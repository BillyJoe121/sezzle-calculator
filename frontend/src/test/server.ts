import { setupServer } from 'msw/node'
import { contractHandler } from './contractExamples'

/** MSW server answering POST /api/v1/calculations from docs/api/examples. Tests override it with server.use(). */
export const server = setupServer(contractHandler)
