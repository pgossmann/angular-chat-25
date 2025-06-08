import { Component, computed, inject, HostListener } from '@angular/core';
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
  
  // Check if we're on mobile
  isMobile = computed(() => window.innerWidth <= 768);
  
  // Show notification badge when there are unread messages
  showNotificationBadge = computed(() => 
    this.hasUnreadMessages() && !this.isOpen()
  );

  // Hide robot on mobile when chat is open
  shouldHideOnMobile = computed(() => 
    this.isMobile() && this.isOpen()
  );

  onRobotClick(): void {
    this.chatService.toggleWidget();
  }

  // Listen to window resize to update mobile state
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    // Force re-computation of isMobile signal
    // The computed signal will automatically update when window.innerWidth changes
  }
}