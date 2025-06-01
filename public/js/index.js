document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('createParty').addEventListener('click', () => {
    const username = prompt('Enter your name:') || `Player${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem('username', username);
    window.location.href = '/lobby.html?host=true';
  });

  document.getElementById('joinParty').addEventListener('click', () => {
    const username = prompt('Enter your name:') || `Player${Math.floor(Math.random() * 1000)}`;
    const roomCode = prompt('Enter room code:');
    if (roomCode) {
      localStorage.setItem('username', username);
      window.location.href = `/lobby.html?room=${roomCode}`;
    }
  });
});