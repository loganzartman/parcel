import { describe, it } from 'node:test';
import assert from 'node:assert';
import { add, multiply, factorial } from './math';

describe('math utilities', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      assert.strictEqual(add(2, 3), 5);
    });

    it('should add negative numbers', () => {
      assert.strictEqual(add(-1, -2), -3);
    });

    it('should handle zero', () => {
      assert.strictEqual(add(5, 0), 5);
    });
  });

  describe('multiply', () => {
    it('should multiply two numbers', () => {
      assert.strictEqual(multiply(3, 4), 12);
    });

    it('should return zero when multiplied by zero', () => {
      assert.strictEqual(multiply(5, 0), 0);
    });
  });

  describe('factorial', () => {
    it('should return 1 for factorial of 0', () => {
      assert.strictEqual(factorial(0), 1);
    });

    it('should return 1 for factorial of 1', () => {
      assert.strictEqual(factorial(1), 1);
    });

    it('should calculate factorial correctly', () => {
      assert.strictEqual(factorial(5), 120);
    });

    it('should throw for negative numbers', () => {
      assert.throws(
        () => factorial(-1),
        { message: 'Factorial is not defined for negative numbers' }
      );
    });
  });
});
