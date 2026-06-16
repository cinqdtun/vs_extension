export function createVscodeInput(id: string, placeholder: string): string {
    return `
        <input 
            type="text" 
            class="vscode-input" 
            id="${id}" 
            placeholder="${placeholder}"
            autocomplete="off"
        >
    `;
}