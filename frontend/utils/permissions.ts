// Narzędzia do obsługi uprawnień użytkownika na mobilce
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Permission = string;

// Callback do powiadamiania o zmianie uprawnień
let permissionsUpdateCallback: (() => void) | null = null;

export function setPermissionsUpdateCallback(callback: (() => void) | null) {
  permissionsUpdateCallback = callback;
}

export function notifyPermissionsUpdated() {
  if (permissionsUpdateCallback) {
    permissionsUpdateCallback();
  }
}

export async function getUserPermissions(): Promise<Permission[]> {
  try {
    const raw = await AsyncStorage.getItem('userPermissions');
    if (!raw) {
      console.log('[Permissions] No permissions found in storage');
      return [];
    }
    const perms = JSON.parse(raw);
    console.log('[Permissions] Retrieved permissions from storage:', perms);
    return perms;
  } catch (error) {
    console.error('[Permissions] Error reading permissions:', error);
    return [];
  }
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const perms = await getUserPermissions();
  return perms.includes(permission);
}
