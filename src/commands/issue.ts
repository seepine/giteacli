import { z } from 'zod'
import { Gitea } from '../gitea'
import { Cli } from '../cli'
import { createIssueCommentCommand } from './issue-comment'
import type { Issue } from '@/gitea/api/globals'

const IssueStateSchema = z.enum(['open', 'closed', 'all']).default('open')

const IssueSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().optional(),
  state: z.enum(['open', 'closed']),
  html_url: z.string(),
  user: z.object({
    username: z.string(),
    email: z.string(),
  }),
  repository: z.object({
    name: z.string(),
    owner: z.string(),
    full_name: z.string(),
  }),
  is_locked: z.boolean(),
  assets: z.array(z.any()),
  labels: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().optional().nullable(),

  assignees: z
    .array(
      z.object({
        username: z.string(),
        email: z.string(),
      }),
    )
    .nullable()
    .optional(),
})
const IssueListSchema = z.array(IssueSchema)

const replaceBodyNewlines = (body: string | undefined) => body?.replace(/\\n/g, '\n')

const issueMap = (issue: Issue): z.infer<typeof IssueSchema> => {
  return {
    ...issue,
    labels: issue.labels?.map((item) => item.name),
  } as any
}

export function createIssueCommand(cli: Cli) {
  const issueCli = cli.command('issue', 'issue manager')

  issueCli.addCommand({
    command: 'get',
    description: 'Get a single issue by index',
    inputSchema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      index: z.number().describe('Issue index number'),
    }),
    outputSchema: IssueSchema,
    async func({ owner, repo, index }) {
      const gitea = new Gitea()
      return issueMap(await gitea.getIssueByIndex(owner, repo, index))
    },
  })

  issueCli.addCommand({
    command: 'list',
    description: 'List issues in a repository',
    inputSchema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      state: IssueStateSchema.optional().describe('Filter by state'),
      labels: z.string().optional().describe('Filter by labels (comma-separated)'),
      q: z.string().optional().describe('Search keyword in title/body'),
      page: z.number().optional().describe('Page number'),
      limit: z.number().optional().default(30).describe('Items per page, default 30'),
    }),
    outputSchema: IssueListSchema,
    async func({ owner, repo, state, labels, q, page, limit }) {
      const gitea = new Gitea()
      return Promise.all(
        (await gitea.listRepoIssues(owner, repo, { state, labels, q, page, limit })).map(issueMap),
      )
    },
  })

  issueCli.addCommand({
    command: 'search',
    description: 'Search issues (assigned to me or created by me)',
    inputSchema: z.object({
      state: IssueStateSchema.optional().describe('Filter by state'),
      labels: z.string().optional().describe('Filter by labels (comma-separated)'),
      assigned: z.boolean().optional().describe('Issues assigned to me'),
      created: z.boolean().optional().describe('Issues created by me'),
      page: z.number().optional().describe('Page number'),
      limit: z.number().optional().default(30).describe('Items per page, default 30'),
      q: z.string().optional().describe('Search keyword'),
    }),
    outputSchema: IssueListSchema,
    async func(args) {
      const gitea = new Gitea()
      return Promise.all((await gitea.searchIssues(args)).map(issueMap))
    },
  })

  issueCli.addCommand({
    command: 'add',
    description: 'Add a new issue',
    inputSchema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      title: z.string().describe('Issue title'),
      body: z.string().optional().describe('Issue body/description'),
      labels: z.string().optional().describe('Label names (comma-separated)'),
    }),
    outputSchema: z.object({
      id: z.number(),
      number: z.number(),
      title: z.string(),
      body: z.string().optional(),
      state: z.string(),
      html_url: z.string(),
    }),
    async func({ owner, repo, title, body, labels }) {
      const gitea = new Gitea()
      const labelIds = await gitea.resolveLabelNamesToIds(owner, repo, labels ?? '')
      return gitea.createIssue(owner, repo, {
        title,
        body: replaceBodyNewlines(body),
        labels: labelIds,
      }) as any
    },
  })

  issueCli.addCommand({
    command: 'edit',
    description: 'Edit an issue',
    inputSchema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      index: z.number().describe('Issue index number'),
      title: z.string().optional().describe('Issue title'),
      body: z.string().optional().describe('Issue body/description'),
      state: z.enum(['open', 'closed']).optional().describe('Issue state'),
    }),
    outputSchema: z.object({
      id: z.number(),
      number: z.number(),
      title: z.string(),
      body: z.string().optional(),
      state: z.string(),
      html_url: z.string(),
    }),
    func({ owner, repo, index, title, body, state }) {
      const gitea = new Gitea()
      return gitea.editIssue(owner, repo, index, {
        title,
        body: replaceBodyNewlines(body),
        state,
      }) as any
    },
  })

  issueCli.addCommand({
    command: 'add-labels',
    description: 'Add labels to an issue',
    inputSchema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      index: z.number().describe('Issue index number'),
      labels: z.string().describe('Label names (comma-separated)'),
    }),
    outputSchema: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        color: z.string(),
      }),
    ),
    async func({ owner, repo, index, labels }) {
      const gitea = new Gitea()
      const labelIds = await gitea.resolveLabelNamesToIds(owner, repo, labels)
      return gitea.addIssueLabels(owner, repo, index, { labels: labelIds ?? [] }) as any
    },
  })

  issueCli.addCommand({
    command: 'del-labels',
    description: 'Del labels from an issue',
    inputSchema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      index: z.number().describe('Issue index number'),
      labels: z.string().describe('Label names (comma-separated)'),
    }),
    outputSchema: z.object({ success: z.literal(true) }),
    async func({ owner, repo, index, labels }) {
      const gitea = new Gitea()
      const labelIds = await gitea.resolveLabelNamesToIds(owner, repo, labels)
      for (const id of labelIds ?? []) {
        await gitea.removeIssueLabel(owner, repo, index, id)
      }
      return { success: true }
    },
  })

  createIssueCommentCommand(issueCli)
}
