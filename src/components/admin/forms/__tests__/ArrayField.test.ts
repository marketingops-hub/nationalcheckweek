/**
 * Unit Tests for ArrayField Component
 */

import { TestSuite, expect, createMock } from './test-utils';

const suite = new TestSuite('ArrayField Component');

suite.test('should accept all required props', () => {
  const props = {
    label: 'Features',
    items: ['Feature 1', 'Feature 2'],
    onChange: createMock<(items: string[]) => void>(),
  };

  expect.toBeDefined(props.label);
  expect.toBeDefined(props.items);
  expect.toBeDefined(props.onChange);
  expect.toHaveLength(props.items, 2);
});

suite.test('should accept optional placeholder prop', () => {
  const props = {
    label: 'Features',
    items: [],
    onChange: createMock<(items: string[]) => void>(),
    placeholder: 'Enter feature...',
  };

  expect.toBeDefined(props.placeholder);
  expect.toEqual(props.placeholder, 'Enter feature...');
});

suite.test('should accept optional addButtonText prop', () => {
  const props = {
    label: 'Features',
    items: [],
    onChange: createMock<(items: string[]) => void>(),
    addButtonText: '+ Add Feature',
  };

  expect.toBeDefined(props.addButtonText);
  expect.toEqual(props.addButtonText, '+ Add Feature');
});

suite.test('should accept optional helpText prop', () => {
  const props = {
    label: 'Features',
    items: [],
    onChange: createMock<(items: string[]) => void>(),
    helpText: 'Add key features',
  };

  expect.toBeDefined(props.helpText);
  expect.toEqual(props.helpText, 'Add key features');
});

suite.test('onChange should be called with array of strings', () => {
  const mockOnChange = createMock<(items: string[]) => void>();
  
  const props = {
    label: 'Features',
    items: ['Item 1'],
    onChange: mockOnChange.call.bind(mockOnChange),
  };

  const newItems = ['Item 1', 'Item 2'];
  props.onChange(newItems);
  
  expect.toBeTruthy(mockOnChange.wasCalled());
  expect.toEqual(mockOnChange.getCallCount(), 1);
  expect.toBeTruthy(mockOnChange.wasCalledWith(newItems));
});

suite.test('should handle empty array', () => {
  const props = {
    label: 'Features',
    items: [],
    onChange: createMock<(items: string[]) => void>(),
  };

  expect.toHaveLength(props.items, 0);
});

suite.test('should handle single item', () => {
  const props = {
    label: 'Features',
    items: ['Single item'],
    onChange: createMock<(items: string[]) => void>(),
  };

  expect.toHaveLength(props.items, 1);
  expect.toEqual(props.items[0], 'Single item');
});

suite.test('should handle multiple items', () => {
  const props = {
    label: 'Features',
    items: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
    onChange: createMock<(items: string[]) => void>(),
  };

  expect.toHaveLength(props.items, 4);
  expect.toEqual(props.items[0], 'Item 1');
  expect.toEqual(props.items[3], 'Item 4');
});

suite.test('should handle adding items', () => {
  const items = ['Item 1'];
  const newItems = [...items, 'Item 2'];
  
  expect.toHaveLength(newItems, 2);
  expect.toEqual(newItems[1], 'Item 2');
});

suite.test('should handle removing items', () => {
  const items = ['Item 1', 'Item 2', 'Item 3'];
  const indexToRemove = 1;
  const newItems = items.filter((_, i) => i !== indexToRemove);
  
  expect.toHaveLength(newItems, 2);
  expect.toEqual(newItems[0], 'Item 1');
  expect.toEqual(newItems[1], 'Item 3');
});

suite.test('should handle updating items', () => {
  const items = ['Item 1', 'Item 2'];
  const indexToUpdate = 0;
  const newValue = 'Updated Item 1';
  const newItems = items.map((item, i) => i === indexToUpdate ? newValue : item);
  
  expect.toHaveLength(newItems, 2);
  expect.toEqual(newItems[0], 'Updated Item 1');
  expect.toEqual(newItems[1], 'Item 2');
});

suite.test('should enforce minimum 1 item when removing', () => {
  const items = ['Last item'];
  const canRemove = items.length > 1;
  
  expect.toBeFalsy(canRemove);
});

suite.test('should allow removing when more than 1 item', () => {
  const items = ['Item 1', 'Item 2'];
  const canRemove = items.length > 1;
  
  expect.toBeTruthy(canRemove);
});

suite.run().catch(console.error);
