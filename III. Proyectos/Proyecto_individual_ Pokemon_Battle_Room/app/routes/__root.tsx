import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div id="app" className="min-h-screen bg-gray-900 text-white">
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  ),
})
