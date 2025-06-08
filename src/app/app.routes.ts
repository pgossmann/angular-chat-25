import { Routes } from '@angular/router';
import { PlaygroundComponent } from './pages/playground/playground.component';
import { HomeComponent } from './pages/home/home.component';


export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        title: 'AI Exploration - Home'
    },
    {
        path: 'playground',
        component: PlaygroundComponent,
        title: 'AI Exploration - Playground'
    },
    {
        path: '**',
        redirectTo: ''
    }
];