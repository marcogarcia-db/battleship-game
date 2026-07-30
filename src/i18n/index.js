import { DEFAULT_LANGUAGE, LANGUAGES, translations } from './translations.js'

export { DEFAULT_LANGUAGE, LANGUAGES, translations }

const STORAGE_KEY = 'battleship.language'

export function isSupported(language) {
  return LANGUAGES.some((item) => item.code === language)
}

/** Builds `t(key, params)` for a language, falling back to the default one. */
export function createTranslator(language) {
  const dictionary = translations[language] ?? translations[DEFAULT_LANGUAGE]

  return function t(key, params) {
    const template = dictionary[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (match, name) => (
      name in params ? String(params[name]) : match
    ))
  }
}

/** Picks the stored language, then the browser's, then the default. */
export function detectLanguage(storage = globalThis.localStorage, navigatorLanguages = globalThis.navigator?.languages) {
  const stored = safeRead(storage)
  if (isSupported(stored)) return stored

  for (const tag of navigatorLanguages ?? []) {
    const code = String(tag).slice(0, 2).toLowerCase()
    if (isSupported(code)) return code
  }
  return DEFAULT_LANGUAGE
}

export function storeLanguage(language, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, language)
  } catch {
    // Private browsing / disabled storage: the choice just does not persist.
  }
}

function safeRead(storage) {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

export function htmlLangOf(language) {
  return LANGUAGES.find((item) => item.code === language)?.htmlLang ?? language
}
