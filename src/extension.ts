import * as vscode from 'vscode';
import { displayClassCreator } from './providers/classCreator';
import { initLogger } from './utils/logger';
import { resolveTargetDirectory } from './utils/utils';

export function activate(context: vscode.ExtensionContext) {

	initLogger();

	let disposable = vscode.commands.registerCommand('vs-extension.createCppClass', async (selectedUri: vscode.Uri) => {
		const targetDirUri = await resolveTargetDirectory(selectedUri);
        displayClassCreator(context, targetDirUri);
    });

	context.subscriptions.push(disposable);
}

export function deactivate() {}
