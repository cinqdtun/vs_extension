import * as vscode from 'vscode';
import { logInfo, logError } from "../utils/logger";
import { capitalizeFirstLetter, isSplitChar, isTypeChar, isKeyword } from "../utils/utils";
import { getTypeDefinitions } from "../utils/languageUtils";
import * as clangd from "./clangd";

export async function handleCreateClass(className: string, attributes: any[], privateId: string, targetDirUri: vscode.Uri) : Promise<boolean> {
    logInfo(`Starting class generation for: ${className}`);

	if (!className) {
        logError(`Generation aborted: Empty class name.`);
        return false;
    }

	logInfo(await generateHeader(className, attributes, privateId, targetDirUri));
	logInfo(`${className}.hpp written to disk.`);
	return true;
}

export async function generateHeader(className: string, attributes: any[], privateId: string, targetDirUri: vscode.Uri) : Promise<string> {
	let attributesFiltered = attributes
		.map((attribute: any) => ({
			name: (attribute.name as string).trim(),
			type: (attribute.type as string).trim()
		}))
		.filter(trimmedAttribute => trimmedAttribute.name && trimmedAttribute.type);

	let privateIdFiltered = privateId.trim();

	let header: string = "";

	header += "#pragma once\n";
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
			//await getTypeDefinition(attribute.type);
		});

		/*for (const attribute of attributesFiltered) {
			for (const type of getAllTypes(attribute.type)) {
				logInfo(`Matches for ${type}:`);
				//await clangd.resolveTypeHeader(type);
			}
		}*/

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

	for (const head of await clangd.clangdResolveHeader(header, targetDirUri)) {
		logInfo(head);
	}

	return (header);
}

export function getAllTypes(type: string) : string[] {
	let arr: string[] = [];
	let buffer: string = "";
	
	for (let i = 0; i < type.length; i++) {
		let c = type.at(i);

		if (!c) {
			continue;
		}

		if (isTypeChar(c)) {
			buffer += c;
		} else if (isSplitChar(c) && buffer.length > 0) {
			if (!isKeyword(buffer)) {
				arr.push(buffer);
			}
			buffer = "";	
		}
	}

	if (buffer.length > 0 && !isKeyword(buffer)) {
		arr.push(buffer);
	}

	return arr;
}