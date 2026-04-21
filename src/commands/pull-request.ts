import { z } from 'zod'
import { Gitea } from '../gitea'
import { Cli } from '../cli'
import { createPullRequestReviewerCommand } from './pull-request-reviewer'
import { parseRepoFullName } from './repo-full-name'

const PRStateSchema = z.enum(['open', 'closed', 'all']).default('open')
const PRSortSchema = z.enum([
  'oldest',
  'recentupdate',
  'recentclose',
  'leastupdate',
  'mostcomment',
  'leastcomment',
  'priority',
])

const PRUserSchema = z.object({
  username: z.string(),
  email: z.string(),
  avatar_url: z.string().nullable(),
})

const PRBranchInfoSchema = z.object({
  label: z.string(),
  ref: z.string(),
  sha: z.string(),

  repo: z.object({
    name: z.string(),
    full_name: z.string(),
    owner: z.object({
      username: z.string(),
      email: z.string(),
      avatar_url: z.string(),
    }),
    html_url: z.string(),
    private: z.boolean(),
    created_at: z.string(),
    updated_at: z.string().optional().nullable(),
  }),
})

const ReviewSchema = z.object({
  id: z.number(),
  user: PRUserSchema,
  state: z.string(),
  body: z.string(),
  commit_id: z.string(),
  submitted_at: z.string(),
  html_url: z.string().optional().nullable(),
  pull_request_url: z.string().optional().nullable(),

  comments_count: z.number(),
  comments_list: z.array(
    z.object({
      body: z.string(),
      path: z.string(),
      position: z.number(),
      diff_hunk: z.string(),
      commit_id: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
  ),
})

const PRSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().nullable(),
  state: z.enum(['open', 'closed']),
  user: PRUserSchema,
  labels: z.array(z.string()),

  assignees: z.array(PRUserSchema).optional().nullable(),

  requested_reviewers: z.array(PRUserSchema).optional().nullable(),
  requested_reviewers_teams: z.array(z.any()).optional().nullable(),

  comments: z.number().nullable().optional(),
  review_comments: z.number().nullable().optional(),
  draft: z.boolean(),
  is_locked: z.boolean(),

  html_url: z.string(),

  mergeable: z.boolean(),
  merged: z.boolean(),
  merged_at: z.string().optional().nullable(),

  head: PRBranchInfoSchema,
  base: PRBranchInfoSchema,

  created_at: z.string(),
  updated_at: z.string().optional().nullable(),
  closed_at: z.string().optional().nullable(),
})

const PRListSchema = z.array(PRSchema)

export function createPullRequestCommand(cli: Cli) {
  const prCli = cli.command('pr', 'pull request manager')

  prCli.addCommand({
    command: 'list',
    description: 'List pull requests in a repository',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      state: PRStateSchema.optional().describe('Filter by state'),
      sort: PRSortSchema.optional().describe('Sort order'),
      page: z.number().optional().describe('Page number'),
      limit: z.number().optional().default(30).describe('Items per page, default 30'),
    }),
    outputSchema: PRListSchema,
    async func({ repo, state, sort, page, limit }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.listPullRequests(owner, repoName, { state, sort, page, limit }) as any
    },
  })

  prCli.addCommand({
    command: 'search',
    description: 'Search pull requests list',
    inputSchema: z.object({
      state: PRStateSchema.optional().describe('Filter by state'),
      assigned: z.boolean().optional().describe('PRs assigned to me'),
      created: z.boolean().optional().describe('PRs created by me'),
      page: z.number().optional().describe('Page number'),
      limit: z.number().optional().default(30).describe('Items per page, default 30'),
    }),
    outputSchema: PRListSchema,
    async func({ state, assigned, created, page, limit }) {
      const gitea = new Gitea()
      return (await gitea.searchPullRequests({ state, assigned, created, page, limit })) as any[]
    },
  })

  prCli.addCommand({
    command: 'get',
    description: 'Get a single pull request by index',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      index: z.number().describe('Pull request index number'),
    }),
    outputSchema: PRSchema,
    async func({ repo, index }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.getPullRequestByIndex(owner, repoName, index) as any
    },
  })

  prCli.addCommand({
    command: 'add',
    description: 'Create a new pull request',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      title: z.string().describe('Pull request title'),
      head: z.string().describe('Source branch (head)'),
      base: z.string().describe('Target branch (base)'),
      body: z.string().optional().describe('Pull request body/description'),
      labels: z.string().optional().describe('Label names (comma-separated)'),
      milestones: z.string().optional().describe('Milestone IDs (comma-separated)'),
    }),
    outputSchema: z.object({
      id: z.number(),
      number: z.number(),
      title: z.string(),
      body: z.string().nullable(),
      state: z.string(),
      html_url: z.string(),
    }),
    async func({ repo, title, head, base, body, labels, milestones }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      const labelIds = await gitea.resolveLabelNamesToIds(owner, repoName, labels ?? '')
      const milestoneIds = milestones
        ? milestones.split(',').map((n: string) => parseInt(n.trim(), 10))
        : undefined
      return gitea.createPullRequest(owner, repoName, {
        title,
        head,
        base,
        body: body?.replace(/\\n/g, '\n'),
        labels: labelIds,
        milestones: milestoneIds,
      }) as any
    },
  })

  prCli.addCommand({
    command: 'edit',
    description: 'Edit a pull request',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      index: z.number().describe('Pull request index number'),
      title: z.string().optional().describe('Pull request title'),
      body: z.string().optional().describe('Pull request body/description'),
      state: z.enum(['open', 'closed']).optional().describe('Pull request state'),
      base: z.string().optional().describe('Target branch (base)'),
      assignee: z.string().optional().describe('Primary assignee username'),
      assignees: z.string().optional().describe('Assignee usernames (comma-separated)'),
      milestone: z.string().optional().describe('Milestone ID'),
      labels: z.string().optional().describe('Label names (comma-separated)'),
    }),
    outputSchema: z.object({
      id: z.number(),
      number: z.number(),
      title: z.string(),
      body: z.string().nullable(),
      state: z.string(),
      html_url: z.string(),
    }),
    async func({ repo, index, title, body, state, base, assignee, assignees, milestone, labels }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      const labelIds = await gitea.resolveLabelNamesToIds(owner, repoName, labels ?? '')
      const assigneeList = assignees ? assignees.split(',').map((n: string) => n.trim()) : undefined
      return gitea.editPullRequest(owner, repoName, index, {
        title,
        body: body?.replace(/\\n/g, '\n'),
        state,
        base,
        assignee,
        assignees: assigneeList,
        milestone: milestone ? parseInt(milestone, 10) : undefined,
        labels: labelIds,
      }) as any
    },
  })

  prCli.addCommand({
    command: 'comments',
    description: 'Get pull request all comments by index',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      index: z.number().describe('Pull request index number'),
    }),
    outputSchema: z.array(z.any()),
    async func({ repo, index }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.getPullRequestCommentsByIndex(owner, repoName, index) as any
    },
  })

  prCli.addCommand({
    command: 'reviews',
    description: 'List all reviews on a pull request',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      index: z.number().describe('Pull request index number'),
      latest: z
        .boolean()
        .optional()
        .default(true)
        .describe('Get the latest review from each reviewer, default true'),
    }),
    outputSchema: z.array(
      z.object({
        id: z.number(),
        user: PRUserSchema,
        state: z.string(),
        body: z.string(),
        commit_id: z.string(),
        submitted_at: z.string(),
        html_url: z.string().optional().nullable(),
        pull_request_url: z.string().optional().nullable(),

        comments_count: z.number(),
        comments_list: z.array(
          z.object({
            body: z.string(),
            path: z.string(),
            position: z.number(),
            diff_hunk: z.string(),
            commit_id: z.string(),
            created_at: z.string(),
            updated_at: z.string(),
          }),
        ),
      }),
    ),
    async func({ repo, index, latest }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return latest
        ? gitea.listPullRequestReviewsFilterUser(owner, repoName, index)
        : (gitea.listPullRequestReviews(owner, repoName, index) as any)
    },
  })

  prCli.addCommand({
    command: 'tbd',
    description: 'Get a pull request that to be done.',
    inputSchema: z.object({}),
    outputSchema: PRSchema.extend({
      reviews: z.array(ReviewSchema),
    }),
    async func({}) {
      const gitea = new Gitea()
      let page = 1
      while (true) {
        const list = await gitea.searchPullRequests({
          state: 'open',
          created: true,
          page,
          limit: 10,
        })
        if (list.length <= 0) {
          throw Error('There is no Pull Request need to revise')
        }
        for (const item of list) {
          const owner = item.repository?.owner!
          const repo = item.repository?.name!
          const index = item.number!
          // 获取 review list
          const reviews = await gitea.listPullRequestReviewsFilterUser(owner, repo, index, {})
          // 获取 review detail
          const prDetail = {
            ...item,
            reviews,
          }
          if (reviews.findIndex((review) => review.state === 'REQUEST_CHANGES') >= 0) {
            return prDetail as any
          }
        }
        page++
      }
    },
  })

  // 审批者相关
  createPullRequestReviewerCommand(prCli)
}
