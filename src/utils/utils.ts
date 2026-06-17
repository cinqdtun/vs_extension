import * as vscode from 'vscode';
import * as path from 'path';

export function getStylesheetUri(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) : vscode.Uri {
	const stylesheetDiskPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'styles', 'styles.css');
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

export function isKeyword(type: string) : Boolean {
	const keywords = new Set([
		"alignas",
		"alignof",
		"and",
		"and_eq",
		"asm",
		"atomic_cancel",
		"atomic_commit",
		"atomic_noexcept",
		"auto",
		"bitand",
		"bitor",
		"bool",
		"break",
		"case",
		"catch",
		"char",
		"char8_t",
		"char16_t",
		"char32_t",
		"class",
		"compl",
		"concept",
		"const",
		"consteval",
		"constexpr",
		"constinit",
		"const_cast",
		"continue",
		"contract_assert",
		"co_await",
		"co_return",
		"co_yield",
		"decltype",
		"default",
		"delete",
		"do",
		"double",
		"dynamic_cast",
		"else",
		"enum",
		"explicit",
		"export",
		"extern",
		"false",
		"float",
		"for",
		"friend",
		"goto",
		"if",
		"inline",
		"int",
		"long",
		"mutable",
		"namespace",
		"new",
		"noexcept",
		"not",
		"not_eq",
		"nullptr",
		"operator",
		"or",
		"or_eq",
		"private",
		"protected",
		"public",
		"reflexpr",
		"register",
		"reinterpret_cast",
		"requires",
		"return",
		"short",
		"signed",
		"sizeof",
		"static",
		"static_assert",
		"static_cast",
		"struct",
		"switch",
		"synchronized",
		"template",
		"this",
		"thread_local",
		"throw",
		"true",
		"try",
		"typedef",
		"typeid",
		"typename",
		"union",
		"unsigned",
		"using",
		"virtual",
		"void",
		"volatile",
		"wchar_t",
		"while",
		"xor",
		"xor_eq"]);

	return keywords.has(type);
}

export function isDigit(c: string) : Boolean {
	if (c.length !== 1) {
		return false;
	}

	return c >= '0' && c <= '9';
}

export function isUpper(c: string) : Boolean {
	if (c.length !== 1) {
		return false;
	}

	return c >= 'A' && c <= 'Z';
}

export function isLower(c: string) : Boolean {
	if (c.length !== 1) {
		return false;
	}

	return c >= 'a' && c <= 'z';
}

export function isUnderscore(c: string) : Boolean {
	if (c.length !== 1) {
		return false;
	}

	return c === '_';
}

export function isColon(c: string) : Boolean {
	if (c.length !== 1) {
		return false;
	}

	return c === ':';
}

export function isTypeChar(c: string) : Boolean {
	if (c.length !== 1) {
		return false;
	}

	return isLower(c) || isUpper(c) || isDigit(c) || isColon(c) || isUnderscore(c);
}

export function isSplitChar(c: string) : Boolean {
	if (c.length !== 1) {
		return false;
	}

	return c === '<' || c === '>' || c === ',' || c === '*' || c === '&' || c === ' ';
}