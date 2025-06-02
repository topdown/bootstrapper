import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface Blueprint {
    name: string;
    description: string;
    id: string;
    createdAt: Date;
    tags: string[];
    files: { [relativePath: string]: string };
    folders: string[];
}

export class BlueprintManager {
    private readonly context: vscode.ExtensionContext;
    private readonly blueprintsPath: string;

    // Helper methods to replace fs-extra functionality
    private async ensureDir(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error: any) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    private async pathExists(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }

    private expandTildePath(inputPath: string): string {
        if (inputPath.startsWith('~/') || inputPath === '~') {
            return path.join(os.homedir(), inputPath.slice(1));
        }
        return inputPath;
    }

    private async writeJson(filePath: string, data: any): Promise<void> {
        const jsonString = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, jsonString, 'utf8');
    }

    private async readJson(filePath: string): Promise<any> {
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
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

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        
        // Get custom path from configuration or use extension storage
        const config = vscode.workspace.getConfiguration('bootstrapper');
        const customPath = config.get<string>('blueprintsPath');
        
        if (customPath && customPath.trim()) {
            // Expand tilde and resolve path
            const expandedPath = this.expandTildePath(customPath.trim());
            this.blueprintsPath = path.resolve(expandedPath);
        } else {
            this.blueprintsPath = path.join(context.globalStorageUri.fsPath, 'blueprints');
        }
        
        // Ensure blueprints directory exists
        this.ensureBlueprintsDirectory();
    }

    private async ensureBlueprintsDirectory(): Promise<void> {
        try {
            await this.ensureDir(this.blueprintsPath);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create blueprints directory: ${error}`);
        }
    }

    async saveBlueprint(blueprint: Blueprint): Promise<void> {
        try {
            const blueprintPath = path.join(this.blueprintsPath, `${blueprint.id}.json`);
            await this.writeJson(blueprintPath, blueprint);
            vscode.window.showInformationMessage(`Blueprint "${blueprint.name}" saved successfully!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save blueprint: ${error}`);
            throw error;
        }
    }

    async getBlueprints(): Promise<Blueprint[]> {
        try {
            await this.ensureBlueprintsDirectory();
            const files = await fs.readdir(this.blueprintsPath);
            const blueprintFiles = files.filter((file: string) => file.endsWith('.json'));
            
            const blueprints: Blueprint[] = [];
            for (const file of blueprintFiles) {
                try {
                    const blueprintPath = path.join(this.blueprintsPath, file);
                    const blueprint = await this.readJson(blueprintPath);
                    blueprints.push(blueprint);
                } catch (error) {
                    console.error(`Failed to read blueprint ${file}:`, error);
                }
            }
            
            return blueprints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load blueprints: ${error}`);
            return [];
        }
    }

    async getBlueprint(id: string): Promise<Blueprint | undefined> {
        try {
            const blueprintPath = path.join(this.blueprintsPath, `${id}.json`);
            if (await this.pathExists(blueprintPath)) {
                return await this.readJson(blueprintPath);
            }
        } catch (error) {
            console.error(`Failed to read blueprint ${id}:`, error);
        }
        return undefined;
    }

    async deleteBlueprint(id: string): Promise<void> {
        try {
            const blueprintPath = path.join(this.blueprintsPath, `${id}.json`);
            await this.remove(blueprintPath);
            vscode.window.showInformationMessage('Blueprint deleted successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete blueprint: ${error}`);
            throw error;
        }
    }

    async updateBlueprint(blueprint: Blueprint): Promise<void> {
        await this.saveBlueprint(blueprint);
    }

    generateBlueprintId(): string {
        return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
    }

    getBlueprintsPath(): string {
        return this.blueprintsPath;
    }
} 