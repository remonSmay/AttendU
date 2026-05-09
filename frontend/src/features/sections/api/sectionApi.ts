import { httpClient } from '../../../api/httpClient'
import type { SectionResponse } from '../types/sectionTypes'

export const getSections = async (): Promise<SectionResponse[]> => {
  const response = await httpClient.get<SectionResponse[]>('/sections')
  return response.data
}
