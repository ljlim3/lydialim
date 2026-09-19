import { appRouter } from './router.js';
import './components/app-home/app-home.js';
import './components/project/project.js';

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
});
