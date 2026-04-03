import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import translations from './translations'

const useTranslation = () => {
  const { language } = useAppContext()

  const t = useCallback(
    (key) => {
      return translations[language]?.[key] || translations.en[key] || key
    },
    [language]
  )

  return { t, language }
}

export default useTranslation
