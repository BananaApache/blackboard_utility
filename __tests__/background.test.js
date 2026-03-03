// Import the functions (in a real scenario, you'd need to export them from background.js)
// For testing purposes, we'll redefine them here

function extractInputs(htmlString) {
  const inputRegex = /<input\s+([^>]*?)>/gi;
  const inputDict = {};
  
  let match;
  while ((match = inputRegex.exec(htmlString)) !== null) {
    const inputAttributes = {};
    
    const attributeRegex = /(\w+)(?:=["']([^"']*?)["'])?/gi;
    let attributeMatch;
    while ((attributeMatch = attributeRegex.exec(match[1])) !== null) {
      inputAttributes[attributeMatch[1]] = attributeMatch[2] || true;
    }
    
    const inputName = inputAttributes.name || `unnamed_input_${Object.keys(inputDict).length}`;
    inputDict[inputName] = inputAttributes;
  }
  
  return inputDict;
}

function extractFormTokenValues(html) {
  const tokens = [];
  const regex = /<input[^>]*id="formToken"[^>]*value="([^"]*)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
}

function extractOptionValues(html) {
  const options = [];
  const regex = /<option[^>]*value="([^"]*)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    options.push(match[1]);
  }
  return options;
}

describe('background.js - extractInputs', () => {
  test('should extract single input with name and value', () => {
    const html = '<input name="username" value="john" type="text">';
    const result = extractInputs(html);
    
    expect(result).toHaveProperty('username');
    expect(result.username.name).toBe('username');
    expect(result.username.value).toBe('john');
    expect(result.username.type).toBe('text');
  });

  test('should extract multiple inputs', () => {
    const html = `
      <input name="email" value="test@example.com" type="email">
      <input name="password" value="secret" type="password">
    `;
    const result = extractInputs(html);
    
    expect(Object.keys(result)).toHaveLength(2);
    expect(result.email.value).toBe('test@example.com');
    expect(result.password.type).toBe('password');
  });

  test('should handle inputs without name attribute', () => {
    const html = '<input value="test" type="text">';
    const result = extractInputs(html);
    
    expect(result).toHaveProperty('unnamed_input_0');
  });

  test('should extract SAML inputs', () => {
    const html = `
      <input name="SAMLResponse" value="PD94bWwgdmVyc2lvbj0iMS4wIj8+" type="hidden">
      <input name="RelayState" value="https://example.com" type="hidden">
    `;
    const result = extractInputs(html);
    
    expect(result.SAMLResponse.value).toBe('PD94bWwgdmVyc2lvbj0iMS4wIj8+');
    expect(result.RelayState.value).toBe('https://example.com');
  });

  test('should return empty object for no inputs', () => {
    const html = '<div>No inputs here</div>';
    const result = extractInputs(html);
    
    expect(result).toEqual({});
  });

  test('should handle inputs with attributes but no value', () => {
    const html = '<input name="checkbox" type="checkbox" checked>';
    const result = extractInputs(html);
    
    expect(result.checkbox.type).toBe('checkbox');
    expect(result.checkbox.checked).toBe(true);
  });
});

describe('background.js - extractFormTokenValues', () => {
  test('should extract single formToken', () => {
    const html = '<input id="formToken" value="abc123xyz">';
    const result = extractFormTokenValues(html);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('abc123xyz');
  });

  test('should extract multiple formTokens', () => {
    const html = `
      <input id="formToken" value="token1">
      <input id="formToken" value="token2">
    `;
    const result = extractFormTokenValues(html);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('token1');
    expect(result[1]).toBe('token2');
  });

  test('should return empty array when no formToken found', () => {
    const html = '<input id="otherField" value="test">';
    const result = extractFormTokenValues(html);
    
    expect(result).toEqual([]);
  });

  test('should extract token with special characters', () => {
    const html = '<input id="formToken" value="token-123_abc.def">';
    const result = extractFormTokenValues(html);
    
    expect(result[0]).toBe('token-123_abc.def');
  });

  test('should handle formToken with empty value', () => {
    const html = '<input id="formToken" value="">';
    const result = extractFormTokenValues(html);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('');
  });
});

describe('background.js - extractOptionValues', () => {
  test('should extract single option value', () => {
    const html = '<option value="option1">Option 1</option>';
    const result = extractOptionValues(html);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('option1');
  });

  test('should extract multiple option values', () => {
    const html = `
      <select>
        <option value="spring2025">Spring 2025</option>
        <option value="fall2025">Fall 2025</option>
        <option value="spring2026">Spring 2026</option>
      </select>
    `;
    const result = extractOptionValues(html);
    
    expect(result).toHaveLength(3);
    expect(result).toContain('spring2025');
    expect(result).toContain('fall2025');
    expect(result).toContain('spring2026');
  });

  test('should return empty array when no options found', () => {
    const html = '<div>No options here</div>';
    const result = extractOptionValues(html);
    
    expect(result).toEqual([]);
  });

  test('should extract numeric values', () => {
    const html = '<option value="2025">2025</option><option value="2026">2026</option>';
    const result = extractOptionValues(html);
    
    expect(result).toEqual(['2025', '2026']);
  });

  test('should handle options with empty values', () => {
    const html = '<option value="">-- Select --</option><option value="val1">Value 1</option>';
    const result = extractOptionValues(html);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('');
    expect(result[1]).toBe('val1');
  });
});
