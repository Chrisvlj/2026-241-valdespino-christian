import { Route as rootRoute } from '../app/routes/__root'
import { Route as indexRoute } from '../app/routes/index'

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
    }
  }
}

export interface FileRoutesByFullPath {
  '/': typeof indexRoute
}

export interface FileRoutesByTo {
  '/': typeof indexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof indexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/'
  fileRoutesByTo: FileRoutesByTo
  to: '/'
  id: '__root__' | '/'
  fileRoutesById: FileRoutesById
}

export type RootRouteChildren = {
  indexRoute: typeof indexRoute
}

const rootRouteChildren: RootRouteChildren = {
  indexRoute: indexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
