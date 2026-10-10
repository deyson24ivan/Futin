import controllers from './controllers.json';

export type PageName = keyof typeof controllers;

export function currentPage(): PageName {
  const name = location.pathname.split('/').pop()?.replace(/\.html$/, '') || 'index';
  return name in controllers ? name as PageName : 'index';
}

