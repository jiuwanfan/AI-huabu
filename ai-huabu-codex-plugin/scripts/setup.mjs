#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const marketplaceRoot = path.dirname(pluginRoot)
const pnpmVersion = '10.13.1'
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'

function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`)
  execFileSync(command, args, {
    cwd: pluginRoot,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32'
  })
}

function ensureNodeVersion() {
  const major = Number(process.versions.node.split('.')[0])
  if (major < 20) {
    throw new Error(`AI Huabu requires Node.js 20 or newer. Current: ${process.version}`)
  }
}

ensureNodeVersion()
run(npxCommand, ['--yes', `pnpm@${pnpmVersion}`, 'install'])
run(npxCommand, [
  '--yes',
  `pnpm@${pnpmVersion}`,
  '-r',
  '--filter',
  '@ai-huabu/shared',
  '--filter',
  '@ai-huabu/canvas-app',
  '--filter',
  '@ai-huabu/mcp-server',
  'build'
])

const mcpServer = path.join(pluginRoot, 'packages/mcp-server/dist/index.js')
const canvasServer = path.join(pluginRoot, 'packages/canvas-app/dist/server/server.js')
if (!existsSync(mcpServer) || !existsSync(canvasServer)) {
  throw new Error('Build finished but required output files were not found.')
}

console.log(`
AI Huabu setup complete.

Plugin path:
${pluginRoot}

Install from this local repository root:
cd "${marketplaceRoot}"
codex plugin marketplace add .
codex plugin add ai-huabu-codex-plugin@ai-huabu

After installing the plugin and restarting Codex, try:
打开 AI Huabu，帮我做一张拉面广告。

Developer preview:
NODE_ENV=production node packages/canvas-app/dist/server/server.js --port 43218 --workspace-root "<your workspace>"
`)
