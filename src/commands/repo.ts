import { z } from 'zod'
import { Gitea } from '../gitea'
import { Cli } from '../cli'
import { createRepoLabelCommand } from './repo-label'
const RepoSchema = z.object({
  name: z.string(),
  full_name: z.string().describe('Repository full name, e.g. owner/repo'),
  description: z.string().nullable().optional(),

  owner: z.object({
    id: z.number(),
    username: z.string(),
    avatar_url: z.string(),
    html_url: z.string(),
    email: z.string(),
  }),

  fork: z.boolean().describe('是否为 fork 仓库'),
  private: z.boolean().describe('是否为私有仓库'),
  archived: z.boolean().describe('是否已归档'),
  mirror: z.boolean().describe('是否为镜像仓库'),
  default_branch: z.string(),

  html_url: z.string(),
  clone_url: z.string(),

  language: z.string().nullable().optional(),
  size: z.number().describe('仓库大小'),
  created_at: z.string().describe('创建时间'),
  updated_at: z.string().describe('更新时间'),

  parent: z
    .object({
      name: z.string(),
      full_name: z.string().describe('Repository full name, e.g. owner/repo'),
      description: z.string().nullable().optional(),

      owner: z.object({
        id: z.number(),
        username: z.string(),
        avatar_url: z.string(),
        html_url: z.string(),
        email: z.string(),
      }),

      html_url: z.string(),
      clone_url: z.string(),

      created_at: z.string().describe('创建时间'),
      updated_at: z.string().describe('更新时间'),
    })
    .optional()
    .nullable()
    .describe('如果是 fork 仓库，则包含父仓库信息'),
})
export function createRepoCommand(cli: Cli) {
  const repoCli = cli.command('repo', 'repo manager')

  repoCli
    .addCommand({
      command: 'list',
      description: 'List current user repositories',
      inputSchema: z.object({
        page: z.number().optional().default(1).describe('Page number'),
        limit: z.number().optional().default(30).describe('Items per page, default 30'),
        created: z.boolean().optional().describe('Repo created by me'),
        forked: z.boolean().optional().describe('Repo is a fork'),
        createdBy: z.string().optional().describe('Filter by repo who created the repo'),
      }),
      outputSchema: z.object({
        hasNextPage: z.boolean(),
        matchItems: z.array(RepoSchema),
      }),
      async func({ page, limit, created, forked, createdBy }) {
        const gitea = new Gitea()
        const res: z.infer<typeof RepoSchema>[] = (await gitea.listMyRepos({ page, limit })) as any
        let hasNextPage = true
        if (res.length === 0) {
          hasNextPage = false
        } else if (res.length < limit) {
          hasNextPage = false
        }
        const userinfo = await gitea.getCurrentUserinfo()

        return {
          hasNextPage,
          matchItems: res.filter((item) => {
            if (created !== undefined) {
              const match = created
                ? item.owner.username === userinfo.username
                : item.owner.username !== userinfo.username
              if (!match) return false
            }
            if (forked !== undefined) {
              const match = forked ? item.fork === true : item.fork === false
              if (!match) return false
            }
            if (createdBy !== undefined) {
              const match = item.owner.username === createdBy
              if (!match) return false
            }
            return true
          }),
        }
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
