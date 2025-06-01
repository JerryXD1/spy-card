document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    if (!roomId) {
        window.location.href = '/';
        return;
    }
    
    // Connect to WebSocket
    const socket = new WebSocket(`ws://${window.location.host}/ws?room=${roomId}`);
    
    let playerRole = 'regular'; // 'regular', 'imposter'
    let currentWord = '';
    let voteInProgress = false;
    
    socket.onopen = () => {
        console.log('Connected to WebSocket');
    };
    
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'gameState':
                updateGameState(data);
                break;
            case 'roleAssignment':
                playerRole = data.role;
                currentWord = data.word || '';
                updateUIForRole(playerRole);
                break;
            case 'chatMessage':
                addGameChatMessage(data.sender, data.message);
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
    
    // Update game state (timer, round, etc.)
    function updateGameState(state) {
        document.getElementById('roundNumber').textContent = state.round;
        document.getElementById('timeLeft').textContent = formatTime(state.timeLeft);
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Update UI based on role
    function updateUIForRole(role) {
        document.getElementById('playerRole').textContent = 
            role === 'imposter' ? 'Imposter (You don\'t know the word)' : 'Regular Player';
        
        if (role === 'imposter') {
            document.querySelectorAll('.imposter-only').forEach(el => el.style.display = 'block');
        } else {
            document.querySelectorAll('.imposter-only').forEach(el => el.style.display = 'none');
        }
    }
    
    // Game chat functionality
    const gameChatInput = document.getElementById('gameChatInput');
    const sendGameMessageBtn = document.getElementById('sendGameMessage');
    
    function addGameChatMessage(sender, message) {
        const chatMessages = document.getElementById('gameChatMessages');
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    sendGameMessageBtn.addEventListener('click', sendGameChatMessage);
    gameChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendGameChatMessage();
        }
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
    
    // Voting system
    const initiateVoteBtn = document.getElementById('initiateVote');
    const voteModal = document.getElementById('voteModal');
    const submitVoteBtn = document.getElementById('submitVote');
    
    initiateVoteBtn.addEventListener('click', () => {
        socket.send(JSON.stringify({
            type: 'requestVote'
        }));
    });
    
    function startVote(players) {
        voteInProgress = true;
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
    
    submitVoteBtn.addEventListener('click', () => {
        const selectedPlayer = document.querySelector('#votePlayers li.selected');
        if (selectedPlayer) {
            socket.send(JSON.stringify({
                type: 'submitVote',
                playerId: selectedPlayer.dataset.playerId
            }));
            voteModal.style.display = 'none';
            voteInProgress = false;
        }
    });
    
    function showVoteResult(votedPlayer, isImposter) {
        const gameResult = document.getElementById('gameResult');
        gameResult.innerHTML = `
            <h3>Voting Results</h3>
            <p>${votedPlayer} was voted out.</p>
            <p>They were ${isImposter ? 'the IMPOSTER!' : 'NOT the imposter.'}</p>
        `;
        gameResult.style.display = 'block';
    }
    
    // Imposter guess functionality
    const guessWordBtn = document.getElementById('guessWord');
    const guessModal = document.getElementById('guessModal');
    const submitGuessBtn = document.getElementById('submitGuess');
    
    guessWordBtn.addEventListener('click', () => {
        guessModal.style.display = 'block';
    });
    
    submitGuessBtn.addEventListener('click', () => {
        const guess = document.getElementById('wordGuess').value.trim().toLowerCase();
        if (guess) {
            socket.send(JSON.stringify({
                type: 'submitGuess',
                guess: guess
            }));
            guessModal.style.display = 'none';
            document.getElementById('wordGuess').value = '';
        }
    });
    
    // Game result
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