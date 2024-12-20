let socket;
let reconnectInterval = 5000;
let isActive = true;
let userId = null;
let isDisconnected = false;

function connect() {
    socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {
        document.getElementById('status').innerText = 'Підключено';
        document.getElementById('status').style.color = 'green';
        console.log('Підключено до сервера');
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            const chat = document.getElementById('chat');
            const newElement = document.createElement('div');

            if (data.type === 'notification') {
                newElement.className = 'notification';
                newElement.innerText = data.message;

                if (data.userId) {
                    userId = data.userId;
                }

                if (data.message === 'Вас було відключено від чату') {
                    alert(data.message);
                    disableChat();
                }

                if (data.message === 'Нові повідомлення у чаті') {
                    showBrowserNotification(data.message);
                }
            } else if (data.type === 'message') {
                newElement.className = 'message';
                const timestamp = new Date(data.timestamp).toLocaleTimeString();
                newElement.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${data.content}`;
            } else {
                console.warn('Невідомий тип повідомлення:', data);
                return;
            }

            chat.appendChild(newElement);
            chat.scrollTop = chat.scrollHeight;
        } catch (e) {
            console.error('Помилка при обробці повідомлення:', e);
        }
    };

    socket.onclose = () => {
        if (!isDisconnected) {
            document.getElementById('status').innerText = 'Відключено. Спроба підключення...';
            document.getElementById('status').style.color = 'red';
            console.log('З\'єднання закрито. Спроба відновлення через 5 секунд...');
            setTimeout(connect, reconnectInterval);
        } else {
            document.getElementById('status').innerText = 'Відключено';
            document.getElementById('status').style.color = 'red';
        }
    };

    socket.onerror = (error) => {
        console.error('Помилка:', error);
        socket.close();
    };
}

function sendMessage() {
    if (isDisconnected) return;

    const messageInput = document.getElementById('message');
    const message = messageInput.value.trim();
    if (message === '' || socket.readyState !== WebSocket.OPEN) return;

    const messageData = JSON.stringify({ type: 'message', content: message });
    socket.send(messageData);
    messageInput.value = '';
}

function disconnect() {
    if (!userId) {
        alert('Відключення неможливе, поки ви не підключені до чату.');
        return;
    }

    fetch(`http://localhost:3000/disconnect?id=${userId}`)
        .then(response => response.text())
        .then(data => {
            alert(data);
            disableChat();
        })
        .catch(error => {
            console.error('Помилка при відключенні:', error);
        });
}


function disableChat() {
    isDisconnected = true;
    document.getElementById('message').disabled = true;
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('disconnectBtn').disabled = true;
    document.getElementById('status').innerText = 'Відключено';
    document.getElementById('status').style.color = 'red';
}

function showBrowserNotification(message) {
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
        const notification = new Notification('Нові повідомлення', {
            body: message,
            icon: 'https://via.placeholder.com/100'
        });

        notification.onclick = () => {
            window.focus();
        };
    }
}

document.addEventListener('mousemove', () => { isActive = true; });
document.addEventListener('keydown', () => { isActive = true; });
setInterval(() => { isActive = false; }, 30000);

window.onload = connect;