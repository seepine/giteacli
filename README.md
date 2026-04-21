# giteacli

A CLI tool for interacting with Gitea instances. Manage repositories, issues, pull requests, labels, and more with type-safe commands.

## Installation

```bash
# Using npm
npm install -g @seepine/giteacli

# Using pnpm
pnpm add -g @seepine/giteacli
```

## Quick Start

```bash
# Login to your Gitea instance
giteacli login --host <host> --token <token>

# Check current user
giteacli whoami
```

## Commands

### Authentication

```bash
# Login to a Gitea instance
giteacli login --host <host> --token <token>

# Show current logged in user
giteacli whoami
```

### Repository Management

```bash
# List your repositories
giteacli repo list

# Create a new repository
giteacli repo add --name <name>

# Fork a repository
giteacli repo fork --repo <owner/repo>
```

#### Repository Labels

```bash
# List labels in a repository
giteacli repo label list --repo <owner/repo>

# Create a new label
giteacli repo label add --repo <owner/repo> --name <name> --color <color>

# Edit a label
giteacli repo label edit --repo <owner/repo> --id <id>

# Delete a label
giteacli repo label del --repo <owner/repo> --id <id>
```

### Issue Management

```bash
# Get a single issue
giteacli issue get --repo <owner/repo> --index <index>

# List issues in a repository
giteacli issue list --repo <owner/repo>

# Search issues
giteacli issue search

# Create a new issue
giteacli issue add --repo <owner/repo> --title <title> --body <body>

# Edit an issue
giteacli issue edit --repo <owner/repo> --index <index>

# Add labels to an issue
giteacli issue add-labels --repo <owner/repo> --index <index> --labels <labels>

# Remove labels from an issue
giteacli issue del-labels --repo <owner/repo> --index <index> --labels <labels>
```

#### Issue Comments

```bash
# List comments on an issue
giteacli issue comment list --repo <owner/repo> --index <index>

# Add a comment to an issue
giteacli issue comment add --repo <owner/repo> --index <index> --body <body>

# Edit a comment
giteacli issue comment edit --repo <owner/repo> --comment-id <commentId> --body <body>
```

### Pull Request Management

```bash
# List pull requests in a repository
giteacli pr list --repo <owner/repo>

# Search pull requests
giteacli pr search

# Get a single pull request
giteacli pr get --repo <owner/repo> --index <index>

# Create a new pull request
giteacli pr add --repo <owner/repo> --title <title> --head <head> --base <base>

# Edit a pull request
giteacli pr edit --repo <owner/repo> --index <index>

# Get pull request comments
giteacli pr comments --repo <owner/repo> --index <index>

# List pull request reviews
giteacli pr reviews --repo <owner/repo> --index <index>

# Find first PR that need changes (REQUEST_CHANGES review)
giteacli pr tbd
```

#### Reviewers

```bash
# Add a reviewer to a pull request
giteacli pr reviewer add --repo <owner/repo> --index <index> --username <username>

# Remove a reviewer from a pull request
giteacli pr reviewer del --repo <owner/repo> --index <index> --username <username>

# Request re-review
giteacli pr reviewer review --repo <owner/repo> --index <index> --username <username>
```

### Configuration

```bash
# Set configuration values
giteacli config set <key> <value>

# Available keys: format
# format: can be set to "toon" for pretty-printed output
```

## Output Format

By default, output is JSON. You can set `format=toon` in config for pretty-printed output:

```bash
giteacli config set format toon
```

## License

MIT
