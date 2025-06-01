const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Load words from JSON file
const words = JSON.parse(fs.readFileSync('words.json', 'utf-8'));

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// API endpoints
app.get('/categories', (req, res) => {
    res.json(Object.keys(words));
});

app.post('/create-lobby', (req, res) => {
    const { name, categories } = req.body;
    const roomId = generateRoomId();
    
    // In a real app, you'd store this in a database
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

// Store lobbies in memory (in production, use a database)
const lobbies = {};
const clients = {};

// Create HTTP server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const roomId = new URLSearchParams(req.url.split('?')[1]).get('room');
    
    if (!roomId || !lobbies[roomId]) {
        ws.close();
        return;
    }
    
    // Add to clients
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
            // Handle player identification
            break;
        case 'chatMessage':
            // Broadcast chat message
            break;
        case 'setReady':
            // Update player ready status
            break;
        case 'startGame':
            // Start the game
            break;
        case 'requestVote':
            // Initiate voting
            break;
        case 'submitVote':
            // Handle vote submission
            break;
        case 'submitGuess':
            // Handle imposter's guess
            break;
    }
}

// Helper functions
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateClientId() {
    return Math.random().toString(36).substring(2, 10);
}