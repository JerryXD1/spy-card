document.getElementById('createBtn').addEventListener('click', () => {
  document.getElementById('createModal').classList.remove('hidden');
});

document.getElementById('joinBtn').addEventListener('click', () => {
  document.getElementById('joinModal').classList.remove('hidden');
});

document.getElementById('closeCreate').addEventListener('click', () => {
  document.getElementById('createModal').classList.add('hidden');
});

document.getElementById('closeJoin').addEventListener('click', () => {
  document.getElementById('joinModal').classList.add('hidden');
});

document.getElementById('confirmCreate').addEventListener('click', () => {
  const roomName = document.getElementById('createRoomName').value;
  if (roomName) {
    localStorage.setItem("roomName", roomName);
    window.location.href = "lobby.html";
  }
});

document.getElementById('confirmJoin').addEventListener('click', () => {
  const roomName = document.getElementById('joinRoomName').value;
  const code = document.getElementById('joinCode').value;
  if (roomName && code) {
    localStorage.setItem("roomName", roomName);
    localStorage.setItem("joinCode", code);
    window.location.href = "lobby.html";
  }
});
