import * as vscode from 'vscode';
import * as https from 'https';
import { Blueprint, BlueprintManager } from './blueprintManager';

export interface CommunityBlueprint {
    name: string;
    description: string;
    path: string;
    download_url: string;
    html_url: string;
    size: number;
    sha: string;
    readme_url?: string;
    readme_content?: string;
}

export interface GitHubContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: string;
    content?: string;
    encoding?: string;
}

export class CommunityBlueprintsManager {
    private readonly API_BASE = 'https://api.github.com';
    private readonly blueprintManager: BlueprintManager;

    constructor(blueprintManager: BlueprintManager) {
        this.blueprintManager = blueprintManager;
    }

    /**
     * Get repository information from configuration
     */
    private getRepositoryInfo(): { owner: string; repo: string } {
        const config = vscode.workspace.getConfiguration('bootstrapper');
        const repository = config.get<string>('communityRepository', 'topdown/Bootstrapper-Blueprints');
        const [owner, repo] = repository.split('/');
        
        if (!owner || !repo) {
            throw new Error('Invalid repository format. Expected format: owner/repo');
        }
        
        return { owner, repo };
    }

    /**
     * Fetch community blueprints from GitHub repository
     */
    async getCommunityBlueprints(): Promise<CommunityBlueprint[]> {
        try {
            console.log('CommunityBlueprintsManager: Starting to fetch community blueprints...');
            vscode.window.showInformationMessage('DEBUG: Starting to fetch community blueprints...');
            const { owner, repo } = this.getRepositoryInfo();
            const url = `${this.API_BASE}/repos/${owner}/${repo}/contents/blueprints`;
            console.log('CommunityBlueprintsManager: Fetching from URL:', url);
            
            const contents = await this.fetchGitHubApi(url) as GitHubContent[];
            console.log('CommunityBlueprintsManager: Received', contents.length, 'items from API');
            
            const communityBlueprints: CommunityBlueprint[] = [];
            
            // Process both direct JSON files and folders containing blueprint.json
            for (let i = 0; i < contents.length; i++) {
                const item = contents[i];
                console.log(`CommunityBlueprintsManager: Processing item ${i + 1}/${contents.length}: ${item.name} (${item.type})`);
                
                try {
                    if (item.type === 'file' && item.name.endsWith('.json') && item.name !== 'package.json') {
                        console.log('CommunityBlueprintsManager: Processing JSON file:', item.name);
                        // Direct JSON file (legacy support)
                        const blueprint = await this.fetchBlueprintMetadata(item);
                        if (blueprint) {
                            console.log('CommunityBlueprintsManager: Successfully loaded blueprint from JSON file:', blueprint.name);
                            communityBlueprints.push(blueprint);
                        } else {
                            console.log('CommunityBlueprintsManager: Failed to parse blueprint from JSON file:', item.name);
                        }
                    } else if (item.type === 'dir') {
                        console.log('CommunityBlueprintsManager: Processing directory:', item.name);
                        // Directory that might contain blueprint.json + README.md
                        const folderBlueprint = await this.fetchBlueprintFromFolder(item);
                        if (folderBlueprint) {
                            console.log('CommunityBlueprintsManager: Successfully loaded blueprint from folder:', folderBlueprint.name);
                            communityBlueprints.push(folderBlueprint);
                        } else {
                            console.log('CommunityBlueprintsManager: No valid blueprint found in folder:', item.name);
                        }
                    } else {
                        console.log('CommunityBlueprintsManager: Skipping item:', item.name, '(type:', item.type, ')');
                    }
                } catch (error) {
                    console.warn(`CommunityBlueprintsManager: Failed to process ${item.name}:`, error);
                }
            }

            console.log('CommunityBlueprintsManager: Finished processing. Found', communityBlueprints.length, 'blueprints');
            return communityBlueprints;
        } catch (error) {
            console.error('CommunityBlueprintsManager: Error in getCommunityBlueprints:', error);
            vscode.window.showErrorMessage(`Failed to fetch community blueprints: ${error}`);
            return [];
        }
    }

    /**
     * Fetch blueprint from folder containing blueprint.json and optionally README.md
     */
    private async fetchBlueprintFromFolder(folder: GitHubContent): Promise<CommunityBlueprint | null> {
        try {
            console.log('CommunityBlueprintsManager: Fetching blueprint from folder:', folder.name);
            const { owner, repo } = this.getRepositoryInfo();
            const folderUrl = `${this.API_BASE}/repos/${owner}/${repo}/contents/${folder.path}`;
            console.log('CommunityBlueprintsManager: Folder URL:', folderUrl);
            
            const folderContents = await this.fetchGitHubApi(folderUrl) as GitHubContent[];
            console.log('CommunityBlueprintsManager: Found', folderContents.length, 'files in folder:', folder.name);
            
            // Look for blueprint.json
            const blueprintFile = folderContents.find(file => 
                file.type === 'file' && file.name === 'blueprint.json'
            );
            
            if (!blueprintFile) {
                console.log('CommunityBlueprintsManager: No blueprint.json found in folder:', folder.name);
                return null;
            }

            console.log('CommunityBlueprintsManager: Found blueprint.json in folder:', folder.name);

            // Look for README.md
            const readmeFile = folderContents.find(file => 
                file.type === 'file' && (file.name.toLowerCase() === 'readme.md' || file.name.toLowerCase() === 'readme.txt')
            );

            if (readmeFile) {
                console.log('CommunityBlueprintsManager: Found README file in folder:', folder.name, '-', readmeFile.name);
            } else {
                console.log('CommunityBlueprintsManager: No README file found in folder:', folder.name);
            }

            // Fetch blueprint content
            console.log('CommunityBlueprintsManager: Fetching blueprint metadata from:', blueprintFile.download_url);
            const blueprint = await this.fetchBlueprintMetadata(blueprintFile);
            if (!blueprint) {
                console.log('CommunityBlueprintsManager: Failed to parse blueprint metadata from folder:', folder.name);
                return null;
            }

            console.log('CommunityBlueprintsManager: Successfully parsed blueprint metadata for:', blueprint.name);

            // Fetch README content if available
            if (readmeFile) {
                try {
                    console.log('CommunityBlueprintsManager: Fetching README content from:', readmeFile.download_url);
                    const readmeContent = await this.fetchGitHubApi(readmeFile.download_url);
                    blueprint.readme_url = readmeFile.html_url;
                    blueprint.readme_content = readmeContent;
                    console.log('CommunityBlueprintsManager: Successfully fetched README content for:', folder.name);
                } catch (error) {
                    console.warn(`CommunityBlueprintsManager: Failed to fetch README for ${folder.name}:`, error);
                }
            }

            console.log('CommunityBlueprintsManager: Successfully processed folder:', folder.name);
            return blueprint;
        } catch (error) {
            console.error(`CommunityBlueprintsManager: Failed to fetch blueprint from folder ${folder.name}:`, error);
            return null;
        }
    }

    /**
     * Download and import a community blueprint to local storage
     */
    async downloadBlueprint(communityBlueprint: CommunityBlueprint): Promise<boolean> {
        try {
            // Show progress
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Downloading blueprint: ${communityBlueprint.name}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Fetching blueprint data..." });
                
                // Fetch the full blueprint content
                const blueprintContent = await this.fetchGitHubApi(communityBlueprint.download_url);
                
                progress.report({ increment: 50, message: "Processing blueprint..." });
                
                // Parse and validate the blueprint
                const blueprint = this.parseBlueprint(blueprintContent);
                if (!blueprint) {
                    throw new Error('Invalid blueprint format');
                }

                // Generate new ID for local storage to avoid conflicts
                blueprint.id = this.blueprintManager.generateBlueprintId();
                blueprint.createdAt = new Date();
                
                // Add community source metadata
                if (!blueprint.tags) {
                    blueprint.tags = [];
                }
                if (!blueprint.tags.includes('community')) {
                    blueprint.tags.push('community');
                }

                progress.report({ increment: 80, message: "Saving to local storage..." });
                
                // Save to local blueprints
                await this.blueprintManager.saveBlueprint(blueprint);
                
                progress.report({ increment: 100, message: "Complete!" });
                
                vscode.window.showInformationMessage(
                    `Community blueprint "${blueprint.name}" downloaded successfully!`
                );
                
                return true;
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to download blueprint: ${error}`);
            return false;
        }
    }

    /**
     * Show community blueprints browser
     */
    async showCommunityBrowser(): Promise<void> {
        try {
            // Use withProgress for proper loading indication
            const communityBlueprints = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Loading community blueprints...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Fetching blueprints from GitHub..." });
                return await this.getCommunityBlueprints();
            });

            if (communityBlueprints.length === 0) {
                vscode.window.showInformationMessage('No community blueprints found.');
                return;
            }

            // Create quick pick items
            const items = communityBlueprints.map(blueprint => ({
                label: `$(file) ${blueprint.name}`,
                description: blueprint.description || 'No description available',
                detail: `Size: ${(blueprint.size / 1024).toFixed(1)}KB${blueprint.readme_content ? ' • Has README' : ''}`,
                blueprint: blueprint
            }));

            // Show selection dialog
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a community blueprint to download',
                ignoreFocusOut: true,
                matchOnDescription: true,
                matchOnDetail: true
            });

            if (selected) {
                // Show blueprint details with README if available
                if (selected.blueprint.readme_content) {
                    const action = await vscode.window.showInformationMessage(
                        `${selected.blueprint.name}\n\n${selected.blueprint.description || 'No description available'}`,
                        { modal: true },
                        'View README',
                        'Download',
                        'Cancel'
                    );

                    if (action === 'View README') {
                        await this.showBlueprintReadme(selected.blueprint);
                        return; // Return to allow user to come back to browse
                    } else if (action === 'Download') {
                        await this.downloadBlueprint(selected.blueprint);
                    }
                } else {
                    const confirmDownload = await vscode.window.showInformationMessage(
                        `Download "${selected.blueprint.name}" to your local blueprints?`,
                        'Download',
                        'Cancel'
                    );

                    if (confirmDownload === 'Download') {
                        await this.downloadBlueprint(selected.blueprint);
                    }
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show community browser: ${error}`);
        }
    }

    /**
     * Show blueprint README in a webview
     */
    private async showBlueprintReadme(blueprint: CommunityBlueprint): Promise<void> {
        if (!blueprint.readme_content) {
            vscode.window.showInformationMessage('No README available for this blueprint.');
            return;
        }

        const webview = vscode.window.createWebviewPanel(
            'blueprintReadme',
            `${blueprint.name} - README`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        webview.webview.html = this.getBlueprintReadmeHtml(blueprint);
        
        // Add download button to webview
        webview.webview.onDidReceiveMessage(async (message: any) => {
            switch (message.command) {
                case 'download':
                    await this.downloadBlueprint(blueprint);
                    webview.dispose();
                    break;
            }
        });
    }

    /**
     * Generate HTML for blueprint README display
     */
    private getBlueprintReadmeHtml(blueprint: CommunityBlueprint): string {
        const readmeHtml = blueprint.readme_content || 'No README content available.';
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${blueprint.name} - README</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    line-height: 1.6;
                    max-width: 800px;
                }
                h1, h2, h3, h4, h5, h6 {
                    color: var(--vscode-textLink-foreground);
                }
                pre, code {
                    background-color: var(--vscode-textBlockQuote-background);
                    border: 1px solid var(--vscode-textBlockQuote-border);
                    border-radius: 4px;
                    font-family: var(--vscode-editor-font-family);
                }
                pre {
                    padding: 10px;
                    overflow-x: auto;
                }
                code {
                    padding: 2px 4px;
                }
                .download-section {
                    margin: 20px 0;
                    padding: 15px;
                    background-color: var(--vscode-textBlockQuote-background);
                    border: 1px solid var(--vscode-textBlockQuote-border);
                    border-radius: 4px;
                }
                .download-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: var(--vscode-font-size);
                }
                .download-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="download-section">
                <h2>${blueprint.name}</h2>
                <p><strong>Description:</strong> ${blueprint.description || 'No description available'}</p>
                <p><strong>Size:</strong> ${(blueprint.size / 1024).toFixed(1)}KB</p>
                <button class="download-button" onclick="downloadBlueprint()">Download Blueprint</button>
            </div>
            
            <div class="readme-content">
                <pre>${readmeHtml}</pre>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function downloadBlueprint() {
                    vscode.postMessage({ command: 'download' });
                }
            </script>
        </body>
        </html>
        `;
    }

    /**
     * Fetch blueprint metadata from GitHub file
     */
    private async fetchBlueprintMetadata(file: GitHubContent): Promise<CommunityBlueprint | null> {
        try {
            const content = await this.fetchGitHubApi(file.download_url);
            const blueprint = this.parseBlueprint(content);
            
            if (blueprint) {
                return {
                    name: blueprint.name,
                    description: blueprint.description,
                    path: file.path,
                    download_url: file.download_url,
                    html_url: file.html_url,
                    size: file.size,
                    sha: file.sha
                };
            }
            return null;
        } catch (error) {
            console.warn(`Failed to fetch metadata for ${file.name}:`, error);
            return null;
        }
    }

    /**
     * Parse and validate blueprint content
     */
    private parseBlueprint(content: any): Blueprint | null {
        try {
            const blueprint = typeof content === 'string' ? JSON.parse(content) : content;
            
            // Validate required fields
            if (!blueprint.name || !blueprint.files) {
                return null;
            }

            return blueprint as Blueprint;
        } catch (error) {
            console.warn('Failed to parse blueprint:', error);
            return null;
        }
    }

    /**
     * Make HTTP request to GitHub API
     */
    private async fetchGitHubApi(url: string): Promise<any> {
        console.log('CommunityBlueprintsManager: Making API request to:', url);
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    'User-Agent': 'Bootstrapper-VSCode-Extension',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };

            const req = https.get(url, options, (res) => {
                console.log('CommunityBlueprintsManager: Response received for:', url, 'Status:', res.statusCode);
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        console.log('CommunityBlueprintsManager: Response data length for:', url, ':', data.length);
                        if (res.statusCode === 200) {
                            // Try to parse as JSON, fall back to raw text
                            try {
                                const jsonData = JSON.parse(data);
                                console.log('CommunityBlueprintsManager: Successfully parsed JSON response for:', url);
                                resolve(jsonData);
                            } catch {
                                console.log('CommunityBlueprintsManager: Returning raw text response for:', url);
                                resolve(data);
                            }
                        } else {
                            console.error('CommunityBlueprintsManager: API request failed for:', url, 'Status:', res.statusCode);
                            reject(new Error(`GitHub API request failed: ${res.statusCode} ${res.statusMessage}`));
                        }
                    } catch (error) {
                        console.error('CommunityBlueprintsManager: Error processing response for:', url, error);
                        reject(error);
                    }
                });
            });

            req.on('error', (error) => {
                console.error('CommunityBlueprintsManager: Request error for:', url, error);
                reject(error);
            });

            req.setTimeout(10000, () => {
                console.error('CommunityBlueprintsManager: Request timeout for:', url);
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }
} 