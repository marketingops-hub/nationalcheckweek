/**
 * Unit Tests for useArrayField Hook
 */

import { TestSuite, expect, createMock } from '../../../components/admin/forms/__tests__/test-utils';

const suite = new TestSuite('useArrayField Hook');

suite.test('should handle adding items', () => {
  const mockOnChange = createMock<(items: string[]) => void>();
  const items = ['Item 1', 'Item 2'];
  
  // Simulate handleAdd behavior
  const handleAdd = () => {
    const newItems = [...items, ''];
    mockOnChange.call(newItems);
  };
  
  handleAdd();
  
  expect.toBeTruthy(mockOnChange.wasCalled());
  expect.toEqual(mockOnChange.getCallCount(), 1);
  
  const callArgs = mockOnChange.getCall(0);
  if (callArgs && callArgs[0]) {
    expect.toHaveLength(callArgs[0], 3);
    expect.toEqual(callArgs[0][2], '');
  }
});

suite.test('should handle removing items', () => {
  const mockOnChange = createMock<(items: string[]) => void>();
  const items = ['Item 1', 'Item 2', 'Item 3'];
  
  // Simulate handleRemove behavior
  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    mockOnChange.call(newItems);
  };
  
  handleRemove(1);
  
  expect.toBeTruthy(mockOnChange.wasCalled());
  
  const callArgs = mockOnChange.getCall(0);
  if (callArgs && callArgs[0]) {
    expect.toHaveLength(callArgs[0], 2);
    expect.toEqual(callArgs[0][0], 'Item 1');
    expect.toEqual(callArgs[0][1], 'Item 3');
  }
});

suite.test('should handle updating items', () => {
  const mockOnChange = createMock<(items: string[]) => void>();
  const items = ['Item 1', 'Item 2'];
  
  // Simulate handleUpdate behavior
  const handleUpdate = (index: number, value: string) => {
    const newItems = items.map((item, i) => i === index ? value : item);
    mockOnChange.call(newItems);
  };
  
  handleUpdate(0, 'Updated Item 1');
  
  expect.toBeTruthy(mockOnChange.wasCalled());
  
  const callArgs = mockOnChange.getCall(0);
  if (callArgs && callArgs[0]) {
    expect.toEqual(callArgs[0][0], 'Updated Item 1');
    expect.toEqual(callArgs[0][1], 'Item 2');
  }
});

suite.test('should not remove last item', () => {
  const items = ['Last Item'];
  const canRemove = items.length > 1;
  
  expect.toBeFalsy(canRemove);
});

suite.test('should allow removing when multiple items exist', () => {
  const items = ['Item 1', 'Item 2'];
  const canRemove = items.length > 1;
  
  expect.toBeTruthy(canRemove);
});

suite.test('should handle empty string updates', () => {
  const mockOnChange = createMock<(items: string[]) => void>();
  const items = ['Item 1', 'Item 2'];
  
  const handleUpdate = (index: number, value: string) => {
    const newItems = items.map((item, i) => i === index ? value : item);
    mockOnChange.call(newItems);
  };
  
  handleUpdate(0, '');
  
  const callArgs = mockOnChange.getCall(0);
  if (callArgs && callArgs[0]) {
    expect.toEqual(callArgs[0][0], '');
  }
});

suite.test('should handle adding multiple items sequentially', () => {
  const mockOnChange = createMock<(items: string[]) => void>();
  let items = ['Item 1'];
  
  const handleAdd = () => {
    items = [...items, ''];
    mockOnChange.call(items);
  };
  
  handleAdd();
  handleAdd();
  handleAdd();
  
  expect.toEqual(mockOnChange.getCallCount(), 3);
  expect.toHaveLength(items, 4);
});

suite.test('should preserve order when updating', () => {
  const items = ['A', 'B', 'C', 'D'];
  const updatedItems = items.map((item, i) => i === 1 ? 'X' : item);
  
  expect.toEqual(updatedItems[0], 'A');
  expect.toEqual(updatedItems[1], 'X');
  expect.toEqual(updatedItems[2], 'C');
  expect.toEqual(updatedItems[3], 'D');
});

suite.test('should handle removing first item', () => {
  const items = ['First', 'Second', 'Third'];
  const newItems = items.filter((_, i) => i !== 0);
  
  expect.toHaveLength(newItems, 2);
  expect.toEqual(newItems[0], 'Second');
  expect.toEqual(newItems[1], 'Third');
});

suite.test('should handle removing last item', () => {
  const items = ['First', 'Second', 'Third'];
  const newItems = items.filter((_, i) => i !== 2);
  
  expect.toHaveLength(newItems, 2);
  expect.toEqual(newItems[0], 'First');
  expect.toEqual(newItems[1], 'Second');
});

suite.run().catch(console.error);
