import { Socket } from 'phoenix';

export function createSocket(): Socket {
  return new Socket('/socket');
}
