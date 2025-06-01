document.addEventListener('DOMContentLoaded', () => {
    // Create Party Modal
    const createModal = document.getElementById('createModal');
    const createPartyBtn = document.getElementById('createParty');
    const createLobbyBtn = document.getElementById('createLobby');
    const selectAllBtn = document.getElementById('selectAll');
    
    createPartyBtn.addEventListener('click', () => {
        createModal.style.display = 'block';
        // Load categories from server
        fetch('/categories')
            .then(response => response.json())
            .then(categories => {
                const categoriesList = document.getElementById('categoriesList');
                categoriesList.innerHTML = '';
                categories.forEach(category => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <input type="checkbox" id="cat_${category}" name="categories" value="${category}" checked>
                        <label for="cat_${category}">${category}</label>
                    `;
                    categoriesList.appendChild(div);
                });
            });
    });
    
    selectAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('input[name="categories"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    });
    
    createLobbyBtn.addEventListener('click', () => {
        const lobbyName = document.getElementById('lobbyName').value;
        const selectedCategories = Array.from(document.querySelectorAll('input[name="categories"]:checked'))
            .map(checkbox => checkbox.value);
        
        if (lobbyName && selectedCategories.length > 0) {
            // Create lobby and redirect
            fetch('/create-lobby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: lobbyName,
                    categories: selectedCategories
                })
            })
            .then(response => response.json())
            .then(data => {
                window.location.href = `/lobby.html?room=${data.roomId}`;
            });
        }
    });
    
    // Join Party Modal
    const joinModal = document.getElementById('joinModal');
    const joinPartyBtn = document.getElementById('joinParty');
    const joinLobbyBtn = document.getElementById('joinLobby');
    
    joinPartyBtn.addEventListener('click', () => {
        joinModal.style.display = 'block';
    });
    
    joinLobbyBtn.addEventListener('click', () => {
        const roomCode = document.getElementById('roomCode').value;
        const username = document.getElementById('username').value;
        
        if (roomCode && username) {
            // Join lobby and redirect
            fetch('/join-lobby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room: roomCode,
                    username: username
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = `/lobby.html?room=${roomCode}`;
                } else {
                    alert(data.message);
                }
            });
        }
    });
    
    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});