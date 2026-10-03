# 🌐 Google Jules REST API Reference (`v1alpha`)

While the `@google/jules` CLI is the standard tool for interactive workflows, Google Jules exposes a direct Google Cloud REST API at `https://jules.googleapis.com/v1alpha`. 

This reference documents the REST API contract, JSON schemas, and programmatic endpoints for headless orchestration, container automation, and structured telemetry extraction.

---

## 🔑 Authentication & Base URL

- **Base URL**: `https://jules.googleapis.com/v1alpha`
- **Authentication**: Provided via header `X-Goog-Api-Key: $JULES_API_KEY` (or Google Cloud OAuth2 Bearer token).
- **API Key Provisioning**: Generated from [jules.google/settings](https://jules.google/).

---

## 📡 Endpoints

### 1. Create a Session (`POST /v1alpha/sessions`)

Creates and schedules a new Jules container VM session for a designated GitHub repository.

#### Request
```bash
curl -s 'https://jules.googleapis.com/v1alpha/sessions' \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  -d '{
    "prompt": "First, verify repository files using git ls-tree -r --name-only HEAD on branch main. DO NOT force-reset or force-push main. Next, read .jules/JULES.md for fleet rules, then execute your assigned task in .jules/tasks/task-1.md. Verify with npm run lint, npm run build, and npm test before opening a Pull Request.",
    "sourceContext": {
      "source": "sources/github/ClawStackStudios/CaraBase",
      "githubRepoContext": {
        "startingBranch": "main"
      }
    },
    "automationMode": "AUTO_CREATE_PR",
    "requirePlanApproval": false
  }'
```

#### JSON Payload Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `prompt` | `string` | The task instructions, constraints, and verification commands. |
| `sourceContext.source` | `string` | The connected repository resource path: `sources/github/<OWNER>/<REPO>`. |
| `sourceContext.githubRepoContext.startingBranch` | `string` | The base branch Jules clones in its isolated VM (defaults to `main`). |
| `automationMode` | `string` | `"AUTO_CREATE_PR"` instructs Jules to open a GitHub Pull Request upon task completion. |
| `requirePlanApproval` | `boolean` | If `true`, Jules pauses in `Awaiting Plan Approval` in the Web UI before modifying code. If `false`, executes plan autonomously. |

#### Response (`200 OK`)
```json
{
  "name": "sessions/17983432046182947102",
  "id": "17983432046182947102",
  "state": "IN_PROGRESS",
  "createTime": "2026-10-02T19:00:00Z"
}
```

---

### 2. List Sessions (`GET /v1alpha/sessions`)

Returns an array of sessions for the authenticated identity.

#### Request
```bash
curl -s 'https://jules.googleapis.com/v1alpha/sessions' \
  -H "X-Goog-Api-Key: $JULES_API_KEY"
```

#### Response (`200 OK`)
```json
{
  "sessions": [
    {
      "id": "17983432046182947102",
      "state": "COMPLETED",
      "prompt": "...",
      "createTime": "2026-10-02T18:30:00Z",
      "updateTime": "2026-10-02T18:45:00Z"
    }
  ]
}
```

---

### 3. Get Session Details (`GET /v1alpha/sessions/{sessionId}`)

Retrieves detailed state, PR URL, and exit reason for a specific session.

#### Request
```bash
curl -s "https://jules.googleapis.com/v1alpha/sessions/17983432046182947102" \
  -H "X-Goog-Api-Key: $JULES_API_KEY"
```

#### Session States
- `QUEUED`: Queued waiting for container VM provisioning.
- `IN_PROGRESS`: Actively cloning repo, planning, or executing edits.
- `AWAITING_USER_FEEDBACK`: Paused waiting for user clarification or plan approval.
- `COMPLETED`: Pull request generated or patch finalized.
- `FAILED`: Encountered unrecoverable VM failure or build error.
- `CANCELLED`: Aborted by user.

---

### 4. Stream Activities & Progress (`GET /v1alpha/sessions/{sessionId}/activities`)

Provides a structured JSON timeline of internal execution events, eliminating the need to scrape or parse terminal output.

#### Request
```bash
curl -s "https://jules.googleapis.com/v1alpha/sessions/17983432046182947102/activities" \
  -H "X-Goog-Api-Key: $JULES_API_KEY"
```

#### Response (`200 OK`)
```json
{
  "activities": [
    {
      "activityType": "PLAN_GENERATED",
      "description": "Formulated plan: decompose TableEditor.tsx into TableHeader.tsx and TableRow.tsx",
      "timestamp": "2026-10-02T18:32:10Z"
    },
    {
      "activityType": "CODE_EDIT",
      "description": "Modified src/components/TableEditor.tsx and created src/components/TableHeader.tsx",
      "timestamp": "2026-10-02T18:37:45Z"
    },
    {
      "activityType": "TEST_EXECUTION",
      "description": "Ran npm test: 28 passing, 0 failing",
      "timestamp": "2026-10-02T18:42:00Z"
    },
    {
      "activityType": "PR_CREATED",
      "description": "Opened Pull Request #36: refactor: decompose TableEditor into subcomponents",
      "timestamp": "2026-10-02T18:44:30Z"
    }
  ]
}
```

---

## 🎯 When to Use REST API vs. CLI

| Use Case | Recommended Tool | Rationale |
| :--- | :--- | :--- |
| **Interactive Developer Workflows** | `jules new` / `jules remote list` | Fast, human-friendly TUI with zero curl boilerplate. |
| **Direct Local Patch Application** | `jules remote pull --session <ID> --apply` | Native patch unpacker directly into local working tree. |
| **Headless CI / Non-TTY Containers** | REST API (`curl` / Node fetch) | Immune to TTY allocation, stdin blocking, or npm binary version mismatches. |
| **Automated Status Dashboards** | REST API (`/activities` endpoint) | Clean JSON object stream instead of ANSI-escaped terminal tables. |
