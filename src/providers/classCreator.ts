import * as vscode from 'vscode';
import { getStylesheetUri, } from '../utils/utils';
import { createVscodeInput } from '../components/input';
import { logInfo } from "../utils/logger";
import { handleCreateClass } from "../core/createClass";


export function displayClassCreator(context: vscode.ExtensionContext, targetDirUri: vscode.Uri) {
	const panel = vscode.window.createWebviewPanel(
		'createClass',
		'Create Class',
		vscode.ViewColumn.One,
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

	panel.webview.html = getClassCreatorHtmlForm(stylesheetUri, displayPath);

	panel.webview.onDidReceiveMessage(
		async (message) => {
			// Mechanics happen here
			switch (message.command) {
				case 'createClass':
					handleCreateClass(message.className, message.attributes, message.privateId, targetDirUri);
					panel.dispose(); // Close the tab when generation finishes successfully
					return;
			}
		},
		undefined,
		context.subscriptions // Auto-cleanup when extension unloads
	);
}

function getClassCreatorHtmlForm(stylesheetUri: vscode.Uri, targetPath: string): string {
	return `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link rel="stylesheet" href="${stylesheetUri}">
			</head>
			<body>
				<h2 class="vscode-section-label">C++ Class Creator</h2>

				<div class="form-group" style="margin-bottom: 18px;">
					<label class="vscode-label">Output Location</label>
					<div class="vscode-description" style="
						font-family: var(--vscode-editor-font-family, monospace);
						background-color: var(--vscode-textBlock-background, rgba(128,128,128,0.1));
						padding: 6px 10px;
						border-radius: 2px;
						border-left: 3px solid var(--vscode-focusBorder);
						word-break: break-all;
					">
						${targetPath}
					</div>
				</div>

				<div class="form-group">
					<label class="vscode-label" for="class-name">Class name</label>
					${createVscodeInput('class-name', 'e.g., Name')}
				</div>

				<div class="form-group">
					<label class="vscode-label" for="private-id">
						Attribute Prefix 
						<span style="
							color: var(--vscode-descriptionForeground); 
							font-weight: normal; 
							font-size: calc(var(--vscode-font-size) * 0.9); 
							margin-left: 4px;
						">(optional)</span>
					</label>
					${createVscodeInput('private-id', 'e.g., m_ or _')}
				</div>

				<div id="attributes-container"></div>

				<div style="display: flex; gap: 12px; margin-top: 16px;">
					<button class="vscode-button secondary" id="add-btn" type="button">
						Add attribute
					</button>
					<button class="vscode-button" id="generate-btn" type="button">
						Generate Class
					</button>
				</div>

				<script>
					const vscode = acquireVsCodeApi();
					const container = document.getElementById('attributes-container');
					const addBtn = document.getElementById('add-btn');
					const generateBtn = document.getElementById('generate-btn');

					let attributeCount = 0;

					// Dynamic row injection via client-side runtime
					addBtn.addEventListener('click', () => {
						attributeCount++;
						
						const row = document.createElement('div');
						row.className = 'attribute-row';
						row.id = 'row-' + attributeCount;

						row.innerHTML = \`
							<div class="attribute-field">
								<label class="vscode-label">Attribute type</label>
								<input type="text" class="vscode-input attr-type" placeholder="e.g., std::string" autocomplete="off">
							</div>
							<div class="attribute-field">
								<label class="vscode-label">Attribute name</label>
								<input type="text" class="vscode-input attr-name" placeholder="e.g., _name" autocomplete="off">
							</div>
							<button class="vscode-button secondary delete-btn" type="button" style="margin: 0; padding: 6px 12px; height: 32px;">
								Delete
							</button>
						\`;

						row.querySelector('.delete-btn').addEventListener('click', () => {
							row.remove();
						});

						container.appendChild(row);
					});

					generateBtn.addEventListener('click', () => {
						const classNameValue = document.getElementById('class-name').value;
						const privateIdValue = document.getElementById('private-id').value;

						const activeRows = document.querySelectorAll('.attribute-row');

						const structuredAttributes = Array.from(activeRows).map(row => ({
							type: row.querySelector('.attr-type').value,
							name: row.querySelector('.attr-name').value
						}));

						vscode.postMessage({
							command: 'createClass',
							className: classNameValue,
							privateId: privateIdValue,
							attributes: structuredAttributes
						});
					});
				</script>
			</body>
		</html>
	`;
}