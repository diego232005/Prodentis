import { mockDelay } from '@/lib/api/delay'
import { useAppDataStore } from '@/app/store/useAppDataStore'
import type { ClinicSettings, MockUserAccount } from '@/types/domain'

export async function getClinicSettings(): Promise<ClinicSettings> {
  await mockDelay(200)
  return { ...useAppDataStore.getState().clinic }
}

export async function updateClinicSettings(patch: Partial<ClinicSettings>): Promise<ClinicSettings> {
  await mockDelay()
  useAppDataStore.getState().updateClinic(patch)
  return { ...useAppDataStore.getState().clinic }
}

export async function listStaffAccounts(): Promise<MockUserAccount[]> {
  await mockDelay()
  return [...useAppDataStore.getState().staffAccounts]
}

export async function updateStaffAccount(account: MockUserAccount): Promise<MockUserAccount> {
  await mockDelay()
  useAppDataStore.getState().upsertStaffAccount(account)
  return account
}
