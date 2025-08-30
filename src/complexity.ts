export interface ComplexityContribution {
  line: number;
  column: number;
  contribution: number;
  description: string;
}

export function calculateCognitiveComplexity(code: string): number {
  return analyzeCognitiveComplexity(code).totalComplexity;
}

export function analyzeCognitiveComplexity(code: string): {
  totalComplexity: number;
  contributions: ComplexityContribution[];
} {
  let complexity = 0;
  let nestingLevel = 0;
  const contributions: ComplexityContribution[] = [];
  const lines = code.split('\n');
  
  const tokens = tokenizeWithPositions(code);
  
  for (let i = 0; i < tokens.length; i++) {
    const { token, line, column } = tokens[i];
    const prevToken = tokens[i - 1]?.token;
    let contribution = 0;
    let description = '';
    
    switch (token) {
      case 'if':
      case 'while':
      case 'for':
      case 'do':
        contribution = 1 + nestingLevel;
        description = nestingLevel === 0 
          ? `+${contribution} ${token} statement`
          : `+${contribution} nested ${token} statement`;
        complexity += contribution;
        break;
        
      case 'else':
        const nextToken = tokens[i + 1]?.token;
        if (nextToken !== 'if') {
          contribution = 1;
          description = `+${contribution} else statement`;
          complexity += contribution;
        }
        break;
        
      case 'catch':
        contribution = 1 + nestingLevel;
        description = nestingLevel === 0 
          ? `+${contribution} catch block`
          : `+${contribution} nested catch block`;
        complexity += contribution;
        break;
        
      case 'switch':
        contribution = 1 + nestingLevel;
        description = nestingLevel === 0 
          ? `+${contribution} switch statement`
          : `+${contribution} nested switch statement`;
        complexity += contribution;
        break;
        
      case 'case':
        break;
        
      case '&&':
        contribution = 1;
        description = `+${contribution} && operator`;
        complexity += contribution;
        break;
        
      case '||':
        contribution = 1;
        description = `+${contribution} || operator`;
        complexity += contribution;
        break;
        
      case '?':
        contribution = 1;
        description = `+${contribution} ternary operator`;
        complexity += contribution;
        break;
        
      case '{':
        if (isNestingToken(prevToken)) nestingLevel++;
        break;
        
      case '}':
        if (nestingLevel > 0) nestingLevel--;
        break;
    }
    
    if (contribution > 0) {
      contributions.push({ line, column, contribution, description });
    }
  }
  
  return { totalComplexity: complexity, contributions };
}

interface TokenWithPosition {
  token: string;
  line: number;
  column: number;
}

function tokenizeWithPositions(code: string): TokenWithPosition[] {
  const tokens: TokenWithPosition[] = [];
  const lines = code.split('\n');
  const regex = /\b(?:if|else|while|for|do|switch|case|catch|function)\b|[{}]|&&|\|\||\?|:/g;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    let line = lines[lineIndex];
    
    // Remove comments and strings for this line
    line = line
      .replace(/\/\*.*?\*\//g, '')
      .replace(/\/\/.*$/, '')
      .replace(/"[^"]*"/g, '')
      .replace(/'[^']*'/g, '')
      .replace(/`[^`]*`/g, '');
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      tokens.push({
        token: match[0],
        line: lineIndex,
        column: match.index
      });
    }
    regex.lastIndex = 0; // Reset for next line
  }
  
  return tokens;
}


function isNestingToken(token: string): boolean {
  return ['if', 'while', 'for', 'do', 'switch', 'catch'].includes(token);
}