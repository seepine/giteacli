# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.1.6](https://github.com/seepine/giteacli/compare/v0.1.5...v0.1.6) (2026-04-21)


### Features

* **cli:** refactor command structure to use full repository name format and add parseRepoFullName utility ([816af00](https://github.com/seepine/giteacli/commit/816af00aad7cd830a9f8428949ba98e9315f53e6))


### Bug Fixes

* **pr:** make comments and review_comments fields optional and nullable ([dff72c1](https://github.com/seepine/giteacli/commit/dff72c19a6a9e83356a95056b850dad3ca9a55e8))

## [0.1.5](https://github.com/seepine/giteacli/compare/v0.1.4...v0.1.5) (2026-04-21)


### Features

* **repo:** add RepoSchema for repository validation and enhance list command with pagination and filtering options ([95e6b0e](https://github.com/seepine/giteacli/commit/95e6b0ef48bf4a01ab6b6e76f4aaecea5131c136))

## [0.1.4](https://github.com/seepine/giteacli/compare/v0.1.3...v0.1.4) (2026-04-19)


### Bug Fixes

* **issue:** sanitize label names by trimming whitespace and removing empty values ([b03a318](https://github.com/seepine/giteacli/commit/b03a318ca63092545fda5e10fe8ca5e9b3435246))

## [0.1.3](https://github.com/seepine/giteacli/compare/v0.1.2...v0.1.3) (2026-04-19)


### Bug Fixes

* **issue:** correct hasNextPage logic in issue list command ([e84f67b](https://github.com/seepine/giteacli/commit/e84f67b8f376018e55d02579c29f27af17457944))

## [0.1.2](https://github.com/seepine/giteacli/compare/v0.1.1...v0.1.2) (2026-04-19)


### Features

* **issue:** add client-side filtering for issues by created/assigned/labels ([6805638](https://github.com/seepine/giteacli/commit/68056387935ab7395933b6432259f736f91aabb5))

## [0.1.1](https://github.com/seepine/giteacli/compare/v0.1.0...v0.1.1) (2026-04-16)


### Features

* **pull-request:** replace page/limit params with latest review filter ([cbd2748](https://github.com/seepine/giteacli/commit/cbd2748180daca86d5992ee3e4413d438dc1c2a8))
