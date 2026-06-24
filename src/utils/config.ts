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