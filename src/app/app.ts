import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FloatingRobotComponent } from './components/floating-robot/floating-robot.component';
import { ChatOverlayComponent } from './components/chat-overlay/chat-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FloatingRobotComponent, ChatOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App {
  protected title = 'angular-chat-25';
}