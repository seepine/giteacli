import { z } from 'zod'
import { Gitea } from '../gitea'
import { CliChild } from '../cli'

export function createRepoLabelCommand(cli: CliChild) {
  const repoLabelCli = cli.command('label', 'Repo label manager')
  // cli repo label list
  repoLabelCli
    .addCommand({
      command: 'list',
      description: 'List all labels in a repository',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
      }),
      outputSchema: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          color: z.string(),
          description: z.string().optional(),
        }),
      ),
      func({ owner, repo }) {
        const gitea = new Gitea()
        return gitea.listRepoLabels(owner, repo) as any
      },
    })
    .addCommand({
      command: 'add',
      description: 'Create a new label',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        name: z.string().describe('Label name'),
        color: z.string().describe('Label color (hex without #)'),
        description: z.string().optional().describe('Label description'),
      }),
      outputSchema: z.object({
        id: z.number(),
        name: z.string(),
        color: z.string(),
        description: z.string().optional(),
      }),
      func({ owner, repo, name, color, description }) {
        const gitea = new Gitea()
        return gitea.createRepoLabel(owner, repo, { name, color, description }) as any
      },
    })
    .addCommand({
      command: 'edit',
      description: 'Edit an existing label',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        id: z.number().describe('Label ID'),
        name: z.string().optional().describe('Label name'),
        color: z.string().optional().describe('Label color (hex without #)'),
        description: z.string().optional().describe('Label description'),
      }),
      outputSchema: z.object({
        id: z.number(),
        name: z.string(),
        color: z.string(),
        description: z.string().optional(),
      }),
      func({ owner, repo, id, name, color, description }) {
        const gitea = new Gitea()
        return gitea.editIssueLabel(owner, repo, id, { name, color, description }) as any
      },
    })
    .addCommand({
      command: 'del',
      description: 'Delete a label',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        id: z.number().describe('Label ID'),
      }),
      outputSchema: z.object({ success: z.literal(true) }),
      async func({ owner, repo, id }) {
        const gitea = new Gitea()
        return gitea.deleteRepoLabel(owner, repo, id).then(() => ({ success: true as const }))
      },
    })
}
