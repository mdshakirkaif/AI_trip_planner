// Configuration
const API_BASE_URL = 'http://localhost:8000';
const STREAMING_ENDPOINT = `${API_BASE_URL}/stream`;

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendBtn = document.querySelector('.send-btn');
const messagesArea = document.getElementById('messagesArea');
const chatForm = document.getElementById('chatForm');
const newChatBtn = document.querySelector('.new-chat-btn');
const loadingIndicator = document.getElementById('loadingIndicator');
const promptBtns = document.querySelectorAll('.prompt-btn');
const toast = document.getElementById('toast');

// State
let isLoading = false;
let currentChatId = 'current';
let chatHistory = {
    current: []
};

// Initialize event listeners
function initEventListeners() {
    messageInput.addEventListener('input', autoResizeTextarea);
    messageInput.addEventListener('keydown', handleInputKeydown);
    chatForm.addEventListener('submit', handleSubmit);
    newChatBtn.addEventListener('click', startNewChat);
    promptBtns.forEach(btn => btn.addEventListener('click', handlePromptClick));
    
    // Load saved chat history
    loadChatHistory();
}

// Auto-resize textarea
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    const newHeight = Math.min(messageInput.scrollHeight, 120);
    messageInput.style.height = newHeight + 'px';
}

// Handle input keydown (Ctrl+Enter to send)
function handleInputKeydown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit(e);
    }
}

// Handle form submit
async function handleSubmit(e) {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message || isLoading) return;

    // Add user message
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Remove welcome section if present
    const welcomeSection = messagesArea.querySelector('.welcome-section');
    if (welcomeSection) {
        welcomeSection.remove();
    }

    isLoading = true;
    sendBtn.disabled = true;
    showLoadingIndicator();

    try {
        await fetchStreamingResponse(message);
    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`, 'error');
        addMessage(`Sorry, I encountered an error: ${error.message}`, 'assistant');
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        hideLoadingIndicator();
    }
}

// Handle quick prompt click
function handlePromptClick(e) {
    const prompt = e.target.getAttribute('data-prompt');
    messageInput.value = prompt;
    autoResizeTextarea();
    messageInput.focus();
}

// Add message to chat
function addMessage(content, role = 'assistant') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Parse markdown and HTML
    contentDiv.innerHTML = parseMarkdown(content);
    
    messageDiv.appendChild(contentDiv);
    messagesArea.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
    
    // Save to chat history
    chatHistory[currentChatId].push({ role, content });
    saveChatHistory();
    
    return contentDiv;
}

// Add streaming message (updates in real-time)
function addStreamingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = '';
    contentDiv.id = 'streaming-message';
    
    messageDiv.appendChild(contentDiv);
    messagesArea.appendChild(messageDiv);
    
    return contentDiv;
}

// Fetch streaming response
async function fetchStreamingResponse(question) {
    const streamingContentDiv = addStreamingMessage();
    let fullContent = '';

    try {
        const response = await fetch(STREAMING_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value);
            
            // Parse streaming chunks (assuming SSE format: "data: {content}")
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.content) {
                            fullContent += data.content;
                            // Update the content in real-time with markdown parsing
                            streamingContentDiv.innerHTML = parseMarkdown(fullContent);
                            messagesArea.scrollTop = messagesArea.scrollHeight;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }

        // Save complete message to history
        chatHistory[currentChatId].push({ role: 'assistant', content: fullContent });
        saveChatHistory();

    } catch (error) {
        // Fallback to non-streaming request
        console.log('Streaming failed, trying non-streaming endpoint');
        await fetchNonStreamingResponse(question, streamingContentDiv);
    }
}

// Fallback non-streaming response
async function fetchNonStreamingResponse(question, contentDiv) {
    try {
        const response = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const content = data.answer || 'No response received';
        
        contentDiv.innerHTML = parseMarkdown(content);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        
        // Save to history
        chatHistory[currentChatId].push({ role: 'assistant', content });
        saveChatHistory();

    } catch (error) {
        throw error;
    }
}

// Parse markdown to HTML
function parseMarkdown(text) {
    if (!text) return '';

    // Escape HTML
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Code blocks
    html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Lists
    html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/<\/li><li>/g, '</li><li>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraphs if not already wrapped
    if (!html.includes('<p>') && !html.includes('<h') && !html.includes('<ul>')) {
        html = `<p>${html}</p>`;
    }

    return html;
}

// Show/hide loading indicator
function showLoadingIndicator() {
    loadingIndicator.classList.remove('hidden');
}

function hideLoadingIndicator() {
    loadingIndicator.classList.add('hidden');
}

// Toast notification
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Chat management
function startNewChat() {
    const chatId = `chat-${Date.now()}`;
    chatHistory[chatId] = [];
    currentChatId = chatId;
    
    // Clear messages
    messagesArea.innerHTML = `
        <div class="welcome-section">
            <div class="welcome-icon">🌍</div>
            <h2>Welcome to Travel Planner</h2>
            <p>Let me help you plan your perfect trip! Ask me to plan a vacation to any destination.</p>
            <div class="quick-prompts">
                <button class="prompt-btn" data-prompt="Plan a 5 days trip to Goa with budget breakdown">
                    📍 Plan a trip to Goa
                </button>
                <button class="prompt-btn" data-prompt="What are the best places to visit in Japan in summer?">
                    🗾 Japan Travel Guide
                </button>
                <button class="prompt-btn" data-prompt="Plan a romantic weekend getaway to Paris">
                    💕 Paris Weekend
                </button>
                <button class="prompt-btn" data-prompt="Create a 10 days adventure trip to the Himalayas">
                    ⛰️ Himalayas Adventure
                </button>
            </div>
        </div>
    `;
    
    // Reattach event listeners to new prompt buttons
    document.querySelectorAll('.prompt-btn').forEach(btn => {
        btn.addEventListener('click', handlePromptClick);
    });
    
    // Update chat history UI
    updateChatHistoryUI();
    saveChatHistory();
    showToast('New chat started', 'success');
}

// Update chat history UI
function updateChatHistoryUI() {
    const historyContainer = document.querySelector('.chat-history');
    historyContainer.innerHTML = '';
    
    Object.entries(chatHistory).forEach(([chatId, messages]) => {
        if (messages.length === 0) return;
        
        const firstUserMessage = messages.find(m => m.role === 'user')?.content || 'Empty Chat';
        const title = firstUserMessage.substring(0, 30) + (firstUserMessage.length > 30 ? '...' : '');
        
        const item = document.createElement('div');
        item.className = `history-item ${chatId === currentChatId ? 'active' : ''}`;
        item.setAttribute('data-chat-id', chatId);
        item.innerHTML = `
            <span class="history-title">${title}</span>
            <button class="delete-btn" title="Delete">🗑️</button>
        `;
        
        item.addEventListener('click', () => loadChat(chatId));
        item.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chatId);
        });
        
        historyContainer.appendChild(item);
    });
}

// Load specific chat
function loadChat(chatId) {
    currentChatId = chatId;
    
    // Clear and render messages
    messagesArea.innerHTML = '';
    chatHistory[chatId].forEach(msg => {
        addMessage(msg.content, msg.role);
    });
    
    updateChatHistoryUI();
}

// Delete chat
function deleteChat(chatId) {
    if (Object.keys(chatHistory).length <= 1) {
        showToast('Cannot delete the last chat', 'error');
        return;
    }
    
    delete chatHistory[chatId];
    
    if (currentChatId === chatId) {
        const remainingChatIds = Object.keys(chatHistory);
        currentChatId = remainingChatIds[0];
        loadChat(currentChatId);
    } else {
        updateChatHistoryUI();
    }
    
    saveChatHistory();
    showToast('Chat deleted', 'success');
}

// Save chat history to localStorage
function saveChatHistory() {
    try {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        localStorage.setItem('currentChatId', currentChatId);
    } catch (e) {
        console.error('Failed to save chat history:', e);
    }
}

// Load chat history from localStorage
function loadChatHistory() {
    try {
        const saved = localStorage.getItem('chatHistory');
        const savedChatId = localStorage.getItem('currentChatId');
        
        if (saved) {
            chatHistory = JSON.parse(saved);
            currentChatId = savedChatId || 'current';
            updateChatHistoryUI();
            loadChat(currentChatId);
        }
    } catch (e) {
        console.error('Failed to load chat history:', e);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', initEventListeners);

// Request camera/microphone permissions (optional feature)
async function requestMediaPermissions() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted');
    } catch (error) {
        console.log('Microphone permission denied or not available');
    }
}

// Focus input on load
window.addEventListener('load', () => {
    messageInput.focus();
});
