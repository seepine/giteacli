import { z } from 'zod'
import { Gitea } from '../gitea'
import { Cli } from '../cli'
import { parseRepoFullName } from './repo-full-name'

const ActionStatusSchema = z.string().optional().describe('Filter by status')

const ActionRunSchema = z.object({
  id: z.number(),
  display_title: z.string().optional(),
  path: z.string().optional(),
  event: z.string().optional(),
  status: z.string().optional(),
  head_sha: z.string().optional(),

  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  html_url: z.string().optional(),

  actor: z.object({
    username: z.string(),
    html_url: z.string(),
  }),

  trigger_actor: z.object({
    username: z.string(),
    html_url: z.string(),
  }),

  repository: z.object({
    owner: z.object({
      username: z.string(),
      html_url: z.string(),
    }),

    name: z.string(),

    full_name: z.string(),
    description: z.string().optional(),

    fork: z.boolean(),
    mirror: z.boolean(),
    private: z.boolean(),
    empty: z.boolean(),
    archived: z.boolean(),

    default_branch: z.string(),

    html_url: z.string(),
  }),
})

const ActionJobSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  run_id: z.number().optional(),
  run_attempt: z.number().optional(),
  status: z.string().optional(),
  conclusion: z.string().optional(),
  head_sha: z.string().optional(),
  runner_id: z.number().optional(),
  runner_name: z.string().optional(),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  html_url: z.string().optional(),
  steps: z
    .array(
      z.object({
        name: z.string(),
        number: z.number(),
        status: z.string(),
        conclusion: z.string(),
        started_at: z.string(),
        completed_at: z.string().optional(),
      }),
    )
    .optional(),
})

const ActionRunListSchema = z.array(ActionRunSchema)
const ActionJobListSchema = z.array(ActionJobSchema)

export function createActionCommand(cli: Cli) {
  const actionCli = cli.command('action', 'action manager')

  actionCli.addCommand({
    command: 'list',
    description: 'List action runs in a repository',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      status: ActionStatusSchema,
      headSha: z.string().optional().describe('Filter by triggering sha'),
      page: z.number().optional().default(1).describe('Page number, default 1'),
      limit: z.number().optional().default(20).describe('Items per page, default 20'),
      branch: z.string().optional().describe('Filter by branch'),
      event: z.string().optional().describe('Filter by event name'),
    }),
    outputSchema: ActionRunListSchema,
    async func({ repo, status, headSha, page, limit, branch, event }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.listActionRuns(owner, repoName, {
        status,
        head_sha: headSha,
        page,
        limit,
        branch,
        event,
      }) as any
    },
  })

  const jobCli = actionCli.command('job', 'action job manager')

  jobCli.addCommand({
    command: 'list',
    description: 'List jobs of an action run',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      index: z.number().describe('Action run id'),
      status: ActionStatusSchema,
      page: z.number().optional().default(1).describe('Page number, default 1'),
      limit: z.number().optional().default(20).describe('Items per page, default 20'),
    }),
    outputSchema: ActionJobListSchema,
    async func({ repo, index, status, page, limit }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.listActionRunJobs(owner, repoName, index, { status, page, limit }) as any
    },
  })

  jobCli.addCommand({
    command: 'view',
    description: 'View an action job by id',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      index: z.number().describe('Action job id'),
    }),
    outputSchema: ActionJobSchema,
    async func({ repo, index }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.getActionRunJob(owner, repoName, index) as any
    },
  })
}
