import { Component, computed, inject, ViewChild, ElementRef, AfterViewChecked, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { ChatWidgetService } from '../../services/chat-widget.service';

@Component({
  selector: 'app-chat-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './chat-overlay.component.html',
  styleUrl: './chat-overlay.component.scss'
})
export class ChatOverlayComponent implements AfterViewChecked, OnChanges {
  @ViewChild('chatMessages') private chatMessages!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  // Input properties for embedded mode
  @Input() show: boolean = true;
  @Input() embedded: boolean = false;
  @Input() systemPrompt: string = '';
  @Input() contextData: string = '';
  @Input() disabled: boolean = false;

  private chatService = inject(ChatWidgetService);

  // Reactive properties from service
  isOpen = this.chatService.isOpen;
  isLoading = this.chatService.isLoading;
  messages = this.chatService.messages;
  appearance = this.chatService.appearance;
  config = this.chatService.config;

  // Local component state
  currentMessage = '';
  selectedPromptType = 'helpful';
  customPrompt = '';
  useStreaming = true; // Toggle for streaming vs non-streaming

  // REACTIVE PROMPTS
  availablePrompts = this.chatService.availablePrompts;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update system prompt when it changes from parent
    if (changes['systemPrompt'] && this.systemPrompt) {
      this.chatService.setCustomSystemPrompt(this.systemPrompt);
      this.selectedPromptType = 'custom';
      this.customPrompt = this.systemPrompt;
    }
  }

  onCloseChat(): void {
    this.chatService.closeWidget();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage(): Promise<void> {
    if (!this.currentMessage.trim() || this.isLoading() || this.disabled) return;

    const message = this.currentMessage.trim();
    this.currentMessage = '';

    if (this.embedded) {
      // In embedded mode, use test lab methods with custom system prompt and context
      if (this.useStreaming) {
        await this.chatService.sendTestLabStreamingMessage(
          message,
          this.systemPrompt?.trim() || undefined,
          this.contextData?.trim() || undefined
        );
      } else {
        await this.chatService.sendTestLabMessage(
          message,
          this.systemPrompt?.trim() || undefined,
          this.contextData?.trim() || undefined
        );
      }
    } else {
      // In normal mode, use regular methods with predefined prompts
      this.chatService.setSystemPrompt(this.selectedPromptType);
      if (this.selectedPromptType === 'custom') {
        this.chatService.setCustomSystemPrompt(this.customPrompt);
      }

      if (this.useStreaming) {
        await this.chatService.sendStreamingMessage(message);
      } else {
        await this.chatService.sendMessage(message);
      }
    }
  }

  clearChat(): void {
    this.chatService.clearMessages();
  }

  onPromptTypeChange(): void {
    this.chatService.setSystemPrompt(this.selectedPromptType);
  }

  toggleStreaming(): void {
    this.useStreaming = !this.useStreaming;
  }

  private scrollToBottom(): void {
    try {
      if (this.chatMessages) {
        this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      }
    } catch (err) {
      // Ignore scrolling errors
    }
  }

  // Helper method to get current prompt name
  getCurrentPromptName(): string {
    const prompt = this.availablePrompts().find(p => p.id === this.selectedPromptType);
    return prompt?.name || 'Assistant';
  }

  // TrackBy function for better performance
  trackByMessageId(index: number, message: any): string {
    return message?.id || index.toString();
  }

  // Auto-resize textarea based on content
  adjustTextareaHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  // Method to safely render streaming markdown
  getMarkdownContent(content: string, isStreaming: boolean): string {
    if (!content) return '';
    
    // For streaming content, we might have incomplete markdown
    // This helps handle partial markdown gracefully
    if (isStreaming) {
      // Simple cleanup for streaming content
      return content;
    }
    
    return content;
  }
}