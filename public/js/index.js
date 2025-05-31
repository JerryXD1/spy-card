const socket = io();

const btnCreateLobby = document.getElementById('btnCreateLobby');
const btnJoinLobby = document.getElementById('btnJoinLobby');

const modalCreate = document.getElementById('modalCreate');
const modalJoin = document.getElementById('modalJoin');

const closeCreate = document.getElementById('closeCreate');
const closeJoin = document.getElementById('closeJoin');

const confirmCreate = document.getElementById('confirmCreate');
const confirmJoin = document.getElementById('confirmJoin');

btnCreateLobby.addEventListener('click', () => {
  modalCreate.style.display = 'flex';
});

btnJoinLobby.addEventListener('click', () => {
  modalJoin.style.display = 'flex';
});

closeCreate.addEventListener('click', () => {
  modalCreate.style.display = 'none';
  document.getElementById('createRoomName').value = '';
});

closeJoin.addEventListener('click', () => {
  modalJoin.style.display = 'none';
  document.getElementById('joinRoomName').value = '';
});

confirmCreate.addEventListener('click', () => {
  const roomName = document.getElementById('createRoomName').value.trim();
  if (roomName.length === 0) {
    alert('Bitte gib einen Raum-Namen ein.');
    return;
  }
  socket.emit('createLobby', { roomName });
});

confirmJoin.addEventListener('click', () => {
  const roomName = document.getElementById('joinRoomName').value.trim();
  if (roomName.length === 0) {
    alert('Bitte gib einen Raum-Namen ein.');
    return;
  }
  socket.emit('joinLobby', { roomName });
});

// Events vom Server

socket.on('errorMessage', (msg) => {
  alert(msg);
});

socket.on('lobbyCreated', (roomName) => {
  alert(`Lobby "${roomName}" erstellt!`);
  modalCreate.style.display = 'none';
  window.location.href = `/lobby.html?room=${encodeURIComponent(roomName)}`;
});

socket.on('lobbyJoined', (roomName) => {
  alert(`Lobby "${roomName}" beigetreten!`);
  modalJoin.style.display = 'none';
  window.location.href = `/lobby.html?room=${encodeURIComponent(roomName)}`;
});
