import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// =============================================================================
// KEY CHAIN — supports rotation via ENCRYPTION_KEY + ENCRYPTION_KEYS_OLD
// =============================================================================

function deriveKey(raw: string): Buffer {
  return createHash('sha256').update(raw).digest()
}

function getKeyChain(): Buffer[] {
  const current = process.env.ENCRYPTION_KEY
  if (!current) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }

  const chain: Buffer[] = [deriveKey(current)]

  const oldKeys = process.env.ENCRYPTION_KEYS_OLD
  if (oldKeys) {
    const keys = oldKeys.split(',').map(k => k.trim()).filter(Boolean)
    for (const k of keys) {
      chain.push(deriveKey(k))
    }
  }

  return chain
}

// =============================================================================
// ENCRYPT — always uses current (first) key
// =============================================================================

export function encrypt(text: string): { encrypted: string; iv: string } {
  const chain = getKeyChain()
  const key = chain[0]
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return {
    encrypted: encrypted + authTag.toString('hex'),
    iv: iv.toString('hex'),
  }
}

// =============================================================================
// DECRYPT — tries current key first, falls back to old keys
// =============================================================================

function tryDecrypt(encrypted: string, iv: string, key: Buffer): string | null {
  try {
    const ivBuffer = Buffer.from(iv, 'hex')
    const authTag = Buffer.from(encrypted.slice(-AUTH_TAG_LENGTH * 2), 'hex')
    const encryptedData = encrypted.slice(0, -AUTH_TAG_LENGTH * 2)

    const decipher = createDecipheriv(ALGORITHM, key, ivBuffer)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return null
  }
}

export function decrypt(encrypted: string, iv: string): string {
  const chain = getKeyChain()

  for (const key of chain) {
    const result = tryDecrypt(encrypted, iv, key)
    if (result !== null) return result
  }

  throw new Error('Failed to decrypt: no valid key found')
}

// =============================================================================
// DECRYPT WITH ROTATION — lazy re-encryption for callers
// =============================================================================

export type DecryptResult =
  | { decrypted: string; rotated: false }
  | { decrypted: string; rotated: true; newEncrypted: string; newIv: string }

export function decryptWithRotation(encrypted: string, iv: string): DecryptResult {
  const chain = getKeyChain()

  // Try current key first
  const currentResult = tryDecrypt(encrypted, iv, chain[0])
  if (currentResult !== null) {
    return { decrypted: currentResult, rotated: false }
  }

  // Try old keys
  for (let i = 1; i < chain.length; i++) {
    const result = tryDecrypt(encrypted, iv, chain[i])
    if (result !== null) {
      // Re-encrypt with current key
      const { encrypted: newEncrypted, iv: newIv } = encrypt(result)
      return { decrypted: result, rotated: true, newEncrypted, newIv }
    }
  }

  throw new Error('Failed to decrypt: no valid key found')
}

// =============================================================================
// API KEY UTILITIES (unchanged)
// =============================================================================

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = 'im_live_'
  const randomPart = randomBytes(24).toString('base64url')
  const key = `${prefix}${randomPart}`
  const hash = hashApiKey(key)

  return { key, prefix, hash }
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}
