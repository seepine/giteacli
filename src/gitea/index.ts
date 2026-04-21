import { createAlova } from 'alova'
import fetchAdapter from 'alova/fetch'
import { createApis, withConfigType } from './api/createApis'
import { getConfig } from './config'
import type {
  PullRequest,
  PullReview,
  PullReviewComment,
  RepositoryMeta,
  User,
} from './api/globals'

export class Gitea {
  Apis: ReturnType<typeof createApis>
  constructor(opt?: { host?: string; token?: string }) {
    const cfg = getConfig() as { host?: string; token?: string }
    const opts = opt ?? (cfg.host && cfg.token ? cfg : null)
    if (!opts?.host || !opts?.token) {
      throw new Error(
        'need auth You need to authorize this machine using `giteacli login --host <host> --token <token>`',
      )
    }
    if (!opts.host.startsWith('http')) {
      opts.host = 'https://' + opts.host
    }
    if (!opts.host.endsWith('/')) {
      opts.host = opts.host + '/'
    }
    const alovaInstance = createAlova({
      baseURL: `${opts.host}api/v1`,
      requestAdapter: fetchAdapter(),
      cacheFor: null,
      beforeRequest: (method) => {
        if (typeof method.config.params !== 'string') {
          method.config.params.access_token = opts.token
        }
      },
      responded: async (res) => {
        if (res.status >= 400) {
          throw new Error(JSON.stringify(await res.json()))
        }
        if (res.status === 204) {
          return null
        }
        return await res.json()
      },
    })
    const $$userConfigMap = withConfigType({})
    this.Apis = createApis(alovaInstance, $$userConfigMap)
  }

  async getCurrentUserinfo(): Promise<User & { username: string }> {
    // @ts-ignore
    return this.Apis.user.userGetCurrent()
  }

  async getIssueByIndex(owner: string, repo: string, index: number) {
    const res = await this.Apis.issue.issueGetIssue({ pathParams: { owner, repo, index } })
    if (res.pull_request !== null) {
      throw new Error('Invalid issue index')
    }
    return res
  }

  async listRepoIssues(
    owner: string,
    repo: string,
    params?: {
      state?: 'open' | 'closed' | 'all'
      labels?: string
      q?: string
      page?: number
      limit?: number
      created_by?: string
      assigned_by?: string
    },
  ) {
    return this.Apis.issue.issueListIssues({ pathParams: { owner, repo }, params: params ?? {} })
  }

  async searchIssues(params: {
    state?: 'open' | 'closed' | 'all'
    labels?: string
    assigned?: boolean
    created?: boolean
    q?: string
    page?: number
    limit?: number
  }) {
    return this.Apis.issue.issueSearchIssues({
      params: { ...params, type: 'issues' },
    })
  }

  async createIssue(
    owner: string,
    repo: string,
    data: { title: string; body?: string; labels?: number[] },
  ) {
    return this.Apis.issue.issueCreateIssue({ pathParams: { owner, repo }, data })
  }

  async getIssueCommentsByIndex(
    owner: string,
    repo: string,
    index: number,
    params?: { since?: string; before?: string },
  ) {
    return this.Apis.issue.issueGetComments({
      pathParams: { owner, repo, index },
      params: params ?? {},
    })
  }

  async listIssueLabels(pathParams: { owner: string; repo: string; index: number }) {
    return this.Apis.issue.issueGetLabels({ pathParams })
  }

  async listRepoLabels(owner: string, repo: string, params?: { page?: number; limit?: number }) {
    const labels = []
    try {
      const orgLables = await this.Apis.organization.orgListLabels({
        pathParams: {
          org: owner,
        },
        params: {},
      })
      labels.push(...orgLables)
    } catch (e) {}
    const repoLabels = await this.Apis.issue.issueListLabels({
      pathParams: { owner, repo },
      params: params ?? {},
    })
    labels.push(...repoLabels)
    return labels
  }

  async createRepoLabel(
    owner: string,
    repo: string,
    data: { name: string; color: string; description?: string },
  ) {
    let _data = {
      ...data,
      name: data.name.trim(),
      exclusive: false,
    }
    if (data.name.includes('/')) {
      _data.exclusive = true
    }
    const labels = await this.listRepoLabels(owner, repo)
    if (labels.findIndex((item) => item.name === _data.name) >= 0) {
      throw new Error('Name has already been taken')
    }
    return this.Apis.issue.issueCreateLabel({ pathParams: { owner, repo }, data: _data })
  }

  async editIssueLabel(
    owner: string,
    repo: string,
    labelId: number,
    data: { name?: string; color?: string; description?: string; exclusive?: boolean },
  ) {
    let _data = {
      ...data,
    }
    if (_data.name) {
      _data.name = _data.name.trim()
      if (_data.name.includes('/')) {
        _data.exclusive = true
      } else {
        _data.exclusive = false
      }
      const labels = await this.listRepoLabels(owner, repo)
      if (labels.findIndex((item) => item.name === _data.name) >= 0) {
        throw new Error('Name has already been taken')
      }
    }
    return this.Apis.issue.issueEditLabel({ pathParams: { owner, repo, id: labelId }, data: _data })
  }

  async deleteRepoLabel(owner: string, repo: string, labelId: number) {
    return this.Apis.issue.issueDeleteLabel({ pathParams: { owner, repo, id: labelId } })
  }

  async replaceIssueLabels(owner: string, repo: string, index: number, data: { labels: number[] }) {
    // IssueLabelsOption in generated types incorrectly uses null[], actual API accepts number[] or string[]
    return this.Apis.issue.issueReplaceLabels({
      pathParams: { owner, repo, index },
      data: data as any,
    })
  }

  async addIssueLabels(owner: string, repo: string, index: number, data: { labels: number[] }) {
    return this.Apis.issue.issueAddLabel({
      pathParams: { owner, repo, index },
      data: data as any,
    })
  }

  async removeIssueLabel(owner: string, repo: string, index: number, labelId: number) {
    return this.Apis.issue.issueRemoveLabel({
      pathParams: { owner, repo, index, id: labelId },
    })
  }

  async createIssueComment(owner: string, repo: string, index: number, data: { body: string }) {
    return this.Apis.issue.issueCreateComment({ pathParams: { owner, repo, index }, data })
  }

  async editIssue(
    owner: string,
    repo: string,
    index: number,
    data: { title?: string; body?: string; state?: 'open' | 'closed' },
  ) {
    return this.Apis.issue.issueEditIssue({ pathParams: { owner, repo, index }, data })
  }

  async editIssueComment(owner: string, repo: string, commentId: number, data: { body: string }) {
    return this.Apis.issue.issueEditComment({ pathParams: { owner, repo, id: commentId }, data })
  }

  async listMyRepos(params?: { page?: number; limit?: number }) {
    return this.Apis.user.userCurrentListRepos({ params: params ?? {} })
  }

  async createRepo(data: {
    name: string
    description?: string
    private?: boolean
    auto_init?: boolean
    gitignore_template?: string
    license_template?: string
    readme?: string
    default_branch?: string
  }) {
    return this.Apis.repository.createCurrentUserRepo({ data })
  }

  async forkRepo(owner: string, repo: string, data?: { organization?: string }) {
    return this.Apis.repository.createFork({ pathParams: { owner, repo }, data: data ?? {} })
  }

  async searchPullRequests(params?: {
    state?: 'open' | 'closed' | 'all'
    assigned?: boolean
    created?: boolean
    page?: number
    limit?: number
  }): Promise<(PullRequest & { repository?: RepositoryMeta })[]> {
    return Promise.all(
      (
        await this.Apis.issue.issueSearchIssues({
          params: { ...params, type: 'pulls' },
        })
      ).map(async (item) => {
        return {
          ...(await this.Apis.repository.repoGetPullRequest({
            pathParams: {
              owner: item.repository?.owner!,
              repo: item.repository?.name!,
              index: item.number!,
            },
          })),
          repository: item.repository,
        }
      }),
    )
  }

  async resolveLabelNamesToIds(
    owner: string,
    repo: string,
    labelNames: string,
  ): Promise<number[] | undefined> {
    if (!labelNames) return undefined
    const allLabels = (await this.listRepoLabels(owner, repo)) as any
    return allLabels
      .filter((l: any) =>
        labelNames
          .split(',')
          .map((n: string) => n.trim())
          .includes(l.name),
      )
      .map((l: any) => l.id)
  }

  async listPullRequests(
    owner: string,
    repo: string,
    params?: {
      state?: 'open' | 'closed' | 'all'
      sort?:
        | 'oldest'
        | 'recentupdate'
        | 'recentclose'
        | 'leastupdate'
        | 'mostcomment'
        | 'leastcomment'
        | 'priority'
      page?: number
      limit?: number
    },
  ) {
    return this.Apis.repository.repoListPullRequests({
      pathParams: { owner, repo },
      params: {
        ...params,
        poster: 'cto',
      },
    })
  }

  async getPullRequestByIndex(owner: string, repo: string, index: number) {
    return this.Apis.repository.repoGetPullRequest({ pathParams: { owner, repo, index } })
  }

  async createPullRequest(
    owner: string,
    repo: string,
    data: {
      title: string
      head: string
      base: string
      body?: string
      milestones?: number[]
      labels?: number[]
    },
  ) {
    return this.Apis.repository.repoCreatePullRequest({ pathParams: { owner, repo }, data })
  }

  async addPullRequestReviewer(owner: string, repo: string, index: number, username: string) {
    return this.Apis.repository.repoCreatePullReviewRequests({
      pathParams: { owner, repo, index },
      data: {
        reviewers: [username],
      },
    })
  }

  async deletePullRequestReviewer(owner: string, repo: string, index: number, username: string) {
    return this.Apis.repository.repoDeletePullReviewRequests({
      pathParams: { owner, repo, index },
      data: { reviewers: [username] },
    })
  }

  async getPullRequestReview(owner: string, repo: string, index: number, reviewId: number) {
    return this.Apis.repository.repoGetPullReview({
      pathParams: { owner, repo, index, id: reviewId },
    })
  }

  async getPullRequestReviewComments(owner: string, repo: string, index: number, reviewId: number) {
    return this.Apis.repository.repoGetPullReviewComments({
      pathParams: { owner, repo, index, id: reviewId },
    })
  }

  async editPullRequest(
    owner: string,
    repo: string,
    index: number,
    data: {
      title?: string
      body?: string
      state?: 'open' | 'closed'
      base?: string
      assignee?: string
      assignees?: string[]
      milestone?: number
      labels?: number[]
    },
  ) {
    return this.Apis.repository.repoEditPullRequest({ pathParams: { owner, repo, index }, data })
  }

  async listPullRequestReviews(
    owner: string,
    repo: string,
    index: number,
    params?: { page?: number; limit?: number },
  ): Promise<(PullReview & { comments_list: PullReviewComment[] })[]> {
    const res = await this.Apis.repository.repoListPullReviews({
      pathParams: { owner, repo, index },
      params: params ?? {},
    })
    return await Promise.all(
      res.map(async (item) => {
        return {
          ...item,
          comments_list:
            (await this.getPullRequestReviewComments(owner, repo, index, item.id!)) || [],
        }
      }),
    )
  }

  /**
   * 获取pr的审核列表，过滤用户，每个用户只保留最新的一条
   * @param owner
   * @param repo
   * @param index
   * @param params
   * @returns
   */
  async listPullRequestReviewsFilterUser(
    owner: string,
    repo: string,
    index: number,
    params?: { page?: number; limit?: number },
  ): Promise<(PullReview & { comments_list: PullReviewComment[] })[]> {
    const res = await this.Apis.repository.repoListPullReviews({
      pathParams: { owner, repo, index },
      params: params ?? {},
    })
    const temp: { [x: string]: PullReview } = {}
    for (const item of res) {
      temp[item.user?.id || 'unknown'] = item
    }
    return await Promise.all(
      Object.values(temp).map(async (item) => {
        return {
          ...item,
          comments_list:
            (await this.getPullRequestReviewComments(owner, repo, index, item.id!)) || [],
        }
      }),
    )
  }

  getPullRequestCommentsByIndex = this.getIssueCommentsByIndex
}
