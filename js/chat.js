// Chat Functions

let chatMessages = [];

function openChat() {
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget) {
        chatWidget.style.display = chatWidget.style.display === 'none' ? 'block' : 'none';
    }
}

async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to display
    displayMessage(message, 'user');
    chatInput.value = '';
    
    try {
        const response = await fetch(`${API_URL}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayMessage(data.reply, 'bot');
        } else {
            displayMessage('Sorry, I encountered an error.', 'bot');
        }
    } catch (error) {
        console.error('Chat error:', error);
        displayMessage('Sorry, I encountered an error.', 'bot');
    }
}

function displayMessage(content, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'user-message' : 'bot-message';
    messageDiv.textContent = content;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Allow Enter key to send message
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});
