import * as vscode from 'vscode';

export function getClangdTimeout(): number {
    const config = vscode.workspace.getConfiguration('cppClassCreator.autoImport');
    const timeout = config.get<number>('clangdTimeout', 3000);

    return timeout;
}

export function getAutoImport(): boolean {
	const config = vscode.workspace.getConfiguration('cppClassCreator.autoImport');
	const autoImport = config.get<boolean>('autoImport', true);

	return autoImport;
}

export function getPrivateId(): string {
    const config = vscode.workspace.getConfiguration('cppClassCreator');
    const privateId = config.get<string>('privateId', "");

    return privateId;
}

export function getInsertSpace(): boolean {
	const config = vscode.workspace.getConfiguration('editor');

	const insertSpaces = config.get<boolean>('insertSpaces', true);
	return insertSpaces;
}

export function getTabSize(): number {
	const config = vscode.workspace.getConfiguration('editor');

	const tabSize = config.get<number>('tabSize', 4);
	return tabSize;
}