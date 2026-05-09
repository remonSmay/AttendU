import { useCallback } from 'react'
import { snackbarStore } from '../components/ui/Snackbar'

export function useSnackbar() {
  const showSnackbar = useCallback((message: string, variant: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    snackbarStore.show(message, variant)
  }, [])

  return { showSnackbar }
}
