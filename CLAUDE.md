# Startup Hub - Project Context

**CRITICAL:** This project uses the agents-playbook MCP system.

## Project Overview
Startup Hub is a multilingual aggregator for early-stage AI/tech startups with MCP API integration for AI agents.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js
- **i18n:** next-intl
- **Hosting:** Vercel

### During Work:
- Reference step_id when updating memory-board
- Link completed work to specific step_id

### When Step Complete:
1. Verify all step tasks done
2. **Call MCP:** `get_next_step(workflow_id="3d434530-7ec6-4caf-adfc-02a81324c49b", current_step=N)`
3. Query new step status

## Active Task

**Task:** startup-hub
**Updated:** 2026-01-10
**Phase:** ✅ PRD COMPLETE - Ready for Implementation

→ **Context:** `.agents-playbook/startup-hub/prd.md`

## Multi-Agent Context Recovery

At the start of any conversation or after context collapse:

1. Check the `## Active Task` section above
2. If there's an active task, read its memory-board.md file
3. Read all files listed in "Files" section
4. Continue from "Current Task"
5. Update todos as you complete them

This enables seamless handoff between agents when context collapses.
