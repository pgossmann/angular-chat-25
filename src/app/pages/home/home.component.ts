import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/shared/header/header.component';
import { FooterComponent } from '../../components/shared/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  features = [
    {
      icon: '🧠',
      title: 'AI Chat Integration',
      description: 'Testing different AI models and prompt strategies in a web interface'
    },
    {
      icon: '⚡',
      title: 'Streaming Responses',
      description: 'Real-time text streaming for better user experience'
    },
    {
      icon: '🔮',
      title: 'Modern Stack',
      description: 'Built with Angular 20, Firebase, and current web standards'
    }
  ];

  techStack = [
    { name: 'Angular 20', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Firebase', category: 'Backend' },
    { name: 'Gemini AI', category: 'AI Model' },
    { name: 'Bootstrap 5', category: 'Styling' },
    { name: 'SCSS', category: 'Styling' }
  ];
}