import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from '../src/routeTree.gen'

export function createRouter() {
  return createTanStackRouter({ routeTree })
}
