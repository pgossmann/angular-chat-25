import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../ai';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <!-- Header with System Prompt Controls -->
      <div class="chat-header">
        <h2>AI Chat Assistant</h2>
        <div class="system-prompt-section">
          <label for="systemPrompt">System Instructions:</label>
          <select [(ngModel)]="selectedSystemPrompt" (change)="onSystemPromptChange()" id="systemPrompt">
            <option value="helpful">Helpful Assistant</option>
            <option value="expert">Technical Expert</option>
            <option value="creative">Creative Writer</option>
            <option value="teacher">Patient Teacher</option>
            <option value="custom">Custom...</option>
          </select>
          
          @if (selectedSystemPrompt === 'custom') {
            <textarea 
              [(ngModel)]="customSystemPrompt" 
              placeholder="Enter your custom system prompt..."
              class="custom-prompt-input"
              rows="2">
            </textarea>
          }
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" #chatMessages>
        @if (messages.length === 0) {
          <div class="empty-state">
            <h3>👋 Start a conversation!</h3>
            <p>Your AI assistant is ready to help. The current persona is: <strong>{{ getCurrentPersonaName() }}</strong></p>
          </div>
        }
        
        @for (message of messages; track message.id) {
          <div class="message" [class.user-message]="message.isUser" [class.ai-message]="!message.isUser">
            <div class="message-avatar">
              {{ message.isUser ? '👤' : '🤖' }}
            </div>
            <div class="message-content">
              <div class="message-text" [class.streaming]="message.isStreaming">
                {{ message.content }}
                @if (message.isStreaming) {
                  <span class="cursor">|</span>
                }
              </div>
              <div class="message-time">
                {{ message.timestamp | date:'short' }}
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Chat Input -->
      <div class="chat-input-container">
        <div class="input-wrapper">
          <textarea 
            [(ngModel)]="currentMessage"
            (keydown)="onKeyDown($event)"
            placeholder="Type your message... (Shift+Enter for new line, Enter to send)"
            class="chat-input"
            rows="1"
            [disabled]="isLoading"
            #messageInput>
          </textarea>
          <button 
            (click)="sendMessage()" 
            [disabled]="!currentMessage.trim() || isLoading"
            class="send-button">
            @if (isLoading) {
              <span class="loading-spinner">⏳</span>
            } @else {
              📤
            }
          </button>
        </div>
        <div class="input-footer">
          <span class="char-count">{{ currentMessage.length }}/2000</span>
          @if (isLoading) {
            <span class="status">AI is thinking...</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 800px;
      margin: 0 auto;
      background: #f5f5f5;
    }

    .chat-header {
      background: white;
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .chat-header h2 {
      margin: 0 0 1rem 0;
      color: #1976d2;
    }

    .system-prompt-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .system-prompt-section label {
      font-weight: 500;
      color: #666;
    }

    .system-prompt-section select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .custom-prompt-input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: vertical;
      font-family: inherit;
      font-size: 14px;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .empty-state {
      text-align: center;
      color: #666;
      margin-top: 2rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
    }

    .message {
      display: flex;
      gap: 0.75rem;
      max-width: 80%;
    }

    .user-message {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .ai-message {
      align-self: flex-start;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .user-message .message-avatar {
      background: #1976d2;
    }

    .ai-message .message-avatar {
      background: #4caf50;
    }

    .message-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .message-text {
      background: white;
      padding: 0.75rem 1rem;
      border-radius: 1rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .user-message .message-text {
      background: #1976d2;
      color: white;
    }

    .message-text.streaming {
      position: relative;
    }

    .cursor {
      animation: blink 1s infinite;
      font-weight: bold;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    .message-time {
      font-size: 0.75rem;
      color: #666;
      align-self: flex-end;
    }

    .user-message .message-time {
      align-self: flex-start;
    }

    .chat-input-container {
      background: white;
      border-top: 1px solid #e0e0e0;
      padding: 1rem;
    }

    .input-wrapper {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .chat-input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 1rem;
      resize: none;
      font-family: inherit;
      font-size: 14px;
      max-height: 120px;
      min-height: 40px;
    }

    .chat-input:focus {
      outline: none;
      border-color: #1976d2;
    }

    .send-button {
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: background 0.3s;
    }

    .send-button:hover:not(:disabled) {
      background: #1565c0;
    }

    .send-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .input-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #666;
    }

    .loading-spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .status {
      font-style: italic;
    }
  `]
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('chatMessages') private chatMessages!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: Message[] = [];
  currentMessage = '';
  isLoading = false;
  selectedSystemPrompt = 'helpful';
  customSystemPrompt = '';

  private systemPrompts = {
    helpful: "You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and useful responses. Be concise but thorough.",
    expert: "You are a technical expert with deep knowledge across multiple domains. Provide detailed, accurate technical information. Use examples and explain complex concepts clearly.",
    creative: "You are a creative AI assistant who thinks outside the box. Be imaginative, inspiring, and help users explore creative solutions. Use metaphors and storytelling when appropriate.",
    teacher: "You are a patient and encouraging teacher. Break down complex topics into simple steps. Always ask if the user understands and needs clarification. Use analogies to explain difficult concepts.",
    custom: ""
  };

  constructor(private aiService: AiService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  getCurrentPersonaName(): string {
    const names = {
      helpful: 'Helpful Assistant',
      expert: 'Technical Expert', 
      creative: 'Creative Writer',
      teacher: 'Patient Teacher',
      custom: 'Custom Assistant'
    };
    return names[this.selectedSystemPrompt as keyof typeof names] || 'Assistant';
  }

  onSystemPromptChange() {
    // You could clear messages here if you want a fresh start
    // this.messages = [];
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: this.currentMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const userInput = this.currentMessage.trim();
    this.currentMessage = '';
    this.isLoading = true;

    // Create AI message placeholder
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    };

    this.messages.push(aiMessage);

    try {
      // Build full prompt with system instructions
      const systemPrompt = this.selectedSystemPrompt === 'custom' 
        ? this.customSystemPrompt 
        : this.systemPrompts[this.selectedSystemPrompt as keyof typeof this.systemPrompts];

      const fullPrompt = `${systemPrompt}\n\nUser: ${userInput}\n\nAssistant:`;

      // Stream the response
      const stream = await this.aiService.generateStreamResponse(fullPrompt);
      
      for await (const chunk of stream) {
        aiMessage.content += chunk;
      }

      aiMessage.isStreaming = false;
    } catch (error: any) {
      aiMessage.content = `Sorry, I encountered an error: ${error.message}`;
      aiMessage.isStreaming = false;
    }

    this.isLoading = false;
  }

  private scrollToBottom() {
    try {
      this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
    } catch (err) {}
  }
}