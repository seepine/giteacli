import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 16
const TAG_LENGTH = 16
const ITERATIONS = 100_000

const SECRET = 'gitea-mcp'

function deriveKey(salt: Buffer): Buffer {
  return pbkdf2Sync(SECRET, salt, ITERATIONS, KEY_LENGTH, 'sha256')
}

export function encrypt(plaintext: string): string {
  const salt = randomBytes(SALT_LENGTH)
  const key = deriveKey(salt)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
}

export function decrypt(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, 'base64')
  const salt = buf.subarray(0, SALT_LENGTH)
  const iv = buf.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const tag = buf.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  const encrypted = buf.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  const key = deriveKey(salt)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}
