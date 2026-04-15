import { homedir } from 'os'
import { join } from 'path'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { encrypt, decrypt } from './utils/encrypt'

const CONFIG_DIR = join(homedir(), '.config', 'giteacli')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

const ENCRYPTED_KEYS = ['host', 'token'] as const
type EncryptedKey = (typeof ENCRYPTED_KEYS)[number]

function ensureConfigDir() {
  mkdirSync(CONFIG_DIR, { recursive: true })
}

function readRawConfig(): Record<string, string> {
  if (!existsSync(CONFIG_FILE)) {
    return {}
  }
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'))
  } catch {
    return {}
  }
}

export function getConfig(key?: string): Record<string, string | undefined> | string | undefined {
  const raw = readRawConfig()
  if (key === undefined) {
    return {
      host: raw.host ? decrypt(raw.host) : undefined,
      token: raw.token ? decrypt(raw.token) : undefined,
      format: raw.format,
    }
  }
  if (ENCRYPTED_KEYS.includes(key as EncryptedKey)) {
    return raw[key] ? decrypt(raw[key]) : undefined
  }
  return raw[key]
}

export function setConfig(key: string, value: string): void {
  ensureConfigDir()
  const raw = readRawConfig()
  if (ENCRYPTED_KEYS.includes(key as EncryptedKey)) {
    raw[key] = encrypt(value)
  } else {
    raw[key] = value
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(raw, null, 2))
}

export function hasConfig(): boolean {
  return existsSync(CONFIG_FILE)
}
