import * as vscode from 'vscode';
import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';
import { logError, logInfo } from './logger';
import { getInsertSpace, getTabSize } from './config';

export function getStylesheetUri(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) : vscode.Uri {
	const stylesheetDiskPath = vscode.Uri.joinPath(context.extensionUri, 'dist', 'styles.css');
	const stylesheetUri = panel.webview.asWebviewUri(stylesheetDiskPath);

	return (stylesheetUri);
}

export async function resolveTargetDirectory(selectedUri: vscode.Uri | undefined): Promise<vscode.Uri> {
	// If something selected extract path
	if (selectedUri) {
		try {
			const stat = await vscode.workspace.fs.stat(selectedUri);
			if (stat.type === vscode.FileType.Directory) {
				return selectedUri;
			} else {
				return vscode.Uri.file(path.dirname(selectedUri.fsPath));
			}
		} catch {}
	}

	// Fallback 2: Look at the file currently open in their active editor
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor && activeEditor.document.uri.scheme === 'file') {
		return vscode.Uri.file(path.dirname(activeEditor.document.uri.fsPath));
	}

	// Fallback 3: Default back to the global workspace project root directory
	const folders = vscode.workspace.workspaceFolders;
	if (folders && folders.length > 0) {
		return folders[0].uri;
	}

	throw new Error('No active directory or workspace could be identified.');
}

export function capitalizeFirstLetter(val: string) {
	return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export async function modifyFile(srcFile: vscode.Uri, linePos: number, lines: string[] | Set<string>) : Promise<boolean> {
	const srcPath = srcFile.fsPath;
	const tmpPath = `${srcPath}.tmp`;

	const writeStream = fs.createWriteStream(`${srcPath}.tmp`);

	return new Promise<boolean>((resolve) => {
		const reader = readline.createInterface({
			input: fs.createReadStream(srcPath),
			terminal: false // Prevents any terminal formatting quirks
		});

		let i = 0;

		reader.on('line', (line) => {
			if (i === linePos) {
				for (const line of lines) {
					writeStream.write(line + '\n');
				}
			}

			writeStream.write(line + '\n');

			i++;
		});

		reader.on('error', (err) => {
			reader.close();
			writeStream.destroy();

			if (fs.existsSync(tmpPath)) {
				fs.unlinkSync(tmpPath);
			}

			logError(`Error occured while modifying file: ${srcPath}`);

			resolve(false);
		});

		reader.on('close', () => {
			if (i <= linePos) {
				for (const line of lines) {
					writeStream.write(line + '\n');
				}
			}

			writeStream.end();

			try {
				fs.renameSync(tmpPath, srcPath);

				logInfo(`Successfully modfied file: ${srcPath}`);
				resolve(true);
			} catch (err) {
				if (fs.existsSync(tmpPath)) {
					fs.unlinkSync(tmpPath);
				}

				logInfo(`Failed to apply modification to: ${srcFile}`);
				resolve(false);
			}
		});
	});
}

export function getSpace() : string {
	if (!getInsertSpace()) {
		return "\t";
	}

	return ' '.repeat(getTabSize());
}