import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import os from 'os'
import type { Plugin } from 'vite'

function mcpSyncPlugin(): Plugin {
  const dataDir  = path.join(os.homedir(), '.expense-tracker')
  const dataFile = path.join(dataDir, 'data.json')

  return {
    name: 'mcp-sync',
    configureServer(server) {
      server.middlewares.use('/api/sync', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            fs.mkdirSync(dataDir, { recursive: true })
            fs.writeFileSync(dataFile, body, 'utf-8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end('{"ok":true}')
          } catch {
            res.statusCode = 500; res.end('{"error":"write failed"}')
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), mcpSyncPlugin()],
})
