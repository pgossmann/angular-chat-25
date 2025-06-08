import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message, MessageHistory } from '../models/message.model';
import { ChatConfig, WidgetAppearance, SystemPromptConfig, DEFAULT_CHAT_CONFIG, DEFAULT_APPEARANCE, PromptTemplate } from '../models/chat-config.model';
import { User, ChatSession, DEFAULT_USER_PREFERENCES } from '../models/user.model';
import { SecureChatService } from './secure-chat.service';

@Injectable({
  providedIn: 'root'
})
export class ChatWidgetService {
  // Signals for reactive state management
  private _isOpen = signal(false);
  private _isLoading = signal(false);
  private _messages = signal<Message[]>([]);
  private _config = signal<ChatConfig>(DEFAULT_CHAT_CONFIG);
  private _appearance = signal<WidgetAppearance>(DEFAULT_APPEARANCE);
  private _currentUser = signal<User | null>(null);
  private _hasUnreadMessages = signal(false);

  // Computed values
  readonly isOpen = computed(() => this._isOpen());
  readonly isLoading = computed(() => this._isLoading());
  readonly messages = computed(() => this._messages());
  readonly config = computed(() => this._config());
  readonly appearance = computed(() => this._appearance());
  readonly currentUser = computed(() => this._currentUser());
  readonly hasUnreadMessages = computed(() => this._hasUnreadMessages());
  readonly messageCount = computed(() => this._messages().length);
  readonly lastMessage = computed(() => {
    const msgs = this._messages();
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  });

  // System prompts configuration - now loaded from server
  private availablePrompts = signal<PromptTemplate[]>([]);
  private selectedSystemPrompt = 'helpful';

  // Session management
  private currentSessionId: string = this.generateSessionId();

  constructor(private secureChatService: SecureChatService) {
    this.initializeDefaultUser();
    this.loadPromptTemplates();
  }

  // Widget state management
  toggleWidget(): void {
    this._isOpen.update(current => !current);
    if (this._isOpen()) {
      this._hasUnreadMessages.set(false);
    }
  }

  openWidget(): void {
    this._isOpen.set(true);
    this._hasUnreadMessages.set(false);
  }

  closeWidget(): void {
    this._isOpen.set(false);
  }

  // Message management
  async sendMessage(content: string): Promise<void> {
    if (!content.trim() || this._isLoading()) return;

    // Add user message
    const userMessage: Message = {
      id: this.generateMessageId(),
      content: content.trim(),
      isUser: true,
      timestamp: new Date()
    };

    this.addMessage(userMessage);
    this._isLoading.set(true);

    try {
      // Create AI message placeholder
      const aiMessage: Message = {
        id: this.generateMessageId(),
        content: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true
      };

      this.addMessage(aiMessage);

      // Prepare conversation history for context
      const conversationHistory = this._messages()
        .filter(m => !m.isStreaming && !m.error)
        .slice(-6)
        .map(m => ({
          content: m.content,
          isUser: m.isUser,
          timestamp: m.timestamp
        }));

      // Send secure chat request
      const response = await this.secureChatService.sendMessage({
        message: content,
        promptType: this.selectedSystemPrompt,
        conversationHistory
      });

      // Update AI message with response
      aiMessage.content = response.response;
      aiMessage.isStreaming = false;
      this.updateMessage(aiMessage);

      // Mark as unread if widget is closed
      if (!this._isOpen()) {
        this._hasUnreadMessages.set(true);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: this.generateMessageId(),
        content: `Sorry, I encountered an error: ${error.message}`,
        isUser: false,
        timestamp: new Date(),
        error: true
      };
      
      // Remove the streaming placeholder and add error message
      this._messages.update(current => current.filter(m => !m.isStreaming));
      this.addMessage(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }

  private addMessage(message: Message): void {
    // Ensure message has an ID
    if (!message.id) {
      message.id = this.generateMessageId();
    }
    this._messages.update(current => [...current, message]);
  }

  private updateMessage(updatedMessage: Message): void {
    this._messages.update(current => 
      current.map(msg => msg.id === updatedMessage.id ? { ...updatedMessage } : msg)
    );
  }

  clearMessages(): void {
    this._messages.set([]);
    this.currentSessionId = this.generateSessionId();
  }

  // System prompt management
  setSystemPrompt(promptType: string): void {
    const availablePromptIds = this.availablePrompts().map(p => p.id);
    if (availablePromptIds.includes(promptType) || promptType === 'custom') {
      this.selectedSystemPrompt = promptType;
    } else {
      console.warn(`Invalid prompt type: ${promptType}. Using default 'helpful'.`);
      this.selectedSystemPrompt = 'helpful';
    }
  }

  setCustomSystemPrompt(prompt: string): void {
    // Store custom prompt - this will be sent to server when promptType is 'custom'
    // Note: Server should handle the actual custom prompt logic
    console.log('Custom prompt set:', prompt);
  }

  getCurrentSystemPrompt(): string {
    return this.selectedSystemPrompt;
  }

  getAvailablePrompts(): PromptTemplate[] {
    return this.availablePrompts();
  }

  // Load prompt templates from server
  private async loadPromptTemplates(): Promise<void> {
    try {
      const templates = await this.secureChatService.getPromptTemplates();
      this.availablePrompts.set(templates);
    } catch (error) {
      console.error('Failed to load prompt templates:', error);
      // Use fallback templates
      this.availablePrompts.set([
        { id: 'helpful', name: 'Helpful Assistant', description: 'General purpose assistant' }
      ]);
    }
  }

  // Configuration management
  updateConfig(config: Partial<ChatConfig>): void {
    this._config.update(current => ({ ...current, ...config }));
  }

  updateAppearance(appearance: Partial<WidgetAppearance>): void {
    this._appearance.update(current => ({ ...current, ...appearance }));
  }

  // User management
  private initializeDefaultUser(): void {
    const defaultUser: User = {
      id: 'anonymous-' + Date.now(),
      isAuthenticated: false,
      preferences: DEFAULT_USER_PREFERENCES
    };
    this._currentUser.set(defaultUser);
  }

  setUser(user: User): void {
    this._currentUser.set(user);
  }

  // Utility methods
  private generateMessageId(): string {
    return 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  private generateSessionId(): string {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Export/Import chat history
  exportChatHistory(): MessageHistory {
    return {
      messages: this._messages(),
      sessionId: this.currentSessionId,
      createdAt: new Date(), // Would be actual session start time
      updatedAt: new Date()
    };
  }

  importChatHistory(history: MessageHistory): void {
    this._messages.set(history.messages);
    this.currentSessionId = history.sessionId;
  }

  // Health check method for monitoring
  async checkServiceHealth(): Promise<boolean> {
    try {
      await this.secureChatService.healthCheck();
      return true;
    } catch (error) {
      console.error('Service health check failed:', error);
      return false;
    }
  }
}