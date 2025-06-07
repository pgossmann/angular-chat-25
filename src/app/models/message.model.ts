export interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    isStreaming?: boolean;
    error?: boolean;
  }
  
  export interface MessageHistory {
    messages: Message[];
    sessionId: string;
    createdAt: Date;
    updatedAt: Date;
  }