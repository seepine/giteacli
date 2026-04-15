import { Command } from 'commander'
import { z, ZodDefault, ZodNullable, ZodOptional, ZodReadonly, ZodType, ZodVoid } from 'zod'
import { encode } from '@toon-format/toon'
import { getConfig } from './gitea/config'

const unwrapZodType = (field: ZodType) => {
  let zodType: ZodType = field
  while (true) {
    if (zodType instanceof ZodOptional) {
      // @ts-ignore
      zodType = zodType.unwrap()
    } else if (zodType instanceof ZodDefault) {
      // @ts-ignore
      zodType = zodType.unwrap()
    } else if (zodType instanceof ZodNullable) {
      // @ts-ignore
      zodType = zodType.unwrap()
    } else if (zodType instanceof ZodReadonly) {
      // @ts-ignore
      zodType = zodType.unwrap()
    } else if (zodType instanceof ZodVoid) {
      // @ts-ignore
      zodType = zodType.unwrap()
    } else {
      break
    }
  }
  return zodType
}

export class CliChild {
  constructor(protected program: Command) {}

  command(command: string, description: string) {
    return new CliChild(this.program.command(command).description(description))
  }

  addCommand<
    TInput extends z.ZodObject,
    TOutput extends z.ZodObject | z.ZodArray | undefined,
  >(opts: {
    command: string
    description: string
    inputSchema: TInput
    outputSchema?: TOutput
    func: TOutput extends ZodType
      ? (input: z.infer<TInput>) => Promise<z.infer<TOutput>> | z.infer<TOutput>
      : (input: z.infer<TInput>) => Promise<void> | void
  }) {
    const cmd = this.program.command(opts.command).description(opts.description)

    const shape = opts.inputSchema.shape
    for (const [key, field] of Object.entries(shape)) {
      if (!(field instanceof ZodType)) {
        continue
      }
      const isOptional = field.safeParse(undefined).success
      let zodType = unwrapZodType(field)
      const typeName = zodType.type
      if (isOptional) {
        cmd.option(`--${key} <${typeName}>`, field.description)
      } else {
        cmd.requiredOption(`--${key} <${typeName}>`, field.description)
      }
    }
    cmd.action(async (args) => {
      // Coerce string values to numbers for number-typed fields
      const coercedArgs: Record<string, unknown> = {}
      for (const [key, field] of Object.entries(shape)) {
        if (!(field instanceof ZodType)) {
          continue
        }
        let zodType = unwrapZodType(field)
        if (zodType.def.type === 'number') {
          coercedArgs[key] = args[key] !== undefined ? Number(args[key]) : undefined
        } else if (zodType.def.type === 'boolean') {
          if (args[key] !== undefined) {
            coercedArgs[key] =
              args[key] === 'true' || args[key] === true || args[key] === 1 || args[key] === '1'
          }
        } else {
          coercedArgs[key] = args[key]
        }
      }
      const parsed = opts.inputSchema.safeParse(coercedArgs)
      if (!parsed.success) {
        throw parsed.error
      }
      try {
        const res = await opts.func(parsed.data)
        if (!opts.outputSchema) {
          return
        }
        const parsedRes = opts.outputSchema.safeParse(res)
        if (!parsedRes.success) {
          throw parsedRes.error
        }
        const config = getConfig() as { format?: string }
        if (config?.format === 'toon') {
          console.log(encode(parsedRes.data))
        } else {
          console.log(JSON.stringify(parsedRes.data, null, 2))
        }
      } catch (e: any) {
        console.error(`Command failed: ${typeof e.message === 'string' ? e.message : String(e)}`)
        process.exit(1)
      }
    })
    return this
  }
}

export class Cli {
  program = new Command()

  constructor(opts: { name: string; description: string; version: string }) {
    this.program.name(opts.name).description(opts.description)
    this.program
      .command('version')
      .description('output the version')
      .action(() => console.log(opts.version))
  }

  parse() {
    this.program.parse()
  }

  command(command: string, description: string) {
    return new CliChild(this.program.command(command).description(description))
  }

  addCommand<
    TInput extends z.ZodObject,
    TOutput extends z.ZodObject | z.ZodArray | undefined,
  >(opts: {
    command: string
    description: string
    inputSchema: TInput
    outputSchema?: TOutput
    func: TOutput extends ZodType
      ? (input: z.infer<TInput>) => Promise<z.infer<TOutput>> | z.infer<TOutput>
      : (input: z.infer<TInput>) => Promise<void> | void
  }): void {
    new CliChild(this.program).addCommand(opts)
  }
}
