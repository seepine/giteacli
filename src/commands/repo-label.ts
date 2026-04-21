import { z } from 'zod'
import { Gitea } from '../gitea'
import { CliChild } from '../cli'
import { parseRepoFullName } from './repo-full-name'

export function createRepoLabelCommand(cli: CliChild) {
  const repoLabelCli = cli.command('label', 'Repo label manager')
  // cli repo label list
  repoLabelCli
    .addCommand({
      command: 'list',
      description: 'List all labels in a repository',
      inputSchema: z.object({
        repo: z.string().describe('Repository full name, e.g. owner/repo'),
      }),
      outputSchema: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          color: z.string(),
          description: z.string().optional(),
        }),
      ),
      func({ repo }) {
        const { owner, repoName } = parseRepoFullName(repo)
        const gitea = new Gitea()
        return gitea.listRepoLabels(owner, repoName) as any
      },
    })
    .addCommand({
      command: 'add',
      description: 'Create a new label',
      inputSchema: z.object({
        repo: z.string().describe('Repository full name, e.g. owner/repo'),
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
      func({ repo, name, color, description }) {
        const { owner, repoName } = parseRepoFullName(repo)
        const gitea = new Gitea()
        return gitea.createRepoLabel(owner, repoName, { name, color, description }) as any
      },
    })
    .addCommand({
      command: 'edit',
      description: 'Edit an existing label',
      inputSchema: z.object({
        repo: z.string().describe('Repository full name, e.g. owner/repo'),
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
      func({ repo, id, name, color, description }) {
        const { owner, repoName } = parseRepoFullName(repo)
        const gitea = new Gitea()
        return gitea.editIssueLabel(owner, repoName, id, { name, color, description }) as any
      },
    })
    .addCommand({
      command: 'del',
      description: 'Delete a label',
      inputSchema: z.object({
        repo: z.string().describe('Repository full name, e.g. owner/repo'),
        id: z.number().describe('Label ID'),
      }),
      outputSchema: z.object({ success: z.literal(true) }),
      async func({ repo, id }) {
        const { owner, repoName } = parseRepoFullName(repo)
        const gitea = new Gitea()
        return gitea.deleteRepoLabel(owner, repoName, id).then(() => ({ success: true as const }))
      },
    })
}
