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
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// Wortbank laden
const words = JSON.parse(fs.readFileSync(path.join(__dirname, 'words.json'), 'utf-8'));

// Spiele-Daten
const games = {};

io.on('connection', (socket) => {
  console.log('Neuer User:', socket.id);

  socket.on('createLobby', ({ roomName }) => {
    if (!roomName) {
      socket.emit('errorMessage', 'Room name required');
      return;
    }
    if (games[roomName]) {
      socket.emit('errorMessage', 'Room name already taken');
      return;
    }
    games[roomName] = {
      players: [],
      state: 'waiting',
      wordData: null,
    };
    socket.join(roomName);
    games[roomName].players.push({ id: socket.id, name: `Player-${socket.id.slice(0,4)}` });
    socket.emit('lobbyCreated', roomName);
    io.to(roomName).emit('updatePlayers', games[roomName].players);
  });

  socket.on('joinLobby', ({ roomName }) => {
    if (!roomName || !games[roomName]) {
      socket.emit('errorMessage', 'Room not found');
      return;
    }
    socket.join(roomName);
    games[roomName].players.push({ id: socket.id, name: `Player-${socket.id.slice(0,4)}` });
    io.to(roomName).emit('updatePlayers', games[roomName].players);
    socket.emit('lobbyJoined', roomName);
  });

  // Hier kann weitere Spiellogik hinzugefügt werden

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomName in games) {
      const game = games[roomName];
      const idx = game.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        game.players.splice(idx, 1);
        io.to(roomName).emit('updatePlayers', game.players);
        if (game.players.length === 0) {
          delete games[roomName];
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
