import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.static(path.join(__dirname, 'public')));

// Wortbank
let words = [];
try { words = JSON.parse(fs.readFileSync(path.join(__dirname, 'words.json'))); }
catch { console.warn('⚠️  words.json fehlt oder invalide – benutze Fallback-Wort.'); words=[{word:'Test',category:'Test'}]; }

// Lobby-Cache
const lobbies = new Map(); // code → {hostId, players:[{id,name,ready}], settings}

io.on('connection', (sock) => {
  console.log('🔌', sock.id);

  sock.on('createLobby', ({ roomName, player }) => {
    if (!roomName) return sock.emit('errorMessage','Room name required');
    const code = roomName.toLowerCase();
    if (lobbies.has(code)) return sock.emit('errorMessage','Room exists');

    lobbies.set(code, {
      hostId: sock.id,
      players:[{ id:sock.id,name:player,ready:false }],
      settings:{ imposter:1,maxPlayers:8,categories:['People','Films','Games'] }
    });
    sock.join(code);
    sock.emit('lobbyCreated', code);
    io.to(code).emit('lobbyUpdate', lobbies.get(code));
  });

  sock.on('joinLobby', ({ roomName, player }) => {
    const lobby = lobbies.get(roomName?.toLowerCase());
    if (!lobby) return sock.emit('errorMessage','Room not found');
    if (lobby.players.length >= lobby.settings.maxPlayers) return sock.emit('errorMessage','Lobby full');

    lobby.players.push({ id:sock.id,name:player,ready:false });
    sock.join(roomName);
    io.to(roomName).emit('lobbyUpdate', lobby);
    sock.emit('lobbyJoined', roomName);
  });

  sock.on('toggleReady', (code) => {
    const lobby = lobbies.get(code);
    if (!lobby) return;
    const p = lobby.players.find(p=>p.id===sock.id);
    if (p) p.ready = !p.ready;
    io.to(code).emit('lobbyUpdate', lobby);
  });

  sock.on('updateSettings', ({ code, settings }) => {
    const lobby = lobbies.get(code);
    if (lobby && sock.id===lobby.hostId) {
      lobby.settings = settings;
      io.to(code).emit('lobbyUpdate', lobby);
    }
  });

  sock.on('startGame', (code) => {
    const lobby = lobbies.get(code);
    if (!lobby || sock.id!==lobby.hostId) return;

    // Wort & Imposter zuteilen
    const wordObj = words[Math.floor(Math.random()*words.length)];
    const impIdx  = Math.floor(Math.random()*lobby.players.length);
    lobby.players.forEach((p,i)=>{
      io.to(p.id).emit('card', i===impIdx ? {hint:wordObj.category} : {word:wordObj.word});
    });
    io.to(code).emit('gameStarted');
  });

  sock.on('chat', ({code,msg})=>{
    const p = lobbies.get(code)?.players.find(pl=>pl.id===sock.id);
    if (p) io.to(code).emit('chat', {sender:p.name,msg});
  });

  sock.on('disconnect', ()=>{
    for (const [code,lobby] of lobbies){
      lobby.players = lobby.players.filter(p=>p.id!==sock.id);
      if (!lobby.players.length) { lobbies.delete(code); }
      else io.to(code).emit('lobbyUpdate', lobby);
    }
  });
});

server.listen(PORT, HOST, ()=>console.log(`🚀 http://${HOST}:${PORT}`));
