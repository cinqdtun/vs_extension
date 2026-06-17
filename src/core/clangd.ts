import * as vscode from 'vscode';
import { logInfo } from './../utils/logger';
import { getTypeDefinitions } from './../utils/languageUtils';
import * as path from 'path';
import * as fs from 'fs';

export function filterSymbolsByName(symbols: vscode.SymbolInformation[], type: string) {
	let symbolsFiltered =
		symbols.filter((symbol: vscode.SymbolInformation) => {
			const split = symbol.name.split(' ');

			if (split.length < 1) {
				return false;
			}

			const cleaned = split.at(0);
			return (type === cleaned);
		});

	return (symbolsFiltered);
}

export function filterSymbolsByType(symbols: vscode.SymbolInformation[]) {
	let symbolsFiltered =
		symbols.filter((symbol: vscode.SymbolInformation) => {
			switch (symbol.kind) {
				case vscode.SymbolKind.Class:
					return true;
				default:
					return false;
			}
		});

	return (symbolsFiltered);
}

export async function resolveTypeHeader(type: string) {
	if (type.startsWith("std::")) {
		// STD namespace need to find the correct header
	} else {
		// May have type comming form standard c lib to see later if want to map everything
		// Fallback if not in std namespace
		const symbols = await getTypeDefinitions(type);

		logInfo(symbols.length.toString());

		const filteredSymName = filterSymbolsByName(symbols, type);
		const filteredSymType = filterSymbolsByType(filteredSymName);

		filteredSymType.forEach((value: vscode.SymbolInformation) => {
			logInfo(`Found possible match for '${type}': ${value.name} in ${value.location.uri}:${value.location.range.start.line}:${value.location.range.start.character}-${value.location.range.end.line}:${value.location.range.end.character}`);
		});
	}
}

export async function clangdResolveHeader(builtHeader: string, targetDirUri: vscode.Uri) : Promise<string[]> {
	
	// 1. Create a physical path inside your target source folder
	const scratchpadUri = vscode.Uri.joinPath(targetDirUri, '_temp_compiler_scratchpad.cpp');
	const filePath = scratchpadUri.fsPath;

	try {
		logInfo("Writing temporary file to disk to trigger clangd...");
		
		// 2. Sync write your generated code buffer straight to the file system
		fs.writeFileSync(filePath, builtHeader, 'utf8');

		// 3. Open the document via its file:// URI schema so VS Code tracks it
		const doc = await vscode.workspace.openTextDocument(scratchpadUri);

		// 4. Wait a small window for the background file-watcher to trigger clangd's engine
		await new Promise(resolve => setTimeout(resolve, 500)); 

		// 5. Read the compilation diagnostics directly from the file path
		const diagnostics = vscode.languages.getDiagnostics(scratchpadUri);
		logInfo(`Disk tracking found ${diagnostics.length} diagnostics.`);
				

		// Filter for type resolution failures
		const missingTypeErrors = diagnostics.filter(d => {
			if (d.severity !== vscode.DiagnosticSeverity.Error) {
				return false;
			}

			const message = d.message.toLowerCase(); // <-- Fixes case sensitivity completely
			
			return message.includes('unknown type name') || 
				message.includes('use of undeclared identifier') ||
				message.includes('expected a type');
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const headersToInclude: string[] = [];

		for (const error of missingTypeErrors) {
			// Request code actions from clangd at the specific error location
			const actions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
				'vscode.executeCodeActionProvider',
				scratchpadUri,
				error.range
			);

			if (actions) {

				const includeAction = actions.find(a => {
					const action = a.title.toLowerCase();
					return action.startsWith('include');
				});
				
				if (includeAction) {
				const match = includeAction.title.match(/(<[^>]+>|"[^"]+")/);
					if (match && match[0]) {
						headersToInclude.push(match[0]);
					}
				}
			}
		}

		return [...new Set(headersToInclude)];

	} catch (error) {
		console.error("Clangd physical header resolution failed:", error);
		return [];
	} finally {
		// 6. ALWAYS cleanup: Delete the scratchpad file from disk so it never leaves a trace
		if (fs.existsSync(filePath)) {
			logInfo("Cleaning up temporary scratchpad file.");
			fs.unlinkSync(filePath);
		}
	}
}