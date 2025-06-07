import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatComponent } from "./chat/chat";

@Component({
  selector: 'app-root',
  template: `
    <app-chat></app-chat>
    <router-outlet />
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `],
  imports: [ChatComponent, RouterOutlet]
})
export class App {
  protected title = 'angular-chat-25';
}