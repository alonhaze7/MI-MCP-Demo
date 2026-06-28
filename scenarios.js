// MI Data Pipelines MCP Demo — Scenario Data
// Each scenario has a user prompt and a sequence of steps the agent takes

const SCENARIOS = {
  discovery: {
    title: "Discovery & Fix — Meta Spend Dropped to Zero",
    userMessage: "Acme's Meta spend dropped to zero on Monday. Find out why and fix it.",
    tools: [
      "getDataPipelines", "getDataPipeline", "getDataPipelineProcessLog",
      "getDataPipelineEntities", "getConnectorFields", "getDataPipelineInfo",
      "editMapping", "validateMapping", "processDataPipeline"
    ],
    steps: [
      {
        type: "thinking",
        content: "I need to investigate why Acme's Meta spend dropped. Let me start by finding the relevant pipeline and checking its recent runs."
      },
      {
        type: "tool",
        name: "getDataPipelines",
        params: '{ "dataSpace": "Acme", "filter": "Meta" }',
        result: '[\n  {\n    "id": "dp-4821",\n    "name": "Acme Meta Ads — Paid Social",\n    "connector": "facebook_ads",\n    "status": "active",\n    "lastRun": "2026-06-28T03:00:00Z",\n    "dataConnection": "dc-meta-acme-01"\n  }\n]',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataPipelineProcessLog",
        params: '{ "dataPipelineId": "dp-4821", "limit": 10 }',
        result: '[\n  { "runId": "r-991", "date": "Jun 28", "status": "success", "rows": 0 },\n  { "runId": "r-990", "date": "Jun 27", "status": "success", "rows": 0 },\n  { "runId": "r-989", "date": "Jun 26", "status": "success", "rows": 0 },\n  { "runId": "r-988", "date": "Jun 25", "status": "success", "rows": 0 },\n  { "runId": "r-987", "date": "Jun 24", "status": "success", "rows": 0 },\n  { "runId": "r-986", "date": "Jun 23", "status": "success", "rows": 0 },\n  { "runId": "r-985", "date": "Jun 22", "status": "success", "rows": 0 },\n  { "runId": "r-984", "date": "Jun 21", "status": "success", "rows": 12400 },\n  { "runId": "r-983", "date": "Jun 20", "status": "success", "rows": 11890 },\n  { "runId": "r-982", "date": "Jun 19", "status": "success", "rows": 12100 }\n]',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataPipelineInfo",
        params: '{ "dataPipelineId": "dp-4821" }',
        result: '{\n  "mappings": [\n    { "source": "spend", "target": "Cost", "status": "unmapped_since_v25" },\n    { "source": "impressions", "target": "Impressions", "status": "ok" },\n    { "source": "clicks", "target": "Clicks", "status": "ok" }\n  ],\n  "apiVersion": "v25",\n  "note": "Field `spend` deprecated in Marketing API v25. Use `cost_per_result` or `amount_spent`."\n}',
        status: "success"
      },
      {
        type: "tool",
        name: "getConnectorFields",
        params: '{ "dataConnectionName": "dc-meta-acme-01", "connectorName": "facebook_ads", "objectName": "ad_insights" }',
        result: '[\n  { "name": "amount_spent", "type": "decimal", "description": "Total spend (v25+)" },\n  { "name": "cost_per_result", "type": "decimal" },\n  { "name": "impressions", "type": "integer" },\n  { "name": "clicks", "type": "integer" },\n  { "name": "spend", "type": "null", "deprecated": true, "note": "Removed in v25" }\n]',
        status: "success"
      },
      {
        type: "response",
        content: `<p>I've found the issue. Here's my analysis:</p>

<div class="status-card warning">
  <div class="status-card-title">Root Cause Identified</div>
  <div class="status-card-body">Pipeline <code>dp-4821</code> (Acme Meta Ads) maps the <code>spend</code> field, which was deprecated in Marketing API v25. Since Jun 22, this field resolves to <strong>null</strong> — runs "succeed" with 0 rows because no spend data passes validation.</div>
</div>

<table class="data-table">
  <tr><th>Date</th><th>Status</th><th>Rows</th></tr>
  <tr><td>Jun 21</td><td>✅ Success</td><td>12,400</td></tr>
  <tr><td>Jun 22</td><td>✅ Success</td><td style="color:#fc5c65">0</td></tr>
  <tr><td>Jun 23–28</td><td>✅ Success</td><td style="color:#fc5c65">0</td></tr>
</table>

<p><strong>Proposed Fix:</strong></p>
<p>Remap <code>spend</code> → <code>amount_spent</code> (the v25 equivalent) and backfill Jun 22–today to recover the missing data.</p>

<div class="action-buttons">
  <button class="action-btn primary" onclick="handleApproval('discovery')">✓ Apply remap & backfill</button>
  <button class="action-btn secondary" onclick="handlePreview('discovery')">Preview diff</button>
</div>`
      },
      {
        type: "approval_response",
        steps: [
          {
            type: "tool",
            name: "editMapping",
            params: '{\n  "dataPipelineId": "dp-4821",\n  "mappings": [{ "source": "amount_spent", "target": "Cost" }]\n}',
            result: '{ "status": "updated", "field": "amount_spent → Cost" }',
            status: "success"
          },
          {
            type: "tool",
            name: "validateMapping",
            params: '{ "dataPipelineId": "dp-4821" }',
            result: '{ "valid": true, "warnings": [] }',
            status: "success"
          },
          {
            type: "tool",
            name: "processDataPipeline",
            params: '{\n  "dataPipelineId": "dp-4821",\n  "mode": "backfill",\n  "dateRange": { "start": "2026-06-22", "end": "2026-06-28" }\n}',
            result: '{ "runId": "r-992", "status": "running", "estimatedRows": 86800 }',
            status: "success"
          }
        ],
        finalResponse: `<div class="status-card success">
  <div class="status-card-title">✓ Fix Applied Successfully</div>
  <div class="status-card-body">
    • Remapped <code>spend</code> → <code>amount_spent</code><br>
    • Mapping validated — no warnings<br>
    • Backfill running for Jun 22–28 (est. ~86,800 rows)<br>
    • Run ID: <code>r-992</code> — ETA ~4 minutes
  </div>
</div>
<p>Spend data will be fully restored once the backfill completes. I'll monitor and confirm the numbers match expected range (~12K rows/day).</p>`
      }
    ]
  },

  connector: {
    title: "Set Up a New Connector — LinkedIn Ads",
    userMessage: "Connect our LinkedIn Ads account to the Acme workspace and start pulling daily.",
    tools: [
      "getAvailableConnectors", "getConnectorConfiguration", "getDataConnections",
      "createNamedCredential", "getAuthorizationUrl", "createDataConnection",
      "getConnectorObjects", "getConnectorFields", "createDataPipeline",
      "updateDataPipelineScheduler"
    ],
    steps: [
      {
        type: "thinking",
        content: "I need to: 1) Check if LinkedIn connector is available, 2) Set up OAuth authentication, 3) Create the data connection, 4) Build a pipeline with suggested mappings, 5) Configure daily scheduling."
      },
      {
        type: "tool",
        name: "getAvailableConnectors",
        params: '{}',
        result: '[\n  "facebook_ads", "google_ads", "linkedin_ads",\n  "dv360", "tiktok_ads", "twitter_ads",\n  "snapchat_ads", "pinterest_ads", "sftp"\n]',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataConnections",
        params: '{ "dataSpace": "Acme", "connector": "linkedin_ads" }',
        result: '{ "connections": [] }',
        status: "success"
      },
      {
        type: "tool",
        name: "getConnectorConfiguration",
        params: '{ "connectorName": "linkedin_ads" }',
        result: '{\n  "authType": "oauth2",\n  "requiredScopes": ["r_ads_reporting", "r_organization_social"],\n  "objects": ["ad_analytics", "campaigns", "creatives"],\n  "supportedGranularity": ["daily", "monthly"],\n  "maxHistoricalDays": 365\n}',
        status: "success"
      },
      {
        type: "tool",
        name: "createNamedCredential",
        params: '{\n  "connectorName": "linkedin_ads",\n  "label": "Acme LinkedIn Ads",\n  "scopes": ["r_ads_reporting", "r_organization_social"]\n}',
        result: '{ "credentialId": "nc-lin-acme-01", "status": "pending_auth" }',
        status: "success"
      },
      {
        type: "tool",
        name: "getAuthorizationUrl",
        params: '{ "credentialId": "nc-lin-acme-01" }',
        result: '{ "url": "https://www.linkedin.com/oauth/v2/authorization?client_id=...&scope=r_ads_reporting", "expiresIn": 600 }',
        status: "success"
      },
      {
        type: "response",
        content: `<p>No LinkedIn connection exists in the Acme workspace yet. I've started the setup:</p>

<div class="status-card info">
  <div class="status-card-title">🔐 OAuth Authorization Required</div>
  <div class="status-card-body">Please authorize LinkedIn Ads access by clicking the link below. This grants read-only access to ad reporting data.<br><br>
  <a href="#" style="color: var(--accent-light)">→ Authorize LinkedIn Ads (expires in 10 min)</a></div>
</div>

<p>Once authorized, I'll automatically:</p>
<p>1. Create the data connection<br>
2. Set up field mappings (spend, impressions, clicks, conversions)<br>
3. Configure daily pulls at 06:00 UTC<br>
4. Trigger initial 90-day backfill</p>

<div class="action-buttons">
  <button class="action-btn primary" onclick="handleApproval('connector')">✓ I've authorized — continue</button>
</div>`
      },
      {
        type: "approval_response",
        steps: [
          {
            type: "tool",
            name: "createDataConnection",
            params: '{\n  "credentialId": "nc-lin-acme-01",\n  "dataSpace": "Acme",\n  "label": "LinkedIn Ads - Acme"\n}',
            result: '{ "dataConnectionId": "dc-lin-acme-01", "status": "authenticated" }',
            status: "success"
          },
          {
            type: "tool",
            name: "getConnectorObjects",
            params: '{ "dataConnectionName": "dc-lin-acme-01" }',
            result: '["ad_analytics", "campaigns", "creatives", "conversions"]',
            status: "success"
          },
          {
            type: "tool",
            name: "getConnectorFields",
            params: '{ "dataConnectionName": "dc-lin-acme-01", "connectorName": "linkedin_ads", "objectName": "ad_analytics" }',
            result: '[\n  { "name": "costInLocalCurrency", "type": "decimal" },\n  { "name": "impressions", "type": "integer" },\n  { "name": "clicks", "type": "integer" },\n  { "name": "externalWebsiteConversions", "type": "integer" },\n  { "name": "dateRange", "type": "date" },\n  { "name": "campaignId", "type": "string" }\n]',
            status: "success"
          },
          {
            type: "tool",
            name: "createDataPipeline",
            params: '{\n  "name": "Acme LinkedIn Ads — Daily",\n  "dataSpace": "Acme",\n  "dataConnectionId": "dc-lin-acme-01",\n  "object": "ad_analytics",\n  "mappings": [\n    { "source": "costInLocalCurrency", "target": "Spend" },\n    { "source": "impressions", "target": "Impressions" },\n    { "source": "clicks", "target": "Clicks" },\n    { "source": "externalWebsiteConversions", "target": "Conversions" }\n  ],\n  "granularity": "daily",\n  "historicalDays": 90\n}',
            result: '{ "dataPipelineId": "dp-4900", "status": "created" }',
            status: "success"
          },
          {
            type: "tool",
            name: "updateDataPipelineScheduler",
            params: '{ "dataPipelineId": "dp-4900", "schedule": "daily", "time": "06:00", "timezone": "UTC" }',
            result: '{ "scheduled": true, "nextRun": "2026-06-29T06:00:00Z" }',
            status: "success"
          },
          {
            type: "tool",
            name: "processDataPipeline",
            params: '{ "dataPipelineId": "dp-4900", "mode": "initial" }',
            result: '{ "runId": "r-001", "status": "running", "historicalDays": 90 }',
            status: "success"
          }
        ],
        finalResponse: `<div class="status-card success">
  <div class="status-card-title">✓ LinkedIn Ads Connected & Running</div>
  <div class="status-card-body">
    <strong>Connection:</strong> dc-lin-acme-01 (authenticated)<br>
    <strong>Pipeline:</strong> dp-4900 "Acme LinkedIn Ads — Daily"<br>
    <strong>Mappings:</strong><br>
    &nbsp;&nbsp;• costInLocalCurrency → Spend<br>
    &nbsp;&nbsp;• impressions → Impressions<br>
    &nbsp;&nbsp;• clicks → Clicks<br>
    &nbsp;&nbsp;• externalWebsiteConversions → Conversions<br>
    <strong>Schedule:</strong> Daily at 06:00 UTC<br>
    <strong>Initial pull:</strong> 90-day backfill running now (run r-001)
  </div>
</div>
<p>First data should land in ~8 minutes. After that, fresh data arrives every morning at 6 AM. You're all set! 🎉</p>`
      }
    ]
  },

  orphans: {
    title: "Find Orphan Connections",
    userMessage: "Are any connections authenticated but not feeding data?",
    tools: [
      "getAllDataConnections", "getDataPipelines", "getConnectorObjects",
      "getConnectorFields", "createDataPipeline", "autoMapDataPipeline"
    ],
    steps: [
      {
        type: "thinking",
        content: "I'll cross-reference all authenticated connections against active pipelines to find any that aren't wired up."
      },
      {
        type: "tool",
        name: "getAllDataConnections",
        params: '{}',
        result: '[\n  { "id": "dc-meta-acme-01", "connector": "facebook_ads", "workspace": "Acme", "status": "authenticated", "created": "2026-03-15" },\n  { "id": "dc-gads-acme-01", "connector": "google_ads", "workspace": "Acme", "status": "authenticated", "created": "2026-02-01" },\n  { "id": "dc-dv360-acme-01", "connector": "dv360", "workspace": "Acme", "status": "authenticated", "created": "2026-06-14" },\n  { "id": "dc-tiktok-globex-01", "connector": "tiktok_ads", "workspace": "Globex", "status": "authenticated", "created": "2026-06-10" },\n  { "id": "dc-gads-initech-01", "connector": "google_ads", "workspace": "Initech", "status": "authenticated", "created": "2026-04-20" },\n  { "id": "dc-lin-acme-01", "connector": "linkedin_ads", "workspace": "Acme", "status": "authenticated", "created": "2026-06-28" }\n]',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataPipelines",
        params: '{}',
        result: '[\n  { "id": "dp-4821", "dataConnection": "dc-meta-acme-01", "status": "active" },\n  { "id": "dp-4800", "dataConnection": "dc-gads-acme-01", "status": "active" },\n  { "id": "dp-4900", "dataConnection": "dc-lin-acme-01", "status": "active" }\n]',
        status: "success"
      },
      {
        type: "response",
        content: `<p>I cross-referenced all authenticated connections against active pipelines. Found <strong>3 orphans</strong>:</p>

<table class="data-table">
  <tr><th>Connection</th><th>Connector</th><th>Workspace</th><th>Issue</th></tr>
  <tr><td>dc-dv360-acme-01</td><td>DV360</td><td>Acme</td><td>⚠️ Authenticated 14 days ago, never wired to a pipeline</td></tr>
  <tr><td>dc-tiktok-globex-01</td><td>TikTok Ads</td><td>Globex</td><td>⚠️ Connected 18 days ago, no pipeline</td></tr>
  <tr><td>dc-gads-initech-01</td><td>Google Ads</td><td>Initech</td><td>⚠️ Auth valid, stream deleted, connection orphaned</td></tr>
</table>

<div class="status-card warning">
  <div class="status-card-title">Impact</div>
  <div class="status-card-body">These 3 connections cost setup effort and produce zero value. DV360 and TikTok are ready to go — I can suggest field mappings and create pipelines immediately. The Initech Google Ads connection is stale and can be retired.</div>
</div>

<p>What would you like me to do?</p>

<div class="action-buttons">
  <button class="action-btn primary" onclick="handleApproval('orphans')">Attach pipelines to DV360 & TikTok</button>
  <button class="action-btn secondary">Retire Initech orphan</button>
</div>`
      },
      {
        type: "approval_response",
        steps: [
          {
            type: "tool",
            name: "getConnectorObjects",
            params: '{ "dataConnectionName": "dc-dv360-acme-01" }',
            result: '["line_items", "campaigns", "insertion_orders"]',
            status: "success"
          },
          {
            type: "tool",
            name: "autoMapDataPipeline",
            params: '{ "dataConnectionId": "dc-dv360-acme-01", "object": "line_items" }',
            result: '{\n  "suggestedMappings": [\n    { "source": "revenue_advertiser_currency", "target": "Spend" },\n    { "source": "impressions", "target": "Impressions" },\n    { "source": "clicks", "target": "Clicks" },\n    { "source": "total_conversions", "target": "Conversions" }\n  ]\n}',
            status: "success"
          },
          {
            type: "tool",
            name: "createDataPipeline",
            params: '{\n  "name": "Acme DV360 — Daily",\n  "dataConnectionId": "dc-dv360-acme-01",\n  "object": "line_items",\n  "mappings": "auto-suggested"\n}',
            result: '{ "dataPipelineId": "dp-4901", "status": "created" }',
            status: "success"
          },
          {
            type: "tool",
            name: "createDataPipeline",
            params: '{\n  "name": "Globex TikTok Ads — Daily",\n  "dataConnectionId": "dc-tiktok-globex-01",\n  "object": "ad_analytics",\n  "mappings": "auto-suggested"\n}',
            result: '{ "dataPipelineId": "dp-4902", "status": "created" }',
            status: "success"
          }
        ],
        finalResponse: `<div class="status-card success">
  <div class="status-card-title">✓ Orphans Resolved</div>
  <div class="status-card-body">
    <strong>DV360 (Acme):</strong> Pipeline dp-4901 created with auto-mapped fields. First run triggered.<br>
    <strong>TikTok (Globex):</strong> Pipeline dp-4902 created with auto-mapped fields. First run triggered.<br><br>
    Both are now pulling data daily. The Initech orphan remains — let me know if you'd like me to retire it.
  </div>
</div>
<p>You just turned 2 idle connections into active data sources. 💪</p>`
      }
    ]
  },

  reprocess: {
    title: "Reprocess for Freshness",
    userMessage: "My conversion numbers look stale — refresh the last 7 days to reflect the latest attribution.",
    tools: [
      "getDataPipelines", "getDataPipelineProcessLog", "processDataPipeline"
    ],
    steps: [
      {
        type: "thinking",
        content: "Conversion data from Meta and Google often gets restated up to 28 days after the event due to attribution windows. Let me check which pipelines have conversion data and reprocess the recent window."
      },
      {
        type: "tool",
        name: "getDataPipelines",
        params: '{ "dataSpace": "Acme", "hasField": "conversions" }',
        result: '[\n  { "id": "dp-4821", "name": "Acme Meta Ads", "connector": "facebook_ads", "lastRun": "2026-06-28" },\n  { "id": "dp-4800", "name": "Acme Google Ads", "connector": "google_ads", "lastRun": "2026-06-28" }\n]',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataPipelineProcessLog",
        params: '{ "dataPipelineId": "dp-4821", "limit": 7 }',
        result: '[\n  { "date": "Jun 28", "rows": 12400, "reprocessed": false },\n  { "date": "Jun 27", "rows": 11900, "reprocessed": false },\n  { "date": "Jun 26", "rows": 12100, "reprocessed": false },\n  { "date": "Jun 25", "rows": 11800, "reprocessed": false },\n  { "date": "Jun 24", "rows": 12200, "reprocessed": false },\n  { "date": "Jun 23", "rows": 12050, "reprocessed": false },\n  { "date": "Jun 22", "rows": 11950, "reprocessed": false }\n]',
        status: "success"
      },
      {
        type: "response",
        content: `<p>Both Meta and Google Ads conversions were pulled at original run time — they haven't been restated. Both platforms restate conversions for up to 28 days as attribution windows close late, so Jun 21–28 are likely <strong>undercounted</strong>.</p>

<div class="status-card info">
  <div class="status-card-title">Why this matters</div>
  <div class="status-card-body">Data wasn't wrong — it was <em>early</em>. Platforms report preliminary conversion counts, then update them as they attribute delayed conversions. Without reprocessing, you're always looking at stale numbers for recent days.</div>
</div>

<p>I'll reprocess both pipelines for Jun 21–28 to pull the latest restated values.</p>

<div class="action-buttons">
  <button class="action-btn primary" onclick="handleApproval('reprocess')">✓ Reprocess both</button>
  <button class="action-btn secondary">Just Meta</button>
</div>`
      },
      {
        type: "approval_response",
        steps: [
          {
            type: "tool",
            name: "processDataPipeline",
            params: '{\n  "dataPipelineId": "dp-4821",\n  "mode": "reprocess",\n  "dateRange": { "start": "2026-06-21", "end": "2026-06-28" }\n}',
            result: '{ "runId": "r-1001", "status": "success", "rowsUpdated": 14200 }',
            status: "success"
          },
          {
            type: "tool",
            name: "processDataPipeline",
            params: '{\n  "dataPipelineId": "dp-4800",\n  "mode": "reprocess",\n  "dateRange": { "start": "2026-06-21", "end": "2026-06-28" }\n}',
            result: '{ "runId": "r-1002", "status": "success", "rowsUpdated": 18500 }',
            status: "success"
          }
        ],
        finalResponse: `<div class="status-card success">
  <div class="status-card-title">✓ Reprocessing Complete</div>
  <div class="status-card-body">
    <strong>Meta Ads:</strong> 14,200 rows updated<br>
    <strong>Google Ads:</strong> 18,500 rows updated<br><br>
    <strong>Result:</strong> Conversions Jun 21–28 rose <span style="color:var(--success)">+18%</span> vs. original pull (late attribution now captured). Spend unchanged, as expected.
  </div>
</div>
<p>Your conversion numbers now reflect the latest attribution data. For ongoing freshness, I can set up automatic 7-day lookback reprocessing on each run — want me to configure that?</p>`
      }
    ]
  },

  backfill: {
    title: "Backfill 90 Days of History",
    userMessage: "Backfill 90 days of Google Ads history for the new Initech workspace.",
    tools: [
      "getDataConnections", "getDataPipeline", "processDataPipeline",
      "getDataPipelineProcessLog"
    ],
    steps: [
      {
        type: "thinking",
        content: "The Initech workspace is new, so they need historical data to establish a baseline for reporting. I'll find the Google Ads connection and trigger a chunked backfill."
      },
      {
        type: "tool",
        name: "getDataConnections",
        params: '{ "dataSpace": "Initech", "connector": "google_ads" }',
        result: '{\n  "connections": [{\n    "id": "dc-gads-initech-01",\n    "status": "authenticated",\n    "created": "2026-06-20",\n    "pipelineId": "dp-4850"\n  }]\n}',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataPipeline",
        params: '{ "dataPipelineId": "dp-4850" }',
        result: '{\n  "id": "dp-4850",\n  "name": "Initech Google Ads",\n  "status": "active",\n  "mode": "forward_only",\n  "firstDataDate": "2026-06-20",\n  "connector": "google_ads"\n}',
        status: "success"
      },
      {
        type: "response",
        content: `<p>Found the Initech Google Ads pipeline (<code>dp-4850</code>). It's currently only forward-filling from Jun 20. I'll backfill 90 days (Mar 28 – Jun 20) chunked by week to stay under API quotas.</p>

<div class="status-card info">
  <div class="status-card-title">Backfill Plan</div>
  <div class="status-card-body">
    • <strong>Range:</strong> Mar 28 – Jun 20, 2026 (84 days)<br>
    • <strong>Strategy:</strong> 12 weekly chunks to respect rate limits<br>
    • <strong>Expected:</strong> ~150K rows based on account size<br>
    • <strong>ETA:</strong> ~6 minutes total
  </div>
</div>

<div class="action-buttons">
  <button class="action-btn primary" onclick="handleApproval('backfill')">✓ Start backfill</button>
</div>`
      },
      {
        type: "approval_response",
        steps: [
          {
            type: "tool",
            name: "processDataPipeline",
            params: '{\n  "dataPipelineId": "dp-4850",\n  "mode": "backfill",\n  "dateRange": { "start": "2026-03-28", "end": "2026-06-20" },\n  "chunkSize": "weekly"\n}',
            result: '{ "runId": "r-bf-01", "status": "running", "totalChunks": 12 }',
            status: "success"
          }
        ],
        finalResponse: `<div class="progress-bar"><div class="progress-fill" style="width: 100%"></div></div>

<div class="status-card success">
  <div class="status-card-title">✓ Backfill Complete — 12/12 chunks</div>
  <div class="status-card-body">
    <strong>Rows ingested:</strong> 156,240<br>
    <strong>Date range:</strong> Mar 28 – Jun 28 (full quarter)<br>
    <strong>Gaps:</strong> None detected<br>
    <strong>Consistency:</strong> Row counts stable week-over-week ✓
  </div>
</div>
<p>Initech now has a full quarter of Google Ads baseline for reporting — value at day zero instead of "come back in 30 days." 📊</p>`
      }
    ]
  },

  prevention: {
    title: "Proactive Break Prevention",
    userMessage: "What's going to break in the next 7 days?",
    tools: [
      "getAllDataConnections", "getDataPipelines", "getDataPipelinesStatusInfo",
      "getDataPipelineScheduler", "getDataPipelineProcessLog"
    ],
    steps: [
      {
        type: "thinking",
        content: "Let me scan all connections for expiring tokens, check pipeline health for quota warnings, and look for patterns that suggest upcoming failures."
      },
      {
        type: "tool",
        name: "getAllDataConnections",
        params: '{}',
        result: '[\n  { "id": "dc-dv360-acme-01", "connector": "dv360", "workspace": "Acme", "tokenExpires": "2026-07-03T00:00:00Z", "status": "authenticated" },\n  { "id": "dc-meta-acme-01", "connector": "facebook_ads", "workspace": "Acme", "tokenExpires": "2026-08-15T00:00:00Z", "status": "authenticated" },\n  { "id": "dc-meta-globex-01", "connector": "facebook_ads", "workspace": "Globex", "tokenExpires": "2026-08-01T00:00:00Z", "status": "authenticated" },\n  { "id": "dc-gads-acme-01", "connector": "google_ads", "workspace": "Acme", "tokenExpires": "never", "status": "authenticated" }\n]',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataPipelinesStatusInfo",
        params: '{ "pipelineIds": ["dp-4821", "dp-4800", "dp-4901", "dp-4830"] }',
        result: '[\n  { "id": "dp-4821", "name": "Acme Meta Ads", "apiQuotaUsed": "85%", "quotaLimit": "hourly", "status": "warning" },\n  { "id": "dp-4800", "name": "Acme Google Ads", "apiQuotaUsed": "42%", "status": "healthy" },\n  { "id": "dp-4901", "name": "Acme DV360", "apiQuotaUsed": "30%", "status": "healthy" },\n  { "id": "dp-4830", "name": "Globex Meta Ads", "apiQuotaUsed": "78%", "quotaLimit": "hourly", "status": "warning" }\n]',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataPipelineScheduler",
        params: '{ "dataPipelineId": "dp-4821" }',
        result: '{ "schedule": "daily", "time": "05:00", "timezone": "UTC", "concurrent_with": ["dp-4830"] }',
        status: "success"
      },
      {
        type: "response",
        content: `<p>I've scanned all connections and pipelines. Found <strong>2 risks</strong> for the next 7 days:</p>

<div class="status-card error">
  <div class="status-card-title">🔴 Critical — DV360 Token Expires Jul 3</div>
  <div class="status-card-body">Connection <code>dc-dv360-acme-01</code> OAuth token expires in <strong>5 days</strong>. If not refreshed, DV360 data stops flowing on Friday. Last time this expired, it took 2 days to notice.</div>
</div>

<div class="status-card warning">
  <div class="status-card-title">🟡 Warning — Meta API Quota at 85%</div>
  <div class="status-card-body">Pipeline <code>dp-4821</code> (Acme Meta) and <code>dp-4830</code> (Globex Meta) both run at 05:00 UTC and share the same hourly quota window. Combined usage: 85%. Adding one more connection or a backfill during that window will trigger throttling.</div>
</div>

<div class="status-card success">
  <div class="status-card-title">✅ All Clear</div>
  <div class="status-card-body">Google Ads (42% quota), LinkedIn Ads, TikTok — no issues projected.</div>
</div>

<p><strong>Recommended actions:</strong></p>
<p>1. Refresh DV360 token now (1-click re-auth)<br>
2. Stagger Meta schedules: move Globex to 07:00 UTC to split quota usage</p>

<div class="action-buttons">
  <button class="action-btn primary" onclick="handleApproval('prevention')">✓ Fix both</button>
  <button class="action-btn secondary">Just refresh token</button>
</div>`
      },
      {
        type: "approval_response",
        steps: [
          {
            type: "tool",
            name: "getAuthorizationUrl",
            params: '{ "credentialId": "dc-dv360-acme-01", "mode": "refresh" }',
            result: '{ "url": "https://accounts.google.com/o/oauth2/auth?...", "status": "refresh_initiated" }',
            status: "success"
          },
          {
            type: "tool",
            name: "updateDataPipelineScheduler",
            params: '{ "dataPipelineId": "dp-4830", "schedule": "daily", "time": "07:00", "timezone": "UTC" }',
            result: '{ "scheduled": true, "previousTime": "05:00", "newTime": "07:00" }',
            status: "success"
          }
        ],
        finalResponse: `<div class="status-card success">
  <div class="status-card-title">✓ Preventive Actions Applied</div>
  <div class="status-card-body">
    <strong>DV360 token:</strong> Refresh initiated — new token valid until Sep 2026<br>
    <strong>Meta schedule:</strong> Globex moved to 07:00 UTC (was 05:00). Projected quota usage drops from 85% → 52% per window.
  </div>
</div>
<p>Crisis averted. No breaks expected in the next 7 days. I recommend running this check weekly — want me to schedule a proactive scan every Monday? 🛡️</p>`
      }
    ]
  },

  duplicates: {
    title: "Duplicate Ingestion Detection",
    userMessage: "Does anything look double-counted?",
    tools: [
      "getDataPipelines", "getDataPipelineEntities", "getDataPipelineExtractAttributes",
      "getConnectorObjects", "getDataPipelineProcessLog", "updateDataPipelineExtractAttributes"
    ],
    steps: [
      {
        type: "thinking",
        content: "I need to check for overlapping data sources — multiple connections pulling the same accounts/campaigns, or pipelines with overlapping entity scopes that would cause double-counting in aggregate reports."
      },
      {
        type: "tool",
        name: "getDataPipelines",
        params: '{ "dataSpace": "Globex" }',
        result: '[\n  { "id": "dp-4830", "name": "Globex Meta Ads", "connector": "facebook_ads", "dataConnection": "dc-meta-globex-01" },\n  { "id": "dp-4835", "name": "Globex Google Ads — Brand", "connector": "google_ads", "dataConnection": "dc-gads-globex-01" },\n  { "id": "dp-4836", "name": "Globex Google Ads — Performance", "connector": "google_ads", "dataConnection": "dc-gads-globex-02" }\n]',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataPipelineEntities",
        params: '{ "dataPipelineId": "dp-4835" }',
        result: '{\n  "accounts": ["ads-acct-7741", "ads-acct-7742", "ads-acct-7743"],\n  "campaigns": ["Brand_US", "Brand_UK", "Brand_DE", "Perf_Retargeting", "Perf_Prospecting", "Perf_Shopping"]\n}',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataPipelineEntities",
        params: '{ "dataPipelineId": "dp-4836" }',
        result: '{\n  "accounts": ["ads-acct-7741", "ads-acct-7742", "ads-acct-7743"],\n  "campaigns": ["Perf_Retargeting", "Perf_Prospecting", "Perf_Shopping", "Perf_Display", "Perf_Video"]\n}',
        status: "success"
      },
      {
        type: "tool",
        name: "getDataPipelineProcessLog",
        params: '{ "dataPipelineId": "dp-4835", "limit": 5 }',
        result: '[\n  { "date": "Jun 28", "rows": 8400 },\n  { "date": "Jun 27", "rows": 8200 },\n  { "date": "Jun 26", "rows": 8350 },\n  { "date": "Jun 25", "rows": 8100 },\n  { "date": "Jun 24", "rows": 8300 }\n]',
        status: "success"
      },
      {
        type: "response",
        content: `<p>Found a <strong>double-counting issue</strong> in Globex:</p>

<div class="status-card error">
  <div class="status-card-title">⚠️ Overlapping Campaigns Detected</div>
  <div class="status-card-body">Two Google Ads pipelines cover the <strong>same accounts</strong> with <strong>overlapping campaign scopes</strong>:</div>
</div>

<table class="data-table">
  <tr><th>Pipeline</th><th>Accounts</th><th>Campaigns</th></tr>
  <tr><td>dp-4835 (Brand)</td><td>7741, 7742, 7743</td><td>Brand_US/UK/DE + <span style="color:var(--error)">Perf_Retarget/Prospect/Shopping</span></td></tr>
  <tr><td>dp-4836 (Performance)</td><td>7741, 7742, 7743</td><td><span style="color:var(--error)">Perf_Retarget/Prospect/Shopping</span> + Display/Video</td></tr>
</table>

<div class="status-card warning">
  <div class="status-card-title">Impact</div>
  <div class="status-card-body"><strong>3 campaigns</strong> (Retargeting, Prospecting, Shopping) are ingested by BOTH pipelines — spend is double-counted since Jun 10. Estimated over-report: <strong>~2x for those 6 campaigns.</strong></div>
</div>

<p><strong>Recommended fix:</strong> Scope each pipeline to distinct campaigns:</p>
<p>• dp-4835 → Brand campaigns only<br>
• dp-4836 → All Performance campaigns (keeps both connections, no overlap)</p>

<div class="action-buttons">
  <button class="action-btn primary" onclick="handleApproval('duplicates')">✓ Apply scoped fix</button>
  <button class="action-btn secondary">Retire dp-4835 instead</button>
</div>`
      },
      {
        type: "approval_response",
        steps: [
          {
            type: "tool",
            name: "updateDataPipelineExtractAttributes",
            params: '{\n  "dataPipelineId": "dp-4835",\n  "entities": {\n    "campaigns": ["Brand_US", "Brand_UK", "Brand_DE"]\n  }\n}',
            result: '{ "status": "updated", "removed": ["Perf_Retargeting", "Perf_Prospecting", "Perf_Shopping"] }',
            status: "success"
          },
          {
            type: "tool",
            name: "processDataPipeline",
            params: '{\n  "dataPipelineId": "dp-4835",\n  "mode": "reprocess",\n  "dateRange": { "start": "2026-06-10", "end": "2026-06-28" }\n}',
            result: '{ "runId": "r-dedup-01", "status": "success", "rowsRemoved": 15200 }',
            status: "success"
          }
        ],
        finalResponse: `<div class="status-card success">
  <div class="status-card-title">✓ Overlap Resolved</div>
  <div class="status-card-body">
    <strong>dp-4835 (Brand):</strong> Scoped to Brand campaigns only — 3 Perf campaigns removed<br>
    <strong>dp-4836 (Performance):</strong> Unchanged — already covers all Perf campaigns<br>
    <strong>Dedup:</strong> Reprocessed Jun 10–28, removed 15,200 duplicate rows<br><br>
    <strong>Net effect:</strong> Globex Google Ads spend corrected downward — no more double-counting.
  </div>
</div>
<p>Your reported numbers are now accurate. This is the kind of silent error that makes reported numbers look fine but wrong — glad we caught it. 🎯</p>`
      }
    ]
  }
};
