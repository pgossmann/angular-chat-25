import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message, MessageHistory } from '../models/message.model';
import { ChatConfig, WidgetAppearance, SystemPromptConfig, DEFAULT_CHAT_CONFIG, DEFAULT_APPEARANCE, PromptTemplate } from '../models/chat-config.model';
import { User, ChatSession, DEFAULT_USER_PREFERENCES } from '../models/user.model';
import { AiService } from '../ai';

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

  // System prompts configuration
  private systemPrompts: { [key: string]: string } = {
    helpful: "You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and useful responses. Be concise but thorough.",
    expert: "You are a technical expert with deep knowledge across multiple domains. Provide detailed, accurate technical information. Use examples and explain complex concepts clearly.",
    creative: "You are a creative AI assistant who thinks outside the box. Be imaginative, inspiring, and help users explore creative solutions. Use metaphors and storytelling when appropriate.",
    teacher: "You are a patient and encouraging teacher. Break down complex topics into simple steps. Always ask if the user understands and needs clarification. Use analogies to explain difficult concepts."
  };

  private selectedSystemPrompt = 'helpful';
  private customSystemPrompt = '';

  // Session management
  private currentSessionId: string = this.generateSessionId();

  constructor(private aiService: AiService) {
    this.initializeDefaultUser();
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

      // Build enhanced prompt
      const enhancedPrompt = this.buildEnhancedPrompt(content);

      // Stream the response
      const stream = await this.aiService.generateStreamResponse(enhancedPrompt);
      
      for await (const chunk of stream) {
        aiMessage.content += chunk;
        this.updateMessage(aiMessage);
      }

      // Mark streaming as complete
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
    this.selectedSystemPrompt = promptType;
  }

  setCustomSystemPrompt(prompt: string): void {
    this.customSystemPrompt = prompt;
  }

  getAvailablePrompts(): PromptTemplate[] {
    return [
      { id: 'helpful', name: 'Helpful Assistant', description: 'General purpose helpful AI assistant' },
      { id: 'expert', name: 'Technical Expert', description: 'Deep technical knowledge and expertise' },
      { id: 'creative', name: 'Creative Writer', description: 'Creative and imaginative responses' },
      { id: 'teacher', name: 'Patient Teacher', description: 'Educational and step-by-step explanations' },
      { id: 'custom', name: 'Custom', description: 'Your own custom system prompt' }
    ];
  }

  private buildEnhancedPrompt(userInput: string): string {
    let prompt = '';

    // Get system prompt
    const systemPrompt = this.selectedSystemPrompt === 'custom' 
      ? this.customSystemPrompt 
      : this.systemPrompts[this.selectedSystemPrompt];
    
    prompt += systemPrompt;

    // Add conversation context (last 6 messages)
    const recentMessages = this._messages()
      .filter(m => !m.isStreaming && !m.error)
      .slice(-6)
      .map(m => `${m.isUser ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
    
    if (recentMessages) {
      prompt += `\n\nRecent conversation context:\n${recentMessages}`;
    }

    // Add current user input
    prompt += `\n\nUser: ${userInput}\n\nAssistant:`;

    return prompt;
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
}