export const session = {
  save(name, lobbyId) {
    localStorage.setItem('playerName', name);
    localStorage.setItem('lobbyId', lobbyId);
  },
  player()  { return localStorage.getItem('playerName'); },
  lobby()   { return localStorage.getItem('lobbyId'); }
};