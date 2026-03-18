import express from 'express';
import { WebSocket } from 'ws';

const app = express();
let latestDecodedXml = null;

// Connect to the socket server on port 8765
const ws = new WebSocket('ws://localhost:8765');

ws.on('open', () => {
  console.log('✓ Connected to socket server on ws://localhost:8765');
});

ws.on('message', (message) => {
  const { type, data } = JSON.parse(message);
  if (type === 'decoded_xml') {
    latestDecodedXml = data;
    console.log('✓ Updated latest XML');
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message);
});

ws.on('close', () => {
  console.log('✗ Disconnected from socket server');
});

app.get('/api/latest-xml', (req, res) => {
  if (!latestDecodedXml) {
    return res.status(202).json({ 
      message: 'Waiting for first XML message from socket server...',
      xml: null 
    });
  }
  res.json({ xml: latestDecodedXml });
});

app.listen(3000, () => {
  console.log('HTTP API running on http://localhost:3000');
  console.log('Access XML at: http://localhost:3000/api/latest-xml');
});
