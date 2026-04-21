import { z } from 'zod'
import { Gitea } from '../gitea'
import { Cli } from '../cli'
import { createIssueCommentCommand } from './issue-comment'
import { parseRepoFullName } from './repo-full-name'
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
    labels: (issue.labels || [])
      .map((item) => item.name?.trim().replace(/[\u200B-\u200D\uFEFF]/g, ''))
      .filter((item) => (item || '').length > 0),
  } as any
}

export function createIssueCommand(cli: Cli) {
  const issueCli = cli.command('issue', 'issue manager')

  issueCli.addCommand({
    command: 'get',
    description: 'Get a single issue by index',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      index: z.number().describe('Issue index number'),
    }),
    outputSchema: IssueSchema,
    async func({ repo, index }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return issueMap(await gitea.getIssueByIndex(owner, repoName, index))
    },
  })

  issueCli.addCommand({
    command: 'list',
    description: 'List issues in a repository',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      state: IssueStateSchema.optional().describe('Filter by state'),
      labels: z.string().optional().describe('Filter by labels (comma-separated)'),
      q: z.string().optional().describe('Search keyword in title/body'),
      page: z.number().optional().describe('Page number'),
      limit: z.number().optional().default(30).describe('Items per page, default 30'),
    }),
    outputSchema: IssueListSchema,
    async func({ repo, state, labels, q, page, limit }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return Promise.all(
        (await gitea.listRepoIssues(owner, repoName, { state, labels, q, page, limit })).map(
          issueMap,
        ),
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
    outputSchema: z.object({
      hasNextPage: z.boolean(),
      matchItems: IssueListSchema,
    }),
    async func(args) {
      const gitea = new Gitea()
      const res = await Promise.all((await gitea.searchIssues(args)).map(issueMap))
      const userinfo = await gitea.getCurrentUserinfo()
      let hasNextPage = true
      if (res.length === 0) {
        hasNextPage = false
      } else if (res.length < args.limit) {
        hasNextPage = false
      }
      return {
        hasNextPage: hasNextPage,
        matchItems: res.filter((item) => {
          if (args.created !== undefined) {
            if (args.created === true && item.user?.username !== userinfo.username) {
              return false
            }
            if (args.created === false && item.user?.username === userinfo.username) {
              return false
            }
          }
          if (args.assigned !== undefined) {
            const isAssigned = item.assignees?.some(
              (assignee) => assignee.username === userinfo.username,
            )
            if (args.assigned === true && !isAssigned) {
              return false
            }
            if (args.assigned === false && isAssigned) {
              return false
            }
          }
          if (args.labels) {
            const labelList = args.labels
              .split(',')
              .map((item) => item.trim())
              .filter((item) => item.length > 0)
            if (!labelList.every((label) => item.labels?.includes(label))) {
              return false
            }
          }
          return true
        }),
      }
    },
  })

  issueCli.addCommand({
    command: 'add',
    description: 'Add a new issue',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
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
    async func({ repo, title, body, labels }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      const labelIds = await gitea.resolveLabelNamesToIds(owner, repoName, labels ?? '')
      return gitea.createIssue(owner, repoName, {
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
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
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
    func({ repo, index, title, body, state }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.editIssue(owner, repoName, index, {
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
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
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
    async func({ repo, index, labels }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      const labelIds = await gitea.resolveLabelNamesToIds(owner, repoName, labels)
      return gitea.addIssueLabels(owner, repoName, index, { labels: labelIds ?? [] }) as any
    },
  })

  issueCli.addCommand({
    command: 'del-labels',
    description: 'Del labels from an issue',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      index: z.number().describe('Issue index number'),
      labels: z.string().describe('Label names (comma-separated)'),
    }),
    outputSchema: z.object({ success: z.literal(true) }),
    async func({ repo, index, labels }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      const labelIds = await gitea.resolveLabelNamesToIds(owner, repoName, labels)
      for (const id of labelIds ?? []) {
        await gitea.removeIssueLabel(owner, repoName, index, id)
      }
      return { success: true }
    },
  })

  createIssueCommentCommand(issueCli)
}
