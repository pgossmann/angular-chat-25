export interface ChatConfig {
    isOpen: boolean;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme: 'light' | 'dark' | 'auto';
    maxMessages: number;
    enableSound: boolean;
    autoScroll: boolean;
  }
  
  export interface WidgetAppearance {
    primaryColor: string;
    secondaryColor: string;
    robotIcon: string;
    title: string;
    subtitle: string;
    placeholder: string;
  }
  
  export interface SystemPromptConfig {
    selectedPrompt: string;
    customPrompt: string;
    availablePrompts: PromptTemplate[];
  }
  
  export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    systemPrompt?: string; // Hidden from client-side
  }
  
  export const DEFAULT_CHAT_CONFIG: ChatConfig = {
    isOpen: false,
    position: 'bottom-right',
    theme: 'light',
    maxMessages: 100,
    enableSound: false,
    autoScroll: true
  };
  
  export const DEFAULT_APPEARANCE: WidgetAppearance = {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d', 
    robotIcon: '🤖',
    title: 'AI Assistant',
    subtitle: 'How can I help you today?',
    placeholder: 'Type your message...'
  };