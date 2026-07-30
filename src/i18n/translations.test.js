import { describe, expect, it } from 'vitest'
import { FLEET } from '../game/index.js'
import { createTranslator, detectLanguage, DEFAULT_LANGUAGE, LANGUAGES, translations } from './index.js'

const codes = LANGUAGES.map((language) => language.code)

describe('translations', () => {
  it('ships the three supported languages', () => {
    expect(codes).toEqual(['en', 'pt', 'es'])
    expect(Object.keys(translations).sort()).toEqual([...codes].sort())
  })

  it('defines exactly the same keys in every language', () => {
    const reference = Object.keys(translations[DEFAULT_LANGUAGE]).sort()
    for (const code of codes) {
      expect(Object.keys(translations[code]).sort(), `language: ${code}`).toEqual(reference)
    }
  })

  it('never leaves a value empty', () => {
    for (const code of codes) {
      for (const [key, value] of Object.entries(translations[code])) {
        expect(value.trim(), `${code}/${key}`).not.toBe('')
      }
    }
  })

  it('names every ship of the fleet', () => {
    for (const code of codes) {
      const t = createTranslator(code)
      for (const ship of FLEET) {
        expect(t(`ship.${ship.id}`), `${code}/${ship.id}`).not.toBe(`ship.${ship.id}`)
      }
    }
  })

  it('keeps the same placeholders across languages', () => {
    const placeholdersOf = (value) => (value.match(/\{\w+\}/g) ?? []).sort()
    for (const [key, reference] of Object.entries(translations[DEFAULT_LANGUAGE])) {
      for (const code of codes) {
        expect(placeholdersOf(translations[code][key]), `${code}/${key}`).toEqual(placeholdersOf(reference))
      }
    }
  })
})

describe('createTranslator', () => {
  it('interpolates params', () => {
    const t = createTranslator('en')
    expect(t('shot.sunk', { actor: 'You', ship: 'Cruiser' })).toBe('You sank the Cruiser!')
  })

  it('falls back to the default language for an unknown language', () => {
    expect(createTranslator('de')('app.title')).toBe(translations[DEFAULT_LANGUAGE]['app.title'])
  })

  it('returns the key itself when it is unknown', () => {
    expect(createTranslator('en')('nope.missing')).toBe('nope.missing')
  })

  it('keeps unknown placeholders untouched', () => {
    expect(createTranslator('en')('shot.hit', {})).toBe('{actor} hit a ship!')
  })
})

describe('detectLanguage', () => {
  const storage = (value) => ({ getItem: () => value, setItem: () => {} })

  it('prefers the stored language', () => {
    expect(detectLanguage(storage('es'), ['en-US'])).toBe('es')
  })

  it('ignores an unsupported stored language', () => {
    expect(detectLanguage(storage('de'), ['en-US'])).toBe('en')
  })

  it('falls back to the browser languages, then to the default', () => {
    expect(detectLanguage(storage(null), ['pt-BR', 'en'])).toBe('pt')
    expect(detectLanguage(storage(null), ['ja'])).toBe(DEFAULT_LANGUAGE)
    expect(detectLanguage(storage(null), undefined)).toBe(DEFAULT_LANGUAGE)
  })

  it('survives a storage that throws (private browsing)', () => {
    const hostile = { getItem: () => { throw new Error('denied') } }
    expect(detectLanguage(hostile, ['es'])).toBe('es')
  })
})
