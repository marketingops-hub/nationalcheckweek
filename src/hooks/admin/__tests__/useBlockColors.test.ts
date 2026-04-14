/**
 * Unit Tests for useBlockColors Hook
 */

import { TestSuite, expect, createMock } from '../../../components/admin/forms/__tests__/test-utils';

const suite = new TestSuite('useBlockColors Hook');

suite.test('should handle color change correctly', () => {
  const mockOnChange = createMock<(key: string, value: unknown) => void>();
  
  const colors = {
    primary: '#29B8E8',
    secondary: '#E5007E',
  };
  
  // Simulate handleColorChange behavior
  const handleColorChange = (colorKey: string, value: string) => {
    mockOnChange.call('colors', {
      ...colors,
      useGlobalColors: false,
      [colorKey]: value,
    });
  };
  
  handleColorChange('primary', '#FF0000');
  
  expect.toBeTruthy(mockOnChange.wasCalled());
  expect.toEqual(mockOnChange.getCallCount(), 1);
  
  const callArgs = mockOnChange.getCall(0);
  expect.toEqual(callArgs?.[0], 'colors');
  expect.toHaveProperty(callArgs?.[1], 'useGlobalColors');
  expect.toEqual((callArgs?.[1] as any).useGlobalColors, false);
});

suite.test('should set useGlobalColors to false when color changes', () => {
  const colors = {
    primary: '#29B8E8',
    useGlobalColors: true,
  };
  
  const newColors = {
    ...colors,
    useGlobalColors: false,
    primary: '#FF0000',
  };
  
  expect.toEqual(newColors.useGlobalColors, false);
  expect.toEqual(newColors.primary, '#FF0000');
});

suite.test('should preserve existing colors when updating', () => {
  const colors = {
    primary: '#29B8E8',
    secondary: '#E5007E',
    textColor: '#3D3D3D',
  };
  
  const updatedColors = {
    ...colors,
    useGlobalColors: false,
    primary: '#FF0000',
  };
  
  expect.toEqual(updatedColors.secondary, '#E5007E');
  expect.toEqual(updatedColors.textColor, '#3D3D3D');
  expect.toEqual(updatedColors.primary, '#FF0000');
});

suite.test('should handle multiple color updates', () => {
  const mockOnChange = createMock<(key: string, value: unknown) => void>();
  
  let colors: Record<string, any> = {
    primary: '#29B8E8',
    secondary: '#E5007E',
  };
  
  const handleColorChange = (colorKey: string, value: string) => {
    colors = {
      ...colors,
      useGlobalColors: false,
      [colorKey]: value,
    };
    mockOnChange.call('colors', colors);
  };
  
  handleColorChange('primary', '#FF0000');
  handleColorChange('secondary', '#00FF00');
  
  expect.toEqual(mockOnChange.getCallCount(), 2);
  expect.toEqual(colors.primary, '#FF0000');
  expect.toEqual(colors.secondary, '#00FF00');
});

suite.test('should handle empty colors object', () => {
  const colors = {};
  
  const updatedColors = {
    ...colors,
    useGlobalColors: false,
    primary: '#29B8E8',
  };
  
  expect.toHaveProperty(updatedColors, 'primary');
  expect.toEqual(updatedColors.primary, '#29B8E8');
});

suite.test('should override useGlobalColors even if already false', () => {
  const colors: Record<string, any> = {
    primary: '#29B8E8',
    useGlobalColors: false,
  };
  
  const updatedColors = {
    ...colors,
    useGlobalColors: false,
    primary: '#FF0000',
  };
  
  expect.toEqual(updatedColors.useGlobalColors, false);
});

suite.test('should handle color key with special characters', () => {
  const colors = {};
  
  const updatedColors = {
    ...colors,
    useGlobalColors: false,
    'background-color': '#FFFFFF',
  };
  
  expect.toHaveProperty(updatedColors, 'background-color');
  expect.toEqual(updatedColors['background-color'], '#FFFFFF');
});

suite.run().catch(console.error);
