// Mini-store (Raumdaten kamen via query + localStorage vom Homescreen)
const urlParams   = new URLSearchParams(window.location.search);
const roomName    = urlParams.get('room')        || localStorage.getItem('roomName');
const isHost      = urlParams.get('host') === '1' || false;              // Homescreen könnte host=1 setzen
const lobbyCode   = localStorage.getItem('joinCode') || 'LOCAL';

// Socket
const socket = io();

// DOM-Refs
const lobbyNameEl = document.getElementById('lobbyName');
const lobbyCodeEl = document.getElementById('lobbyCode');
const startBtn    = document.getElementById('startBtn');
const playerList  = document.getElementById('playerList');
const pCountEl    = document.getElementById('pCount');
const pMaxEl      = document.getElementById('pMax');
const readyBtn    = document.getElementById('readyBtn');

const impCountInp = document.getElementById('impCount');
const maxPlayersInp = document.getElementById('maxPlayers');
const catList     = document.getElementById('catList');
const selectAllCats = document.getElementById('selectAllCats');

const chatBox   = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendChat  = document.getElementById('sendChat');

// ─────────────────────────────
// Init UI
lobbyNameEl.textContent = roomName || 'Unnamed';
lobbyCodeEl.textContent = lobbyCode;

if (isHost) {
  startBtn.classList.remove('hidden');
  impCountInp.disabled = false;
  maxPlayersInp.disabled = false;
} else {
  impCountInp.disabled = true;
  maxPlayersInp.disabled = true;
}

// Kategorien (Demo)
const categories = ['People','Films','Series','Games','Places','Brands'];
categories.forEach(cat => {
  const id = 'cat-' + cat;
  catList.insertAdjacentHTML('beforeend', `
    <label class="flex items-center gap-2">
      <input type="checkbox" id="${id}" class="catCheckbox accent-purple-500" checked ${!isHost && 'disabled'}>
      <span>${cat}</span>
    </label>
  `);
});

// Toggle-All Cats (nur Host)
if (!isHost) selectAllCats.classList.add('hidden');
selectAllCats.onclick = () => {
  document.querySelectorAll('.catCheckbox').forEach(cb => cb.checked = !cb.checked);
};

// Ready-Button
let readyState = false;
readyBtn.onclick = () => {
  readyState = !readyState;
  readyBtn.textContent = readyState ? '❌ UNREADY' : '✅ READY';
  readyBtn.classList.toggle('bg-green-500', !readyState);
  readyBtn.classList.toggle('bg-red-500', readyState);
  socket.emit('update-ready', { code: lobbyCode, ready: readyState });
};

// Start-Game (Host)
startBtn.onclick = () => socket.emit('start-game', lobbyCode);

// Chat
sendChat.onclick = sendMessage;
chatInput.addEventListener('keydown', e => e.key === 'Enter' && sendMessage());

function sendMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;
  socket.emit('lobby-chat', { code: lobbyCode, msg });
  chatInput.value = '';
}

// ─────────────────────────────
// Socket-Events (Demo-Backend)
socket.on('lobby-update', data => {
  playerList.innerHTML = '';
  data.players.forEach(p => {
    playerList.insertAdjacentHTML('beforeend', `
      <li class="flex items-center justify-between bg-purple-800/40 p-2 rounded-lg">
        <span>${p.name}</span>
        ${p.ready ? '<span class="text-green-400 font-bold">✓</span>' : ''}
      </li>
    `);
  });
  pCountEl.textContent = data.players.length;
});

socket.on('chat-msg', ({ sender, msg }) => {
  chatBox.insertAdjacentHTML('beforeend', `
    <div><span class="text-purple-300 font-semibold">${sender}:</span> ${msg}</div>
  `);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('game-start', () => {
  window.location.href = 'game.html';
});
