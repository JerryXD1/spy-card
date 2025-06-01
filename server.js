import express from 'express';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Load words
const words = JSON.parse(readFileSync(path.join(__dirname, 'words.json'), 'utf-8'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/categories', (req, res) => res.json(Object.keys(words)));

app.post('/create-lobby', (req, res) => {
  const roomId = generateId(6);
  lobbies[roomId] = {
    name: req.body.name,
    categories: req.body.categories,
    players: [],
    settings: {
      roundTime: 5,
      maxPlayers: 8
    }
  };
  res.json({ roomId });
});

app.post('/join-lobby', (req, res) => {
  const room = req.body.room;
  if (!lobbies[room]) return res.json({ success: false, message: 'Room not found' });
  if (lobbies[room].players.length >= lobbies[room].settings.maxPlayers) {
    return res.json({ success: false, message: 'Room full' });
  }
  res.json({ success: true });
});

// WebSocket
const lobbies = {};
const clients = {};
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const roomId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('room');
  if (!lobbies[roomId]) return ws.close();

  const clientId = generateId(8);
  clients[clientId] = { ws, roomId };

  ws.on('message', data => handleMessage(clientId, JSON.parse(data)));
  ws.on('close', () => handleDisconnect(clientId));
});

function handleMessage(clientId, data) {
  const { ws, roomId } = clients[clientId] || {};
  if (!ws) return;

  switch (data.type) {
    case 'identify':
      const player = {
        id: clientId,
        username: data.username,
        isHost: lobbies[roomId].players.length === 0,
        isReady: false
      };
      lobbies[roomId].players.push(player);
      ws.send(JSON.stringify({ type: 'role', isHost: player.isHost }));
      broadcast(roomId, { type: 'playerList', players: lobbies[roomId].players });
      break;

    case 'updateSettings':
      if (lobbies[roomId].players.find(p => p.id === clientId)?.isHost) {
        lobbies[roomId].settings = { ...lobbies[roomId].settings, ...data };
        broadcast(roomId, { type: 'settingsUpdate', settings: lobbies[roomId].settings });
      }
      break;

    case 'setReady':
      const playerToUpdate = lobbies[roomId].players.find(p => p.id === clientId);
      if (playerToUpdate) playerToUpdate.isReady = data.ready;
      broadcast(roomId, { type: 'playerList', players: lobbies[roomId].players });
      break;

    case 'startGame':
      if (lobbies[roomId].players.find(p => p.id === clientId)?.isHost) {
        broadcast(roomId, { type: 'gameStart' });
      }
      break;

    case 'chatMessage':
      broadcast(roomId, { type: 'chatMessage', sender: data.sender, message: data.message });
      break;
  }
}

function handleDisconnect(clientId) {
  const { roomId } = clients[clientId] || {};
  if (!roomId) return;

  lobbies[roomId].players = lobbies[roomId].players.filter(p => p.id !== clientId);
  delete clients[clientId];
  broadcast(roomId, { type: 'playerList', players: lobbies[roomId].players });
}

function broadcast(roomId, message) {
  Object.values(clients).forEach(client => {
    if (client.roomId === roomId) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function generateId(length) {
  return Math.random().toString(36).substring(2, 2+length).toUpperCase();
}