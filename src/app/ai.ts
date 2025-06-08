import { Injectable, inject } from '@angular/core';
import { SecureChatService, ChatRequest } from './services/secure-chat.service';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private secureChatService = inject(SecureChatService);

  async generateResponse(prompt: string, promptType: string = 'helpful'): Promise<string> {
    try {
      const request: ChatRequest = {
        message: prompt,
        promptType: promptType
      };
      
      const response = await this.secureChatService.sendMessage(request);
      return response.response;
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  // Note: Streaming requires WebSocket/SSE implementation on Functions side
  async generateStreamResponse(prompt: string, promptType: string = 'helpful'): Promise<AsyncIterable<string>> {
    throw new Error('Streaming is not supported with the secure Firebase Functions approach. Use generateResponse() instead.');
  }
}