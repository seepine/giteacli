import { z } from 'zod'
import { Gitea } from '../gitea'
import { CliChild } from '../cli'

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
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      index: z.number().describe('Issue index number'),
    }),
    outputSchema: z.array(IssueCommentSchema),
    async func({ owner, repo, index }) {
      const gitea = new Gitea()
      return gitea.getIssueCommentsByIndex(owner, repo, index) as any
    },
  })

  commentCli.addCommand({
    command: 'add',
    description: 'Add a comment to an issue',
    inputSchema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      index: z.number().describe('Issue index number'),
      body: z.string().describe('Comment body'),
    }),
    outputSchema: IssueCommentSchema,
    func({ owner, repo, index, body }) {
      const gitea = new Gitea()
      return gitea.createIssueComment(owner, repo, index, {
        body: replaceBodyNewlines(body),
      }) as any
    },
  })

  commentCli.addCommand({
    command: 'edit',
    description: 'Edit a comment',
    inputSchema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      commentId: z.number().describe('Comment ID'),
      body: z.string().describe('New comment body'),
    }),
    outputSchema: IssueCommentSchema,
    func({ owner, repo, commentId, body }) {
      const gitea = new Gitea()
      return gitea.editIssueComment(owner, repo, commentId, {
        body: replaceBodyNewlines(body),
      }) as any
    },
  })
}
