import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { BlueprintManager, Blueprint } from './blueprintManager';

export class BlueprintCreator {
    private readonly blueprintManager: BlueprintManager;

    constructor(blueprintManager: BlueprintManager) {
        this.blueprintManager = blueprintManager;
    }

    // Helper methods to replace fs-extra functionality
    private async pathExists(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }

    private async ensureDir(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error: any) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    private async remove(path: string): Promise<void> {
        try {
            const stat = await fs.stat(path);
            if (stat.isDirectory()) {
                await fs.rmdir(path, { recursive: true });
            } else {
                await fs.unlink(path);
            }
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    private async getAllFiles(dir: string, excludePatterns: string[] = []): Promise<string[]> {
        const result: string[] = [];
        
        const walk = async (currentDir: string, basePath: string = '') => {
            try {
                const entries = await fs.readdir(currentDir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const relativePath = path.join(basePath, entry.name);
                    const fullPath = path.join(currentDir, entry.name);
                    
                    // Check if this path should be excluded
                    const shouldExclude = excludePatterns.some(pattern => {
                        // Simple pattern matching - handle basic cases
                        if (pattern.startsWith('**/')) {
                            return relativePath.includes(pattern.slice(3));
                        }
                        return relativePath === pattern || relativePath.endsWith('/' + pattern) || entry.name === pattern;
                    });
                    
                    if (shouldExclude) {
                        continue;
                    }
                    
                    if (entry.isDirectory()) {
                        result.push(relativePath);
                        await walk(fullPath, relativePath);
                    } else if (entry.isFile()) {
                        result.push(relativePath);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
                console.warn(`Cannot read directory ${currentDir}:`, error);
            }
        };
        
        await walk(dir);
        return result;
    }

    async createFromBlueprint(): Promise<void> {
        try {
            const blueprints = await this.blueprintManager.getBlueprints();
            
            if (blueprints.length === 0) {
                const result = await vscode.window.showInformationMessage(
                    'No blueprints found. Would you like to create one from your current project?',
                    'Create Blueprint',
                    'Cancel'
                );
                
                if (result === 'Create Blueprint') {
                    await this.saveAsBlueprint();
                }
                return;
            }

            // Show blueprint selection
            const blueprintItems = blueprints.map(blueprint => ({
                label: blueprint.name,
                description: blueprint.description,
                detail: `Created: ${new Date(blueprint.createdAt).toLocaleDateString()} | Tags: ${blueprint.tags.join(', ')}`,
                blueprint
            }));

            const selected = await vscode.window.showQuickPick(blueprintItems, {
                placeHolder: 'Select a blueprint to create project from',
                matchOnDescription: true,
                matchOnDetail: true
            });

            if (!selected) {
                return;
            }

            // Get target directory
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select Project Location'
            });

            if (!folderUri || folderUri.length === 0) {
                return;
            }

            // Get project name
            const projectName = await vscode.window.showInputBox({
                prompt: 'Enter project name',
                value: selected.blueprint.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Project name is required';
                    }
                    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                        return 'Project name can only contain letters, numbers, hyphens, and underscores';
                    }
                    return null;
                }
            });

            if (!projectName) {
                return;
            }

            // Create project from blueprint
            await this.createProjectFromBlueprint(selected.blueprint, folderUri[0].fsPath, projectName);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create project from blueprint: ${error}`);
        }
    }

    async saveAsBlueprint(uri?: vscode.Uri): Promise<void> {
        try {
            let sourcePath: string;

            if (uri) {
                sourcePath = uri.fsPath;
            } else {
                // If no URI provided, use current workspace folder
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) {
                    vscode.window.showWarningMessage('No workspace folder found. Please open a folder first.');
                    return;
                }

                if (workspaceFolders.length === 1) {
                    sourcePath = workspaceFolders[0].uri.fsPath;
                } else {
                    // Multiple folders, let user choose
                    const folderItems = workspaceFolders.map(folder => ({
                        label: folder.name,
                        description: folder.uri.fsPath,
                        uri: folder.uri
                    }));

                    const selected = await vscode.window.showQuickPick(folderItems, {
                        placeHolder: 'Select workspace folder to save as blueprint'
                    });

                    if (!selected) {
                        return;
                    }
                    sourcePath = selected.uri.fsPath;
                }
            }

            // Get blueprint metadata
            const name = await vscode.window.showInputBox({
                prompt: 'Enter blueprint name',
                value: path.basename(sourcePath),
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Blueprint name is required';
                    }
                    return null;
                }
            });

            if (!name) {
                return;
            }

            const description = await vscode.window.showInputBox({
                prompt: 'Enter blueprint description (optional)',
                value: `Blueprint created from ${path.basename(sourcePath)}`
            });

            const tags = await vscode.window.showInputBox({
                prompt: 'Enter tags (comma-separated, optional)',
                placeHolder: 'react, typescript, webapp'
            });

            const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

            // Create blueprint
            await this.createBlueprintFromProject(sourcePath, name, description || '', tagArray);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save blueprint: ${error}`);
        }
    }

    async createProjectFromBlueprint(blueprint: Blueprint, targetPath: string, projectName: string): Promise<void> {
        const projectPath = path.join(targetPath, projectName);

        // Check if directory already exists
        if (await this.pathExists(projectPath)) {
            const overwrite = await vscode.window.showWarningMessage(
                `Directory "${projectName}" already exists. Overwrite?`,
                'Overwrite',
                'Cancel'
            );

            if (overwrite !== 'Overwrite') {
                return;
            }

            await this.remove(projectPath);
        }

        // Create project directory
        await this.ensureDir(projectPath);

        // Create folders
        for (const folder of blueprint.folders) {
            await this.ensureDir(path.join(projectPath, folder));
        }

        // Create files
        for (const [relativePath, content] of Object.entries(blueprint.files)) {
            const filePath = path.join(projectPath, relativePath);
            await this.ensureDir(path.dirname(filePath));
            
            // Replace placeholders in content
            const processedContent = this.replacePlaceholders(content, projectName);
            await fs.writeFile(filePath, processedContent, 'utf8');
        }

        // Open the new project
        const openInNewWindow = await vscode.window.showInformationMessage(
            `Project "${projectName}" created successfully!`,
            'Open in New Window',
            'Open in Current Window',
            'Show in Explorer'
        );

        if (openInNewWindow === 'Open in New Window') {
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), true);
        } else if (openInNewWindow === 'Open in Current Window') {
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), false);
        } else if (openInNewWindow === 'Show in Explorer') {
            await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(projectPath));
        }
    }

    private async createBlueprintFromProject(sourcePath: string, name: string, description: string, tags: string[]): Promise<void> {
        const config = vscode.workspace.getConfiguration('bootstrapper');
        const excludePatterns = config.get<string[]>('excludePatterns') || [];
        const includeGitIgnore = config.get<boolean>('includeGitIgnore', true);

        // Build exclusion patterns
        const excludePatternsExpanded = excludePatterns.slice();
        if (!includeGitIgnore) {
            excludePatternsExpanded.push('.gitignore');
        }

        // Get all files
        const allFiles = await this.getAllFiles(sourcePath, excludePatternsExpanded);

        const blueprint: Blueprint = {
            id: this.blueprintManager.generateBlueprintId(),
            name,
            description,
            createdAt: new Date(),
            tags,
            files: {},
            folders: []
        };

        const folders = new Set<string>();

        for (const file of allFiles) {
            const fullPath = path.join(sourcePath, file);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
                folders.add(file);
            } else if (stat.isFile()) {
                // Add parent directories
                let dir = path.dirname(file);
                while (dir && dir !== '.' && dir !== '/') {
                    folders.add(dir);
                    dir = path.dirname(dir);
                }

                // Read file content
                try {
                    const content = await fs.readFile(fullPath, 'utf8');
                    blueprint.files[file] = content;
                } catch (error) {
                    // Skip binary files or files that can't be read as text
                    console.warn(`Skipping file ${file}: ${error}`);
                }
            }
        }

        blueprint.folders = Array.from(folders).sort();

        await this.blueprintManager.saveBlueprint(blueprint);
    }

    private replacePlaceholders(content: string, projectName: string): string {
        const replacements = {
            // Double curly brace format (new format)
            '{{PROJECT_NAME}}': projectName,
            '{{PROJECT_NAME_UPPER}}': projectName.toUpperCase(),
            '{{PROJECT_NAME_LOWER}}': projectName.toLowerCase(),
            '{{PROJECT_NAME_CAMEL}}': this.toCamelCase(projectName),
            '{{PROJECT_NAME_PASCAL}}': this.toPascalCase(projectName),
            '{{DATE}}': new Date().toISOString().split('T')[0],
            '{{YEAR}}': new Date().getFullYear().toString(),
            
            // Single format for backward compatibility (old format)
            'PROJECT_NAME': projectName,
            'PROJECT_NAME_UPPER': projectName.toUpperCase(),
            'PROJECT_NAME_LOWER': projectName.toLowerCase(),
            'PROJECT_NAME_CAMEL': this.toCamelCase(projectName),
            'PROJECT_NAME_PASCAL': this.toPascalCase(projectName),
            'DATE': new Date().toISOString().split('T')[0],
            'YEAR': new Date().getFullYear().toString()
        };

        let result = content;
        for (const [placeholder, value] of Object.entries(replacements)) {
            // For the old format, we need to be more careful with replacement to avoid
            // replacing parts of other identifiers. Use word boundaries.
            if (placeholder.includes('{{')) {
                // New format with curly braces - use exact match
                result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
            } else {
                // Old format without braces - use word boundaries to avoid partial matches
                result = result.replace(new RegExp('\\b' + placeholder + '\\b', 'g'), value);
            }
        }

        return result;
    }

    private toCamelCase(str: string): string {
        return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
    }

    private toPascalCase(str: string): string {
        const camelCase = this.toCamelCase(str);
        return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
    }
} 