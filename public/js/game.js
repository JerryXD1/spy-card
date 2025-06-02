let socket;
let isImposter = false;
let currentWord = '';
let voteInProgress = false;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  const username = localStorage.getItem('username');

  if (!roomId) {
    window.location.href = '/';
    return;
  }

  // Connect to WebSocket
  socket = new WebSocket(`ws://${window.location.host}/ws?room=${roomId}`);

  // UI Event Listeners
  document.getElementById('initiateVote').addEventListener('click', () => {
    socket.send(JSON.stringify({ type: 'requestVote' }));
  });

  document.getElementById('guessWord').addEventListener('click', () => {
    const guess = prompt('What do you think the word is?');
    if (guess) {
      socket.send(JSON.stringify({ type: 'submitGuess', guess }));
    }
  });

  // Game chat functionality
  const gameChatInput = document.getElementById('gameChatInput');
  const sendGameMessageBtn = document.getElementById('sendGameMessage');

  sendGameMessageBtn.addEventListener('click', sendGameChatMessage);
  gameChatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendGameChatMessage();
  });

  function sendGameChatMessage() {
    const message = gameChatInput.value.trim();
    if (message) {
      socket.send(JSON.stringify({
        type: 'gameChatMessage',
        message: message
      }));
      gameChatInput.value = '';
    }
  }

  // WebSocket Event Handlers
  socket.onopen = () => {
    socket.send(JSON.stringify({ 
      type: 'identify', 
      username: username 
    }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case 'gameState':
        updateGameState(data);
        break;
      case 'roleAssignment':
        isImposter = data.isImposter;
        currentWord = data.word || '';
        updateUIForRole();
        break;
      case 'chatMessage':
        addChatMessage(data.sender, data.message);
        break;
      case 'voteStarted':
        startVote(data.players);
        break;
      case 'voteResult':
        showVoteResult(data.votedPlayer, data.isImposter);
        break;
      case 'gameOver':
        showGameResult(data.winner, data.imposter);
        break;
    }
  };

  // Helper Functions
  function updateGameState(state) {
    document.getElementById('roundNumber').textContent = state.round;
    document.getElementById('timeLeft').textContent = formatTime(state.timeLeft);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updateUIForRole() {
    document.getElementById('playerRole').textContent = 
      isImposter ? 'Imposter (You don\'t know the word)' : 'Regular Player';
    
    if (isImposter) {
      document.getElementById('imposterControls').style.display = 'block';
      document.querySelectorAll('.imposter-only').forEach(el => el.style.display = 'block');
    } else {
      document.getElementById('imposterControls').style.display = 'none';
      document.querySelectorAll('.imposter-only').forEach(el => el.style.display = 'none');
    }
  }

  function addChatMessage(sender, message) {
    const chat = document.getElementById('gameChatMessages');
    const msg = document.createElement('div');
    msg.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  function startVote(players) {
    voteInProgress = true;
    const voteModal = document.getElementById('voteModal');
    const votePlayers = document.getElementById('votePlayers');
    votePlayers.innerHTML = '';
    
    players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = player.username;
      li.dataset.playerId = player.id;
      li.addEventListener('click', () => {
        document.querySelectorAll('#votePlayers li').forEach(item => {
          item.classList.remove('selected');
        });
        li.classList.add('selected');
      });
      votePlayers.appendChild(li);
    });
    
    voteModal.style.display = 'block';
  }

  function showVoteResult(votedPlayer, isImposter) {
    const gameResult = document.getElementById('gameResult');
    gameResult.innerHTML = `
      <h3>Voting Results</h3>
      <p>${votedPlayer} was voted out.</p>
      <p>They were ${isImposter ? 'the IMPOSTER!' : 'NOT the imposter.'}</p>
    `;
    gameResult.style.display = 'block';
  }

  function showGameResult(winner, imposter) {
    const gameResult = document.getElementById('gameResult');
    gameResult.innerHTML = `
      <h2>Game Over</h2>
      <p>The ${winner} win!</p>
      <p>The imposter was ${imposter}.</p>
      <p>The word was: ${currentWord}</p>
      <button id="returnToLobby">Return to Lobby</button>
    `;
    gameResult.style.display = 'block';
    
    document.getElementById('returnToLobby').addEventListener('click', () => {
      window.location.href = `/lobby.html?room=${roomId}`;
    });
  }
});