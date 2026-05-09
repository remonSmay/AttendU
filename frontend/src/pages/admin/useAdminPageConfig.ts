import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'

import type { AdminShellOutletContext, AdminTopBarConfig } from '../../components/admin/AdminShell'

export const useAdminPageConfig = (config: AdminTopBarConfig): void => {
  const { setTopBarConfig, resetTopBarConfig } = useOutletContext<AdminShellOutletContext>()

  useEffect(() => {
    setTopBarConfig(config)

    return () => {
      resetTopBarConfig()
    }
  }, [config, resetTopBarConfig, setTopBarConfig])
}
