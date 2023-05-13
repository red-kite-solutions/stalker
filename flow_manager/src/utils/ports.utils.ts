import { Port } from '../modules/database/reporting/port/port.model';

// This data is according to nmap nmap-services ports data file
export const top100TcpPorts = [
  80, 23, 443, 21, 22, 25, 3389, 110, 445, 139, 143, 53, 135, 3306, 8080, 1723,
  111, 995, 993, 5900, 1025, 587, 8888, 199, 1720, 465, 548, 113, 81, 6001,
  10000, 514, 5060, 179, 1026, 2000, 8443, 8000, 32768, 554, 26, 1433, 49152,
  2001, 515, 8008, 49154, 1027, 5666, 646, 3001, 5631, 631, 49153, 8081, 2049,
  88, 79, 5800, 106, 2121, 1110, 49155, 6000, 513, 990, 5357, 427, 49156, 543,
  544, 5101, 144, 7, 389, 8009, 3128, 444, 9999, 5009, 7070, 5190, 3000, 5432,
  1900, 3986, 13, 1029, 9, 5051, 6646, 49157, 1028, 873, 1755, 2717, 4899, 9100,
  119, 37,
];

/**
 * Returns the top n TCP ports that are open for a host's port list, sorted by popularity, according to nmap data.
 * @param ports An array of numbers containing the ports of a host.
 * @param top The desired amount of top ports, max 100.
 * @returns The list of the top port numbers, in order of popularity for the top 100 ones.
 */
export function getTopTcpPorts(ports: Port[], top: number = 100): Port[] {
  if (!ports || top < 1) return [];

  top = Math.floor(top);
  if (top > 100) top = 100;

  const topPorts: Port[] = [];

  for (let i = 0; topPorts.length < top && i < 100; ++i) {
    const index = ports.findIndex((port) => port.port === top100TcpPorts[i]);
    if (index === -1) continue;
    topPorts.push(ports[index]);
  }

  if (topPorts.length === top) return topPorts;

  for (let i = 0; topPorts.length < top && i < ports.length; ++i) {
    if (!topPorts.some((port) => port.port === ports[i].port)) {
      topPorts.push(ports[i]);
    }
  }

  return topPorts;
}
