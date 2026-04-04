/**
 * Password hashing using Web Crypto API (SHA-256 + salt)
 * This is client-side hashing — better than plaintext but
 * for production, use Firebase Auth or a Cloud Function with bcrypt.
 */

const SALT_PREFIX = 'RKSK_SALT_'

export async function hashPassword(password) {
  const salted = SALT_PREFIX + password
  const encoded = new TextEncoder().encode(salted)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password, hash) {
  const hashed = await hashPassword(password)
  return hashed === hash
}
