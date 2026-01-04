# TypeScript Tests with Node's Test Runner

This example demonstrates how to run TypeScript tests using Node's built-in test runner with `@parcel/register` for on-the-fly TypeScript transformation.

## How it works

1. **`@parcel/register`** hooks into Node's module loading system using the `pirates` library
2. When a TypeScript file is `require()`d, Parcel transforms it to JavaScript on-the-fly
3. **Node's test runner** (`node --test`) discovers and runs test files
4. The `-r @parcel/register` flag loads the register hook before tests run

## Setup

```bash
# Install dependencies (from the parcel monorepo root)
yarn install
```

## Running Tests

```bash
# From this directory
yarn test

# Or directly
node --test -r @parcel/register src/*.test.ts
```

## Project Structure

```
typescript-node-test/
├── package.json          # Package configuration
├── src/
│   ├── math.ts          # TypeScript source module
│   └── math.test.ts     # TypeScript test file using Node test runner
└── README.md
```

## Notes

- This uses Node's `-r` (require) flag to load `@parcel/register` before the tests
- The test files use Node's `node:test` module for test definitions
- TypeScript types are stripped at runtime, enabling direct execution of .ts files

## Known Limitations

- The process may not exit cleanly after tests complete due to Parcel's background workers
- For programmatic use, call `require('@parcel/register').dispose()` after tests to allow the process to exit
- Alternatively, you can use a process manager or timeout to terminate the process after tests complete
