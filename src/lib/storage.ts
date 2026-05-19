export const memoryStorage = new Map<string, string>();

export function safeGetItem(key: string): string | null {
  try {
    const val = sessionStorage.getItem(key);
    if (val !== null) return val;
  } catch (e) {
    // Ignore DOMException for sessionStorage
  }
  return memoryStorage.get(key) || null;
}

export function safeSetItem(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    // Ignore DOMException
  }
  memoryStorage.set(key, value);
}

export function safeRemoveItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    // Ignore DOMException
  }
  memoryStorage.delete(key);
}
