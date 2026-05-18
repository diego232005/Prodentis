import { apiClient } from '@/lib/api/client'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import type { InventoryItem, StockMovement } from '@/types/domain'

export async function listItems(): Promise<InventoryItem[]> {
  const inventory = await apiClient.get<InventoryItem[]>('/inventory')
  useAppDataStore.setState({ inventory })
  return inventory
}

export async function getItem(id: string): Promise<InventoryItem> {
  return apiClient.get<InventoryItem>(`/inventory/${id}`)
}

export async function createItem(
  input: Omit<InventoryItem, 'id' | 'updatedAt'>,
): Promise<InventoryItem> {
  const item = await apiClient.post<InventoryItem>('/inventory', input)
  useAppDataStore.getState().upsertInventoryItem(item)
  return item
}

export async function updateItem(item: InventoryItem): Promise<InventoryItem> {
  const next = await apiClient.put<InventoryItem>(`/inventory/${item.id}`, item)
  useAppDataStore.getState().upsertInventoryItem(next)
  return next
}

export async function recordMovement(
  input: Omit<StockMovement, 'id' | 'createdAt'>,
): Promise<StockMovement> {
  const m = await apiClient.post<StockMovement>(`/inventory/${input.itemId}/movements`, {
    type: input.type,
    quantity: input.quantity,
    reason: input.reason,
    relatedTreatmentId: input.relatedTreatmentId,
  })
  await listItems()
  const movements = await listMovements()
  useAppDataStore.setState({ movements })
  return m
}

export async function listMovements(itemId?: string): Promise<StockMovement[]> {
  const q = itemId ? `?itemId=${encodeURIComponent(itemId)}` : ''
  const movements = await apiClient.get<StockMovement[]>(`/inventory/movements${q}`)
  if (!itemId) useAppDataStore.setState({ movements })
  return movements
}
