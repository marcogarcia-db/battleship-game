import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createTranslator, detectLanguage, htmlLangOf, storeLanguage } from './index.js'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(detectLanguage)

  const changeLanguage = useCallback((next) => {
    setLanguage(next)
    storeLanguage(next)
  }, [])

  const value = useMemo(
    () => ({ language, setLanguage: changeLanguage, t: createTranslator(language) }),
    [language, changeLanguage],
  )

  useEffect(() => {
    document.documentElement.lang = htmlLangOf(language)
    document.title = value.t('app.documentTitle')
  }, [language, value])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useTranslation must be used inside a LanguageProvider')
  return context
}
