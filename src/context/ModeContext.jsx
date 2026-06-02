import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

const ModeContext = createContext(null)

export function ModeProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem('philomni_mode') || 'creator'
  )
  const [toast, setToast] = useState(null)

  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'creator' ? 'pro' : 'creator'
      localStorage.setItem('philomni_mode', next)
      setToast(next === 'pro' ? 'Switching to Pro Mode...' : 'Switching to Creator Mode...')
      setTimeout(() => setToast(null), 1500)
      return next
    })
  }, [])

  const switchTo = useCallback((target) => {
    if (target === mode) return
    localStorage.setItem('philomni_mode', target)
    setMode(target)
    setToast(target === 'pro' ? 'Switching to Pro Mode...' : 'Switching to Creator Mode...')
    setTimeout(() => setToast(null), 1500)
  }, [mode])

  const value = useMemo(
    () => ({ mode, toggleMode, switchTo, toast }),
    [mode, toggleMode, switchTo, toast]
  )

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used within ModeProvider')
  return ctx
}
