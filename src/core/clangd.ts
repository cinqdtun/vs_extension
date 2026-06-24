import * as vscode from 'vscode';
import { logError, logInfo } from './../utils/logger';
import { getClangdTimeout } from '../utils/config';
import { performance } from 'perf_hooks';

export function waitForDiagnostics(fileUri: vscode.Uri, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            listener.dispose();

			logInfo("Clangd has not analyzed file in given time");
            resolve();
        }, timeoutMs);

        const listener = vscode.languages.onDidChangeDiagnostics((e) => {
            const fileHasBeenAnalyzed = e.uris.some(uri => uri.toString() === fileUri.toString());
            
            if (fileHasBeenAnalyzed) {
                clearTimeout(timer);
                listener.dispose();

				logInfo("Clangd has analyzed file!");
                resolve();
            }
        });
    });
}

export async function clangdResolveTypes(fileUri: vscode.Uri) : Promise<Set<string>> {
	try {
		const diagnosticPromise = waitForDiagnostics(fileUri, getClangdTimeout());
		const startTime = performance.now();

		await vscode.workspace.openTextDocument(fileUri); // Open file to force clangd to analyze it
		await diagnosticPromise; // Wait for clangd to analyze file

		const endTime = performance.now();
		const executionTime = endTime - startTime;

		logInfo(`Clangd analysis completed in ${executionTime.toFixed(0)} ms`);

		const diagnostics = vscode.languages.getDiagnostics(fileUri); // Ask for diagnostics
		logInfo(`Clangd found ${diagnostics.length} diagnostics.`);

		// Filter errors to keep missing header ones
		const missingHeaderErrors = diagnostics.filter(d => {
			if (d.severity !== vscode.DiagnosticSeverity.Error) {
				return false;
			}

			const message = d.message.toLowerCase(); // Fixes case sensitivity issues
			
			return message.includes('unknown type name') || 
				message.includes('use of undeclared identifier') ||
				message.includes('expected a type');
		});

		await new Promise(resolve => setTimeout(resolve, 100)); // Wait before asking for auto import to give the missing header

		const missingHeaders: Set<string> = new Set();
		for (const error of missingHeaderErrors) {
			// Request smart fix to get missing header location
			const hint = await vscode.commands.executeCommand<vscode.CodeAction[]>(
				'vscode.executeCodeActionProvider',
				fileUri,
				error.range
			);

			if (hint) {
				const headerHint = hint.find(h => {
					const lowerHint = h.title.toLowerCase(); // Lowercase hint

					return lowerHint.startsWith('include'); // Is giving header hint ?
				});
				
				if (headerHint) {
					const match = headerHint.title.match(/(<[^>]+>|"[^"]+")/); // Try to match header path in <> OR ""

					if (match && match[0]) { // Check if header found to add it
						missingHeaders.add(match[0]);
					}
				}
			}
		}

		return (missingHeaders);

	} catch (error) {
		logError("Error occured while resolving types with clangd");
	}

	return new Set();
}

export function isClangdPresent() : boolean {
	const clangdExtension = vscode.extensions.getExtension('llvm-vs-code-extensions.vscode-clangd');

	if (!clangdExtension) {
		logError("clangd is NOT installed / activated.");
		return false;
	}

	return true;
}