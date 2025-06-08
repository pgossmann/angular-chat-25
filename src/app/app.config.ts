import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp } from '@angular/fire/app';
import { initializeApp } from "firebase/app";

import { routes } from './app.routes';
import { provideMarkdown, MarkedOptions } from 'ngx-markdown';

// Direct Firebase configuration (API key is safe for web apps)
export const firebaseConfig = {
  apiKey: "AIzaSyBbGuEaGBfA52F5ZJmWC77WG8v0ky_hGl8",
  authDomain: "angular-chat-25.firebaseapp.com",
  projectId: "angular-chat-25",
  storageBucket: "angular-chat-25.firebasestorage.app", 
  messagingSenderId: "613881772696",
  appId: "1:613881772696:web:c548fb8176d9dd85c56eed",
  measurementId: "G-BYH0NMK1RZ"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideMarkdown()
  ]
};