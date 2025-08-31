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
  
  const tokens = tokenizeWithPositions(code);
  
  for (let i = 0; i < tokens.length; i++) {
    const { token, line, column } = tokens[i];
    const prevToken = tokens[i - 1]?.token;
    const nextToken = tokens[i + 1]?.token;
    let contribution = 0;
    let description = '';
    let incrementsNesting = false;
    
    switch (token) {
      case 'if':
        contribution = 1 + nestingLevel;
        description = nestingLevel === 0 
          ? `+${contribution} if statement`
          : `+${contribution} nested if statement (nesting=${nestingLevel})`;
        complexity += contribution;
        incrementsNesting = true;
        break;
        
      case 'else':
        if (nextToken === 'if') {
          // else if - hybrid increment (no nesting penalty)
          contribution = 1;
          description = `+${contribution} else if statement`;
          complexity += contribution;
          incrementsNesting = true;
          i++; // Skip the 'if' token
        } else {
          // else - hybrid increment (no nesting penalty) 
          contribution = 1;
          description = `+${contribution} else statement`;
          complexity += contribution;
          incrementsNesting = true;
        }
        break;
        
      case 'while':
      case 'for':
      case 'do':
        contribution = 1 + nestingLevel;
        description = nestingLevel === 0 
          ? `+${contribution} ${token} loop`
          : `+${contribution} nested ${token} loop (nesting=${nestingLevel})`;
        complexity += contribution;
        incrementsNesting = true;
        break;
        
      case 'catch':
        contribution = 1 + nestingLevel;
        description = nestingLevel === 0 
          ? `+${contribution} catch block`
          : `+${contribution} nested catch block (nesting=${nestingLevel})`;
        complexity += contribution;
        incrementsNesting = true;
        break;
        
      case 'switch':
        contribution = 1 + nestingLevel;
        description = nestingLevel === 0 
          ? `+${contribution} switch statement`
          : `+${contribution} nested switch statement (nesting=${nestingLevel})`;
        complexity += contribution;
        incrementsNesting = true;
        break;
        
      case '?':
        contribution = 1 + nestingLevel;
        description = nestingLevel === 0 
          ? `+${contribution} ternary operator`
          : `+${contribution} nested ternary operator (nesting=${nestingLevel})`;
        complexity += contribution;
        incrementsNesting = true;
        break;
        
      case '&&':
      case '||':
        // Check if this starts a new sequence of logical operators
        if (prevToken !== '&&' && prevToken !== '||') {
          contribution = 1;
          description = `+${contribution} logical operator sequence`;
          complexity += contribution;
        }
        break;
        
      case '{':
        if (incrementsNesting || (prevToken && isNestingToken(prevToken))) {
          nestingLevel++;
        }
        break;
        
      case '}':
        if (nestingLevel > 0) nestingLevel--;
        break;
        
      case 'goto':
      case 'break':
      case 'continue':
        // Only increment for labeled jumps or multi-level jumps
        if (nextToken && (isLabel(nextToken) || isNumber(nextToken))) {
          contribution = 1;
          description = `+${contribution} jump to ${nextToken}`;
          complexity += contribution;
        }
        break;
    }
    
    if (contribution > 0) {
      contributions.push({ line, column, contribution, description });
    }
    
    // Reset incrementsNesting flag after processing braces
    if (token !== '{' && token !== '}') {
      incrementsNesting = false;
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
  
  // Remove comments and strings 
  let cleanCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multiline comments
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/"(?:[^"\\]|\\.)*"/g, '') // Remove double-quoted strings
    .replace(/'(?:[^'\\]|\\.)*'/g, '') // Remove single-quoted strings
    .replace(/`(?:[^`\\]|\\.)*`/g, ''); // Remove template literals
  
  const lines = cleanCode.split('\n');
  
  // Updated regex to capture all required tokens
  const regex = /\b(?:if|else|while|for|do|switch|case|catch|try|finally|goto|break|continue|function)\b|[{}]|&&|\|\||(?<!\?)(\?)(?!\?|\.)|:/g;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      // Skip 'case' and 'try'/'finally' as they don't increment complexity
      if (match[0] === 'case' || match[0] === 'try' || match[0] === 'finally') {
        continue;
      }
      
      tokens.push({
        token: match[0],
        line: lineIndex + 1, // 1-based line numbers
        column: match.index
      });
    }
    regex.lastIndex = 0; // Reset for next line
  }
  
  return tokens;
}

function isNestingToken(token: string): boolean {
  return ['if', 'else', 'while', 'for', 'do', 'switch', 'catch'].includes(token);
}

function isLabel(token: string): boolean {
  // Simple heuristic: labels are typically alphanumeric identifiers
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token);
}

function isNumber(token: string): boolean {
  return /^\d+$/.test(token);
}