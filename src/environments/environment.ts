// src/environments/environment.ts (Production - DEFAULT)
export const environment = {
    production: true,
    firebase: {
      // These are PUBLIC configuration values - safe to include in client
      authDomain: "angular-chat-25.firebaseapp.com",
      projectId: "angular-chat-25", 
      storageBucket: "angular-chat-25.firebasestorage.app",
      messagingSenderId: "613881772696",
      appId: "1:613881772696:web:c548fb8176d9dd85c56eed",
      measurementId: "G-BYH0NMK1RZ"
      // NOTE: NO API KEY - This is handled server-side only
    }
  };