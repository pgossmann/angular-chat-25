import { Injectable, inject } from '@angular/core';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { FirebaseApp } from '@angular/fire/app';

export interface ChatRequest {
  message: string;
  promptType: string;
  conversationHistory?: Array<{
    content: string;
    isUser: boolean;
    timestamp: Date;
  }>;
}

export interface ChatResponse {
  response: string;
  promptType: string;
  timestamp: string;
  success: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecureChatService {
  private app = inject(FirebaseApp);
  private functions = getFunctions(this.app);
  
  constructor() {
    // Uncomment for local development with emulator
    // connectFunctionsEmulator(this.functions, 'localhost', 5001);
  }

  // Send secure chat message
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const secureChat = httpsCallable<ChatRequest, ChatResponse>(this.functions, 'secureChat');
    
    try {
      const result = await secureChat(request);
      return result.data;
    } catch (error: any) {
      console.error('Secure chat error:', error);
      
      // Handle specific Firebase Function errors
      if (error.code === 'functions/resource-exhausted') {
        throw new Error('Rate limit exceeded. Please wait before sending another message.');
      } else if (error.code === 'functions/invalid-argument') {
        throw new Error(error.message || 'Invalid request. Please check your message.');
      } else if (error.code === 'functions/internal') {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error('Unable to send message. Please check your connection.');
      }
    }
  }

  // Get available prompt templates
  async getPromptTemplates(): Promise<PromptTemplate[]> {
    const getTemplates = httpsCallable<void, { templates: PromptTemplate[] }>(
      this.functions, 
      'getPromptTemplates'
    );
    
    try {
      const result = await getTemplates();
      return result.data.templates;
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
      // Return fallback templates if server is down
      return [
        { id: 'helpful', name: 'Helpful Assistant', description: 'General purpose assistant' },
        { id: 'expert', name: 'Technical Expert', description: 'Technical expertise' },
        { id: 'creative', name: 'Creative Assistant', description: 'Creative solutions' },
        { id: 'teacher', name: 'Patient Teacher', description: 'Educational guidance' }
      ];
    }
  }

  // Health check for monitoring
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const health = httpsCallable<void, { status: string; timestamp: string }>(
      this.functions, 
      'healthCheck'
    );
    
    try {
      const result = await health();
      return result.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}