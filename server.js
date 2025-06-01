import express from 'express';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const words = JSON.parse(readFileSync(path.join(__dirname, 'words.json'), 'utf-8'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/categories', (req, res) => res.json(Object.keys(words)));

app.post('/create-lobby', (req, res) => {
  const roomId = generateId(6);
  lobbies[roomId] = {
    name: req.body.name,
    categories: req.body.categories,
    players: [],
    settings: { roundTime: 5, maxPlayers: 8 },
    gameState: null
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
  const lobby = lobbies[roomId];
  if (!ws || !lobby) return;

  switch (data.type) {
    case 'identify':
      handleIdentify(clientId, roomId, data.username);
      break;
    case 'setReady':
      handleSetReady(clientId, roomId, data.ready);
      break;
    case 'startGame':
      handleStartGame(clientId, roomId);
      break;
    case 'chatMessage':
      broadcast(roomId, { type: 'chatMessage', sender: data.sender, message: data.message });
      break;
    case 'submitVote':
      handleVote(roomId, data.playerId);
      break;
    case 'submitGuess':
      handleGuess(roomId, clientId, data.guess);
      break;
  }
}

function handleIdentify(clientId, roomId, username) {
  const lobby = lobbies[roomId];
  const isHost = lobby.players.length === 0;
  const player = { id: clientId, username, isHost, isReady: false, isImposter: false };
  lobby.players.push(player);
  
  clients[clientId].ws.send(JSON.stringify({ 
    type: 'roleAssignment', 
    isHost, 
    isImposter: false 
  }));
  
  broadcast(roomId, { type: 'playerList', players: lobby.players });
}

function handleStartGame(clientId, roomId) {
  const lobby = lobbies[roomId];
  const host = lobby.players.find(p => p.id === clientId);
  if (!host?.isHost) return;

  // Select imposter
  const imposterIndex = Math.floor(Math.random() * lobby.players.length);
  lobby.players[imposterIndex].isImposter = true;
  
  // Select word
  const categories = lobby.categories || Object.keys(words);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const wordList = words[category];
  const word = wordList[Math.floor(Math.random() * wordList.length)];
  
  lobby.gameState = { word, imposterId: lobby.players[imposterIndex].id };
  
  // Send roles and start game
  lobby.players.forEach(player => {
    clients[player.id].ws.send(JSON.stringify({
      type: 'roleAssignment',
      isHost: player.isHost,
      isImposter: player.isImposter,
      word: player.isImposter ? null : word
    }));
  });
  
  broadcast(roomId, { type: 'gameStart' });
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