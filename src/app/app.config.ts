import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { provideFirebaseApp } from '@angular/fire/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBbGuEaGBfA52F5ZJmWC77WG8v0ky_hGl8",
  authDomain: "angular-chat-25.firebaseapp.com",
  projectId: "angular-chat-25",
  storageBucket: "angular-chat-25.firebasestorage.app",
  messagingSenderId: "613881772696",
  appId: "1:613881772696:web:c548fb8176d9dd85c56eed",
  measurementId: "G-BYH0NMK1RZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig))
  ]
};
