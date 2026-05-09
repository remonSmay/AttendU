import { useCallback, useEffect, useMemo, useState } from 'react'

import { listSectionsAdmin } from '../api/sectionsAdminApi'
import type { SectionApiResponse } from '../types/adminApiTypes'

export interface AdminSectionOption {
  id: string
  label: string
}

export interface UseAdminSectionOptionsResult {
  sectionOptions: AdminSectionOption[]
  sectionsById: Record<string, SectionApiResponse>
  isLoading: boolean
  error: string | null
}

export const useAdminSectionOptions = (): UseAdminSectionOptionsResult => {
  const [sections, setSections] = useState<SectionApiResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSections = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const items = await listSectionsAdmin()
      setSections(items)
    } catch (requestError) {
      setSections([])
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load sections.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSections()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadSections])

  const sectionsById = useMemo<Record<string, SectionApiResponse>>(
    () => Object.fromEntries(sections.map((section) => [section.id, section])),
    [sections],
  )

  const sectionOptions = useMemo<AdminSectionOption[]>(
    () =>
      sections.map((section) => ({
        id: section.id,
        label: section.section_name,
      })),
    [sections],
  )

  return {
    sectionOptions,
    sectionsById,
    isLoading,
    error,
  }
}
