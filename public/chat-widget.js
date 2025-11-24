/**
 * Payvost Chat Widget
 * Embeddable chat widget script
 * 
 * Usage:
 * <script src="https://yourdomain.com/chat-widget.js"></script>
 * 
 * Configuration options can be set via data attributes:
 * <script src="chat-widget.js" data-api-url="https://api.payvost.com" data-theme="light"></script>
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    apiUrl: document.currentScript?.getAttribute('data-api-url') || window.location.origin,
    wsUrl: document.currentScript?.getAttribute('data-ws-url') || window.location.origin.replace(/^http/, 'ws'),
    theme: document.currentScript?.getAttribute('data-theme') || 'light',
    position: document.currentScript?.getAttribute('data-position') || 'bottom-right',
    primaryColor: document.currentScript?.getAttribute('data-primary-color') || '#0070f3',
    autoOpen: document.currentScript?.getAttribute('data-auto-open') === 'true',
    greeting: document.currentScript?.getAttribute('data-greeting') || 'Hello! How can we help you?',
  };

  // Create widget container
  const widgetId = 'payvost-chat-widget';
  if (document.getElementById(widgetId)) {
    return; // Already loaded
  }

  const container = document.createElement('div');
  container.id = widgetId;
  document.body.appendChild(container);

  // Widget state
  let isOpen = false;
  let isMinimized = false;
  let socket = null;
  let sessionId = null;
  let messages = [];
  let userId = null;
  let authToken = null;

  // Load auth from localStorage (if user is logged in)
  function getAuthToken() {
    try {
      const firebaseAuth = localStorage.getItem('firebase:authUser');
      if (firebaseAuth) {
        const auth = JSON.parse(firebaseAuth);
        return auth.stsTokenManager?.accessToken;
      }
    } catch (e) {
      console.error('Error reading auth token:', e);
    }
    return null;
  }

  // Initialize chat session
  async function initChat() {
    try {
      authToken = getAuthToken();
      
      // Create or get session
      const response = await fetch(`${config.apiUrl}/api/support/chat/sessions/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (response.ok) {
        const session = await response.json();
        sessionId = session.id;
        
        // Connect WebSocket
        connectWebSocket();
      } else {
        console.error('Failed to create chat session');
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  }

  // Connect WebSocket
  function connectWebSocket() {
    if (!sessionId) return;

    try {
      const wsProtocol = config.wsUrl.startsWith('wss') ? 'wss' : 'ws';
      const wsPath = config.wsUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
      socket = new WebSocket(`${wsProtocol}://${wsPath}/socket.io/chat/?token=${authToken || ''}`);

      socket.onopen = () => {
        console.log('Chat connected');
        socket.send(JSON.stringify({ type: 'join:session', sessionId }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socket.onclose = () => {
        console.log('Chat disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  // Handle WebSocket messages
  function handleWebSocketMessage(data) {
    switch (data.type) {
      case 'message:new':
        messages.push(data.message);
        renderMessages();
        break;
      case 'session:history':
        messages = data.messages || [];
        renderMessages();
        break;
      default:
        break;
    }
  }

  // Render messages
  function renderMessages() {
    const messagesContainer = container.querySelector('.chat-messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = messages.map(msg => {
      const isUser = msg.senderId === userId;
      return `
        <div class="chat-message ${isUser ? 'chat-message-user' : 'chat-message-bot'}">
          <div class="chat-message-content">${escapeHtml(msg.content)}</div>
          <div class="chat-message-time">${formatTime(msg.createdAt)}</div>
        </div>
      `;
    }).join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Send message
  function sendMessage(content) {
    if (!content.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: 'message:send',
      sessionId,
      content: content.trim(),
      type: 'text',
    }));

    // Add user message immediately
    messages.push({
      id: `temp-${Date.now()}`,
      sessionId,
      senderId: userId || 'user',
      content: content.trim(),
      type: 'text',
      createdAt: new Date().toISOString(),
    });
    renderMessages();
  }

  // Create widget HTML
  function createWidgetHTML() {
    const positionClass = config.position === 'bottom-left' ? 'chat-widget-left' : 'chat-widget-right';
    
    return `
      <div class="chat-widget ${positionClass} ${isOpen ? 'chat-widget-open' : ''}">
        ${isOpen ? createChatWindow() : createChatButton()}
      </div>
    `;
  }

  // Create chat button
  function createChatButton() {
    return `
      <button class="chat-button" onclick="window.payvostChatOpen()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        ${messages.length > 0 ? `<span class="chat-badge">${messages.length}</span>` : ''}
      </button>
    `;
  }

  // Create chat window
  function createChatWindow() {
    return `
      <div class="chat-window">
        <div class="chat-header">
          <div class="chat-header-content">
            <div class="chat-header-avatar">💬</div>
            <div>
              <div class="chat-header-title">Support Chat</div>
              <div class="chat-header-status">Online</div>
            </div>
          </div>
          <button class="chat-close" onclick="window.payvostChatClose()">×</button>
        </div>
        <div class="chat-messages"></div>
        <div class="chat-input-container">
          <input 
            type="text" 
            class="chat-input" 
            placeholder="Type your message..."
            onkeydown="if(event.key==='Enter') window.payvostChatSend(this.value, this)"
          />
          <button class="chat-send" onclick="window.payvostChatSendInput()">Send</button>
        </div>
      </div>
    `;
  }

  // Render widget
  function renderWidget() {
    container.innerHTML = createWidgetHTML();
    renderMessages();
  }

  // Open chat
  window.payvostChatOpen = function() {
    isOpen = true;
    isMinimized = false;
    renderWidget();
    if (!sessionId) {
      initChat();
    }
    if (config.autoOpen && messages.length === 0) {
      sendMessage(config.greeting);
    }
  };

  // Close chat
  window.payvostChatClose = function() {
    isOpen = false;
    renderWidget();
  };

  // Send message
  window.payvostChatSend = function(content, input) {
    if (input) {
      input.value = '';
    }
    sendMessage(content);
  };

  // Send message from input
  window.payvostChatSendInput = function() {
    const input = container.querySelector('.chat-input');
    if (input && input.value) {
      sendMessage(input.value);
      input.value = '';
    }
  };

  // Utility functions
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // Add CSS styles
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #${widgetId} {
        position: fixed;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .chat-widget-right {
        bottom: 20px;
        right: 20px;
      }
      .chat-widget-left {
        bottom: 20px;
        left: 20px;
      }
      .chat-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${config.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: transform 0.2s;
      }
      .chat-button:hover {
        transform: scale(1.1);
      }
      .chat-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff4444;
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 12px;
        font-weight: bold;
      }
      .chat-window {
        width: 380px;
        height: 600px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .chat-header {
        background: ${config.primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .chat-header-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .chat-header-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
      .chat-header-title {
        font-weight: 600;
        font-size: 16px;
      }
      .chat-header-status {
        font-size: 12px;
        opacity: 0.9;
      }
      .chat-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .chat-message {
        display: flex;
        flex-direction: column;
        max-width: 75%;
      }
      .chat-message-user {
        align-self: flex-end;
      }
      .chat-message-bot {
        align-self: flex-start;
      }
      .chat-message-content {
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.4;
      }
      .chat-message-user .chat-message-content {
        background: ${config.primaryColor};
        color: white;
      }
      .chat-message-bot .chat-message-content {
        background: #f1f1f1;
        color: #333;
      }
      .chat-message-time {
        font-size: 11px;
        color: #999;
        margin-top: 4px;
        padding: 0 4px;
      }
      .chat-input-container {
        border-top: 1px solid #e0e0e0;
        padding: 12px;
        display: flex;
        gap: 8px;
      }
      .chat-input {
        flex: 1;
        border: 1px solid #e0e0e0;
        border-radius: 20px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
      }
      .chat-input:focus {
        border-color: ${config.primaryColor};
      }
      .chat-send {
        background: ${config.primaryColor};
        color: white;
        border: none;
        border-radius: 20px;
        padding: 10px 20px;
        cursor: pointer;
        font-weight: 600;
      }
      .chat-send:hover {
        opacity: 0.9;
      }
      @media (max-width: 480px) {
        .chat-window {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize
  injectStyles();
  renderWidget();

  // Auto-open if configured
  if (config.autoOpen) {
    setTimeout(() => {
      window.payvostChatOpen();
    }, 1000);
  }
})();

