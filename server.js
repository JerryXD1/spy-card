const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = new Map(); // Map für username + ws

wss.on('connection', ws => {
  console.log('Neuer Client verbunden');

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      // Beispiel: Nachricht ist { type: "join", username: "Jerry", room: "room1" }
      if (data.type === 'join') {
        clients.set(ws, { username: data.username, room: data.room, ready: false, isHost: false });
        console.log(`${data.username} ist dem Raum ${data.room} beigetreten`);
        broadcastPlayerList(data.room);
      }
      // Weitere Nachrichten (ready, chat, kick, promote etc.) können hier ergänzt werden

      // Beispiel Chat Broadcast an alle im Raum
      if (data.type === 'chat') {
        broadcastToRoom(data.room, JSON.stringify({ type: 'chat', from: data.from, message: data.message }));
      }

      // Broadcast an alle
      // wss.clients.forEach(client => {
      //   if (client.readyState === WebSocket.OPEN) client.send(message);
      // });
    } catch(e) {
      console.log('Fehler beim Parsen:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client getrennt');
    const client = clients.get(ws);
    if (client) {
      clients.delete(ws);
      broadcastPlayerList(client.room);
    }
  });
});

function broadcastToRoom(room, message) {
  for (const [client, info] of clients.entries()) {
    if (info.room === room && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastPlayerList(room) {
  const players = [];
  for (const [client, info] of clients.entries()) {
    if (info.room === room) {
      players.push({ username: info.username, ready: info.ready, isHost: info.isHost });
    }
  }
  broadcastToRoom(room, JSON.stringify({ type: 'playerList', players }));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
