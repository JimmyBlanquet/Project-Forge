# TDD Cycle Example: String Calculator

This example demonstrates the complete TDD workflow for building a simple string calculator function.

## Feature Requirements

Create a `calculate(expression: string): number` function that:
- Evaluates basic math expressions
- Supports addition, subtraction, multiplication, division
- Returns the result as a number

## Iteration 1: Basic Addition

### 🔴 RED Phase

```typescript
// tests/calculator.test.ts
describe('calculate', () => {
  test('should add two numbers', () => {
    const result = calculate('2 + 3');
    expect(result).toBe(5);
  });
});
```

**Run:**
```bash
npm test tests/calculator.test.ts
```

**Output:**
```
❌ FAIL tests/calculator.test.ts
  ● calculate › should add two numbers

    ReferenceError: calculate is not defined
```

✅ **Good RED:** Function doesn't exist

---

### 🟢 GREEN Phase

```typescript
// lib/calculator.ts
export function calculate(expression: string): number {
  // Minimal implementation - just make test pass
  return 5;
}
```

**Run:**
```bash
npm test tests/calculator.test.ts
```

**Output:**
```
✅ PASS tests/calculator.test.ts
  ✓ calculate › should add two numbers (3ms)
```

✅ **Test passes** (hardcoded is OK for first test)

---

### 🔵 REFACTOR Phase

*(Code is too simple, skip refactoring for now)*

---

## Iteration 2: Different Numbers

### 🔴 RED Phase

```typescript
describe('calculate', () => {
  test('should add two numbers', () => {
    const result = calculate('2 + 3');
    expect(result).toBe(5);
  });

  test('should add different numbers', () => {
    const result = calculate('10 + 7');
    expect(result).toBe(17);
  });
});
```

**Run:**
```bash
npm test
```

**Output:**
```
✅ PASS calculate › should add two numbers
❌ FAIL calculate › should add different numbers

  Expected: 17
  Received: 5
```

✅ **Good RED:** Hardcoded value doesn't work for all inputs

---

### 🟢 GREEN Phase

```typescript
export function calculate(expression: string): number {
  // Now we need to actually parse the expression
  const parts = expression.split(' + ');
  const a = parseInt(parts[0]);
  const b = parseInt(parts[1]);
  return a + b;
}
```

**Run:**
```bash
npm test
```

**Output:**
```
✅ PASS calculate › should add two numbers (2ms)
✅ PASS calculate › should add different numbers (1ms)
```

✅ **Both tests pass**

---

### 🔵 REFACTOR Phase

```typescript
export function calculate(expression: string): number {
  const [leftStr, rightStr] = expression.split(' + ');
  const left = Number(leftStr);
  const right = Number(rightStr);
  return left + right;
}
```

**Run:**
```bash
npm test
```

**Output:**
```
✅ PASS calculate › should add two numbers (2ms)
✅ PASS calculate › should add different numbers (1ms)
```

✅ **Still passing** after refactor

---

## Iteration 3: Subtraction Support

### 🔴 RED Phase

```typescript
describe('calculate', () => {
  // ... previous tests ...

  test('should subtract two numbers', () => {
    const result = calculate('10 - 3');
    expect(result).toBe(7);
  });
});
```

**Run:**
```bash
npm test
```

**Output:**
```
✅ PASS calculate › should add two numbers
✅ PASS calculate › should add different numbers
❌ FAIL calculate › should subtract two numbers

  Expected: 7
  Received: NaN
```

✅ **Good RED:** Current implementation only handles addition

---

### 🟢 GREEN Phase

```typescript
export function calculate(expression: string): number {
  // Check for subtraction
  if (expression.includes(' - ')) {
    const [leftStr, rightStr] = expression.split(' - ');
    return Number(leftStr) - Number(rightStr);
  }

  // Addition (existing code)
  const [leftStr, rightStr] = expression.split(' + ');
  return Number(leftStr) + Number(rightStr);
}
```

**Run:**
```bash
npm test
```

**Output:**
```
✅ PASS calculate › should add two numbers (2ms)
✅ PASS calculate › should add different numbers (1ms)
✅ PASS calculate › should subtract two numbers (2ms)
```

✅ **All tests pass**

---

### 🔵 REFACTOR Phase

```typescript
export function calculate(expression: string): number {
  // Extract operator detection
  const operators = [
    { symbol: ' + ', fn: (a: number, b: number) => a + b },
    { symbol: ' - ', fn: (a: number, b: number) => a - b }
  ];

  for (const op of operators) {
    if (expression.includes(op.symbol)) {
      const [leftStr, rightStr] = expression.split(op.symbol);
      const left = Number(leftStr);
      const right = Number(rightStr);
      return op.fn(left, right);
    }
  }

  throw new Error('Invalid expression');
}
```

**Run:**
```bash
npm test
```

**Output:**
```
✅ PASS calculate › should add two numbers (2ms)
✅ PASS calculate › should add different numbers (1ms)
✅ PASS calculate › should subtract two numbers (2ms)
```

✅ **Still passing** with cleaner code

---

## Iteration 4: Multiplication and Division

### 🔴 RED Phase

```typescript
describe('calculate', () => {
  // ... previous tests ...

  test('should multiply two numbers', () => {
    const result = calculate('4 * 5');
    expect(result).toBe(20);
  });

  test('should divide two numbers', () => {
    const result = calculate('20 / 4');
    expect(result).toBe(5);
  });
});
```

**Run:**
```bash
npm test
```

**Output:**
```
✅ PASS (3 previous tests)
❌ FAIL calculate › should multiply two numbers
❌ FAIL calculate › should divide two numbers
```

✅ **Good RED:** New operators not implemented

---

### 🟢 GREEN Phase

```typescript
export function calculate(expression: string): number {
  const operators = [
    { symbol: ' + ', fn: (a: number, b: number) => a + b },
    { symbol: ' - ', fn: (a: number, b: number) => a - b },
    { symbol: ' * ', fn: (a: number, b: number) => a * b },
    { symbol: ' / ', fn: (a: number, b: number) => a / b }
  ];

  for (const op of operators) {
    if (expression.includes(op.symbol)) {
      const [leftStr, rightStr] = expression.split(op.symbol);
      const left = Number(leftStr);
      const right = Number(rightStr);
      return op.fn(left, right);
    }
  }

  throw new Error('Invalid expression');
}
```

**Run:**
```bash
npm test
```

**Output:**
```
✅ PASS calculate › should add two numbers (2ms)
✅ PASS calculate › should add different numbers (1ms)
✅ PASS calculate › should subtract two numbers (2ms)
✅ PASS calculate › should multiply two numbers (2ms)
✅ PASS calculate › should divide two numbers (2ms)
```

✅ **All 5 tests pass**

---

### 🔵 REFACTOR Phase

*(Code is already clean from previous refactoring, no changes needed)*

---

## Iteration 5: Edge Cases

### 🔴 RED Phase

```typescript
describe('calculate edge cases', () => {
  test('should handle decimal numbers', () => {
    expect(calculate('2.5 + 3.7')).toBe(6.2);
  });

  test('should handle negative numbers', () => {
    expect(calculate('-5 + 10')).toBe(5);
  });

  test('should throw error for invalid expression', () => {
    expect(() => calculate('invalid')).toThrow('Invalid expression');
  });

  test('should throw error for division by zero', () => {
    expect(() => calculate('10 / 0')).toThrow('Division by zero');
  });
});
```

**Run:**
```bash
npm test
```

**Output:**
```
✅ PASS (5 previous tests)
✅ PASS should handle decimal numbers
✅ PASS should handle negative numbers
✅ PASS should throw error for invalid expression
❌ FAIL should throw error for division by zero

  Expected: Error "Division by zero"
  Received: Infinity
```

✅ **Good RED:** Division by zero not handled

---

### 🟢 GREEN Phase

```typescript
export function calculate(expression: string): number {
  const operators = [
    { symbol: ' + ', fn: (a: number, b: number) => a + b },
    { symbol: ' - ', fn: (a: number, b: number) => a - b },
    { symbol: ' * ', fn: (a: number, b: number) => a * b },
    {
      symbol: ' / ',
      fn: (a: number, b: number) => {
        if (b === 0) throw new Error('Division by zero');
        return a / b;
      }
    }
  ];

  for (const op of operators) {
    if (expression.includes(op.symbol)) {
      const [leftStr, rightStr] = expression.split(op.symbol);
      const left = Number(leftStr);
      const right = Number(rightStr);
      return op.fn(left, right);
    }
  }

  throw new Error('Invalid expression');
}
```

**Run:**
```bash
npm test
```

**Output:**
```
✅ PASS (all 9 tests passing)
```

✅ **Complete feature with edge cases**

---

## Final Test Suite

```typescript
// tests/calculator.test.ts
describe('calculate', () => {
  describe('basic operations', () => {
    test('should add two numbers', () => {
      expect(calculate('2 + 3')).toBe(5);
    });

    test('should add different numbers', () => {
      expect(calculate('10 + 7')).toBe(17);
    });

    test('should subtract two numbers', () => {
      expect(calculate('10 - 3')).toBe(7);
    });

    test('should multiply two numbers', () => {
      expect(calculate('4 * 5')).toBe(20);
    });

    test('should divide two numbers', () => {
      expect(calculate('20 / 4')).toBe(5);
    });
  });

  describe('edge cases', () => {
    test('should handle decimal numbers', () => {
      expect(calculate('2.5 + 3.7')).toBe(6.2);
    });

    test('should handle negative numbers', () => {
      expect(calculate('-5 + 10')).toBe(5);
    });

    test('should throw error for invalid expression', () => {
      expect(() => calculate('invalid')).toThrow('Invalid expression');
    });

    test('should throw error for division by zero', () => {
      expect(() => calculate('10 / 0')).toThrow('Division by zero');
    });
  });
});
```

**Final Output:**
```
✅ PASS tests/calculator.test.ts
  calculate
    basic operations
      ✓ should add two numbers (2ms)
      ✓ should add different numbers (1ms)
      ✓ should subtract two numbers (2ms)
      ✓ should multiply two numbers (1ms)
      ✓ should divide two numbers (2ms)
    edge cases
      ✓ should handle decimal numbers (1ms)
      ✓ should handle negative numbers (1ms)
      ✓ should throw error for invalid expression (2ms)
      ✓ should throw error for division by zero (1ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

---

## Key Takeaways

1. **Start Simple:** First test just checked if function exists
2. **Incremental:** Each iteration added one new capability
3. **RED-GREEN-REFACTOR:** Followed cycle strictly
4. **No Over-Engineering:** Didn't add features before tests required them
5. **Edge Cases:** Added after basic functionality worked
6. **Living Documentation:** Tests document all supported behaviors

---

## Commit History

```bash
git log --oneline

✅ RED: Add division by zero test
✅ GREEN: Throw error on division by zero
✅ RED: Add edge case tests
✅ GREEN: Handle decimals and negatives
✅ RED: Add multiplication and division tests
✅ GREEN: Implement * and / operators
🔵 REFACTOR: Extract operator detection
✅ RED: Add subtraction test
✅ GREEN: Implement subtraction
🔵 REFACTOR: Clean up parsing logic
✅ RED: Add different numbers test
✅ GREEN: Parse expression dynamically
✅ RED: Add basic addition test
✅ GREEN: Return hardcoded result
```

Each commit represents one phase of the TDD cycle.
