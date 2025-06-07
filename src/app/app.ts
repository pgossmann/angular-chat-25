import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AiService } from './ai';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="container">
      <h1>Angular Chat 25 🤖</h1>
      <p>Firebase AI Logic: <span class="status">Connected ✅</span></p>
      
      <div class="test-section">
        <button (click)="testAI()" [disabled]="testing" class="test-btn">
          {{ testing ? 'Testing AI...' : 'Test AI Connection' }}
        </button>
        
        <button (click)="testStream()" [disabled]="streaming" class="test-btn stream">
          {{ streaming ? 'Streaming...' : 'Test Streaming' }}
        </button>
      </div>
      
      <div *ngIf="aiResponse" class="ai-response">
        <strong>AI Response:</strong><br>
        {{ aiResponse }}
      </div>
      <div *ngIf="!aiResponse" class="instruction">
        👆 Click a button above to test the AI connection!
      </div>
      
      <div *ngIf="streamResponse" class="stream-response">
        <strong>Streaming Response:</strong><br>
        {{ streamResponse }}
      </div>
      
      <div *ngIf="error" class="error">
        <strong>Error:</strong> {{ error }}
      </div>
      
      <router-outlet />
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      text-align: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .status { 
      font-weight: bold; 
      color: #4CAF50; 
    }
    
    .test-section {
      margin: 2rem 0;
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .test-btn {
      background: #1976d2;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      min-width: 150px;
      transition: background 0.3s;
    }
    
    .test-btn:hover:not(:disabled) {
      background: #1565c0;
    }
    
    .test-btn:disabled { 
      background: #ccc; 
      cursor: not-allowed; 
    }
    
    .test-btn.stream {
      background: #7b1fa2;
    }
    
    .test-btn.stream:hover:not(:disabled) {
      background: #6a1b9a;
    }
    
    .ai-response, .stream-response {
      margin: 1rem 0;
      padding: 1rem;
      background: #e8f5e8;
      border-radius: 8px;
      text-align: left;
      border-left: 4px solid #4CAF50;
      white-space: pre-wrap;
    }
    
    .stream-response {
      background: #f3e5f5;
      border-left-color: #7b1fa2;
    }
    
    .instruction {
      margin: 1rem 0;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      color: #1976d2;
      border-left: 4px solid #2196f3;
    }
    
    .error {
      margin: 1rem 0;
      padding: 1rem;
      background: #ffebee;
      border-radius: 8px;
      text-align: left;
      border-left: 4px solid #f44336;
      color: #c62828;
    }
  `]
})
export class App {
  protected title = 'angular-chat-25';
  testing = false;
  streaming = false;
  aiResponse = '';
  streamResponse = '';
  error = '';

  constructor(private aiService: AiService) {}

  async testAI() {
    this.testing = true;
    this.error = '';
    this.aiResponse = '';
    this.streamResponse = ''; // Clear previous stream
    
    try {
      this.aiResponse = await this.aiService.generateResponse(
        'Hello! Please introduce yourself as an AI assistant and say something friendly about helping with Angular development.'
      );
    } catch (error: any) {
      this.error = error.message || 'Unknown error occurred';
      console.error('AI Test Error:', error);
    }
    
    this.testing = false;
  }

  async testStream() {
    this.streaming = true;
    this.error = '';
    this.streamResponse = '';
    this.aiResponse = ''; // Clear previous response
    
    try {
      const stream = await this.aiService.generateStreamResponse(
        'Write a short poem about Angular and TypeScript development. Make it fun and creative!'
      );
      
      for await (const chunk of stream) {
        this.streamResponse += chunk;
      }
    } catch (error: any) {
      this.error = error.message || 'Streaming error occurred';
      console.error('Streaming Test Error:', error);
    }
    
    this.streaming = false;
  }
}