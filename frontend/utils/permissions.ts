// Narzędzia do obsługi uprawnień użytkownika na mobilce
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Permission = string;

export async function getUserPermissions(): Promise<Permission[]> {
  try {
    const raw = await AsyncStorage.getItem('userPermissions');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const perms = await getUserPermissions();
  return perms.includes(permission);
}
