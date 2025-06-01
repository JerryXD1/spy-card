let socket;
let isImposter = false;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  const username = localStorage.getItem('username');

  socket = new WebSocket(`ws://${window.location.host}/ws?room=${roomId}`);

  document.getElementById('initiateVote').addEventListener('click', () => {
    socket.send(JSON.stringify({ type: 'requestVote' }));
  });

  document.getElementById('guessWord').addEventListener('click', () => {
    const guess = prompt('What do you think the word is?');
    if (guess) {
      socket.send(JSON.stringify({ type: 'submitGuess', guess }));
    }
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
      case 'roleAssignment':
        isImposter = data.isImposter;
        document.getElementById('playerRole').textContent = isImposter ? 'Imposter' : 'Player';
        if (isImposter) {
          document.getElementById('imposterControls').style.display = 'block';
        }
        break;
      case 'chatMessage':
        addChatMessage(data.sender, data.message);
        break;
      case 'gameOver':
        alert(`Game over! ${data.winner} win!`);
        window.location.href = '/';
        break;
    }
  };
});

function addChatMessage(sender, message) {
  const chat = document.getElementById('gameChatMessages');
  const msg = document.createElement('div');
  msg.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}