import { WebSocketServer } from 'ws';

const socket = new WebSocketServer({port: 3001});

socket.onopen = (event) => {
    console.writeLine('WebSocket connection established');
    socket.send('Hello server!'); // Send a message
};

socket.onmessage = (event) => {
    console.log('Message from server:', event.data);
};

socket.onclose = (event) => {
    console.log('WebSocket connection closed');
};

socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};
