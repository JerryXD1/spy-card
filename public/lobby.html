import { session } from './session.js';
const socket   = io();
const lobbyId  = session.lobby();
const player   = session.player();

// Join room on socket side
socket.emit('join_room_socket', lobbyId);

socket.on('lobby_update', data => {
  document.getElementById('room-name').textContent = data.name;
  document.getElementById('room-code').textContent = data.id;
  const list = document.getElementById('players');
  list.innerHTML = '';
  data.players.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name + (p.ready ? ' ✓' : '') + (p.name === player ? ' (you)' : '');
    list.appendChild(li);
  });
});

// Ready toggle
window.addEventListener('keydown', e => {
  if (e.key === 'r') socket.emit('toggle_ready', lobbyId);
});

document.getElementById('start-btn').onclick = () => socket.emit('start_game', lobbyId);