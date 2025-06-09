import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/shared/header/header.component';
import { ChatOverlayComponent } from '../../components/chat-overlay/chat-overlay.component';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HeaderComponent, 
    ChatOverlayComponent
  ],
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss'
})
export class TestComponent implements OnInit {
  systemPrompt: string = `You are a helpful AI assistant focused on software development.

Guidelines:
- Provide clear, concise responses
- Include code examples when relevant
- Be professional and helpful

Please respond based on the context provided.`;

  contextData: string = `Context Information:
- Working on an Angular 20 project
- Using Bootstrap 5 for styling
- Firebase for backend
- TypeScript for development

Add any relevant context here for better responses.`;

  isChatVisible: boolean = true;

  constructor() {}

  ngOnInit(): void {
    // Initialize component
  }

  onSystemPromptChange(): void {
    // Handle system prompt changes
    if (this.systemPrompt.length > 2000) {
      console.warn('System prompt exceeds 2000 character limit');
    }
  }

  onContextChange(): void {
    // Handle context changes
    if (this.contextData.length > 10000) {
      console.warn('Context data exceeds 10000 character limit');
    }
  }

  isValidForChat(): boolean {
    return this.systemPrompt.length <= 2000 && this.contextData.length <= 10000;
  }

  clearSystemPrompt(): void {
    this.systemPrompt = '';
  }

  clearContext(): void {
    this.contextData = '';
  }

  resetToDefaults(): void {
    this.systemPrompt = `You are a helpful AI assistant focused on software development.

Guidelines:
- Provide clear, concise responses
- Include code examples when relevant
- Be professional and helpful

Please respond based on the context provided.`;

    this.contextData = `Context Information:
- Working on an Angular 20 project
- Using Bootstrap 5 for styling
- Firebase for backend
- TypeScript for development

Add any relevant context here for better responses.`;
  }

  getCharacterCountClass(currentLength: number, maxLength: number): string {
    const percentage = (currentLength / maxLength) * 100;
    
    if (currentLength > maxLength) {
      return 'text-danger';
    } else if (percentage > 90) {
      return 'text-warning';
    } else if (percentage > 75) {
      return 'text-info';
    } else {
      return 'text-muted';
    }
  }
}