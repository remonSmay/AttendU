import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export interface TopbarConfig {
  kicker?: string
  title?: ReactNode
  description?: string
  actions?: ReactNode
}

interface TopbarContextValue {
  config: TopbarConfig
  setTopbar: (config: TopbarConfig) => void
}

const TopbarContext = createContext<TopbarContextValue>({
  config: {},
  setTopbar: () => {},
})

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TopbarConfig>({})

  const setTopbar = useCallback((c: TopbarConfig) => {
    setConfig((prev) => {
      if (
        prev.kicker === c.kicker &&
        prev.title === c.title &&
        prev.description === c.description &&
        prev.actions === c.actions
      ) {
        return prev
      }
      return c
    })
  }, [])

  return (
    <TopbarContext.Provider value={{ config, setTopbar }}>
      {children}
    </TopbarContext.Provider>
  )
}

export function useTopbarConfig(): TopbarConfig {
  return useContext(TopbarContext).config
}

export function useTopbarSetter(): (config: TopbarConfig) => void {
  return useContext(TopbarContext).setTopbar
}
