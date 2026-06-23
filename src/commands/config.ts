import { z } from 'zod'
import { Cli } from '../cli'
import { getConfig, setConfig, unsetConfig } from '../gitea/config'

const ALLOWED_KEYS = ['format'] as const
const ALLOWED_KEYS_STR = ALLOWED_KEYS.join(', ')
const FORMAT_VALUES = ['json', 'toon'] as const
const FORMAT_VALUES_STR = FORMAT_VALUES.join(', ')

type ConfigKey = (typeof ALLOWED_KEYS)[number]
type ConfigMap = Partial<Record<ConfigKey, string>>

const ConfigKeySchema = z.enum(ALLOWED_KEYS)
const ConfigValueSchema = z.enum(FORMAT_VALUES)

const validateConfigValue = (key: ConfigKey, value: string): string => {
  if (key === 'format') {
    const parsed = ConfigValueSchema.safeParse(value)
    if (!parsed.success) {
      throw new Error(`Invalid value for format: "${value}". Allowed values: ${FORMAT_VALUES_STR}`)
    }
    return parsed.data
  }
  return value
}

export function createConfigCommand(cli: Cli) {
  const configCli = cli.command('config', 'config manager')

  configCli.addCommand({
    command: 'set',
    paths: ['key', 'value'],
    description: `Set a configuration value. Allowed keys: ${ALLOWED_KEYS_STR}. format: ${FORMAT_VALUES_STR}.`,
    inputSchema: z.object({
      key: ConfigKeySchema.describe('Configuration key'),
      value: z.string().describe('Configuration value'),
    }),
    func({ key, value }) {
      setConfig(key, validateConfigValue(key, value))
      console.log(`Set ${key} successfully`)
    },
  })

  configCli.addCommand({
    command: 'get',
    paths: ['key'],
    description: `Get a configuration value. Allowed keys: ${ALLOWED_KEYS_STR}.`,
    inputSchema: z.object({
      key: ConfigKeySchema.describe('Configuration key'),
    }),
    outputSchema: z.object({
      key: ConfigKeySchema,
      value: z.string().optional(),
    }),
    func({ key }) {
      return { key, value: getConfig(key) as string | undefined }
    },
  })

  configCli.addCommand({
    command: 'list',
    description: 'List configuration values',
    inputSchema: z.object({}),
    outputSchema: z.object({
      format: z.string().optional(),
    }),
    func() {
      const config = getConfig() as ConfigMap
      return { format: config.format }
    },
  })

  configCli.addCommand({
    command: 'unset',
    paths: ['key'],
    description: `Unset a configuration value. Allowed keys: ${ALLOWED_KEYS_STR}.`,
    inputSchema: z.object({
      key: ConfigKeySchema.describe('Configuration key'),
    }),
    func({ key }) {
      unsetConfig(key)
      console.log(`Unset ${key} successfully`)
    },
  })
}
