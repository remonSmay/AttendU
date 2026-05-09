import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import type { AdminTopBarConfig } from '../../components/admin/AdminShell'
import AdminFormModal from '../../components/admin/AdminFormModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import DataTable, { type DataTableColumn } from '../../components/admin/DataTable'
import TableToolbar from '../../components/admin/TableToolbar'
import FeedbackBanner from '../../components/ui/FeedbackBanner'
import {
  createDeviceAdmin,
  deleteDeviceAdmin,
  listDevicesAdmin,
  updateDeviceAdmin,
} from '../../features/admin/api/devicesAdminApi'
import { useAdminSectionOptions } from '../../features/admin/hooks/useAdminSectionOptions'
import type { DeviceApiResponse, DeviceApiUpsertPayload } from '../../features/admin/types/adminApiTypes'
import type { DeviceAdminRow, DeviceFormPayload, PresenceMethod } from '../../features/admin/types/adminContracts'
import { useSnackbar } from '../../hooks/useSnackbar'
import { useAdminPageConfig } from './useAdminPageConfig'
import './AdminPages.css'

const initialDeviceForm: DeviceFormPayload = {
  deviceName: '',
  location: '',
  sectionId: '',
  supportedMethods: ['RFID'],
  isActive: true,
}

const normalizeMethods = (value: string): PresenceMethod[] => {
  const methods = value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is PresenceMethod => item === 'RFID' || item === 'FACE' || item === 'MANUAL')

  return methods.length > 0 ? methods : ['RFID']
}

const toDeviceRow = (
  device: DeviceApiResponse,
  sectionName: string,
): DeviceAdminRow => ({
  id: device.id,
  deviceName: device.device_name,
  location: device.location ?? 'Not set',
  sectionName,
  supportedMethods: ['RFID'],
  isActive: true,
})

const toDevicePayload = (
  formState: DeviceFormPayload,
): DeviceApiUpsertPayload => ({
  device_name: formState.deviceName.trim(),
  location: formState.location.trim() || undefined,
  section_id: formState.sectionId,
})

export default function DevicesAdminPage() {
  const [rows, setRows] = useState<DeviceAdminRow[]>([])
  const [devicesById, setDevicesById] = useState<Record<string, DeviceApiResponse>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formState, setFormState] = useState<DeviceFormPayload>(initialDeviceForm)
  const [selectedDevice, setSelectedDevice] = useState<DeviceAdminRow | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { showSnackbar } = useSnackbar()
  const {
    sectionOptions,
    sectionsById,
    isLoading: isSectionOptionsLoading,
    error: sectionOptionsError,
  } = useAdminSectionOptions()

  const resolveSectionName = useCallback((sectionId: string | null): string => {
    if (!sectionId) {
      return 'Unknown section'
    }

    return sectionsById[sectionId]?.section_name ?? 'Unknown section'
  }, [sectionsById])

  const syncDeviceIntoState = useCallback((device: DeviceApiResponse) => {
    const nextRow = toDeviceRow(device, resolveSectionName(device.section_id))

    setRows((currentRows) => {
      const existingIndex = currentRows.findIndex((row) => row.id === nextRow.id)

      if (existingIndex === -1) {
        return [nextRow, ...currentRows]
      }

      const updatedRows = [...currentRows]
      updatedRows[existingIndex] = nextRow
      return updatedRows
    })

    setDevicesById((current) => ({
      ...current,
      [device.id]: device,
    }))
  }, [resolveSectionName])

  const removeDeviceFromState = useCallback((deviceId: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== deviceId))
    setDevicesById((current) => {
      const next = { ...current }
      delete next[deviceId]
      return next
    })
  }, [])

  const loadDevices = useCallback(async () => {
    setIsLoading(true)
    setFeedbackError(null)

    try {
      const devices = await listDevicesAdmin()
      setRows(
        devices.map((device) =>
          toDeviceRow(device, resolveSectionName(device.section_id)),
        ),
      )
      setDevicesById(
        Object.fromEntries(devices.map((device) => [device.id, device])),
      )
    } catch (error) {
      setFeedbackError(
        error instanceof Error ? error.message : 'Failed to load devices.',
      )
      setRows([])
      setDevicesById({})
    } finally {
      setIsLoading(false)
    }
  }, [resolveSectionName])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDevices()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadDevices])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    setFormState({
      ...initialDeviceForm,
      sectionId: sectionOptions[0]?.id ?? '',
    })
    setFormError(null)
    setIsFormOpen(true)
  }, [sectionOptions])

  const pageConfig = useMemo<AdminTopBarConfig>(
    () => ({
      title: 'Devices',
      description: 'Manage attendance devices, deployment locations, and availability from the same admin design system.',
      primaryActionLabel: 'Add Device',
      onPrimaryAction: openCreateModal,
      isPrimaryActionLoading: isSubmitting,
    }),
    [isSubmitting, openCreateModal],
  )

  useAdminPageConfig(pageConfig)

  const columns = useMemo<DataTableColumn<DeviceAdminRow>[]>(
    () => [
      { id: 'deviceName', header: 'Device', cell: (row) => row.deviceName },
      { id: 'location', header: 'Location', cell: (row) => row.location },
      { id: 'sectionName', header: 'Section', cell: (row) => row.sectionName },
      {
        id: 'supportedMethods',
        header: 'Methods',
        cell: (row) => row.supportedMethods.join(', '),
      },
      {
        id: 'status',
        header: 'Status',
        align: 'right',
        cell: (row) => (
          <span
            className={`admin-status-pill ${
              row.isActive ? 'admin-status-pill-active' : 'admin-status-pill-inactive'
            }`}
          >
            {row.isActive ? 'active' : 'inactive'}
          </span>
        ),
      },
    ],
    [],
  )

  const handleEdit = useCallback((row: DeviceAdminRow) => {
    const sourceDevice = devicesById[row.id]

    setEditingId(row.id)
    setFormState({
      deviceName: sourceDevice?.device_name ?? row.deviceName,
      location: sourceDevice?.location ?? '',
      sectionId: sourceDevice?.section_id ?? '',
      supportedMethods: row.supportedMethods,
      isActive: row.isActive,
    })
    setFormError(null)
    setIsFormOpen(true)
  }, [devicesById])

  const handleDelete = useCallback((row: DeviceAdminRow) => {
    setSelectedDevice(row)
    setIsDeleteOpen(true)
  }, [])

  const handleFormSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSectionOptionsLoading) {
      setFormError('Sections are still loading. Please wait and try again.')
      return
    }
    if (sectionOptionsError) {
      setFormError('Sections failed to load. Retry after reloading the page.')
      return
    }
    if (!formState.sectionId) {
      setFormError('Please select a section.')
      return
    }
    if (!sectionsById[formState.sectionId]) {
      setFormError('Selected section is no longer available. Please choose another one.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const payload = toDevicePayload(formState)
      const savedDevice = editingId
        ? await updateDeviceAdmin(editingId, payload)
        : await createDeviceAdmin(payload)

      syncDeviceIntoState(savedDevice)
      setIsFormOpen(false)
      setEditingId(null)
      setFormState(initialDeviceForm)
      showSnackbar(editingId ? 'Device updated successfully.' : 'Device created successfully.', 'success')
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to save device.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [
    editingId,
    formState,
    isSectionOptionsLoading,
    sectionOptionsError,
    sectionsById,
    syncDeviceIntoState,
    showSnackbar,
  ])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedDevice) {
      return
    }

    setIsDeleting(true)
    setFormError(null)

    try {
      await deleteDeviceAdmin(selectedDevice.id)
      removeDeviceFromState(selectedDevice.id)
      setSelectedDevice(null)
      setIsDeleteOpen(false)
      showSnackbar('Device deleted successfully.', 'success')
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to delete device.',
        'error'
      )
    } finally {
      setIsDeleting(false)
    }
  }, [removeDeviceFromState, selectedDevice, showSnackbar])

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const query = searchQuery.toLowerCase()
    return rows.filter(row => 
      row.deviceName.toLowerCase().includes(query) || 
      row.location.toLowerCase().includes(query)
    )
  }, [rows, searchQuery])

  return (
    <div className="admin-page-stack">
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search devices by name or location..."
      />

      {feedbackError && (
        <FeedbackBanner 
          variant="error" 
          title="Data loading failed" 
          description={feedbackError} 
          actionLabel="Retry" 
          onAction={() => void loadDevices()} 
        />
      )}

      <DataTable
        columns={columns}
        rows={filteredRows}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onEditRow={handleEdit}
        onDeleteRow={handleDelete}
        emptyState={
          <FeedbackBanner
            variant="empty"
            title={searchQuery ? 'No devices found' : 'No devices loaded'}
            description={searchQuery ? 'Try adjusting your search criteria.' : 'Create the first device to get started.'}
            actionLabel={searchQuery ? undefined : 'Add Device'}
            onAction={searchQuery ? undefined : openCreateModal}
          />
        }
      />

      <AdminFormModal
        isOpen={isFormOpen}
        title={editingId ? 'Update Device' : 'Create Device'}
        description="Maintain the device details used to identify active attendance hardware across locations."
        submitLabel={editingId ? 'Save Device' : 'Create Device'}
        isSubmitting={isSubmitting}
        errorMessage={formError}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      >
        <div className="admin-form-grid">
          <div className="ui-field">
            <label className="ui-field__label">Device Name</label>
            <input
              className="ui-input"
              value={formState.deviceName}
              onChange={(event) => setFormState((current) => ({ ...current, deviceName: event.target.value }))}
              placeholder="e.g. Lab Reader A"
              required
            />
          </div>

          <div className="ui-field">
            <label className="ui-field__label">Location</label>
            <input
              className="ui-input"
              value={formState.location}
              onChange={(event) => setFormState((current) => ({ ...current, location: event.target.value }))}
              placeholder="e.g. Building 4, Room 201"
              required
            />
          </div>

          <div className="ui-field">
            <label className="ui-field__label">Section</label>
            <select
              className="ui-select"
              value={formState.sectionId}
              onChange={(event) =>
                setFormState((current) => ({ ...current, sectionId: event.target.value }))
              }
              disabled={isSectionOptionsLoading || sectionOptions.length === 0}
              required
            >
              {sectionOptions.length === 0 ? (
                <option value="">
                  {isSectionOptionsLoading ? 'Loading sections...' : 'No sections available'}
                </option>
              ) : (
                sectionOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))
              )}
            </select>
            {sectionOptionsError ? (
              <p className="ui-field__hint ui-field__hint--error">{sectionOptionsError}</p>
            ) : null}
          </div>

          <div className="ui-field admin-field-span-2">
            <label className="ui-field__label">Supported Methods (RFID, FACE, MANUAL)</label>
            <input
              className="ui-input"
              value={formState.supportedMethods.join(', ')}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  supportedMethods: normalizeMethods(event.target.value),
                }))
              }
              placeholder="e.g. RFID, FACE"
            />
          </div>

          <div className="ui-field admin-field-span-2">
            <label className="ui-field__label">Status</label>
            <select
              className="ui-select"
              value={formState.isActive ? 'active' : 'inactive'}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  isActive: event.target.value === 'active',
                }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </AdminFormModal>

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        title="Delete Device"
        message={`Delete ${selectedDevice?.deviceName ?? 'this device'} from the device inventory?`}
        confirmLabel="Delete Device"
        isConfirming={isDeleting}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
