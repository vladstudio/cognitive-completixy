import * as vscode from 'vscode';
import { calculateCognitiveComplexity } from './complexity';

let statusBarItem: vscode.StatusBarItem;
let timeout: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'cognitiveComplexity.refresh';
  context.subscriptions.push(statusBarItem);

  const refreshCommand = vscode.commands.registerCommand('cognitiveComplexity.refresh', updateComplexity);
  context.subscriptions.push(refreshCommand);

  const onActiveEditorChange = vscode.window.onDidChangeActiveTextEditor(updateComplexity);
  context.subscriptions.push(onActiveEditorChange);

  const onDocumentChange = vscode.workspace.onDidChangeTextDocument(debounceUpdate);
  context.subscriptions.push(onDocumentChange);

  updateComplexity();
}

function debounceUpdate() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(updateComplexity, 300);
}

function updateComplexity() {
  const editor = vscode.window.activeTextEditor;
  
  if (!editor || !isSupportedLanguage(editor.document.languageId)) {
    statusBarItem.hide();
    return;
  }

  const complexity = calculateCognitiveComplexity(editor.document.getText());
  const color = getComplexityColor(complexity);
  
  statusBarItem.text = `$(pulse) CC: ${complexity}`;
  statusBarItem.color = color;
  statusBarItem.tooltip = `Cognitive Complexity: ${complexity}`;
  statusBarItem.show();
}

function isSupportedLanguage(languageId: string): boolean {
  return ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId);
}

function getComplexityColor(complexity: number): string {
  if (complexity <= 5) return '#28a745';
  if (complexity <= 10) return '#ffc107';
  if (complexity <= 20) return '#fd7e14';
  return '#dc3545';
}

export function deactivate() {
  if (timeout) clearTimeout(timeout);
}