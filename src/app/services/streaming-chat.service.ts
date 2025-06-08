import { Injectable, inject, resource, signal } from '@angular/core';

export interface ChatRequest {
  message: string;
  promptType: string;
  conversationHistory?: Array<{
    content: string;
    isUser: boolean;
    timestamp: Date;
  }>;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class StreamingChatService {
  // Your Firebase Functions base URL
  private readonly baseUrl = 'https://us-central1-angular-chat-25.cloudfunctions.net';
  
  // Text decoder for streaming
  private decoder = new TextDecoder();

  // Send streaming message using simplified approach (not Angular resource API)
  async createStreamingChat(request: ChatRequest, onChunk: (chunk: string) => void, onComplete: () => void, onError: (error: string) => void) {
    try {
      const response = await fetch(`${this.baseUrl}/streamChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        onError(errorData.error || 'Request failed');
        return;
      }

      if (!response.body) {
        onError('No response body');
        return;
      }

      // Create a reader for the response stream
      const reader = response.body.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            onComplete();
            break;
          }

          // Decode the chunk and call the callback
          const chunkText = this.decoder.decode(value);
          if (chunkText) {
            onChunk(chunkText);
          }
        }
      } catch (streamError) {
        console.error('Stream reading error:', streamError);
        onError('Stream reading failed');
      } finally {
        reader.releaseLock();
      }

    } catch (error: any) {
      console.error('Fetch error:', error);
      onError(error.message || 'Network error');
    }
  }

  // Fallback non-streaming chat
  async sendMessage(request: ChatRequest): Promise<{ response: string; promptType: string; timestamp: string; success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Non-streaming chat error:', error);
      throw error;
    }
  }

  // Get available prompt templates
  async getPromptTemplates(): Promise<PromptTemplate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/getPromptTemplates`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      return data.templates;
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
    try {
      const response = await fetch(`${this.baseUrl}/healthCheck`);
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}