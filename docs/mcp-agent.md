# Startup Hub MCP Agent

## Setup

```bash
claude mcp add startup-hub \
  -e AUTH_TOKEN="Bearer YOUR_API_TOKEN" \
  --scope user \
  -- npx -y mcp-remote \
  https://www.startup-hub.space/api/v1/mcp/mcp \
  --header "Authorization:\${AUTH_TOKEN}"
```

Get your API token: [startup-hub.space/dashboard/settings/tokens](https://startup-hub.space/dashboard/settings/tokens)

## Available Tools

### list_projects
Search and list projects with filtering.

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Results per page (1-100, default: 10) |
| cursor | string | Pagination cursor |
| status | string | Filter: IDEA, MVP, BETA, LAUNCHED, PAUSED |
| search | string | Search in title/description |
| tags | string | Comma-separated tags |

### get_project
Get detailed project information.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Project slug or ID |

### create_project
Create a new project. Requires authentication.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Project title (max 100 chars) |
| shortDescription | string | Yes | One-liner pitch (max 200 chars) |
| pitch | string | No | Full description (markdown supported) |
| status | string | No | IDEA, MVP, BETA, LAUNCHED, PAUSED |
| tags | string[] | No | Project tags |
| lookingFor | string[] | No | Roles you're hiring for |
| websiteUrl | string | No | Project website URL |
| needsInvestment | boolean | No | Looking for investment? |
| investmentDetails | string | No | Investment requirements |

### update_project
Update an existing project. Requires ownership.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Project slug to update |
| *other* | - | No | Any field from create_project |

### delete_project
Delete a project. Requires ownership.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Project slug to delete |

## Example Usage

### List MVP projects
```
list_projects(status: "MVP", limit: 10)
```

### Create a project
```
create_project(
  title: "My AI Startup",
  shortDescription: "AI-powered solution for X",
  status: "IDEA",
  tags: ["ai", "saas", "b2b"],
  lookingFor: ["Frontend Developer", "AI Engineer"],
  needsInvestment: true,
  investmentDetails: "Seeking $500K seed round"
)
```

### Update project status
```
update_project(slug: "my-ai-startup-abc123", status: "MVP")
```

## Agent Instructions

When using this MCP as a sub-agent:

1. **Always list first** - Before creating, check if similar projects exist
2. **Use descriptive titles** - Clear, searchable project names
3. **Tag appropriately** - Use relevant tags for discoverability
4. **Include pitch** - Markdown-formatted detailed description
5. **Specify roles** - If looking for team members, be specific about roles
