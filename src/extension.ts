import * as vscode from 'vscode';
import { calculateCognitiveComplexity, analyzeCognitiveComplexity, ComplexityContribution } from './complexity';

let statusBarItem: vscode.StatusBarItem;
let timeout: NodeJS.Timeout | undefined;
let hintsVisible = false;
let infoDecorationType: vscode.TextEditorDecorationType;
let warningDecorationType: vscode.TextEditorDecorationType;
let errorDecorationType: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'cognitiveComplexity.refresh';
  context.subscriptions.push(statusBarItem);

  // Create decoration types
  infoDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
      color: '#17a2b8',
      fontStyle: 'italic',
      margin: '0 0 0 1em'
    }
  });

  warningDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
      color: '#ffc107',
      fontStyle: 'italic',
      margin: '0 0 0 1em'
    }
  });

  errorDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
      color: '#dc3545',
      fontStyle: 'italic',
      margin: '0 0 0 1em'
    }
  });

  context.subscriptions.push(infoDecorationType, warningDecorationType, errorDecorationType);

  const refreshCommand = vscode.commands.registerCommand('cognitiveComplexity.refresh', toggleHints);
  context.subscriptions.push(refreshCommand);

  const onActiveEditorChange = vscode.window.onDidChangeActiveTextEditor(() => {
    hideHints();
    updateComplexity();
  });
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
  const level = getComplexityLevel(complexity);
  
  statusBarItem.text = `$(pulse) CC: ${complexity} (${level})`;
  statusBarItem.color = undefined;
  statusBarItem.tooltip = `Cognitive Complexity: ${complexity} - ${level}`;
  statusBarItem.show();
}

function isSupportedLanguage(languageId: string): boolean {
  return ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId);
}

function getComplexityLevel(complexity: number): string {
  if (complexity <= 5) return 'Very Low';
  if (complexity <= 10) return 'Low';
  if (complexity <= 20) return 'Moderate';
  if (complexity <= 50) return 'High';
  return 'Very High';
}

function toggleHints() {
  if (hintsVisible) {
    hideHints();
  } else {
    showHints();
  }
}

function showHints() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !isSupportedLanguage(editor.document.languageId)) {
    return;
  }

  const analysis = analyzeCognitiveComplexity(editor.document.getText());
  const infoDecorations: vscode.DecorationOptions[] = [];
  const warningDecorations: vscode.DecorationOptions[] = [];
  const errorDecorations: vscode.DecorationOptions[] = [];

  for (const contribution of analysis.contributions) {
    const lineText = editor.document.lineAt(contribution.line).text;
    const lineEnd = lineText.length;
    
    const range = new vscode.Range(
      contribution.line,
      lineEnd,
      contribution.line,
      lineEnd
    );

    const decoration: vscode.DecorationOptions = {
      range,
      renderOptions: {
        after: {
          contentText: ` // ${contribution.description}`
        }
      }
    };

    if (contribution.contribution === 1) {
      infoDecorations.push(decoration);
    } else if (contribution.contribution <= 3) {
      warningDecorations.push(decoration);
    } else {
      errorDecorations.push(decoration);
    }
  }

  editor.setDecorations(infoDecorationType, infoDecorations);
  editor.setDecorations(warningDecorationType, warningDecorations);
  editor.setDecorations(errorDecorationType, errorDecorations);
  hintsVisible = true;
}

function hideHints() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    editor.setDecorations(infoDecorationType, []);
    editor.setDecorations(warningDecorationType, []);
    editor.setDecorations(errorDecorationType, []);
  }
  hintsVisible = false;
}

export function deactivate() {
  if (timeout) clearTimeout(timeout);
}