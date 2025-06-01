document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    if (!roomId) {
        window.location.href = '/';
        return;
    }
    
    // Connect to WebSocket
    const socket = new WebSocket(`ws://${window.location.host}/ws?room=${roomId}`);
    
    // Get player role (host or guest)
    let isHost = false;
    
    socket.onopen = () => {
        console.log('Connected to WebSocket');
        
        // Check if we're the host
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            socket.send(JSON.stringify({
                type: 'identify',
                username: storedUsername,
                room: roomId
            }));
        }
    };
    
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'playerList':
                updatePlayerList(data.players);
                break;
            case 'role':
                isHost = data.isHost;
                updateUIForRole(isHost);
                break;
            case 'gameStart':
                window.location.href = `/game.html?room=${roomId}`;
                break;
            case 'chatMessage':
                addChatMessage(data.sender, data.message);
                break;
        }
    };
    
    socket.onclose = () => {
        console.log('Disconnected from WebSocket');
    };
    
    // Update player list
    function updatePlayerList(players) {
        const playerList = document.getElementById('players');
        const playerCount = document.getElementById('playerCount');
        
        playerList.innerHTML = '';
        playerCount.textContent = players.length;
        
        players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.username;
            if (player.isReady) {
                li.textContent += ' ✓';
            }
            
            if (isHost) {
                li.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    showPlayerContextMenu(e, player);
                });
            }
            
            playerList.appendChild(li);
        });
    }
    
    // Show context menu for host
    function showPlayerContextMenu(event, player) {
        // Implement context menu for kick/promote
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <ul>
                <li class="promote">Promote to Host</li>
                <li class="kick">Kick Player</li>
            </ul>
        `;
        
        menu.style.position = 'absolute';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        menu.style.backgroundColor = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.zIndex = '1000';
        
        document.body.appendChild(menu);
        
        // Handle menu clicks
        menu.querySelector('.promote').addEventListener('click', () => {
            socket.send(JSON.stringify({
                type: 'promote',
                playerId: player.id
            }));
            document.body.removeChild(menu);
        });
        
        menu.querySelector('.kick').addEventListener('click', () => {
            socket.send(JSON.stringify({
                type: 'kick',
                playerId: player.id
            }));
            document.body.removeChild(menu);
        });
        
        // Close menu when clicking elsewhere
        window.addEventListener('click', () => {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
        }, { once: true });
    }
    
    // Update UI based on role
    function updateUIForRole(host) {
        if (host) {
            document.querySelectorAll('.host-only').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.player-only').forEach(el => el.style.display = 'none');
        } else {
            document.querySelectorAll('.host-only').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.player-only').forEach(el => el.style.display = 'block');
        }
    }
    
    // Chat functionality
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    
    function addChatMessage(sender, message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    sendMessageBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    function sendChatMessage() {
        const message = chatInput.value.trim();
        if (message) {
            socket.send(JSON.stringify({
                type: 'chatMessage',
                message: message
            }));
            chatInput.value = '';
        }
    }
    
    // Ready/Start game buttons
    const readyButton = document.getElementById('readyButton');
    const startGameButton = document.getElementById('startGame');
    
    if (readyButton) {
        readyButton.addEventListener('click', () => {
            const isReady = readyButton.textContent.includes('Ready');
            readyButton.textContent = isReady ? 'Not Ready' : 'Ready';
            socket.send(JSON.stringify({
                type: 'setReady',
                ready: !isReady
            }));
        });
    }
    
    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            socket.send(JSON.stringify({
                type: 'startGame'
            }));
        });
    }
    
    // Settings modal
    const settingsModal = document.getElementById('settingsModal');
    const gameSettingsBtn = document.getElementById('gameSettings');
    const saveSettingsBtn = document.getElementById('saveSettings');
    
    if (gameSettingsBtn) {
        gameSettingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'block';
        });
    }
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const roundTime = document.getElementById('roundTime').value;
            const maxPlayers = document.getElementById('maxPlayers').value;
            
            socket.send(JSON.stringify({
                type: 'updateSettings',
                roundTime: roundTime,
                maxPlayers: maxPlayers
            }));
            
            settingsModal.style.display = 'none';
        });
    }
});