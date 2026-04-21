import { z } from 'zod'
import { Gitea } from '../gitea'
import { CliChild } from '../cli'
import { parseRepoFullName } from './repo-full-name'

const replaceBodyNewlines = (body: string) => body.replace(/\\n/g, '\n')

const IssueCommentSchema = z.object({
  id: z.number(),
  body: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    avatar_url: z.string(),
  }),
  issue_url: z.string(),
  html_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  assets: z.array(z.any()),
})
export function createIssueCommentCommand(issueCli: CliChild) {
  const commentCli = issueCli.command('comment', 'Issue comment manager')

  commentCli.addCommand({
    command: 'list',
    description: 'List all comments on an issue',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      index: z.number().describe('Issue index number'),
    }),
    outputSchema: z.array(IssueCommentSchema),
    async func({ repo, index }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.getIssueCommentsByIndex(owner, repoName, index) as any
    },
  })

  commentCli.addCommand({
    command: 'add',
    description: 'Add a comment to an issue',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      index: z.number().describe('Issue index number'),
      body: z.string().describe('Comment body'),
    }),
    outputSchema: IssueCommentSchema,
    func({ repo, index, body }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.createIssueComment(owner, repoName, index, {
        body: replaceBodyNewlines(body),
      }) as any
    },
  })

  commentCli.addCommand({
    command: 'edit',
    description: 'Edit a comment',
    inputSchema: z.object({
      repo: z.string().describe('Repository full name, e.g. owner/repo'),
      commentId: z.number().describe('Comment ID'),
      body: z.string().describe('New comment body'),
    }),
    outputSchema: IssueCommentSchema,
    func({ repo, commentId, body }) {
      const { owner, repoName } = parseRepoFullName(repo)
      const gitea = new Gitea()
      return gitea.editIssueComment(owner, repoName, commentId, {
        body: replaceBodyNewlines(body),
      }) as any
    },
  })
}
