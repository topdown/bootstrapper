import * as vscode from 'vscode';
import { BlueprintManager } from './blueprintManager';
import { BlueprintCreator } from './blueprintCreator';
import { BlueprintProvider } from './blueprintProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Bootstrapper extension is activating...');
    
    try {
        const blueprintManager = new BlueprintManager(context);
        const blueprintCreator = new BlueprintCreator(blueprintManager);
        const blueprintProvider = new BlueprintProvider(blueprintManager);
        
        console.log('Bootstrapper: All classes instantiated successfully');

        // Register commands
        console.log('Bootstrapper: Registering commands...');
        
        const createFromBlueprintCommand = vscode.commands.registerCommand(
            'bootstrapper.createFromBlueprint',
            () => {
                console.log('Bootstrapper: createFromBlueprint command called');
                return blueprintCreator.createFromBlueprint();
            }
        );

        const saveAsBlueprintCommand = vscode.commands.registerCommand(
            'bootstrapper.saveAsBlueprint',
            (uri?: vscode.Uri) => {
                console.log('Bootstrapper: saveAsBlueprint command called', uri);
                return blueprintCreator.saveAsBlueprint(uri);
            }
        );

        const manageBlueprintsCommand = vscode.commands.registerCommand(
            'bootstrapper.manageBlueprints',
            () => {
                console.log('Bootstrapper: manageBlueprints command called');
                return blueprintProvider.showBlueprintManagement();
            }
        );

        console.log('Bootstrapper: Commands registered successfully');

        // Add commands to subscription
        context.subscriptions.push(
            createFromBlueprintCommand,
            saveAsBlueprintCommand,
            manageBlueprintsCommand
        );

        // Show welcome message on first activation
        const hasShownWelcome = context.globalState.get('bootstrapper.hasShownWelcome', false);
        if (!hasShownWelcome) {
            vscode.window.showInformationMessage(
                'Bootstrapper is now active! Create projects from blueprints via the File menu or Command Palette.',
                'Got it!'
            );
            context.globalState.update('bootstrapper.hasShownWelcome', true);
        }
        
        console.log('Bootstrapper extension activated successfully!');
        
    } catch (error) {
        console.error('Bootstrapper extension failed to activate:', error);
        vscode.window.showErrorMessage(`Bootstrapper extension failed to activate: ${error}`);
    }
}

export function deactivate() {} 