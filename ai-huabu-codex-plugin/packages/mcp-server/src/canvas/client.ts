import type { CanvasStatePayload, SelectionSnapshot } from '@ai-huabu/shared'
import { startCanvasService, waitForHealth } from './process.js'
import { findPluginRoot } from '../utils/paths.js'

export type CanvasRuntime = {
  url: string
  canvasId: string
  storagePath: string
  port: number
}

let runtime: CanvasRuntime | undefined

type CanvasHealth = {
  ok: boolean
  product?: string
  appVersion?: string
  features?: string[]
  pluginRoot?: string
  canvasId?: string
  storagePath?: string
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!response.ok) {
    throw new Error(text || response.statusText)
  }
  return JSON.parse(text) as T
}

async function fetchJsonAt<T>(apiPath: string, base: string): Promise<T> {
  const response = await fetch(`${base}${apiPath}`)
  return parseJson<T>(response)
}

async function postJsonAt<T>(apiPath: string, body: unknown, base: string): Promise<T> {
  const response = await fetch(`${base}${apiPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return parseJson<T>(response)
}

async function waitForCompatibleCanvas(url: string, timeoutMs: number, expectedPluginRoot?: string) {
  await waitForHealth(url, timeoutMs)
  const health = await fetchJsonAt<CanvasHealth>('/api/health', url)
  if (health.product !== 'ai-huabu') {
    throw new Error(`Canvas service at ${url} is not AI Huabu.`)
  }
  if (!health.features?.includes('editRequestQueue')) {
    throw new Error(`Canvas service at ${url} is an older build without edit request queue support.`)
  }
  if (expectedPluginRoot && health.pluginRoot !== expectedPluginRoot) {
    throw new Error(`Canvas service at ${url} belongs to a different AI Huabu plugin build.`)
  }
  return health
}

export function getCanvasRuntime() {
  return runtime
}

export async function openCanvas(input: {
  workspaceRoot?: string
  canvasId?: string
  port?: number
}) {
  const workspaceRoot = input.workspaceRoot ?? process.cwd()
  const requestedPort = input.port ?? Number(process.env.AI_HUABU_PORT ?? 43218)
  const existingUrl = `http://127.0.0.1:${requestedPort}`
  const pluginRoot = findPluginRoot(import.meta.url)

  try {
    await waitForCompatibleCanvas(existingUrl, 600, pluginRoot)
    runtime = { url: existingUrl, port: requestedPort, canvasId: input.canvasId ?? '', storagePath: '' }
  } catch {
    const started = await startCanvasService({
      pluginRoot,
      workspaceRoot,
      canvasId: input.canvasId,
      requestedPort
    })
    runtime = { url: started.url, port: started.port, canvasId: input.canvasId ?? '', storagePath: '' }
  }

  const result = await postJsonAt<{
    product: 'ai-huabu'
    url: string
    canvasId: string
    storagePath: string
  }>('/api/canvas/open', { workspaceRoot, canvasId: input.canvasId }, runtime.url)

  if (result.product !== 'ai-huabu') {
    throw new Error(`Canvas service at ${runtime.url} returned the wrong product identity.`)
  }

  runtime = {
    url: result.url.replace(/\/$/, ''),
    canvasId: result.canvasId,
    storagePath: result.storagePath,
    port: Number(new URL(result.url).port)
  }
  return result
}

export async function ensureCanvas() {
  if (runtime) return runtime
  const port = Number(process.env.AI_HUABU_PORT ?? 43218)
  const url = process.env.AI_HUABU_URL?.replace(/\/$/, '') ?? `http://127.0.0.1:${port}`
  const pluginRoot = findPluginRoot(import.meta.url)
  try {
    await waitForCompatibleCanvas(url, 1_000, pluginRoot)
  } catch {
    await openCanvas({ workspaceRoot: process.cwd(), port })
    if (!runtime) throw new Error('Canvas runtime was not initialized.')
    return runtime
  }
  const state = await fetchJsonAt<CanvasStatePayload>('/api/canvas/state', url)
  runtime = {
    url,
    canvasId: state.canvasId,
    storagePath: state.storagePath,
    port
  }
  return runtime
}

export async function fetchJson<T>(apiPath: string, explicitUrl?: string): Promise<T> {
  const base = explicitUrl ?? (await ensureCanvas()).url
  const response = await fetch(`${base}${apiPath}`)
  return parseJson<T>(response)
}

export async function postJson<T>(apiPath: string, body: unknown): Promise<T> {
  const base = (await ensureCanvas()).url
  const response = await fetch(`${base}${apiPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return parseJson<T>(response)
}

export async function getCanvasState() {
  return fetchJson<CanvasStatePayload>('/api/canvas/state')
}

export async function getSelection() {
  return fetchJson<SelectionSnapshot>('/api/canvas/selection')
}
