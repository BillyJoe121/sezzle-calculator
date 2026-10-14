import { http, HttpResponse } from 'msw'

// Loads the normative fixtures in docs/api/examples (see docs/api/README.md) and serves them with MSW,
// so the client is tested against the same cases as the backend contract test.

export interface ContractExample {
  /** File name without `.json`: the stable case id. */
  id: string
  name: string
  request: {
    method: string
    path: string
    headers: Record<string, string>
    body: unknown
  }
  response: {
    status: number
    contentType: string
    body: unknown
  }
}

const modules = import.meta.glob<Omit<ContractExample, 'id'>>('../../../docs/api/examples/*.json', {
  eager: true,
  import: 'default',
})

export const contractExamples: ContractExample[] = Object.entries(modules).map(([path, example]) => ({
  ...example,
  id: path.slice(path.lastIndexOf('/') + 1, -'.json'.length),
}))

/**
 * Cases the browser client can produce: a JSON object POSTed to /api/v1/calculations as application/json.
 * Skipped by design: string bodies (malformed-json), other content types (unsupported-media-type), bodies with
 * fields the client never sends (unknown-field) and healthz.
 */
export const clientExamples = contractExamples.filter(
  (example) =>
    example.request.method === 'POST' &&
    example.request.path === '/api/v1/calculations' &&
    example.request.headers['Content-Type'] === 'application/json' &&
    typeof example.request.body === 'object' &&
    example.request.body !== null &&
    Object.keys(example.request.body).join() === 'operation,operands',
)

export function contractExample(id: string): ContractExample {
  const example = contractExamples.find((candidate) => candidate.id === id)
  if (!example) throw new Error(`Unknown contract example: ${id}`)
  return example
}

export function contractResponse(example: ContractExample): HttpResponse<string> {
  return new HttpResponse(JSON.stringify(example.response.body), {
    status: example.response.status,
    headers: { 'Content-Type': example.response.contentType },
  })
}

// Bodies are compared as canonical JSON: fixture and client both use the key order operation, operands.
export const contractHandler = http.post('/api/v1/calculations', async ({ request }) => {
  const body = JSON.stringify(await request.json())
  const example = clientExamples.find((candidate) => JSON.stringify(candidate.request.body) === body)
  if (!example) throw new Error(`No contract example matches the request body ${body}`)
  return contractResponse(example)
})
