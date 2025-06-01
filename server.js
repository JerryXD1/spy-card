import express from 'express';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Load words from JSON file
const words = JSON.parse(readFileSync(path.join(__dirname, 'words.json'), 'utf-8'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API endpoints
app.get('/categories', (req, res) => {
  res.json(Object.keys(words));
});

app.post('/create-lobby', (req, res) => {
  const { name, categories } = req.body;
  const roomId = generateRoomId();
  
  lobbies[roomId] = {
    name,
    categories,
    players: [],
    settings: {
      roundTime: 5,
      maxPlayers: 8
    }
  };
  
  res.json({ roomId });
});

app.post('/join-lobby', (req, res) => {
  const { room, username } = req.body;
  
  if (!lobbies[room]) {
    return res.json({ success: false, message: 'Room not found' });
  }
  
  if (lobbies[room].players.length >= lobbies[room].settings.maxPlayers) {
    return res.json({ success: false, message: 'Room is full' });
  }
  
  res.json({ success: true });
});

// Store lobbies in memory
const lobbies = {};
const clients = {};

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const roomId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('room');
  
  if (!roomId || !lobbies[roomId]) {
    ws.close();
    return;
  }
  
  const clientId = generateClientId();
  clients[clientId] = { ws, roomId };
  
  ws.on('message', (message) => {
    handleMessage(clientId, JSON.parse(message));
  });
  
  ws.on('close', () => {
    handleDisconnect(clientId);
  });
});

function handleMessage(clientId, data) {
  const client = clients[clientId];
  if (!client) return;
  
  const roomId = client.roomId;
  const lobby = lobbies[roomId];
  
  switch (data.type) {
    case 'identify':
      handleIdentify(clientId, data);
      break;
    case 'chatMessage':
      broadcastToRoom(roomId, {
        type: 'chatMessage',
        sender: data.sender,
        message: data.message
      });
      break;
    // Add other cases as needed
  }
}

function handleIdentify(clientId, data) {
  const client = clients[clientId];
  const lobby = lobbies[client.roomId];
  
  const player = {
    id: clientId,
    username: data.username,
    isHost: lobby.players.length === 0,
    isReady: false
  };
  
  lobby.players.push(player);
  
  client.ws.send(JSON.stringify({
    type: 'role',
    isHost: player.isHost
  }));
  
  broadcastPlayerList(client.roomId);
}

function broadcastPlayerList(roomId) {
  const lobby = lobbies[roomId];
  broadcastToRoom(roomId, {
    type: 'playerList',
    players: lobby.players
  });
}

function broadcastToRoom(roomId, message) {
  Object.entries(clients).forEach(([id, client]) => {
    if (client.roomId === roomId) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function handleDisconnect(clientId) {
  const client = clients[clientId];
  if (!client) return;
  
  const lobby = lobbies[client.roomId];
  if (lobby) {
    lobby.players = lobby.players.filter(p => p.id !== clientId);
    broadcastPlayerList(client.roomId);
  }
  
  delete clients[clientId];
}

// Helper functions
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateClientId() {
  return Math.random().toString(36).substring(2, 10);
}