import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/shared/header/header.component';
import { FooterComponent } from '../../components/shared/footer/footer.component';
import { ChatOverlayComponent } from '../../components/chat-overlay/chat-overlay.component';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HeaderComponent, 
    FooterComponent, 
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
- Ask clarifying questions if needed
- Be professional and helpful

Please respond based on the context provided and follow these guidelines.`;

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
    console.log('System prompt updated:', this.systemPrompt);
  }

  onContextChange(): void {
    // Handle context changes
    console.log('Context updated:', this.contextData);
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
- Ask clarifying questions if needed
- Be professional and helpful

Please respond based on the context provided and follow these guidelines.`;

    this.contextData = `Context Information:
- Working on an Angular 20 project
- Using Bootstrap 5 for styling
- Firebase for backend
- TypeScript for development

Add any relevant context here for better responses.`;
  }
}