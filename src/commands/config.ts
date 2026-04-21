import { z } from 'zod'
import { Cli } from '../cli'
import { setConfig } from '../gitea/config'

const ALLOWED_KEYS = ['format'] as const
const ALLOWED_KEYS_STR = ALLOWED_KEYS.join(', ')
type ConfigKey = (typeof ALLOWED_KEYS)[number]

export function createConfigCommand(cli: Cli) {
  const configCli = cli.command('config', 'config manager')

  configCli.addCommand({
    command: 'set',
    paths: ['key', 'value'],
    description: `Set a configuration value. Allowed keys: ${ALLOWED_KEYS_STR}, allowed values depend on the key. \n  format: json/toon.`,
    inputSchema: z.object({
      key: z.enum(ALLOWED_KEYS).describe('Configuration key'),
      value: z.string().describe('Configuration value'),
    }),
    func({ key, value }: { key: string; value: string }) {
      if (!ALLOWED_KEYS.includes(key as ConfigKey)) {
        throw new Error(`Unknown key: "${key}". Allowed keys: ${ALLOWED_KEYS_STR}`)
      }
      setConfig(key, value)
      console.log(`Set ${key} successfully`)
    },
  })
}
