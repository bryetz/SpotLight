// Determine if the environment is development or production
const isDevelopment = process.env.NODE_ENV === 'development';

// Set API base URL
export const API_URL = isDevelopment 
    ? 'http://localhost:8080' 
    : 'https://your-production-api-url.com'; // TODO: Replace production API URL

// Set WebSocket URL
const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
export const WS_URL = isDevelopment
    ? `ws://localhost:8080/ws`
    : `${wsProtocol}://your-production-websocket-url.com/ws`; // TODO: Replace with production WS URL

console.log(`API URL: ${API_URL}`);
console.log(`WebSocket URL: ${WS_URL}`); 