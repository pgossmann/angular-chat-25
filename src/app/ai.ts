import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai;
  private model;

  constructor() {
    // Firebase config from your app.config.ts
    const firebaseConfig = {
      apiKey: "AIzaSyBbGuEaGBfA52F5ZJmWC77WG8v0ky_hGl8",
      authDomain: "angular-chat-25.firebaseapp.com",
      projectId: "angular-chat-25",
      storageBucket: "angular-chat-25.firebasestorage.app",
      messagingSenderId: "613881772696",
      appId: "1:613881772696:web:c548fb8176d9dd85c56eed",
      measurementId: "G-BYH0NMK1RZ"
    };

    // Initialize Firebase App
    const firebaseApp = initializeApp(firebaseConfig, 'ai-service');
    
    // NEW API: Initialize the Gemini Developer API backend service
    this.ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
    
    // Create a GenerativeModel instance
    this.model = getGenerativeModel(this.ai, { 
      model: 'gemini-2.0-flash' 
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  async generateStreamResponse(prompt: string): Promise<AsyncIterable<string>> {
    try {
      const result = await this.model.generateContentStream(prompt);
      
      async function* streamGenerator() {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            yield chunkText;
          }
        }
      }
      
      return streamGenerator();
    } catch (error) {
      console.error('AI streaming error:', error);
      throw error;
    }
  }
}