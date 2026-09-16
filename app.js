import { appRouter } from './router.js';
import './components/app-home/app-home.js';
import './components/project/project.js';
// const routes = {
//   404: { title: 'Page Not Found', render: () => '<h1>Page Not Found</h1>' },
//   '/station': './components/app-home/app-home.js',
//   '/project': './components/project/project.html'
// };

const routes = [
  {
    path: '#/',
    component: 'app-home-component',
  },
  {
    path: '#/project',
    component: 'project-component',
  }
];


window.addEventListener('DOMContentLoaded', () => {
  const outlet = document.getElementById('app-outlet');
  appRouter.init(routes, outlet);
  console.log('app router initialized')
});

// export const handleRouting = async () => {
//   console.log('handleRouting()')
//   // const route = routes.find(r => r.path.test(window.location.href));
//   const route = routes.find(r => r.path === window.location.pathname);
//   console.log('pathname', window.location.pathname)

//   // load the file only if it hasn't been loaded yet
//   if (route.load) await route.load();

//   const el = document.createElement(route.component);
//   outlet.replaceChildren(el);
// }
// export const handleRouting = () => {
//   const pathname = window.location.pathname;
//   const componentName = routes[pathname] || routes['/'];
//   const el = document.createElement(componentName);
//   outlet.replaceChildren(el);
// }

// const handleLinkClick = (e) => {
//   const link = e.target.closest('a');
//   if (!link || link.origin !== window.location.origin) return;

//   const url = new URL(link.href);
//   if (url.pathname === window.location.pathname && url.search === window.location.search) return;

//   e.preventDefault();
//   history.pushState(null, '', link.href);
//   handleRouting();
// }

// const handleLinkClick = (e) => {
//   const link = e.composedPath().find(el => el.tagName === 'A');

//   if (link && link.origin === window.location.origin) {
//     e.preventDefault();
//     history.pushState(null, '', link.href);
//     handleRouting();
//   }
//   // console.log(link)
//   // console.log('click')
// }


// listen for history changes
// window.addEventListener('popstate', handleRouting);

// window.addEventListener('click', handleLinkClick);
// window.addEventListener('popstate', handleRouting)
// handleRouting();



// export const route = (event) => {
//   event = event || window.event;
//   event.preventDefault();
//   window.history.pushState({}, '', event.target.href);
//   handleRouting();
// }

// const handleLocation = async () => {
//   const path = window.location.path;
//   const route = routes[path] || routes[404];
//   const html = await fetch(route).then(data => data.text());
//   document.getElementById('app-outlet').innerHTML = html;
// }

// handles when users click the forward and backward browser buttons
// window.onpopstate = handleLocation;
// window.route = route;

// handleLocation();

// function router() {
//   const path = window.location.pathname;
//   const route = routes[path];

//   document.title = route.title;
//   const app = document.getElementById('app');
//   const content = document.createElement('div');
//   content.innerHTML = route.render();
//   app.replaceChildren(content);
// }

