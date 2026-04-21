export const parseRepoFullName = (repo: string): { owner: string; repoName: string } => {
  const parts = repo.split('/')

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid --repo value "${repo}". Expected format: OWNER/REPO`)
  }

  return {
    owner: parts[0],
    repoName: parts[1],
  }
}
