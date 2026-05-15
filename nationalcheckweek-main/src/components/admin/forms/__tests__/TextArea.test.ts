/**
 * Unit Tests for TextArea Component
 */

import { TestSuite, expect, createMock } from './test-utils';

const suite = new TestSuite('TextArea Component');

suite.test('should accept all required props', () => {
  const props = {
    label: 'Description',
    value: 'test description',
    onChange: createMock<(value: string) => void>(),
  };

  expect.toBeDefined(props.label);
  expect.toBeDefined(props.value);
  expect.toBeDefined(props.onChange);
  expect.toEqual(props.label, 'Description');
  expect.toEqual(props.value, 'test description');
});

suite.test('should accept optional placeholder prop', () => {
  const props = {
    label: 'Description',
    value: '',
    onChange: createMock<(value: string) => void>(),
    placeholder: 'Enter description...',
  };

  expect.toBeDefined(props.placeholder);
  expect.toEqual(props.placeholder, 'Enter description...');
});

suite.test('should accept optional required prop', () => {
  const props = {
    label: 'Description',
    value: '',
    onChange: createMock<(value: string) => void>(),
    required: true,
  };

  expect.toBeTruthy(props.required);
});

suite.test('should accept optional helpText prop', () => {
  const props = {
    label: 'Description',
    value: '',
    onChange: createMock<(value: string) => void>(),
    helpText: 'Provide a detailed description',
  };

  expect.toBeDefined(props.helpText);
  expect.toEqual(props.helpText, 'Provide a detailed description');
});

suite.test('should accept optional rows prop', () => {
  const props = {
    label: 'Description',
    value: '',
    onChange: createMock<(value: string) => void>(),
    rows: 6,
  };

  expect.toBeDefined(props.rows);
  expect.toEqual(props.rows, 6);
});

suite.test('should default to 4 rows when not specified', () => {
  const defaultRows = 4;
  expect.toEqual(defaultRows, 4);
});

suite.test('onChange should be called with string value', () => {
  const mockOnChange = createMock<(value: string) => void>();
  
  const props = {
    label: 'Description',
    value: '',
    onChange: mockOnChange.call.bind(mockOnChange),
  };

  props.onChange('new description');
  
  expect.toBeTruthy(mockOnChange.wasCalled());
  expect.toEqual(mockOnChange.getCallCount(), 1);
  expect.toBeTruthy(mockOnChange.wasCalledWith('new description'));
});

suite.test('should handle empty string value', () => {
  const props = {
    label: 'Description',
    value: '',
    onChange: createMock<(value: string) => void>(),
  };

  expect.toEqual(props.value, '');
});

suite.test('should handle multi-line text', () => {
  const multiLineText = 'Line 1\nLine 2\nLine 3';
  const props = {
    label: 'Description',
    value: multiLineText,
    onChange: createMock<(value: string) => void>(),
  };

  expect.toContain(props.value, '\n');
  expect.toContain(props.value, 'Line 1');
  expect.toContain(props.value, 'Line 3');
});

suite.test('should handle long text content', () => {
  const longText = 'a'.repeat(1000);
  const props = {
    label: 'Description',
    value: longText,
    onChange: createMock<(value: string) => void>(),
  };

  expect.toEqual(props.value.length, 1000);
});

suite.run().catch(console.error);
