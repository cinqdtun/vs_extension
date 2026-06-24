import * as vscode from 'vscode';
import { logInfo, logError } from "../utils/logger";
import { capitalizeFirstLetter, modifyFile } from "../utils/utils";
import { getAutoImport } from '../utils/config';
import * as clangd from "./clangd";
import * as fs from 'fs';
 
export async function handleCreateClass(className: string, attributes: any[], privateId: string, targetDirUri: vscode.Uri) : Promise<void> {
    logInfo(`Starting class generation for: ${className}`);

	if (!className) {
        logError(`Empty class name.`);
		vscode.window.showErrorMessage('Empty class name.');
        return;
    }

	const basicHeader = await generateHeader(className, attributes, privateId);
	const fileUri = vscode.Uri.joinPath(targetDirUri, className + '.hpp');

	if (!writeFile(basicHeader, fileUri)) {
		vscode.window.showErrorMessage('Failed to write class to disk.');
		return;
	}

	if (!getAutoImport()) {
		return;
	}

	if (!clangd.isClangdPresent()) {
		vscode.window.showErrorMessage('Clangd is not installed / enabled.');
		return;
	}

	// Should check if clangd extension is present and operational
	const missingHeaders = await clangd.clangdResolveTypes(fileUri);

	if (missingHeaders.size) {
		let headersInject = [""];

		missingHeaders.forEach((header: string) => {
			headersInject.push(`#include ${header}`);
		});

		// Found missing headers
		if (!await modifyFile(fileUri, 1, headersInject)) {
			vscode.window.showErrorMessage('Auto import failed to apply updates.');
			return;
		}
	}

	vscode.window.showInformationMessage('Successfully created class.');
	logInfo(`Successfully created class.`);
	return;
}

export async function generateHeader(className: string, attributes: any[], privateId: string) : Promise<string> {
	let attributesFiltered = attributes
		.map((attribute: any) => ({
			name: (attribute.name as string).trim(),
			type: (attribute.type as string).trim()
		}))
		.filter(trimmedAttribute => trimmedAttribute.name && trimmedAttribute.type);

	let privateIdFiltered = privateId.trim();

	let header: string = "";

	header += "#pragma once\n\n";
	header += `class ${className} {\n`;

	header += '\tpublic:\n';
	header += `\t\t${className}() = default;\n`;

	if (attributesFiltered.length) {
		header += `\t\t${className}(`;

		let isFirst = true;

		await attributesFiltered.forEach(async (attribute: any) => {
			if (!isFirst) {
				header += ", ";
			}
			header += `${attribute.type} ${attribute.name}`;
			isFirst = false;
		});

		header += ") : ";

		isFirst = true;

		attributesFiltered.forEach((attribute: any) => {
			if (!isFirst) {
				header += ", ";
			}

			header += `${privateIdFiltered}${attribute.name}(${attribute.name})`;
			isFirst = false;
		});

		header += " {}\n";
	}
	header += `\t\t${className}(const ${className}& obj) = default;\n`;
	header += `\t\t${className}& operator=(const ${className}& obj) = default;\n`;
	
	if (attributesFiltered.length) {
		header += `\n`;

		attributesFiltered.forEach((attribute: any) => {
			const name = capitalizeFirstLetter(attribute.name);
			header += `\t\t${attribute.type} get${name}() const { return ${privateIdFiltered}${attribute.name}; }\n`;
		});

		header += `\n`;

		attributesFiltered.forEach((attribute: any) => {
			const name = capitalizeFirstLetter(attribute.name);
			header += `\t\tvoid set${name}(${attribute.type} ${attribute.name}) { ${privateIdFiltered}${attribute.name} = ${attribute.name}; }\n`;
		});
	}

	header += '\tprivate:\n';

	attributesFiltered.forEach((attribute: any) => {
		header += `\t\t${attribute.type} ${privateIdFiltered}${attribute.name};\n`;
	});

	header += '};\n';

	return (header);
}

export function writeFile(builtHeader: string, fileUri: vscode.Uri) : Boolean {
	const filePath = fileUri.fsPath;

	try {
		logInfo("Attempting writing header to disk...");

		fs.writeFileSync(filePath, builtHeader, 'utf8');

		return true;
	} catch (error) {
		logError("Error occured while writing file");
	}

	return false;
}