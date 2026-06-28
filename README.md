# MI Data Pipelines — MCP Interactive Demo

An interactive demo showing how an AI agent (Claude + MCP) can manage Marketing Intelligence Data Pipelines end-to-end using natural language.

## What This Demonstrates

With 50+ MCP tools, an AI agent can do — by natural language — what today takes a marketer 20+ clicks across the Data Cloud / MI UI:

- **Discover & inspect** existing pipelines, see status across many at once
- **Build a pipeline end-to-end**: pick a connector → authenticate → map fields → validate → save
- **Run, monitor & schedule** pipelines
- **Fix issues** with mapping, transforms, and connections
- **Prevent breaks** before they happen

## Use Cases Covered

| # | Scenario | What It Shows |
|---|----------|---------------|
| 1 | Discovery & Fix | Detects why Meta spend dropped to zero, remaps deprecated field, backfills |
| 2 | Set Up Connector | LinkedIn Ads: OAuth → connection → mapping → schedule → first run |
| 3 | Find Orphans | Cross-references connections vs pipelines to find idle configs |
| 4 | Reprocess Data | Handles attribution window staleness with targeted reprocessing |
| 5 | Backfill History | Chunks a 90-day backfill to respect API quotas |
| 6 | Break Prevention | Proactively finds expiring tokens and quota risks |
| 7 | Duplicate Detection | Finds overlapping campaign scopes causing double-counting |

## MCP Tools Used (50 total)

Organized into 9 categories:
- Pipeline CRUD (6)
- Execution & Monitoring (5)
- Scheduling (2)
- Entities & Attributes (3)
- Connectors (5)
- TotalConnect / SFDrive (8)
- Data Lake Objects (4)
- Mapping & Transform (8)
- OAuth & Connections (8)
- Context (1)

## Running Locally

Just open `index.html` in a browser — no build step needed.

## Live Demo

👉 [View Live Demo](https://alonhaze7.github.io/MI-MCP-Demo/)

---

*Built for the 262 Hackathon — MI Data Pipelines MCP*
