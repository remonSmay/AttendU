import { httpClient } from '../../../api/httpClient'
import type { DeviceApiResponse, DeviceApiUpsertPayload } from '../types/adminApiTypes'
import { extractApiErrorMessage } from './adminApiUtils'

export const listDevicesAdmin = async (): Promise<DeviceApiResponse[]> => {
  try {
    const response = await httpClient.get<DeviceApiResponse[]>('/devices')
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to fetch devices.'))
  }
}

export const createDeviceAdmin = async (
  payload: DeviceApiUpsertPayload,
): Promise<DeviceApiResponse> => {
  try {
    const response = await httpClient.post<DeviceApiResponse>('/devices', payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to create device.'))
  }
}

export const updateDeviceAdmin = async (
  deviceId: string,
  payload: DeviceApiUpsertPayload,
): Promise<DeviceApiResponse> => {
  try {
    const response = await httpClient.put<DeviceApiResponse>(`/devices/${deviceId}`, payload)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to update device.'))
  }
}

export const deleteDeviceAdmin = async (deviceId: string): Promise<void> => {
  try {
    await httpClient.delete(`/devices/${deviceId}`)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to delete device.'))
  }
}
