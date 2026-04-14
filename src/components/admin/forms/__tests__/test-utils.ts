/**
 * Simple Test Utilities for Shared Components
 * No 3rd party testing libraries - uses native Node.js assert
 */

import { strict as assert } from 'assert';

/**
 * Test result interface
 */
interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
}

/**
 * Test suite class
 */
export class TestSuite {
  private tests: Array<() => Promise<void>> = [];
  private results: TestResult[] = [];
  private suiteName: string;

  constructor(suiteName: string) {
    this.suiteName = suiteName;
  }

  /**
   * Add a test case
   */
  test(name: string, fn: () => void | Promise<void>): void {
    this.tests.push(async () => {
      const start = Date.now();
      try {
        await fn();
        this.results.push({
          name,
          passed: true,
          duration: Date.now() - start,
        });
      } catch (error) {
        this.results.push({
          name,
          passed: false,
          error: error as Error,
          duration: Date.now() - start,
        });
      }
    });
  }

  /**
   * Run all tests
   */
  async run(): Promise<void> {
    console.log(`\n🧪 Running test suite: ${this.suiteName}\n`);
    
    for (const test of this.tests) {
      await test();
    }

    this.printResults();
  }

  /**
   * Print test results
   */
  private printResults(): void {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n📊 Test Results:\n');
    
    for (const result of this.results) {
      const icon = result.passed ? '✅' : '❌';
      const time = `(${result.duration}ms)`;
      console.log(`${icon} ${result.name} ${time}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error.message}`);
        if (result.error.stack) {
          console.log(`   ${result.error.stack.split('\n').slice(1, 3).join('\n   ')}`);
        }
      }
    }

    console.log(`\n${passed}/${total} tests passed`);
    
    if (failed > 0) {
      console.log(`❌ ${failed} test(s) failed\n`);
      process.exit(1);
    } else {
      console.log(`✅ All tests passed!\n`);
    }
  }
}

/**
 * Assertion helpers
 */
export const expect = {
  /**
   * Assert value is truthy
   */
  toBeTruthy(value: any, message?: string): void {
    assert.ok(value, message || `Expected ${value} to be truthy`);
  },

  /**
   * Assert value is falsy
   */
  toBeFalsy(value: any, message?: string): void {
    assert.ok(!value, message || `Expected ${value} to be falsy`);
  },

  /**
   * Assert values are equal
   */
  toEqual(actual: any, expected: any, message?: string): void {
    assert.deepStrictEqual(actual, expected, message);
  },

  /**
   * Assert values are not equal
   */
  toNotEqual(actual: any, expected: any, message?: string): void {
    assert.notDeepStrictEqual(actual, expected, message);
  },

  /**
   * Assert value is defined
   */
  toBeDefined(value: any, message?: string): void {
    assert.notStrictEqual(value, undefined, message || 'Expected value to be defined');
  },

  /**
   * Assert value is undefined
   */
  toBeUndefined(value: any, message?: string): void {
    assert.strictEqual(value, undefined, message || 'Expected value to be undefined');
  },

  /**
   * Assert value is null
   */
  toBeNull(value: any, message?: string): void {
    assert.strictEqual(value, null, message || 'Expected value to be null');
  },

  /**
   * Assert function throws error
   */
  toThrow(fn: () => any, message?: string): void {
    assert.throws(fn, message);
  },

  /**
   * Assert string contains substring
   */
  toContain(str: string, substring: string, message?: string): void {
    assert.ok(
      str.includes(substring),
      message || `Expected "${str}" to contain "${substring}"`
    );
  },

  /**
   * Assert array has length
   */
  toHaveLength(arr: any[], length: number, message?: string): void {
    assert.strictEqual(
      arr.length,
      length,
      message || `Expected array to have length ${length}, got ${arr.length}`
    );
  },

  /**
   * Assert object has property
   */
  toHaveProperty(obj: any, property: string, message?: string): void {
    assert.ok(
      property in obj,
      message || `Expected object to have property "${property}"`
    );
  },
};

/**
 * Mock function helper
 */
export class MockFunction<T extends (...args: any[]) => any> {
  private calls: Array<Parameters<T>> = [];
  private returnValue: ReturnType<T> | undefined;

  /**
   * Call the mock function
   */
  call(...args: Parameters<T>): ReturnType<T> {
    this.calls.push(args);
    return this.returnValue as ReturnType<T>;
  }

  /**
   * Set return value
   */
  mockReturnValue(value: ReturnType<T>): this {
    this.returnValue = value;
    return this;
  }

  /**
   * Get number of calls
   */
  getCallCount(): number {
    return this.calls.length;
  }

  /**
   * Get all calls
   */
  getCalls(): Array<Parameters<T>> {
    return this.calls;
  }

  /**
   * Get specific call arguments
   */
  getCall(index: number): Parameters<T> | undefined {
    return this.calls[index];
  }

  /**
   * Check if function was called
   */
  wasCalled(): boolean {
    return this.calls.length > 0;
  }

  /**
   * Check if function was called with specific arguments
   */
  wasCalledWith(...args: Parameters<T>): boolean {
    return this.calls.some(call => 
      JSON.stringify(call) === JSON.stringify(args)
    );
  }

  /**
   * Reset mock
   */
  reset(): void {
    this.calls = [];
    this.returnValue = undefined;
  }
}

/**
 * Create a mock function
 */
export function createMock<T extends (...args: any[]) => any>(): MockFunction<T> {
  return new MockFunction<T>();
}
