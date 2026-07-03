import { Cli } from '../cli'
import { createOrgLabelCommand } from './org-label'

export function createOrgCommand(cli: Cli) {
  const orgCli = cli.command('org', 'organization manager')

  createOrgLabelCommand(orgCli)
}
