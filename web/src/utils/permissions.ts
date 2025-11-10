// Narzędzia do obsługi uprawnień użytkownika na froncie
import { useAuth } from './auth';

export type Permission = string;

export function getUserPermissions(): Permission[] {
  try {
    const raw = localStorage.getItem('userPermissions');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getUserPermissionsAsync(): Promise<Permission[]> {
  try {
    const raw = localStorage.getItem('userPermissions');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function hasPermission(permission: Permission): boolean {
  return getUserPermissions().includes(permission);
}

export async function hasPermissionAsync(permission: Permission): Promise<boolean> {
  const perms = await getUserPermissionsAsync();
  return perms.includes(permission);
}
