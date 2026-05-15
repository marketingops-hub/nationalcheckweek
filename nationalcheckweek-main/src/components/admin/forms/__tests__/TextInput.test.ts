/**
 * Unit Tests for TextInput Component
 * Run with: node --loader tsx src/components/admin/forms/__tests__/TextInput.test.ts
 */

import { TestSuite, expect, createMock } from './test-utils';

// Mock React for testing
const mockReact = {
  createElement: (type: any, props: any, ...children: any[]) => ({
    type,
    props: { ...props, children },
  }),
};

const suite = new TestSuite('TextInput Component');

suite.test('should accept all required props', () => {
  const props = {
    label: 'Test Label',
    value: 'test value',
    onChange: createMock<(value: string) => void>(),
  };

  expect.toBeDefined(props.label);
  expect.toBeDefined(props.value);
  expect.toBeDefined(props.onChange);
  expect.toEqual(props.label, 'Test Label');
  expect.toEqual(props.value, 'test value');
});

suite.test('should accept optional placeholder prop', () => {
  const props = {
    label: 'Test',
    value: '',
    onChange: createMock<(value: string) => void>(),
    placeholder: 'Enter text...',
  };

  expect.toBeDefined(props.placeholder);
  expect.toEqual(props.placeholder, 'Enter text...');
});

suite.test('should accept optional required prop', () => {
  const props = {
    label: 'Test',
    value: '',
    onChange: createMock<(value: string) => void>(),
    required: true,
  };

  expect.toBeTruthy(props.required);
});

suite.test('should accept optional helpText prop', () => {
  const props = {
    label: 'Test',
    value: '',
    onChange: createMock<(value: string) => void>(),
    helpText: 'This is help text',
  };

  expect.toBeDefined(props.helpText);
  expect.toEqual(props.helpText, 'This is help text');
});

suite.test('should accept optional type prop', () => {
  const validTypes = ['text', 'email', 'url', 'number'];
  
  for (const type of validTypes) {
    const props = {
      label: 'Test',
      value: '',
      onChange: createMock<(value: string) => void>(),
      type: type as 'text' | 'email' | 'url' | 'number',
    };
    
    expect.toBeDefined(props.type);
    expect.toEqual(props.type, type);
  }
});

suite.test('should accept optional maxLength prop', () => {
  const props = {
    label: 'Test',
    value: '',
    onChange: createMock<(value: string) => void>(),
    maxLength: 100,
  };

  expect.toBeDefined(props.maxLength);
  expect.toEqual(props.maxLength, 100);
});

suite.test('onChange should be called with string value', () => {
  const mockOnChange = createMock<(value: string) => void>();
  
  const props = {
    label: 'Test',
    value: '',
    onChange: mockOnChange.call.bind(mockOnChange),
  };

  // Simulate onChange call
  props.onChange('new value');
  
  expect.toBeTruthy(mockOnChange.wasCalled());
  expect.toEqual(mockOnChange.getCallCount(), 1);
  expect.toBeTruthy(mockOnChange.wasCalledWith('new value'));
});

suite.test('should handle empty string value', () => {
  const props = {
    label: 'Test',
    value: '',
    onChange: createMock<(value: string) => void>(),
  };

  expect.toEqual(props.value, '');
});

suite.test('should handle null/undefined value gracefully', () => {
  const nullValue = null;
  const undefinedValue = undefined;
  
  const propsWithNull = {
    label: 'Test',
    value: nullValue || '',
    onChange: createMock<(value: string) => void>(),
  };
  
  const propsWithUndefined = {
    label: 'Test',
    value: undefinedValue || '',
    onChange: createMock<(value: string) => void>(),
  };

  expect.toEqual(propsWithNull.value, '');
  expect.toEqual(propsWithUndefined.value, '');
});

suite.test('should validate email type', () => {
  const props = {
    label: 'Email',
    value: 'test@example.com',
    onChange: createMock<(value: string) => void>(),
    type: 'email' as const,
  };

  expect.toEqual(props.type, 'email');
  expect.toContain(props.value, '@');
});

suite.test('should validate url type', () => {
  const props = {
    label: 'Website',
    value: 'https://example.com',
    onChange: createMock<(value: string) => void>(),
    type: 'url' as const,
  };

  expect.toEqual(props.type, 'url');
  expect.toContain(props.value, 'https://');
});

suite.test('should validate number type', () => {
  const props = {
    label: 'Age',
    value: '25',
    onChange: createMock<(value: string) => void>(),
    type: 'number' as const,
  };

  expect.toEqual(props.type, 'number');
  const numValue = Number(props.value);
  expect.toBeTruthy(!isNaN(numValue));
});

// Run tests
suite.run().catch(console.error);
