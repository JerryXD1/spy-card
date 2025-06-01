// url params → ?room=myroom&host=1&player=Jerry
const qp    = new URLSearchParams(location.search);
const code  = qp.get('room');
const host  = qp.get('host') === '1';
const me    = qp.get('player') || 'You';

document.getElementById('roomName').textContent = code;
const startBtn  = document.getElementById('startBtn');
const readyBtn  = document.getElementById('readyBtn');
const chatBox   = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendChat  = document.getElementById('sendChat');
const pCount    = document.getElementById('pCount');
const pMax      = document.getElementById('pMax');
const playerList= document.getElementById('playerList');
const impInput  = document.getElementById('impInput');
const maxInput  = document.getElementById('maxInput');
const catWrap   = document.getElementById('catWrap');

const socket = io();

// Host-UI
if (host) startBtn.classList.remove('hidden');
else { impInput.disabled = maxInput.disabled = true; }

const categories = ['People','Films','Series','Games','Places','Brands'];
categories.forEach(c=>{
  catWrap.insertAdjacentHTML('beforeend',`
  <label class="flex items-center gap-2">
    <input type="checkbox" value="${c}" class="cat accent-purple-500" checked ${!host&&'disabled'}>
    <span>${c}</span>
  </label>`);
});

// Events
readyBtn.onclick = ()=>socket.emit('toggleReady', code);
startBtn.onclick = ()=>socket.emit('startGame', code);

sendChat.onclick = sendMsg;
chatInput.addEventListener('keydown',e=>e.key==='Enter'&&sendMsg());

function sendMsg(){
  const m = chatInput.value.trim();
  if(!m) return;
  socket.emit('chat',{code,msg:m});
  chatInput.value='';
}

// Host-Änderungen
[impInput,maxInput].forEach(inp=>{
  inp.onchange = ()=>{
    if(!host) return;
    const cats=[...document.querySelectorAll('.cat:checked')].map(c=>c.value);
    socket.emit('updateSettings',{code,settings:{
      imposter:+impInput.value||1,
      maxPlayers:+maxInput.value||8,
      categories:cats
    }});
  };
});
catWrap.addEventListener('change',()=>impInput.onchange());

// Server-Events
socket.on('lobbyUpdate', data=>{
  pCount.textContent = data.players.length;
  pMax.textContent   = data.settings.maxPlayers;
  playerList.innerHTML='';
  data.players.forEach(p=>{
    playerList.insertAdjacentHTML('beforeend',`
      <li class="flex justify-between bg-black/30 px-3 py-1 rounded">
        <span>${p.name}${p.id===socket.id?' (you)':''}</span>
        ${p.ready?'<span class="text-green-400">✓</span>':''}
      </li>`);
  });
  impInput.value = data.settings.imposter;
  maxInput.value = data.settings.maxPlayers;
  document.querySelectorAll('.cat').forEach(cb=>{
    cb.checked = data.settings.categories.includes(cb.value);
  });
});

socket.on('chat', ({sender,msg})=>{
  chatBox.insertAdjacentHTML('beforeend',`<div><span class="text-purple-400">${sender}:</span> ${msg}</div>`);
  chatBox.scrollTop=chatBox.scrollHeight;
});

socket.on('card', data=>{
  alert(data.word?`You are citizen with word: ${data.word}`:`You are IMPOSTER! Hint: ${data.hint}`);
});
socket.on('gameStarted',()=>alert('Game started!'));
