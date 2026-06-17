import * as vscode from 'vscode';
import { logInfo } from './logger';

export async function isLanguageServerActive() : Promise<Boolean> {
	try {
        const probeResult = await vscode.commands.executeCommand(
            'vscode.executeWorkspaceSymbolProvider',
            ''
        ); // Send empty command

        return probeResult !== undefined;
    } catch (error) {
        return false;
    }
}

export async function getTypeDefinitions(type: string) : Promise<vscode.SymbolInformation[]> {
	const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
		'vscode.executeWorkspaceSymbolProvider',
		type
	);

	return symbols;
}