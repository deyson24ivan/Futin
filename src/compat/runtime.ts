import {pages, type PageName} from './pages';
export type {PageName} from './pages';



export function currentPage(): PageName {
  const name = location.pathname.split('/').pop()?.replace(/\.html$/, '') || 'index';
  return pages.includes(name as PageName) ? name as PageName : 'index';
}

