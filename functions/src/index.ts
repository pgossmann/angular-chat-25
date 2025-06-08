import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { initializeApp as initializeClientApp } from 'firebase/app';
import cors from 'cors';

// Initialize Firebase Admin
initializeApp();

// 🔓 Firebase Client Config - API KEY CAN BE PUBLIC
const firebaseConfig = {
    apiKey: "AIzaSyBbGuEaGBfA52F5ZJmWC77WG8v0ky_hGl8", // ✅ Safe to be public
    authDomain: "angular-chat-25.firebaseapp.com",
    projectId: "angular-chat-25",
    storageBucket: "angular-chat-25.firebasestorage.app",
    messagingSenderId: "613881772696",
    appId: "1:613881772696:web:c548fb8176d9dd85c56eed"
};

// Initialize Firebase AI
const clientApp = initializeClientApp(firebaseConfig, 'functions-app');
const ai = getAI(clientApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: 'gemini-2.0-flash' });

// 🔒 SECURE SYSTEM PROMPTS (Server-side only)
const SYSTEM_PROMPTS: { [key: string]: any } = {
    helpful: {
        name: "Helpful Assistant",
        prompt: `You are a professional and helpful AI assistant. Provide clear, accurate responses.
    
GUIDELINES:
- Be concise but thorough
- Always be polite and professional  
- Provide practical, actionable advice
- Format code examples clearly

RESTRICTIONS:
- Do not provide harmful or inappropriate content
- Stay focused on being helpful and informative`
    },

    expert: {
        name: "Technical Expert",
        prompt: `You are a senior technical expert with deep knowledge across software development.
    
EXPERTISE:
- Software architecture and design patterns
- Modern web development (Angular, React, Node.js)
- Cloud platforms and databases
- Security and performance best practices

STYLE:
- Provide detailed technical explanations
- Include code examples when relevant
- Mention potential pitfalls and alternatives`
    },

    creative: {
        name: "Creative Assistant",
        prompt: `You are a creative AI assistant who thinks outside the box.
    
APPROACH:
- Think laterally and suggest unexpected solutions
- Use metaphors and analogies
- Encourage experimentation
- Provide multiple creative alternatives
- Be inspiring and motivational`
    },

    teacher: {
        name: "Patient Teacher",
        prompt: `You are a patient, encouraging teacher who breaks down complex topics.
    
TEACHING:
- Start with basics and build complexity gradually
- Use analogies and real-world examples
- Check for understanding
- Provide step-by-step instructions
- Be encouraging and supportive`
    }
};

// 🛡️ ENHANCED RATE LIMITING with IP + User tracking
const rateLimitMap = new Map();

function checkRateLimit(identifier: string, isAuthenticated: boolean): boolean {
    const now = Date.now();
    const limit = rateLimitMap.get(identifier);

    // Different limits for authenticated vs anonymous users
    const maxRequests = isAuthenticated ? 30 : 5; // Auth users get more requests
    const windowMs = 60000; // 1 minute

    if (!limit || now > limit.resetTime) {
        rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (limit.count >= maxRequests) return false;

    limit.count++;
    return true;
}

// 🔐 DOMAIN VALIDATION (additional security layer)
function validateOrigin(request: any): void {
    const allowedOrigins = [
        'https://pgossmann.github.io',
        'http://localhost:4200',
        'http://localhost:3000'
    ];

    const origin = request.get('origin');
    if (origin && !allowedOrigins.includes(origin)) {
        throw new Error('Invalid origin');
    }
}

// Configure CORS
const corsHandler = cors({
    origin: [
        'https://pgossmann.github.io',
        'http://localhost:4200',
        'http://localhost:3000'
    ],
    credentials: true
});

// 🚀 STREAMING CHAT ENDPOINT
export const streamChat = onRequest(
    {
        region: 'us-central1',
        cors: true
    },
    async (request, response) => {
        // Handle CORS
        corsHandler(request, response, async () => {
            try {
                // Only allow POST requests
                if (request.method !== 'POST') {
                    response.status(405).json({ error: 'Method not allowed' });
                    return;
                }

                // 🛡️ DOMAIN VALIDATION
                validateOrigin(request);

                const { message, promptType = 'helpful', conversationHistory = [] } = request.body;

                // Basic validation
                if (!message || typeof message !== 'string') {
                    response.status(400).json({ error: 'Message is required' });
                    return;
                }

                if (message.length > 2000) {
                    response.status(400).json({ error: 'Message too long' });
                    return;
                }

                // 🛡️ RATE LIMITING
                const identifier = request.ip || 'anonymous';
                const isAuthenticated = false; // You can implement auth later

                if (!checkRateLimit(identifier, isAuthenticated)) {
                    response.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
                    return;
                }

                // Get system prompt
                const systemConfig = SYSTEM_PROMPTS[promptType];
                if (!systemConfig) {
                    response.status(400).json({ error: 'Invalid prompt type' });
                    return;
                }

                // 🔒 INPUT SANITIZATION
                const sanitizedMessage = message.trim().substring(0, 2000);

                // Build prompt
                let fullPrompt = systemConfig.prompt;

                // Add context if available (limit context size)
                if (conversationHistory.length > 0) {
                    const recent = conversationHistory
                        .slice(-3) // Only last 3 messages
                        .filter((msg: any) => msg.content && msg.content.length < 500)
                        .map((msg: any) => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`)
                        .join('\n');
                    fullPrompt += `\n\nContext:\n${recent}`;
                }

                fullPrompt += `\n\nUser: ${sanitizedMessage}\n\nAssistant:`;

                // 🌊 SET UP STREAMING RESPONSE
                response.setHeader('Content-Type', 'text/plain; charset=utf-8');
                response.setHeader('Cache-Control', 'no-cache');
                response.setHeader('Connection', 'keep-alive');

                // Generate streaming response
                try {
                    const result = await model.generateContentStream(fullPrompt);

                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        if (chunkText) {
                            response.write(chunkText);
                        }
                    }

                    response.end();
                } catch (streamError) {
                    console.error('Streaming error:', streamError);
                    response.write('\n\n[Error: Failed to generate response]');
                    response.end();
                }

                // 📊 USAGE LOGGING
                console.log(`Streaming chat request - IP: ${identifier}, Auth: ${isAuthenticated}, Prompt: ${promptType}`);

            } catch (error: any) {
                console.error('Chat error:', error);

                if (!response.headersSent) {
                    response.status(500).json({ error: 'Server error occurred' });
                }
            }
        });
    }
);

// 🚀 NON-STREAMING CHAT ENDPOINT (Fallback)
export const chat = onRequest(
    {
        region: 'us-central1',
        cors: true
    },
    async (request, response) => {
        corsHandler(request, response, async () => {
            try {
                if (request.method !== 'POST') {
                    response.status(405).json({ error: 'Method not allowed' });
                    return;
                }

                validateOrigin(request);

                const { message, promptType = 'helpful', conversationHistory = [] } = request.body;

                if (!message || typeof message !== 'string') {
                    response.status(400).json({ error: 'Message is required' });
                    return;
                }

                if (message.length > 2000) {
                    response.status(400).json({ error: 'Message too long' });
                    return;
                }

                const identifier = request.ip || 'anonymous';
                if (!checkRateLimit(identifier, false)) {
                    response.status(429).json({ error: 'Rate limit exceeded' });
                    return;
                }

                const systemConfig = SYSTEM_PROMPTS[promptType];
                if (!systemConfig) {
                    response.status(400).json({ error: 'Invalid prompt type' });
                    return;
                }

                const sanitizedMessage = message.trim().substring(0, 2000);
                let fullPrompt = systemConfig.prompt;

                if (conversationHistory.length > 0) {
                    const recent = conversationHistory
                        .slice(-3)
                        .filter((msg: any) => msg.content && msg.content.length < 500)
                        .map((msg: any) => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`)
                        .join('\n');
                    fullPrompt += `\n\nContext:\n${recent}`;
                }

                fullPrompt += `\n\nUser: ${sanitizedMessage}\n\nAssistant:`;

                const result = await model.generateContent(fullPrompt);
                const responseText = result.response.text();

                response.json({
                    response: responseText,
                    promptType: systemConfig.name,
                    timestamp: new Date().toISOString(),
                    success: true
                });

                console.log(`Chat request - IP: ${identifier}, Prompt: ${promptType}`);

            } catch (error: any) {
                console.error('Chat error:', error);
                response.status(500).json({ error: 'Server error occurred' });
            }
        });
    }
);

// Get available prompts (no auth required, but rate limited)
export const getPromptTemplates = onRequest(
    {
        region: 'us-central1',
        cors: true
    },
    async (request, response) => {
        corsHandler(request, response, async () => {
            try {
                validateOrigin(request);

                const identifier = request.ip || 'anonymous';
                if (!checkRateLimit(`templates_${identifier}`, false)) {
                    response.status(429).json({ error: 'Rate limit exceeded' });
                    return;
                }

                response.json({
                    templates: Object.keys(SYSTEM_PROMPTS).map(key => ({
                        id: key,
                        name: SYSTEM_PROMPTS[key].name,
                        description: `${SYSTEM_PROMPTS[key].name} for various tasks`
                    }))
                });

            } catch (error) {
                console.error('Templates error:', error);
                response.status(500).json({ error: 'Server error occurred' });
            }
        });
    }
);

// Health check
export const healthCheck = onRequest(
    {
        region: 'us-central1',
        cors: true
    },
    async (request, response) => {
        response.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            region: 'us-central1'
        });
    }
);