import { z } from 'zod'
import { Gitea } from '../gitea'
import { Cli } from '../cli'
import { parseRepoFullName } from './repo-full-name'

const ActionStatusSchema = z.string().optional().describe('Filter by status')

const ActionRunSchema = z.object({
  id: z.number().optional(),
  display_title: z.string().optional(),
  path: z.string().optional(),
  event: z.string().optional(),
  status: z.string().optional(),
  head_sha: z.string().optional(),

  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  html_url: z.string().optional(),

  actor: z
    .object({
      username: z.string().optional(),
    })
    .optional(),

  trigger_actor: z
    .object({
      username: z.string().optional(),
    })
    .optional(),
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

const ActionRunListSchema = z.array(
  ActionRunSchema.extend({
    _tips: z.string().optional(),
  }),
)
const ActionJobListSchema = z.array(
  ActionJobSchema.extend({
    _tips: z.string().optional(),
  }),
)

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
      limit: z.number().optional().default(5).describe('Items per page, default 5'),
      branch: z.string().optional().describe('Filter by branch'),
      event: z.string().optional().describe('Filter by event name'),
    }),
    outputSchema: ActionRunListSchema,
    async func({ repo, status, headSha, page, limit, branch, event }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      const list = await gitea.listActionRuns(owner, repoName, {
        status,
        head_sha: headSha,
        page,
        limit,
        branch,
        event,
      })
      return list.map((item: any) => {
        return {
          ...item,
          _tips: `use \`giteacli action job list --repo ${repo} --run-id ${item.id}\` to see jobs`,
        }
      })
    },
  })

  const jobCli = actionCli.command('job', 'action job manager')

  jobCli.addCommand({
    command: 'list',
    description: 'List jobs of an action run',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      runId: z.number().describe('Action run id'),
      status: ActionStatusSchema,
      page: z.number().optional().default(1).describe('Page number, default 1'),
      limit: z.number().optional().default(20).describe('Items per page, default 20'),
    }),
    outputSchema: ActionJobListSchema,
    async func({ repo, runId, status, page, limit }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      const list = await gitea.listActionRunJobs(owner, repoName, runId, { status, page, limit })
      return list.map((item: any) => {
        return {
          ...item,
          _tips: `use \`giteacli action job logs --repo ${repo} --job-id ${item.id}\` to see the job logs (all steps)`,
        }
      })
    },
  })

  jobCli.addCommand({
    command: 'logs',
    description: 'View logs of an action job',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      jobId: z.number().describe('Action job id'),
    }),
    outputSchema: z.string(),
    async func({ repo, jobId }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.getActionRunJobLogs(owner, repoName, jobId)
    },
  })
}
