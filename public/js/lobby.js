document.addEventListener('DOMContentLoaded', () => {
  const lobbyNameElem = document.getElementById('lobbyName');
  const playersList = document.getElementById('playersList');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const categorySelect = document.getElementById('categorySelect');
  const startGameBtn = document.getElementById('startGameBtn');
  const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');

  const playerName = session.getPlayerName();
  const lobbyName = session.getLobbyName();

  if (!playerName || !lobbyName) {
    window.location.href = 'index.html';
    return;
  }

  lobbyNameElem.textContent = lobbyName;

  // Beispiel Kategorien - diese könnten vom Server geladen werden
  const categories = [
    'Personen',
    'Filme',
    'Serien',
    'Firmen',
    'Spiele',
    'Sehenswürdigkeiten',
  ];

  // Fülle Kategorien
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  // Nur Host sieht Start Game Button - Beispiel: Host ist erster Spieler
  let isHost = false;

  // Dummy Spieler-Liste (später über Websocket aktualisieren)
  let players = [playerName];
  updatePlayersList();

  // Beispiel: Prüfe, ob Spieler Host ist (erstes Element)
  isHost = players[0] === playerName;
  if (isHost) startGameBtn.classList.remove('hidden');

  leaveLobbyBtn.addEventListener('click', () => {
    session.clear();
    window.location.href = 'index.html';
  });

  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;

    addChatMessage(playerName, msg);
    chatInput.value = '';

    // TODO: Nachricht an Server senden
  });

  function addChatMessage(sender, message) {
    const msgElem = document.createElement('div');
    msgElem.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatMessages.appendChild(msgElem);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function updatePlayersList() {
    playersList.innerHTML = '';
    players.forEach(p => {
      const li = document.createElement('li');
      li.textContent = p + (p === playerName ? ' (Du)' : '');
      playersList.appendChild(li);
    });
  }

  // TODO: Websocket verbinden, Nachrichten & Spieler-Liste synchronisieren

  startGameBtn.addEventListener('click', () => {
    alert('Spiel wird gestartet! (noch keine Funktion)');
    // TODO: Spielstart-Logik implementieren
  });
});
