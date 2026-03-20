# Beast Life AI Support Automation Dashboard

A startup-focused, AI-assisted support operations dashboard built with Next.js. The project demonstrates how customer queries from multiple channels can be classified, prioritized, routed, and analyzed with an automation-first workflow.

## Project Purpose

This repository is the assignment implementation for an AI-powered support intelligence system for Beast Life. The app focuses on:

- Faster support resolution with automation + human-assist routing
- Better operational visibility for support teams
- Founder-level business signals like churn risk and MRR-at-risk

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Radix UI primitives + custom UI components
- Recharts for analytics visualization
- Local browser storage for demo persistence

## Core Features

- Multi-channel inspired support intake experience
- AI-style classification metadata per query:
  - category
  - urgency
  - sentiment
  - confidence
  - auto_resolvable
- Automation decision flow with human handoff/escalation paths
- Query filtering, sorting, and saved views
- Dashboard analytics + automation insights
- Team assignment and workload views
- Response template management
- Workflow diagram and explainability-style demos
- Export/import support for query datasets

## System Workflow

1. Query ingestion from channels (WhatsApp/Instagram/Email model)
2. AI classification into structured fields
3. Decision engine routes to:
   - auto response
   - human assist
   - escalation
4. Analytics + insight layer tracks trends, risks, and automation potential

Reference architecture and assignment-specific details are documented in `SUBMISSION_GUIDE.md`.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
pnpm install
```

### Run in Development

```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

### Build and Start

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

## Scripts

- `pnpm dev` - start development server
- `pnpm build` - create production build
- `pnpm start` - run production server
- `pnpm lint` - run ESLint checks

## Project Structure

```text
app/                  # Next.js app router entry (main dashboard page)
components/           # Feature and UI components
components/ui/        # Reusable primitive UI building blocks
hooks/                # Reusable React hooks
lib/                  # Types, storage helpers, utility modules
styles/               # Additional global styles
SUBMISSION_GUIDE.md   # Assignment architecture and workflow narrative
```

## Assignment Highlights

- Demonstrates AI workflow from ingestion to decisioning
- Includes automation strategy and scale narrative
- Surfaces startup-relevant metrics and team execution views
- Provides UI artifacts for analytics, automation, templates, and operations

## Notes

- This project currently uses local storage + mock/demo data patterns for assignment demonstration.
- You can plug in live APIs/LLM providers by extending modules in `lib/` and relevant feature components.

## License

For assignment/demo usage.
