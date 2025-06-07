import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatWidgetService } from '../../services/chat-widget.service';

@Component({
  selector: 'app-floating-robot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-robot.component.html',
  styleUrl: './floating-robot.component.scss'
})
export class FloatingRobotComponent {
  private chatService = inject(ChatWidgetService);

  // Computed properties for reactive UI
  isOpen = this.chatService.isOpen;
  hasUnreadMessages = this.chatService.hasUnreadMessages;
  messageCount = this.chatService.messageCount;
  appearance = this.chatService.appearance;
  
  // Show notification badge when there are unread messages
  showNotificationBadge = computed(() => 
    this.hasUnreadMessages() && !this.isOpen()
  );

  onRobotClick(): void {
    this.chatService.toggleWidget();
  }
}