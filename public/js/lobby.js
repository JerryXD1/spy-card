let socket;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room') || generateRoomId();
  const isHost = params.has('host');
  const username = localStorage.getItem('username');

  socket = new WebSocket(`ws://${window.location.host}/ws?room=${roomId}`);

  if (isHost) {
    document.getElementById('hostControls').style.display = 'block';
    document.getElementById('readyButton').style.display = 'none';
  } else {
    document.getElementById('hostControls').style.display = 'none';
    document.getElementById('readyButton').style.display = 'block';
  }

  document.getElementById('startGame').addEventListener('click', () => {
    socket.send(JSON.stringify({ type: 'startGame' }));
  });

  document.getElementById('readyButton').addEventListener('click', () => {
    const button = document.getElementById('readyButton');
    const isReady = button.textContent.includes('✓');
    button.textContent = isReady ? 'Ready Up' : '✓ Ready';
    socket.send(JSON.stringify({ type: 'setReady', ready: !isReady }));
  });

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
    }
  };
});

function updatePlayerList(players) {
  const list = document.getElementById('players');
  list.innerHTML = '';
  players.forEach(player => {
    const li = document.createElement('li');
    li.textContent = `${player.username}${player.isReady ? ' ✓' : ''}`;
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

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}