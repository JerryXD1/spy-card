import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // ← Render verlangt das!

// Öffentlichen Ordner (Client-Dateien)
app.use(express.static(path.join(__dirname, 'public')));

// Wortbank laden
let words = [];
try {
  words = JSON.parse(fs.readFileSync(path.join(__dirname, 'words.json'), 'utf-8'));
} catch (err) {
  console.error('Fehler beim Laden von words.json:', err.message);
}

// Spiel-Datenbank (nur im RAM)
const games = {};

io.on('connection', (socket) => {
  console.log('👤 Neuer User verbunden:', socket.id);

  socket.on('createLobby', ({ roomName }) => {
    if (!roomName) return socket.emit('errorMessage', 'Room name required');
    if (games[roomName]) return socket.emit('errorMessage', 'Room name already taken');

    games[roomName] = {
      players: [],
      state: 'waiting',
      wordData: null,
    };
    socket.join(roomName);
    const player = { id: socket.id, name: `Player-${socket.id.slice(0, 4)}` };
    games[roomName].players.push(player);
    socket.emit('lobbyCreated', roomName);
    io.to(roomName).emit('updatePlayers', games[roomName].players);
  });

  socket.on('joinLobby', ({ roomName }) => {
    if (!roomName || !games[roomName]) return socket.emit('errorMessage', 'Room not found');
    socket.join(roomName);
    const player = { id: socket.id, name: `Player-${socket.id.slice(0, 4)}` };
    games[roomName].players.push(player);
    io.to(roomName).emit('updatePlayers', games[roomName].players);
    socket.emit('lobbyJoined', roomName);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    for (const roomName in games) {
      const game = games[roomName];
      const idx = game.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        game.players.splice(idx, 1);
        io.to(roomName).emit('updatePlayers', game.players);
        if (game.players.length === 0) {
          delete games[roomName];
          console.log(`🗑️ Lobby "${roomName}" gelöscht.`);
        }
        break;
      }
    }
  });
});

// Starte den Server auf 0.0.0.0 für Render
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server läuft auf http://${HOST}:${PORT}`);
});
