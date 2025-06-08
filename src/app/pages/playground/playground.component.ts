import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/shared/header/header.component';
import { FooterComponent } from '../../components/shared/footer/footer.component';
import { FloatingRobotComponent } from '../../components/floating-robot/floating-robot.component';
import { ChatOverlayComponent } from '../../components/chat-overlay/chat-overlay.component';

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [
    CommonModule, 
    HeaderComponent, 
    FooterComponent, 
    FloatingRobotComponent, 
    ChatOverlayComponent
  ],
  templateUrl: './playground.component.html',
  styleUrl: './playground.component.scss'
})
export class PlaygroundComponent {
  features = [
    {
      icon: '🤖',
      title: 'AI Personalities',
      description: 'Switch between helper, expert, creative, and teacher modes'
    },
    {
      icon: '🌊',
      title: 'Streaming Responses',
      description: 'See text appear in real-time as the AI generates it'
    },
    {
      icon: '💬',
      title: 'Context Memory',
      description: 'Chat maintains conversation history for better responses'
    },
    {
      icon: '🎨',
      title: 'Custom Prompts',
      description: 'Write your own system prompts to test different behaviors'
    }
  ];
}