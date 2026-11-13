import { parseLocalizedNumber } from '../packages/core/src/lib/formatting.js'

function assertParsed(rawValue: string, fractionDigits: number, expected: number) {
  const actual = parseLocalizedNumber(rawValue, fractionDigits)
  const matches = Number.isNaN(expected) ? Number.isNaN(actual) : actual === expected
  if (!matches) {
    throw new Error(`parseLocalizedNumber(${JSON.stringify(rawValue)}, ${fractionDigits}): expected ${expected}, got ${actual}`)
  }
}

function testEuropeanNotation() {
  assertParsed('250.000', 0, 250000)
  assertParsed('1.234.567', 0, 1234567)
  assertParsed('3,5', 2, 3.5)
  assertParsed('1.234,56', 2, 1234.56)
  assertParsed(',5', 2, 0.5)
}

function testDotDecimalNotation() {
  assertParsed('3.5', 2, 3.5)
  assertParsed('3.', 2, 3)
  assertParsed('3.125', 2, 3.125)
  assertParsed('1,234.56', 2, 1234.56)
}

function testDotsInIntegerFieldsAreGrouping() {
  assertParsed('1.5', 0, 15)
  assertParsed('1.234.567', 2, 1234567)
}

function testWhitespaceAndInvalidInput() {
  assertParsed('250 000', 0, 250000)
  assertParsed('250 000', 0, 250000)
  assertParsed('', 2, Number.NaN)
  assertParsed('abc', 2, Number.NaN)
  assertParsed('1,2,3', 2, Number.NaN)
  assertParsed('-', 2, Number.NaN)
}

testEuropeanNotation()
testDotDecimalNotation()
testDotsInIntegerFieldsAreGrouping()
testWhitespaceAndInvalidInput()
