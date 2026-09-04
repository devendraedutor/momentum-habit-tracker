export interface Tester {
  id: string;
  name: string;
}

export const TESTERS_REGISTRY: Record<string, Tester> = {
  FLUX_CHIRAG: { id: 'chirag', name: 'Chirag' },
  FLUX_PRINCE: { id: 'prince', name: 'Prince' },
  FLUX_DEVENDRA: { id: 'devendra', name: 'Devendra' },
  FLUX_KHETESH: { id: 'khetesh', name: 'Khetesh' },
  FLUX_ADMIN: { id: 'admin', name: 'Admin' },
};

export const AUTH_SESSION_KEY = 'flux_active_session';

/**
 * Normalizes input passkey by trimming whitespace and uppercase transformation.
 */
export function normalizePasskey(input: string): string {
  return input.trim().toUpperCase();
}

/**
 * Validates a passkey against the authorized tester registry.
 */
export function validatePasskey(passkey: string): Tester | null {
  const normalized = normalizePasskey(passkey);
  return TESTERS_REGISTRY[normalized] || null;
}

/**
 * Looks up tester by their canonical user ID.
 */
export function getTesterById(id: string | null | undefined): Tester | null {
  if (!id) return null;
  const entry = Object.values(TESTERS_REGISTRY).find((t) => t.id === id.toLowerCase());
  return entry || null;
}

/**
 * Gets currently active session user ID from localStorage.
 */
export function getActiveSessionUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_SESSION_KEY);
}

/**
 * Saves active session user ID to localStorage.
 */
export function setActiveSessionUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_SESSION_KEY, userId);
}

/**
 * Clears the active session from localStorage.
 */
export function clearActiveSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_SESSION_KEY);
}
