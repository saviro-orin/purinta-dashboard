import type { ServerWebSocket } from 'bun';
import type { PurintaSnapshot, WebsocketMessage } from './types';

export interface WebSocketData {
  clientId: string;
}

const sockets = new Set<ServerWebSocket<WebSocketData>>();
let latest: PurintaSnapshot | null = null;

function send(socket: ServerWebSocket<WebSocketData>, message: WebsocketMessage) {
  socket.send(JSON.stringify(message));
}

export function registerSocket(socket: ServerWebSocket<WebSocketData>) {
  sockets.add(socket);
  if (latest) send(socket, { type: 'snapshot', payload: latest });
}

export function unregisterSocket(socket: ServerWebSocket<WebSocketData>) {
  sockets.delete(socket);
}

export function broadcastSnapshot(snapshot: PurintaSnapshot) {
  latest = snapshot;
  const message: WebsocketMessage = { type: 'snapshot', payload: snapshot };

  for (const socket of sockets) send(socket, message);
}

export function broadcastStatus(status: PurintaSnapshot['status'], message?: string) {
  const payload: WebsocketMessage = {
    type: 'status',
    payload: { status, message },
  };
  for (const socket of sockets) send(socket, payload);
}

export function primeSnapshot(snapshot: PurintaSnapshot) {
  latest = snapshot;
}
