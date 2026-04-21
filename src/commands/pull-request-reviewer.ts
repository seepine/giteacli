import type { CliChild } from '@/cli'
import { Gitea } from '@/gitea'
import { z } from 'zod'
import { parseRepoFullName } from './repo-full-name'

export function createPullRequestReviewerCommand(prCli: CliChild) {
  const cli = prCli.command('reviewer', 'Pull Request reviewer manager')

  cli
    .addCommand({
      command: 'add',
      description: 'Add reviewers to a pull request',
      inputSchema: z.object({
        repo: z.string().describe('Repository full name, e.g. owner/repo'),
        index: z.number().describe('Pull request index number'),
        username: z.string().describe('Reviewer username'),
      }),
      outputSchema: z.object({ success: z.literal(true) }),
      async func({ repo, index, username }) {
        const { owner, repoName } = parseRepoFullName(repo)
        const gitea = new Gitea()
        await gitea.addPullRequestReviewer(owner, repoName, index, username)
        return { success: true }
      },
    })
    .addCommand({
      command: 'del',
      description: 'Delete a reviewer from a pull request',
      inputSchema: z.object({
        repo: z.string().describe('Repository full name, e.g. owner/repo'),
        index: z.number().describe('Pull request index number'),
        username: z.string().describe('Reviewer username'),
      }),
      outputSchema: z.object({ success: z.literal(true) }),
      async func({ repo, index, username }) {
        const { owner, repoName } = parseRepoFullName(repo)
        const gitea = new Gitea()
        await gitea.deletePullRequestReviewer(owner, repoName, index, username)
        return { success: true }
      },
    })
    .addCommand({
      command: 'review',
      description: 'Request reviewers to re-review a pull request',
      inputSchema: z.object({
        repo: z.string().describe('Repository full name, e.g. owner/repo'),
        index: z.number().describe('Pull request index number'),
        username: z.string().describe('Reviewer username'),
      }),
      outputSchema: z.object({ success: z.literal(true) }),
      async func({ repo, index, username }) {
        const { owner, repoName } = parseRepoFullName(repo)
        const gitea = new Gitea()
        await gitea.addPullRequestReviewer(owner, repoName, index, username)
        return { success: true }
      },
    })
}
