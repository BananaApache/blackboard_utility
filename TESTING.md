# Testing Guide

## Setup

Install the required dependencies:

```bash
npm install
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode (automatically re-runs on file changes):
```bash
npm run test:watch
```

Run tests with coverage report:
```bash
npm run test:coverage
```

## Test Files

- `__tests__/background.test.js` - Tests for background.js utility functions
  - `extractInputs()` - Extracts input fields from HTML
  - `extractFormTokenValues()` - Extracts form tokens
  - `extractOptionValues()` - Extracts option values from select elements

- `__tests__/popup.test.js` - Tests for popup.js utility functions
  - `formatTime()` - Formats time from 24-hour to 12-hour format
  - `convertTimeToMinutes()` - Converts time to minutes
  - `convertToNormalTime()` - Converts time with timezone offset
  - DOM helper functions
  - Schedule sorting logic

## Test Coverage

The tests focus on:
- HTML parsing functions
- Time formatting and conversion
- Date handling
- Schedule sorting
- DOM manipulation helpers

## Notes

- Chrome API calls are mocked in `jest.setup.js`
- Tests use `jsdom` environment to simulate browser DOM
- Functions are redefined in test files (consider exporting them from source files for better testing)
