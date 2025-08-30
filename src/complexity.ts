export function calculateCognitiveComplexity(code: string): number {
  let complexity = 0;
  let nestingLevel = 0;
  
  const tokens = tokenize(code);
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = tokens[i - 1];
    
    switch (token) {
      case 'if':
      case 'while':
      case 'for':
      case 'do':
        complexity += 1 + nestingLevel;
        break;
        
      case 'else':
        if (prevToken !== '}') complexity += 1 + nestingLevel;
        break;
        
      case 'catch':
        complexity += 1 + nestingLevel;
        break;
        
      case 'switch':
        complexity += 1 + nestingLevel;
        break;
        
      case 'case':
        if (nestingLevel > 0) complexity += 1;
        break;
        
      case '&&':
      case '||':
        complexity += 1;
        break;
        
      case '{':
        if (isNestingToken(prevToken)) nestingLevel++;
        break;
        
      case '}':
        if (nestingLevel > 0) nestingLevel--;
        break;
    }
  }
  
  return complexity;
}

function tokenize(code: string): string[] {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/"[^"]*"/g, '')
    .replace(/'[^']*'/g, '')
    .replace(/`[^`]*`/g, '')
    .match(/\b(?:if|else|while|for|do|switch|case|catch|function)\b|[{}]|&&|\|\|/g) || [];
}

function isNestingToken(token: string): boolean {
  return ['if', 'while', 'for', 'do', 'switch', 'catch', 'function'].includes(token);
}