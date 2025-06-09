import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message, MessageHistory } from '../models/message.model';
import { ChatConfig, WidgetAppearance, SystemPromptConfig, DEFAULT_CHAT_CONFIG, DEFAULT_APPEARANCE, PromptTemplate } from '../models/chat-config.model';
import { User, ChatSession, DEFAULT_USER_PREFERENCES } from '../models/user.model';
import { ChatRequest, StreamingChatService, TestLabRequest } from './streaming-chat.service';

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
  private _availablePrompts = signal<PromptTemplate[]>([]);

  // PUBLIC REACTIVE PROMPTS
  readonly availablePrompts = computed(() => this._availablePrompts());

  private selectedSystemPrompt = 'helpful';

  // Session management
  private currentSessionId: string = this.generateSessionId();

  // Track current streaming message
  private currentStreamingMessageId: string | null = null;

  constructor(private streamingChatService: StreamingChatService) {
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

  // STREAMING MESSAGE MANAGEMENT
  async sendStreamingMessage(content: string): Promise<void> {
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

    // Create AI message placeholder
    const aiMessage: Message = {
      id: this.generateMessageId(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    };

    this.addMessage(aiMessage);
    this.currentStreamingMessageId = aiMessage.id;

    try {
      // Prepare conversation history for context
      const conversationHistory = this._messages()
        .filter(m => !m.isStreaming && !m.error)
        .slice(-6)
        .map(m => ({
          content: m.content,
          isUser: m.isUser,
          timestamp: m.timestamp
        }));

      // Create streaming request
      const request: ChatRequest = {
        message: content,
        promptType: this.selectedSystemPrompt,
        conversationHistory
      };

      // Start streaming with callbacks
      await this.streamingChatService.createStreamingChat(
        request,
        // onChunk callback
        (chunk: string) => {
          aiMessage.content += chunk;
          this.updateMessage(aiMessage);
        },
        // onComplete callback
        () => {
          aiMessage.isStreaming = false;
          this.updateMessage(aiMessage);
          this.currentStreamingMessageId = null;
          this._isLoading.set(false);

          // Mark as unread if widget is closed
          if (!this._isOpen()) {
            this._hasUnreadMessages.set(true);
          }
        },
        // onError callback
        (error: string) => {
          this.handleStreamingError(aiMessage.id, error);
          this._isLoading.set(false);
        }
      );

    } catch (error: any) {
      console.error('Streaming chat error:', error);
      this.handleStreamingError(aiMessage.id, error.message);
      this._isLoading.set(false);
    }
  }

  // FALLBACK NON-STREAMING MESSAGE
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

      // Send non-streaming request
      const response = await this.streamingChatService.sendMessage({
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
      this.handleStreamingError(this.currentStreamingMessageId, error.message);
    } finally {
      this._isLoading.set(false);
    }
  }

  // 🧪 TEST LAB: Streaming message with custom system prompt and context
  async sendTestLabStreamingMessage(
    content: string, 
    systemPrompt?: string, 
    contextData?: string
  ): Promise<void> {
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

    // Create AI message placeholder
    const aiMessage: Message = {
      id: this.generateMessageId(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    };

    this.addMessage(aiMessage);
    this.currentStreamingMessageId = aiMessage.id;

    try {
      // Prepare conversation history for context
      const conversationHistory = this._messages()
        .filter(m => !m.isStreaming && !m.error)
        .slice(-6)
        .map(m => ({
          content: m.content,
          isUser: m.isUser,
          timestamp: m.timestamp
        }));

      // Create test lab streaming request
      const request: TestLabRequest = {
        message: content,
        systemPrompt: systemPrompt || undefined,
        contextData: contextData || undefined,
        conversationHistory
      };

      // Start streaming with callbacks
      await this.streamingChatService.createTestLabStreamingChat(
        request,
        // onChunk callback
        (chunk: string) => {
          aiMessage.content += chunk;
          this.updateMessage(aiMessage);
        },
        // onComplete callback
        () => {
          aiMessage.isStreaming = false;
          this.updateMessage(aiMessage);
          this.currentStreamingMessageId = null;
          this._isLoading.set(false);

          // Mark as unread if widget is closed
          if (!this._isOpen()) {
            this._hasUnreadMessages.set(true);
          }
        },
        // onError callback
        (error: string) => {
          this.handleStreamingError(aiMessage.id, error);
          this._isLoading.set(false);
        }
      );

    } catch (error: any) {
      console.error('Test Lab streaming chat error:', error);
      this.handleStreamingError(aiMessage.id, error.message);
      this._isLoading.set(false);
    }
  }

  // 🧪 TEST LAB: Non-streaming message with custom system prompt and context
  async sendTestLabMessage(
    content: string, 
    systemPrompt?: string, 
    contextData?: string
  ): Promise<void> {
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

      // Send test lab non-streaming request
      const response = await this.streamingChatService.sendTestLabMessage({
        message: content,
        systemPrompt: systemPrompt || undefined,
        contextData: contextData || undefined,
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
      console.error('Test Lab chat error:', error);
      this.handleStreamingError(this.currentStreamingMessageId, error.message);
    } finally {
      this._isLoading.set(false);
    }
  }

  private handleStreamingError(messageId: string | null, errorMessage: string): void {
    if (messageId) {
      // Remove the streaming placeholder
      this._messages.update(current => current.filter(m => m.id !== messageId));
    }

    // Add error message
    const errorMsg: Message = {
      id: this.generateMessageId(),
      content: `Sorry, I encountered an error: ${errorMessage}`,
      isUser: false,
      timestamp: new Date(),
      error: true
    };

    this.addMessage(errorMsg);
    this.currentStreamingMessageId = null;
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
    this.currentStreamingMessageId = null;
  }

  // System prompt management
  setSystemPrompt(promptType: string): void {
    const availablePromptIds = this._availablePrompts().map(p => p.id);
    if (availablePromptIds.includes(promptType) || promptType === 'custom') {
      this.selectedSystemPrompt = promptType;
    } else {
      console.warn(`Invalid prompt type: ${promptType}. Using default 'helpful'.`);
      this.selectedSystemPrompt = 'helpful';
    }
  }

  setCustomSystemPrompt(prompt: string): void {
    // Store custom prompt - this will be sent to server when promptType is 'custom'
    console.log('Custom prompt set:', prompt);
  }

  getCurrentSystemPrompt(): string {
    return this.selectedSystemPrompt;
  }

  // DEPRECATED: Keep for backward compatibility
  getAvailablePrompts(): PromptTemplate[] {
    return this._availablePrompts();
  }

  // Load prompt templates from server
  private async loadPromptTemplates(): Promise<void> {
    try {
      const templates = await this.streamingChatService.getPromptTemplates();

      // Add custom option to server templates
      const allTemplates = [
        ...templates,
        { id: 'custom', name: 'Custom Prompt', description: 'Use your own system prompt' }
      ];

      // UPDATE THE SIGNAL - this will trigger reactivity
      this._availablePrompts.set(allTemplates);
    } catch (error) {
      console.error('Failed to load prompt templates:', error);
      // Use fallback templates
      this._availablePrompts.set([
        { id: 'helpful', name: 'Helpful Assistant', description: 'General purpose assistant' },
        { id: 'expert', name: 'Technical Expert', description: 'Technical expertise' },
        { id: 'creative', name: 'Creative Assistant', description: 'Creative solutions' },
        { id: 'teacher', name: 'Patient Teacher', description: 'Educational guidance' },
        { id: 'custom', name: 'Custom Prompt', description: 'Use your own system prompt' }
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
      createdAt: new Date(),
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
      await this.streamingChatService.healthCheck();
      return true;
    } catch (error) {
      console.error('Service health check failed:', error);
      return false;
    }
  }
}