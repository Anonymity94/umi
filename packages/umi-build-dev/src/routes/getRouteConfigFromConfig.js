import assert from 'assert';
import { join } from 'path';
import deepclone from 'lodash.clonedeep';
import winPath from '../winPath';

export default (routes, pagesPath = 'src/pages', parentRoutePath = '/') => {
  // deepclone 是为了避免 patch 多次
  const clonedRoutes = deepclone(routes);
  patchRoutes(clonedRoutes, pagesPath, parentRoutePath);
  return clonedRoutes;
};

function patchRoutes(routes, pagesPath, parentRoutePath) {
  assert(Array.isArray(routes), `routes should be Array, but got ${routes}`);
  routes.forEach(route => {
    patchRoute(route, pagesPath, parentRoutePath);
  });
}

function patchRoute(route, pagesPath, parentRoutePath) {
  // route.component start from pages
  if (route.component) {
    route.component = resolveComponent(pagesPath, route.component);
  }

  // path patch must be before bigfish patch
  if (route.path && route.path.charAt(0) !== '/') {
    route.path = join(parentRoutePath, route.path);
  }

  // Compatible with bigfish
  if (process.env.BIGFISH_COMPAT) {
    if (route.childRoutes) {
      route.routes = route.childRoutes;
      delete route.childRoutes;
    }
    if (route.indexRoute) {
      if (route.indexRoute.redirect) {
        if (route.indexRoute.component || route.routes) {
          if (!route.routes) {
            route.routes = [];
          }
          route.routes.unshift({
            path: route.path,
            redirect: route.indexRoute.redirect,
          });
        } else {
          route.redirect = route.indexRoute.redirect;
        }
      }
      if (route.indexRoute.component) {
        if (!route.routes) {
          route.routes = [];
        }
        route.routes.unshift({
          path: route.path,
          exact: true,
          component: route.indexRoute.component,
        });
      }
      delete route.indexRoute;
    }
  }

  if (route.redirect && route.redirect.charAt(0) !== '/') {
    route.redirect = join(parentRoutePath, route.redirect);
  }
  if (route.routes) {
    patchRoutes(route.routes, pagesPath, route.path);
  } else if (!('exact' in route)) {
    route.exact = true;
  }

  return route;
}

function resolveComponent(pagesPath, component) {
  const ret = winPath(join(pagesPath, component));
  if (ret.indexOf('./') !== 0) {
    return `./${ret}`;
  }
}
