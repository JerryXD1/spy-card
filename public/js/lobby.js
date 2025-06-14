let socket;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room') || generateRoomId();
  const isHost = params.has('host');
  const username = localStorage.getItem('username');

  // Initialize WebSocket connection
  socket = new WebSocket(`ws://${window.location.host}/ws?room=${roomId}`);

  // Set up UI based on role
  if (isHost) {
    document.getElementById('hostControls').style.display = 'block';
    document.getElementById('readyButton').style.display = 'none';
  } else {
    document.getElementById('hostControls').style.display = 'none';
    document.getElementById('readyButton').style.display = 'block';
  }

  // Event listeners
  document.getElementById('startGame').addEventListener('click', () => {
    socket.send(JSON.stringify({ type: 'startGame' }));
  });

  document.getElementById('readyButton').addEventListener('click', () => {
    const button = document.getElementById('readyButton');
    const isReady = button.textContent.includes('✓');
    button.textContent = isReady ? 'Ready Up' : '✓ Ready';
    socket.send(JSON.stringify({ type: 'setReady', ready: !isReady }));
  });

  // WebSocket event handlers
  socket.onopen = () => {
    socket.send(JSON.stringify({ 
      type: 'identify', 
      username: username 
    }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case 'playerList':
        updatePlayerList(data.players);
        break;
      case 'gameStart':
        window.location.href = `/game.html?room=${roomId}`;
        break;
      case 'chatMessage':
        addChatMessage(data.sender, data.message);
        break;
      case 'roleAssignment':
        updateUIForRole(data.isHost);
        break;
    }
  };

  // Chat functionality
  const chatInput = document.getElementById('chatInput');
  const sendMessageBtn = document.getElementById('sendMessage');

  sendMessageBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
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

// Helper functions
function updatePlayerList(players) {
  const list = document.getElementById('players');
  list.innerHTML = '';
  players.forEach(player => {
    const li = document.createElement('li');
    li.textContent = `${player.username}${player.isReady ? ' ✓' : ''}`;
    if (player.isHost) li.textContent += ' (Host)';
    if (player.isImposter) li.textContent += ' [Imposter]';
    list.appendChild(li);
  });
  document.getElementById('playerCount').textContent = players.length;
}

function addChatMessage(sender, message) {
  const chat = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function updateUIForRole(isHost) {
  if (isHost) {
    document.querySelectorAll('.host-only').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.player-only').forEach(el => el.style.display = 'none');
  } else {
    document.querySelectorAll('.host-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.player-only').forEach(el => el.style.display = 'block');
  }
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}