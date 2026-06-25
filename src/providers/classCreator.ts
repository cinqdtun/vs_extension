import * as vscode from 'vscode';
import { getStylesheetUri, } from '../utils/utils';
import { createVscodeInput } from '../components/input';
import { logInfo } from "../utils/logger";
import { handleCreateClass } from "../core/createClass";
import { getPrivateId } from "../utils/config";
import * as fs from "fs";


export function displayClassCreator(context: vscode.ExtensionContext, targetDirUri: vscode.Uri) {
	const panel = vscode.window.createWebviewPanel(
		'createClass',
		'Create Class',
		{ 
			viewColumn: vscode.ViewColumn.One,
			preserveFocus: false
    	},
		{ enableScripts: true }
	);

	const stylesheetUri = getStylesheetUri(context, panel);

	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	let displayPath: string;

	if (!workspaceFolder) {
		// State A: No workspace open -> display the full absolute path
		displayPath = targetDirUri.fsPath;
	} else if (targetDirUri.toString() === workspaceFolder.uri.toString()) {
		// State B: Folder is exactly the workspace root -> display ./
		displayPath = './';
	} else {
		// State C: Folder is a subfolder -> display ./path/to/folder
		const relativePath = vscode.workspace.asRelativePath(targetDirUri, false);
		displayPath = `./${relativePath}/`;
	}

	const htmlUri = vscode.Uri.joinPath(context.extensionUri, 'src', 'providers', 'classCreator.html');
	let htmlContent = fs.readFileSync(htmlUri.fsPath, 'utf8');

	// Replace variables
	htmlContent = htmlContent.replace('${stylesheetUri}', stylesheetUri.toString());
	htmlContent = htmlContent.replace('${targetPath}', displayPath);

	panel.webview.html = htmlContent;

	panel.webview.onDidReceiveMessage(
		async (message) => {
			switch (message.command) {
				case 'createClass':
					handleCreateClass(
						message.className,
						message.attributes,
						!message.privateId ? getPrivateId() : message.privateId,
						targetDirUri
					);
					panel.dispose(); // Close the tab when generation finishes successfully
					return;
			}
		},
		undefined,
		context.subscriptions // Auto-cleanup when extension unloads
	);
}