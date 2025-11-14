import * as vscode from 'vscode';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private conversationHistory: ChatMessage[] = [];
  private serverUrl: string;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;

    const config = vscode.workspace.getConfiguration('astra');
    this.serverUrl = config.get<string>('serverUrl', 'http://localhost:5000');

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent();

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'sendMessage':
            await this.handleUserMessage(message.text);
            break;
          case 'clearChat':
            this.conversationHistory = [];
            this._panel.webview.postMessage({ type: 'clearChat' });
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'astraChat',
      '💬 Chat with Codebase',
      column || vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
  }

  private async handleUserMessage(text: string) {
    if (!text.trim()) return;

    // Add user message to history
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    this.conversationHistory.push(userMessage);

    // Display user message
    this._panel.webview.postMessage({
      type: 'addMessage',
      message: userMessage,
    });

    // Show thinking indicator
    this._panel.webview.postMessage({ type: 'thinking', isThinking: true });

    try {
      // Get workspace folder for context
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const projectPath = workspaceFolders ? workspaceFolders[0].uri.fsPath : undefined;

      // Call backend chat API
      const response = await fetch(`${this.serverUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          projectPath,
          conversationHistory: this.conversationHistory
            .slice(0, -1)
            .map(msg => ({ role: msg.role, content: msg.content })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Chat request failed');
      }

      const data = await response.json();

      // Add assistant message to history
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      };
      this.conversationHistory.push(assistantMessage);

      // Display assistant message
      this._panel.webview.postMessage({
        type: 'addMessage',
        message: assistantMessage,
      });
    } catch (error: any) {
      vscode.window.showErrorMessage(`Chat error: ${error.message}`);

      // Show error in chat
      this._panel.webview.postMessage({
        type: 'addMessage',
        message: {
          role: 'assistant',
          content: `❌ Error: ${error.message}\n\nMake sure:\n- Backend server is running\n- GROQ_API_KEY is set\n- Get your free key at: https://console.groq.com/keys`,
          timestamp: Date.now(),
        },
      });
    } finally {
      this._panel.webview.postMessage({ type: 'thinking', isThinking: false });
    }
  }

  private _getWebviewContent(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ASTra Chat</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 0;
        }
        .header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--vscode-panel-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h2 { font-size: 16px; font-weight: 600; }
        .clear-btn {
          background: var(--vscode-button-secondaryBackground);
          color: var(--vscode-button-secondaryForeground);
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .clear-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .message {
          margin-bottom: 20px;
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .message.user {
          display: flex;
          justify-content: flex-end;
        }
        .message-content {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 12px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .message.user .message-content {
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
        }
        .message.assistant .message-content {
          background: var(--vscode-editor-inactiveSelectionBackground);
          color: var(--vscode-editor-foreground);
        }
        .message code {
          background: var(--vscode-textBlockQuote-background);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
        .message pre {
          background: var(--vscode-textCodeBlock-background);
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 8px 0;
        }
        .thinking {
          display: none;
          padding: 12px 16px;
          color: var(--vscode-descriptionForeground);
          font-style: italic;
        }
        .thinking.active { display: block; }
        .input-area {
          padding: 16px 20px;
          border-top: 1px solid var(--vscode-panel-border);
          display: flex;
          gap: 10px;
        }
        #messageInput {
          flex: 1;
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          padding: 10px 12px;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
          resize: none;
          min-height: 40px;
          max-height: 120px;
        }
        #messageInput:focus {
          outline: none;
          border-color: var(--vscode-focusBorder);
        }
        #sendButton {
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }
        #sendButton:hover { background: var(--vscode-button-hoverBackground); }
        #sendButton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--vscode-descriptionForeground);
        }
        .empty-state h3 { margin-bottom: 12px; font-size: 18px; }
        .empty-state p { margin-bottom: 8px; line-height: 1.6; }
        .empty-state .examples {
          margin-top: 24px;
          text-align: left;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        .example {
          background: var(--vscode-editor-inactiveSelectionBackground);
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .example:hover { background: var(--vscode-list-hoverBackground); }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>💬 Chat with Your Codebase</h2>
        <button class="clear-btn" onclick="clearChat()">Clear Chat</button>
      </div>

      <div class="messages" id="messages">
        <div class="empty-state">
          <h3>👋 Hello! I'm your AI coding assistant</h3>
          <p>Ask me anything about your codebase, and I'll help you understand it better.</p>
          <div class="examples">
            <p style="margin-bottom: 12px; font-weight: 600;">Try asking:</p>
            <div class="example" onclick="askExample(this)">
              How does the authentication system work?
            </div>
            <div class="example" onclick="askExample(this)">
              Explain the main components of this project
            </div>
            <div class="example" onclick="askExample(this)">
              What security vulnerabilities should I fix first?
            </div>
            <div class="example" onclick="askExample(this)">
              How can I improve the performance of my code?
            </div>
          </div>
        </div>
        <div class="thinking" id="thinking">🤔 Thinking...</div>
      </div>

      <div class="input-area">
        <textarea
          id="messageInput"
          placeholder="Ask about your codebase... (Shift+Enter for new line)"
          rows="1"
        ></textarea>
        <button id="sendButton" onclick="sendMessage()">Send</button>
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const thinkingDiv = document.getElementById('thinking');

        // Handle messages from extension
        window.addEventListener('message', event => {
          const message = event.data;
          switch (message.type) {
            case 'addMessage':
              addMessageToUI(message.message);
              break;
            case 'thinking':
              thinkingDiv.classList.toggle('active', message.isThinking);
              sendButton.disabled = message.isThinking;
              break;
            case 'clearChat':
              const emptyState = messagesDiv.querySelector('.empty-state');
              messagesDiv.innerHTML = '';
              if (emptyState) messagesDiv.appendChild(emptyState);
              break;
          }
        });

        function sendMessage() {
          const text = messageInput.value.trim();
          if (!text) return;

          vscode.postMessage({ type: 'sendMessage', text });
          messageInput.value = '';
          messageInput.style.height = 'auto';

          // Remove empty state
          const emptyState = messagesDiv.querySelector('.empty-state');
          if (emptyState) emptyState.remove();
        }

        function addMessageToUI(message) {
          const messageDiv = document.createElement('div');
          messageDiv.className = \`message \${message.role}\`;

          const contentDiv = document.createElement('div');
          contentDiv.className = 'message-content';
          contentDiv.innerHTML = formatMessage(message.content);

          messageDiv.appendChild(contentDiv);
          messagesDiv.insertBefore(messageDiv, thinkingDiv);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function formatMessage(content) {
          // Simple markdown-like formatting
          let formatted = content
            .replace(/```([\\s\\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
            .replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\*([^\\*]+)\\*/g, '<em>$1</em>');
          return formatted;
        }

        function clearChat() {
          vscode.postMessage({ type: 'clearChat' });
        }

        function askExample(element) {
          messageInput.value = element.textContent.trim();
          messageInput.focus();
        }

        // Auto-resize textarea
        messageInput.addEventListener('input', function() {
          this.style.height = 'auto';
          this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Send on Enter (Shift+Enter for new line)
        messageInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });

        // Focus input on load
        messageInput.focus();
      </script>
    </body>
    </html>`;
  }

  public dispose() {
    ChatPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
