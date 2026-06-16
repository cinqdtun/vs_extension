import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function initLogger() {
    if (!channel) {
        channel = vscode.window.createOutputChannel('vs-extension');
		channel.appendLine("[INFO] Logger successfully initialized!");
    }
}

export function logInfo(message: string) {
	if (channel) {
		channel.appendLine(`[INFO] ${message}`);
	}
}

export function logError(message: string) {
	if (channel) {
		channel.appendLine(`[ERROR] ${message}`);
	}
}