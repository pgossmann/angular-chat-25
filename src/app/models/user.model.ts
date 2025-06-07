export interface User {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    isAuthenticated: boolean;
    preferences: UserPreferences;
  }
  
  export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: boolean;
    chatHistory: boolean;
  }
  
  export interface ChatSession {
    id: string;
    userId: string;
    startTime: Date;
    endTime?: Date;
    messageCount: number;
    isActive: boolean;
  }
  
  export const DEFAULT_USER_PREFERENCES: UserPreferences = {
    theme: 'light',
    language: 'en',
    notifications: true,
    chatHistory: true
  };