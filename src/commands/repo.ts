import { z } from 'zod'
import { Gitea } from '../gitea'
import { Cli } from '../cli'
import { createRepoLabelCommand } from './repo-label'

export function createRepoCommand(cli: Cli) {
  const repoCli = cli.command('repo', 'repo manager')

  repoCli
    .addCommand({
      command: 'list',
      description: 'List current user repositories',
      inputSchema: z.object({
        page: z.number().optional().describe('Page number'),
        limit: z.number().optional().default(30).describe('Items per page, default 30'),
      }),
      outputSchema: z.array(
        z.object({
          name: z.string(),
          full_name: z.string(),
          description: z.string().nullable(),
          private: z.boolean(),
          html_url: z.string(),
          clone_url: z.string(),
          created_at: z.string(),
          updated_at: z.string(),
          owner: z.object({
            username: z.string(),
            email: z.string(),
          }),
        }),
      ),
      func({ page, limit }) {
        const gitea = new Gitea()
        return gitea.listMyRepos({ page, limit }) as any
      },
    })
    .addCommand({
      command: 'add',
      description: 'Create a new repository',
      inputSchema: z.object({
        name: z.string().describe('Repository name'),
        description: z.string().optional().describe('Repository description'),
        private: z.boolean().optional().describe('Make repository private'),
        defaultBranch: z.string().optional().default('main').describe('Default branch name'),
      }),
      outputSchema: z.object({
        name: z.string(),
        full_name: z.string(),
        description: z.string().nullable(),
        private: z.boolean(),
        html_url: z.string(),
        clone_url: z.string(),
      }),
      func({ name, description, private: isPrivate, defaultBranch }) {
        const gitea = new Gitea()
        return gitea.createRepo({
          name,
          description,
          private: isPrivate,
          default_branch: defaultBranch,
        }) as any
      },
    })
    .addCommand({
      command: 'fork',
      description: 'Fork a repository',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner'),
        repo: z.string().describe('Repository name'),
        organization: z
          .string()
          .optional()
          .describe('Organization name, if forking into an organization'),
      }),
      outputSchema: z.object({
        name: z.string(),
        full_name: z.string(),
        description: z.string().nullable(),
        private: z.boolean(),
        html_url: z.string(),
        clone_url: z.string(),
      }),
      func({ owner, repo, organization }) {
        const gitea = new Gitea()
        return gitea.forkRepo(owner, repo, { organization }) as any
      },
    })

  createRepoLabelCommand(repoCli)
}
