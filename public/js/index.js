document.addEventListener('DOMContentLoaded', () => {
  const playerNameInput = document.getElementById('playerName');
  const lobbyNameInput = document.getElementById('lobbyName');
  const createLobbyBtn = document.getElementById('createLobbyBtn');
  const joinLobbyBtn = document.getElementById('joinLobbyBtn');
  const form = document.getElementById('createJoinForm');

  // Load saved player/lobby names if any
  const savedPlayerName = session.getPlayerName();
  if (savedPlayerName) playerNameInput.value = savedPlayerName;
  const savedLobbyName = session.getLobbyName();
  if (savedLobbyName) lobbyNameInput.value = savedLobbyName;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const playerName = playerNameInput.value.trim();
    const lobbyName = lobbyNameInput.value.trim();

    if (!playerName || !lobbyName) return;

    session.savePlayerName(playerName);
    session.saveLobbyName(lobbyName);

    // Hier: Lobby erstellen
    // Beispiel: Weiterleitung auf lobby.html
    window.location.href = 'lobby.html';
  });

  joinLobbyBtn.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    const lobbyName = lobbyNameInput.value.trim();

    if (!playerName || !lobbyName) return;

    session.savePlayerName(playerName);
    session.saveLobbyName(lobbyName);

    // Weiterleitung zur Lobby
    window.location.href = 'lobby.html';
  });
});
