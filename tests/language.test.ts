import { TRANSLATIONS, getBrowserLanguage, resolveSupportedLanguage } from '../packages/core/src/i18n/translations.js'
import { assertEqual } from './assert.js'

function testResolvesFirstSupportedLanguage() {
  assertEqual(resolveSupportedLanguage(['it-IT']), 'it', 'region tag')
  assertEqual(resolveSupportedLanguage(['de_CH']), 'de', 'underscore separator')
  assertEqual(resolveSupportedLanguage(['FR']), 'fr', 'upper case')
  assertEqual(resolveSupportedLanguage([' en-GB ']), 'en', 'surrounding whitespace')
  assertEqual(resolveSupportedLanguage(['es-ES', 'pt-BR', 'de-AT', 'it']), 'de', 'skips unsupported, keeps preference order')
}

function testFallsBackToEnglish() {
  assertEqual(resolveSupportedLanguage([]), 'en', 'no candidates')
  assertEqual(resolveSupportedLanguage(['es', 'ja-JP']), 'en', 'only unsupported')
  assertEqual(resolveSupportedLanguage([null, undefined, '']), 'en', 'missing values')
  assertEqual(resolveSupportedLanguage([null, 'it-IT']), 'it', 'ignores missing values before a match')
}

function testBrowserLanguageUsesNavigator() {
  const globalWithNavigator = globalThis as { navigator?: unknown }
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const setNavigator = (value: unknown) =>
    Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true })

  try {
    setNavigator({ languages: ['es-ES', 'fr-CA'], language: 'es-ES' })
    assertEqual(getBrowserLanguage(), 'fr', 'navigator.languages order')

    setNavigator({ language: 'de-DE' })
    assertEqual(getBrowserLanguage(), 'de', 'navigator.language only')

    setNavigator(undefined)
    assertEqual(getBrowserLanguage(), 'en', 'no navigator')
  } finally {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', originalNavigator)
    } else {
      delete globalWithNavigator.navigator
    }
  }
}

testResolvesFirstSupportedLanguage()
testFallsBackToEnglish()
testBrowserLanguageUsesNavigator()

function testEveryLanguageTranslatesAccessibilityAndErrorTexts() {
  for (const [language, copy] of Object.entries(TRANSLATIONS)) {
    for (const key of ['selectChartYear', 'storageReadError', 'storageSaveInputsError', 'storageSaveArchiveError', 'pdfExportError'] as const) {
      assertEqual(copy[key].trim().length > 0, true, `${language}.${key} is not empty`)
      if (language !== 'en') {
        assertEqual(copy[key] !== TRANSLATIONS.en[key], true, `${language}.${key} is translated`)
      }
    }

    assertEqual(copy.decreaseValue('X').includes('X'), true, `${language}.decreaseValue includes the field label`)
    assertEqual(copy.increaseValue('X').includes('X'), true, `${language}.increaseValue includes the field label`)
  }
}

testEveryLanguageTranslatesAccessibilityAndErrorTexts()
