import type {CatalogPlayer, Roster} from "../domain/game";

  const rows: [string, string, number, string, string, number[], string, string, string][] = [
    ['alex-rios','Alex Ríos',91,'DEL','ESPECIAL',[92,89,84,42,78],'special-tier','Colombia','FUTIN City'],
    ['leo-mena','Leo Mena',84,'DEL','ORO',[88,84,79,38,72],'gold-normal','Argentina','Norte Verde'],
    ['saul-cruz','Saúl Cruz',87,'DEL','ORO',[90,88,76,35,81],'gold-special','México','FUTIN City'],
    ['javier-torres','Javier Torres',79,'MC','PLATA',[73,68,78,70,75],'silver-normal','España','Atlético Central'],
    ['diego-vega','Diego Vega',86,'MCO','ORO',[82,84,89,50,71],'gold-special','Chile','FUTIN City'],
    ['marcos-pardo','Marcos Pardo',81,'MC','PLATA',[76,75,82,72,78],'silver-special','Colombia','Norte Verde'],
    ['andres-luna','Andrés Luna',76,'LI','PLATA',[81,48,70,74,72],'silver-normal','Uruguay','Atlético Central'],
    ['carlos-mora','Carlos Mora',82,'DFC','ORO',[69,42,62,84,86],'gold-normal','Costa Rica','FUTIN City'],
    ['fabio-rojas','Fabio Rojas',85,'DFC','ORO',[74,45,68,88,87],'gold-special','Perú','Norte Verde'],
    ['nico-silva','Nico Silva',78,'LD','PLATA',[83,50,73,76,74],'silver-normal','Brasil','Atlético Central'],
    ['esteban-gil','Esteban Gil',80,'POR','ORO',[78,72,75,81,79],'gold-normal','Colombia','FUTIN City'],
    ['mateo-rey','Mateo Rey',79,'MC','PLATA',[76,74,80,69,75],'silver-normal','Argentina','Norte Verde'],
    ['ivan-soto','Iván Soto',77,'DFC','PLATA',[70,43,63,79,82],'silver-normal','España','Atlético Central'],
    ['tomas-arias','Tomás Arias',80,'DEL','ORO',[85,81,74,39,76],'gold-special','Uruguay','FUTIN City'],
    ['bruno-paz','Bruno Paz',75,'POR','PLATA',[74,68,72,77,78],'silver-normal','Chile','Norte Verde'],
    ['lucas-diaz','Lucas Díaz',78,'MC','PLATA',[78,71,79,68,73],'silver-special','Colombia','Atlético Central'],
    ['enzo-cano','Enzo Cano',77,'MI','PLATA',[84,73,75,58,70],'silver-normal','México','FUTIN City'],
    ['ramiro-leon','Ramiro León',76,'DFC','PLATA',[68,40,62,78,84],'silver-normal','Perú','Norte Verde'],
    ['luis-prado','Luis Prado',62,'DEL','BRONCE',[68,61,56,31,58],'bronze-normal','Colombia','Atlético Central'],
    ['alan-costa','Alan Costa',64,'MC','BRONCE',[62,58,67,55,64],'bronze-normal','Brasil','Norte Verde'],
    ['simon-ruiz','Simón Ruiz',61,'DFC','BRONCE',[52,34,48,66,69],'bronze-normal','Chile','FUTIN City'],
    ['dario-perez','Darío Pérez',63,'POR','BRONCE',[59,56,58,65,67],'bronze-normal','España','Atlético Central'],
    ['juan-marin','Juan Marín',60,'LI','BRONCE',[67,33,51,59,58],'bronze-normal','Colombia','Norte Verde'],
    ['franco-vidal','Franco Vidal',64,'DEL','BRONCE',[70,65,54,28,59],'bronze-normal','Argentina','FUTIN City'],
    ['adrian-soler','Adrián Soler',92,'MC','ÉLITE',[90,88,94,82,87],'elite-special','España','Atlético Central'],
    ['gabriel-farias','Gabriel Farías',94,'DEL','ÉLITE',[96,94,88,44,86],'elite-special','Brasil','Norte Verde'],
    ['nicolas-valle','Nicolás Valle',93,'DFC','ÉLITE',[84,61,85,96,95],'elite-special','Uruguay','FUTIN City'],
    ['sebastian-roca','Sebastián Roca',95,'MCO','ESPECIAL',[94,93,96,65,87],'special-tier','Colombia','Atlético Central'],
  ];
  const catalog: CatalogPlayer[] = rows.map(([id,name,rating,position,rarity,stats,cardDesign,country,club]) => ({
    id, name, rating, position, rarity, stats, cardDesign, country, club,
    initials: name.split(' ').map(part => part[0]).slice(0,2).join(''),
  }));
  function initialRoster(): Roster {
    return { formation:'4-3-3', activeInventory:'club', players:catalog.slice(0,18).map((player,index) => ({
      ...structuredClone(player), zone:index < 11 ? 'starter' : 'bench', slot:index < 11 ? index : index - 11,
    })) };
  }
  export const playersApi = { catalog, initialRoster };

window.FutinPlayers = playersApi;
