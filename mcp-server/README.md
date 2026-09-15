# Expense Tracker MCP Server

An MCP (Model Context Protocol) server that exposes your Expense Tracker data to AI assistants like **Claude Desktop** and **Cursor**.

## Tools Available

| Tool | Description |
|---|---|
| `add_expense` | Add an expense or income transaction |
| `get_expenses` | Retrieve transactions with optional filters |
| `delete_expense` | Delete a transaction by ID |
| `get_summary` | Spending summary, category breakdown, monthly trends |
| `get_dashboard_stats` | All dashboard KPIs + recent transactions |
| `export_to_excel` | Export all data to `~/Downloads/expenses-<date>.xlsx` |

## Data Storage

The MCP server reads and writes `~/.expense-tracker/data.json`. The web app syncs to this file automatically when running locally (`npm run dev`). Both stay in sync.

## Setup

### 1. Install dependencies and build

```bash
cd mcp-server
npm install
npm run build
```

### 2. Connect to Claude Desktop

Open `~/Library/Application Support/Claude/claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "expense-tracker": {
      "command": "node",
      "args": ["/Users/parthbansal/Desktop/expense-tracker/mcp-server/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. You'll see the 6 tools appear in the tools panel.

### 3. Connect to Cursor

Open Cursor Settings → MCP → Add Server:

```json
{
  "expense-tracker": {
    "command": "node",
    "args": ["/Users/parthbansal/Desktop/expense-tracker/mcp-server/dist/index.js"]
  }
}
```

Or add to `.cursor/mcp.json` in the project root:

```json
{
  "mcpServers": {
    "expense-tracker": {
      "command": "node",
      "args": ["./mcp-server/dist/index.js"]
    }
  }
}
```

## Example Usage in Claude

```
"Add a $45 expense for dinner at a restaurant in Food & Dining paid by Card"
"Show me all expenses from this month"
"What's my spending summary for 2025-07?"
"Export my expenses to Excel"
"How much did I spend on Transport this month?"
```

## Development

```bash
# Run directly with ts-node (no build needed)
npm run dev

# Rebuild after changes
npm run build
```

## Updating After Web App Changes

If you add new transactions in the web app, they sync to `~/.expense-tracker/data.json` automatically. The MCP server always reads the latest file on each tool call — no restart needed.
