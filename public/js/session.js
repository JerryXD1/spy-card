// Session Management: Save and load player & lobby info in localStorage

const session = {
  savePlayerName(name) {
    localStorage.setItem('playerName', name);
  },
  getPlayerName() {
    return localStorage.getItem('playerName');
  },
  saveLobbyName(name) {
    localStorage.setItem('lobbyName', name);
  },
  getLobbyName() {
    return localStorage.getItem('lobbyName');
  },
  clear() {
    localStorage.removeItem('playerName');
    localStorage.removeItem('lobbyName');
  }
};
