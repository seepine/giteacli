import { z } from 'zod'
import { Gitea } from '../gitea'
import { CliChild } from '../cli'

const LabelSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  description: z.string().optional(),
})

export function createOrgLabelCommand(cli: CliChild) {
  const orgLabelCli = cli.command('label', 'Org label manager')

  orgLabelCli
    .addCommand({
      command: 'list',
      description: 'List all labels in an organization',
      inputSchema: z.object({
        org: z.string().describe('Organization name'),
      }),
      outputSchema: z.array(LabelSchema),
      func({ org }) {
        const gitea = new Gitea()
        return gitea.listOrgLabels(org) as any
      },
    })
    .addCommand({
      command: 'add',
      description: 'Create a new label',
      inputSchema: z.object({
        org: z.string().describe('Organization name'),
        name: z.string().describe('Label name'),
        color: z.string().describe('Label color (hex without #)'),
        description: z.string().optional().describe('Label description'),
      }),
      outputSchema: LabelSchema,
      func({ org, name, color, description }) {
        const gitea = new Gitea()
        return gitea.createOrgLabel(org, { name, color, description }) as any
      },
    })
    .addCommand({
      command: 'edit',
      description: 'Edit an existing label',
      inputSchema: z.object({
        org: z.string().describe('Organization name'),
        id: z.number().describe('Label ID'),
        name: z.string().optional().describe('Label name'),
        color: z.string().optional().describe('Label color (hex without #)'),
        description: z.string().optional().describe('Label description'),
      }),
      outputSchema: LabelSchema,
      func({ org, id, name, color, description }) {
        const gitea = new Gitea()
        return gitea.editOrgLabel(org, id, { name, color, description }) as any
      },
    })
    .addCommand({
      command: 'del',
      description: 'Delete a label',
      inputSchema: z.object({
        org: z.string().describe('Organization name'),
        id: z.number().describe('Label ID'),
      }),
      outputSchema: z.object({ success: z.literal(true) }),
      async func({ org, id }) {
        const gitea = new Gitea()
        return gitea.deleteOrgLabel(org, id).then(() => ({ success: true as const }))
      },
    })
}
