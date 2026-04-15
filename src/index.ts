#!/usr/bin/env node
import pkg from '../package.json'
import { Gitea } from './gitea'
import { setConfig } from './gitea/config'
import { createRepoCommand } from './commands/repo'
import { createIssueCommand } from './commands/issue'
import { createPullRequestCommand } from './commands/pull-request'
import { createConfigCommand } from './commands/config'
import { Cli } from './cli'
import z from 'zod'

const cli = new Cli({
  name: 'giteacli',
  description:
    'A CLI tool for interacting with Gitea instances - manage repos, issues, pull requests, and more',
  version: `v${pkg.version}`,
})

cli.addCommand({
  command: 'login',
  description: 'Login to a Gitea instance and save credentials',
  inputSchema: z.object({
    host: z.string().describe('Gitea host, like gitea.com'),
    token: z.string().describe('Gen from Gitea Settings, like d56axxxxxxxe67'),
  }),
  async func({ host, token }) {
    try {
      const gitea = new Gitea({ host, token })
      await gitea.getCurrentUserinfo()
    } catch (e) {
      console.error('Login failed: invalid host or token')
      process.exit(1)
    }
    setConfig('host', host)
    setConfig('token', token)
    console.log('Login successful')
  },
})

cli.addCommand({
  command: 'whoami',
  description: 'Show current logged in user information',
  inputSchema: z.object({}),
  outputSchema: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    active: z.boolean(),
    avatar_url: z.string(),
    html_url: z.string(),
  }),
  func() {
    const gitea = new Gitea()
    return gitea.getCurrentUserinfo() as any
  },
})

createRepoCommand(cli)
createIssueCommand(cli)
createPullRequestCommand(cli)
createConfigCommand(cli)

cli.parse()
