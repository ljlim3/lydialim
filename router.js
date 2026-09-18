class Router {
  get projectId() {
    return this._projectId;
  }

  constructor(routes, outlet) {
    this.routes = routes;
    this.outlet = outlet;

    this._projectId = null;

    this.init();
  }

  init() {
    window.addEventListener('click', (e) => {
      // const link = e.target.closest('a');
      const link = e.composedPath().find(el => el?.tagName === 'A');
      if ( 
        link && 
        link.href && 
        link.target !== '_blank'  &&
        new URL(link.href).origin === window.location.origin
      ) {
        e.preventDefault(); // prevent the browser from doing a hard refresh and trying to fetch a new HTML file from the server
        const url = new URL(link.href);
        this.navigate(url.hash);
      }
    });

    window.addEventListener('popstate', () => {
      this.resolveRoute(); // on Back or Forward click, bypass full reloads and swap components to match the historical URL
    });

    this.resolveRoute(); // resolve the initial page load route
  }

  // update the address bar without reloading
  navigate(path) {
    const currentHashRoute = window.location.hash + window.location.search;
    // prevent unnecessary page re-render by verifying if the URL you're trying to navigate to is different from the page you're already on
    if (currentHashRoute !== path) {
      const nextUrl = new URL(path, window.location.origin);
      const sameRoute = nextUrl.hash === window.location.hash;

      history.pushState({}, '', path); // push a new history entry onto the browser's stack and update the text in the address bar without network requests or refreshes
 
      if (sameRoute && this.outlet.firstElementChild?.routeChanged) {
        this.outlet.firstElementChild.routeChanged(nextUrl);
        return;
      }
      
      this.resolveRoute(); // swap the visual component out
    }
  }

  resolveRoute() {
    const hash = window.location.hash;

    let currentPath = null;
    if (hash && !hash.startsWith('#/')) {
      currentPath = "/";
    } else {
      currentPath = hash.slice(1) || "/";
    }
    
    const route = this.routes.find(r => this.matchPath(r.path, currentPath)) || this.routes.find(r => r.path === '*');

    if (route) {
      const params = this.getParams(route.path, currentPath);
      const element = document.createElement(route.component);
      element.routeParams = params;
      
      this.outlet.innerHTML = '';
      this.outlet.appendChild(element);
    }
  }

  getCleanParts(pathString) {
    return pathString
      .split('?')[0]
      .replace(/^#/, '')      // 1. Remove a leading '#' if it exists
      .replace(/^\/+|\/+$/g, '') // 2. Trim slashes from the front and back ("//project/" -> "project")
      .split('/')             // 3. Break into clean array pieces
      .filter(part => part !== ''); // 4. Safeguard: Drop empty elements
  }

  // break up URL strings by their slashes to deal with dynamic variables
  matchPath(routePath, currentPath) {
    const routeParts = this.getCleanParts(routePath);
    const currentParts = this.getCleanParts(currentPath);

    const queryString = currentPath.includes('?') ? currentPath.split('?')[1] : window.location.search;
    const urlParams = new URLSearchParams(queryString);

    this._projectId = urlParams.get('project');

    if (routeParts.length !== currentParts.length) return false;

    return routeParts.every((part, i) => part === currentParts[i] || part.startsWith(':'));
  }

  getParams(routePath, currentPath) {
    const params = {};
    const routeParts = routePath.split('/');
    const currentParts = currentPath.split('/');

    routeParts.forEach((part, i) => {
      if (part.startsWith(':')) {
        const paramName = part.substring(1);
        params[paramName] = currentParts[i];
      }
    });
    return params;
  }
}

export const appRouter = {
  instance: null,
  init(routes, outlet) { this.instance = new Router(routes, outlet); },
  go(path) { if (this.instance) this.instance.navigate(path); },
  projectId() { if (this.instance) return this.instance.projectId }
}