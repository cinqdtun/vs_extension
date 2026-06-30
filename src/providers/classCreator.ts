import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { logInfo } from "../utils/logger";
import { handleCreateClass } from "../core/createClass";
import { getPrivateId } from "../utils/config";
import rawPage from "./pages/classCreator.html";

export function displayClassCreator(context: vscode.ExtensionContext, targetDirUri: vscode.Uri) {
	const panel = vscode.window.createWebviewPanel(
		'createClass',
		'Create Class',
		{ 
			viewColumn: vscode.ViewColumn.One,
			preserveFocus: false
    	},
		{ 	enableScripts: true, 
			localResourceRoots: [
				vscode.Uri.joinPath(context.extensionUri, 'dist'),
			]
		}
	);

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

	const stylesPath = path.join(context.extensionPath, 'dist', 'styles.css');
	const stylesContent = fs.readFileSync(stylesPath, 'utf8');
	
	// Replace variables
	const htmlContent = rawPage.replace('__TARGET_PATH__', displayPath);

	// Inline styles
	const finalHtml = htmlContent.replace(
		/<style id=["']?styles["']?><\/style>/,
		`<style id="styles">${stylesContent}</style>`
	);

	panel.webview.html = finalHtml;

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