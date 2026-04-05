const PIN_ITERATIONS = 150000
const PIN_HASH_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16

const textEncoder = new TextEncoder()

const bytesToBase64 = (bytes) => {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

const base64ToBytes = (value) => {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

const randomBytes = (length) => crypto.getRandomValues(new Uint8Array(length))

const importPinMaterial = async (pin) => crypto.subtle.importKey(
  'raw',
  textEncoder.encode(pin),
  'PBKDF2',
  false,
  ['deriveBits', 'deriveKey'],
)

const derivePinHashBytes = async (pin, saltBytes) => {
  const pinMaterial = await importPinMaterial(pin)
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PIN_ITERATIONS,
      hash: 'SHA-256',
    },
    pinMaterial,
    PIN_HASH_LENGTH,
  )

  return new Uint8Array(derivedBits)
}

const deriveVaultKey = async (pin, saltBytes) => {
  const pinMaterial = await importPinMaterial(pin)
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PIN_ITERATIONS,
      hash: 'SHA-256',
    },
    pinMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export const createVaultSecrets = async (pin) => {
  const saltBytes = randomBytes(SALT_LENGTH)
  const pinHashBytes = await derivePinHashBytes(pin, saltBytes)
  const key = await deriveVaultKey(pin, saltBytes)

  return {
    pinSalt: bytesToBase64(saltBytes),
    pinHash: bytesToBase64(pinHashBytes),
    key,
  }
}

export const unlockVaultKey = async (pin, pinSalt, pinHash) => {
  const saltBytes = base64ToBytes(pinSalt)
  const candidateHash = bytesToBase64(await derivePinHashBytes(pin, saltBytes))
  if (candidateHash !== pinHash) {
    return null
  }

  return deriveVaultKey(pin, saltBytes)
}

export const encryptVaultFile = async (file, key) => {
  const ivBytes = randomBytes(IV_LENGTH)
  const fileBuffer = await file.arrayBuffer()
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    key,
    fileBuffer,
  )

  return {
    iv: bytesToBase64(ivBytes),
    encryptedBytes: new Uint8Array(encryptedBuffer),
  }
}

export const decryptVaultFile = async (encryptedBytes, iv, key) => {
  const cipherBytes = encryptedBytes instanceof Uint8Array ? encryptedBytes : new Uint8Array(encryptedBytes)
  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64ToBytes(iv),
    },
    key,
    cipherBytes,
  )
}
