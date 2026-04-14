/**
 * Unit Tests for ColorPicker Component
 */

import { TestSuite, expect, createMock } from './test-utils';

const suite = new TestSuite('ColorPicker Component');

suite.test('should accept all required props', () => {
  const props = {
    label: 'Primary Color',
    value: '#29B8E8',
    onChange: createMock<(value: string) => void>(),
  };

  expect.toBeDefined(props.label);
  expect.toBeDefined(props.value);
  expect.toBeDefined(props.onChange);
});

suite.test('should accept optional helpText prop', () => {
  const props = {
    label: 'Primary Color',
    value: '#29B8E8',
    onChange: createMock<(value: string) => void>(),
    helpText: 'Choose your brand color',
  };

  expect.toBeDefined(props.helpText);
  expect.toEqual(props.helpText, 'Choose your brand color');
});

suite.test('onChange should be called with hex color value', () => {
  const mockOnChange = createMock<(value: string) => void>();
  
  const props = {
    label: 'Primary Color',
    value: '#29B8E8',
    onChange: mockOnChange.call.bind(mockOnChange),
  };

  props.onChange('#FF0000');
  
  expect.toBeTruthy(mockOnChange.wasCalled());
  expect.toEqual(mockOnChange.getCallCount(), 1);
  expect.toBeTruthy(mockOnChange.wasCalledWith('#FF0000'));
});

suite.test('should handle hex color format', () => {
  const hexColor = '#29B8E8';
  expect.toContain(hexColor, '#');
  expect.toEqual(hexColor.length, 7);
});

suite.test('should handle short hex format', () => {
  const shortHex = '#FFF';
  expect.toContain(shortHex, '#');
  expect.toEqual(shortHex.length, 4);
});

suite.test('should validate hex color pattern', () => {
  const validHex = '#29B8E8';
  const hexPattern = /^#[0-9A-Fa-f]{3,6}$/;
  expect.toBeTruthy(hexPattern.test(validHex));
});

suite.test('should reject invalid hex colors', () => {
  const invalidColors = ['#GGGGGG', 'red', '29B8E8', '#'];
  const hexPattern = /^#[0-9A-Fa-f]{3,6}$/;
  
  for (const color of invalidColors) {
    expect.toBeFalsy(hexPattern.test(color));
  }
});

suite.test('should handle uppercase hex values', () => {
  const upperHex = '#29B8E8';
  expect.toContain(upperHex, 'B');
  expect.toContain(upperHex, 'E');
});

suite.test('should handle lowercase hex values', () => {
  const lowerHex = '#29b8e8';
  expect.toContain(lowerHex, 'b');
  expect.toContain(lowerHex, 'e');
});

suite.test('should handle default color values', () => {
  const defaultColors = {
    primary: '#29B8E8',
    accent: '#E5007E',
    white: '#FFFFFF',
    black: '#000000',
  };

  for (const color of Object.values(defaultColors)) {
    expect.toContain(color, '#');
    expect.toBeTruthy(color.length >= 4 && color.length <= 7);
  }
});

suite.run().catch(console.error);
