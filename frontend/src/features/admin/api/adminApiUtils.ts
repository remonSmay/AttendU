import { isAxiosError } from 'axios'

const defaultErrorMessage = 'Request failed. Please try again.'

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage: string = defaultErrorMessage,
): string => {
  if (!isAxiosError(error)) {
    return fallbackMessage
  }

  const responseData = error.response?.data

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData
  }

  if (responseData && typeof responseData === 'object') {
    const detail = (responseData as { detail?: unknown }).detail

    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }

    if (Array.isArray(detail)) {
      const detailAsText = detail
        .map((item) => {
          if (typeof item === 'string') {
            return item
          }

          if (item && typeof item === 'object' && 'msg' in item) {
            const message = (item as { msg?: unknown }).msg
            if (typeof message === 'string') {
              return message
            }
          }

          return ''
        })
        .filter(Boolean)
        .join(', ')

      if (detailAsText) {
        return detailAsText
      }
    }
  }

  return fallbackMessage
}
