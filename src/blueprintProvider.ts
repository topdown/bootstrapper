import * as vscode from 'vscode';
import { BlueprintManager, Blueprint } from './blueprintManager';
import { BlueprintCreator } from './blueprintCreator';

export class BlueprintProvider {
    private readonly blueprintManager: BlueprintManager;
    private readonly blueprintCreator: BlueprintCreator;

    constructor(blueprintManager: BlueprintManager) {
        this.blueprintManager = blueprintManager;
        this.blueprintCreator = new BlueprintCreator(blueprintManager);
    }

    async showBlueprintManagement(): Promise<void> {
        try {
            const blueprints = await this.blueprintManager.getBlueprints();
            
            if (blueprints.length === 0) {
                vscode.window.showInformationMessage('No blueprints found. Create your first blueprint from a project folder.');
                return;
            }

            const items = blueprints.map(blueprint => ({
                label: `$(rocket) Create Project from "${blueprint.name}"`,
                description: blueprint.description,
                detail: `Created: ${new Date(blueprint.createdAt).toLocaleDateString()} | Tags: ${blueprint.tags.join(', ')} | Files: ${Object.keys(blueprint.files).length}`,
                blueprint,
                action: 'create'
            }));

            // Add separator
            items.push({
                label: '$(chrome-minimize)',
                description: '',
                detail: '',
                blueprint: null as any,
                action: 'separator'
            });

            // Add management options
            items.push(
                ...blueprints.map(blueprint => ({
                    label: `$(gear) Manage "${blueprint.name}"`,
                    description: 'View, edit, export, duplicate, or delete this blueprint',
                    detail: `${Object.keys(blueprint.files).length} files, ${blueprint.folders.length} folders`,
                    blueprint,
                    action: 'manage'
                }))
            );

            // Add utility options
            items.push(
                {
                    label: '$(chrome-minimize)',
                    description: '',
                    detail: '',
                    blueprint: null as any,
                    action: 'separator'
                },
                { 
                    label: '$(folder-opened) Open Blueprints Folder',
                    description: 'Open the folder containing all blueprints',
                    detail: this.blueprintManager.getBlueprintsPath(),
                    blueprint: null as any,
                    action: 'open-folder'
                },
                { 
                    label: '$(refresh) Refresh List',
                    description: 'Refresh the blueprint list',
                    detail: 'Reload blueprints from storage',
                    blueprint: null as any,
                    action: 'refresh'
                }
            );

            const selected = await vscode.window.showQuickPick(
                items.filter(item => item.action !== 'separator'), 
                {
                    placeHolder: 'Create a new project from a blueprint, or manage existing blueprints',
                    matchOnDescription: true,
                    matchOnDetail: true
                }
            );

            if (!selected) {
                return;
            }

            switch (selected.action) {
                case 'create':
                    await this.createProjectFromBlueprint(selected.blueprint);
                    break;
                case 'manage':
                    await this.showBlueprintActions(selected.blueprint);
                    break;
                case 'open-folder':
                    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(this.blueprintManager.getBlueprintsPath()));
                    break;
                case 'refresh':
                    await this.showBlueprintManagement();
                    break;
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show blueprint management: ${error}`);
        }
    }

    private async createProjectFromBlueprint(blueprint: Blueprint): Promise<void> {
        try {
            // Get target directory
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select Project Location',
                title: `Create project from "${blueprint.name}" blueprint`
            });

            if (!folderUri || folderUri.length === 0) {
                return;
            }

            // Get project name
            const projectName = await vscode.window.showInputBox({
                prompt: `Enter name for your new project (from "${blueprint.name}" blueprint)`,
                value: blueprint.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
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

            // Use the BlueprintCreator to create the project
            await this.blueprintCreator.createProjectFromBlueprint(blueprint, folderUri[0].fsPath, projectName);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create project from blueprint: ${error}`);
        }
    }

    private async showBlueprintActions(blueprint: Blueprint): Promise<void> {
        const actions = [
            {
                label: '$(rocket) Create Project from This Blueprint',
                description: 'Create a new project using this blueprint as a template'
            },
            {
                label: '$(eye) View Details',
                description: 'View blueprint information and file structure'
            },
            {
                label: '$(edit) Edit Metadata',
                description: 'Edit blueprint name, description, and tags'
            },
            {
                label: '$(export) Export Blueprint',
                description: 'Export blueprint to a file'
            },
            {
                label: '$(copy) Duplicate Blueprint',
                description: 'Create a copy of this blueprint'
            },
            {
                label: '$(trash) Delete Blueprint',
                description: 'Permanently delete this blueprint'
            }
        ];

        const selected = await vscode.window.showQuickPick(actions, {
            placeHolder: `What would you like to do with "${blueprint.name}"?`
        });

        if (!selected) {
            return;
        }

        switch (selected.label) {
            case '$(rocket) Create Project from This Blueprint':
                await this.createProjectFromBlueprint(blueprint);
                break;
            case '$(eye) View Details':
                await this.showBlueprintDetails(blueprint);
                break;
            case '$(edit) Edit Metadata':
                await this.editBlueprintMetadata(blueprint);
                break;
            case '$(export) Export Blueprint':
                await this.exportBlueprint(blueprint);
                break;
            case '$(copy) Duplicate Blueprint':
                await this.duplicateBlueprint(blueprint);
                break;
            case '$(trash) Delete Blueprint':
                await this.deleteBlueprint(blueprint);
                break;
        }
    }

    private async showBlueprintDetails(blueprint: Blueprint): Promise<void> {
        const fileCount = Object.keys(blueprint.files).length;
        const folderCount = blueprint.folders.length;
        
        const details = [
            `**Name:** ${blueprint.name}`,
            `**Description:** ${blueprint.description || 'No description'}`,
            `**Created:** ${new Date(blueprint.createdAt).toLocaleDateString()}`,
            `**Tags:** ${blueprint.tags.length > 0 ? blueprint.tags.join(', ') : 'No tags'}`,
            `**Files:** ${fileCount}`,
            `**Folders:** ${folderCount}`,
            '',
            '**File Structure:**'
        ];

        // Add folder structure
        const allPaths = [...blueprint.folders, ...Object.keys(blueprint.files)].sort();
        for (const path of allPaths) {
            const isFile = blueprint.files.hasOwnProperty(path);
            const icon = isFile ? '📄' : '📁';
            details.push(`${icon} ${path}`);
        }

        const webview = vscode.window.createWebviewPanel(
            'blueprintDetails',
            `Blueprint: ${blueprint.name}`,
            vscode.ViewColumn.One,
            {}
        );

        webview.webview.html = this.getBlueprintDetailsHtml(blueprint, details.join('\n'));
    }

    private async editBlueprintMetadata(blueprint: Blueprint): Promise<void> {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter blueprint name',
            value: blueprint.name,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Blueprint name is required';
                }
                return null;
            }
        });

        if (name === undefined) {
            return;
        }

        const description = await vscode.window.showInputBox({
            prompt: 'Enter blueprint description (optional)',
            value: blueprint.description
        });

        if (description === undefined) {
            return;
        }

        const tags = await vscode.window.showInputBox({
            prompt: 'Enter tags (comma-separated, optional)',
            value: blueprint.tags.join(', '),
            placeHolder: 'react, typescript, webapp'
        });

        if (tags === undefined) {
            return;
        }

        const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

        const updatedBlueprint: Blueprint = {
            ...blueprint,
            name,
            description,
            tags: tagArray
        };

        await this.blueprintManager.updateBlueprint(updatedBlueprint);
        vscode.window.showInformationMessage(`Blueprint "${name}" updated successfully!`);
    }

    private async exportBlueprint(blueprint: Blueprint): Promise<void> {
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`${blueprint.name}.blueprint.json`),
            filters: {
                'Blueprint Files': ['json']
            }
        });

        if (!saveUri) {
            return;
        }

        try {
            const content = JSON.stringify(blueprint, null, 2);
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content));
            vscode.window.showInformationMessage(`Blueprint exported to ${saveUri.fsPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export blueprint: ${error}`);
        }
    }

    private async duplicateBlueprint(blueprint: Blueprint): Promise<void> {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter name for the duplicated blueprint',
            value: `${blueprint.name} (Copy)`,
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

        const duplicatedBlueprint: Blueprint = {
            ...blueprint,
            id: this.blueprintManager.generateBlueprintId(),
            name,
            createdAt: new Date()
        };

        await this.blueprintManager.saveBlueprint(duplicatedBlueprint);
        vscode.window.showInformationMessage(`Blueprint "${name}" created successfully!`);
    }

    private async deleteBlueprint(blueprint: Blueprint): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete the blueprint "${blueprint.name}"? This action cannot be undone.`,
            { modal: true },
            'Delete',
            'Cancel'
        );

        if (confirm === 'Delete') {
            await this.blueprintManager.deleteBlueprint(blueprint.id);
        }
    }

    private getBlueprintDetailsHtml(blueprint: Blueprint, details: string): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Blueprint Details</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    line-height: 1.6;
                }
                h1 {
                    color: var(--vscode-textLink-foreground);
                    border-bottom: 1px solid var(--vscode-textSeparator-foreground);
                    padding-bottom: 10px;
                }
                pre {
                    background-color: var(--vscode-textBlockQuote-background);
                    border: 1px solid var(--vscode-textBlockQuote-border);
                    padding: 10px;
                    border-radius: 4px;
                    overflow-x: auto;
                    white-space: pre-wrap;
                }
                .file-item {
                    margin: 2px 0;
                    font-family: var(--vscode-editor-font-family);
                }
            </style>
        </head>
        <body>
            <h1>Blueprint: ${blueprint.name}</h1>
            <div class="content">
                ${details.split('\n').map(line => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                        return `<strong>${line.slice(2, -2)}</strong>`;
                    }
                    if (line.startsWith('📄') || line.startsWith('📁')) {
                        return `<div class="file-item">${line}</div>`;
                    }
                    return line || '<br>';
                }).join('\n')}
            </div>
        </body>
        </html>
        `;
    }
} 