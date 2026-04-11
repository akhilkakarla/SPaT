import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PCAP_DIR = path.join(__dirname, 'stored_pcap_data');
const LATEST_PCAP_FILE = path.join(PCAP_DIR, 'latest.pcap');
const PCAP_HISTORY_FILE = path.join(PCAP_DIR, 'pcap_history.json');

const SPAT_URL = 'http://129.114.36.77:8080/spat';
const DECODER_SCRIPT = '/Users/akhilkakarla/Desktop/SPaT/backend/decoder.py';
const WS_PORT = 8765;

// Create pcap directory if it doesn't exist
if (!fs.existsSync(PCAP_DIR)) {
  fs.mkdirSync(PCAP_DIR, { recursive: true });
  console.log(`✓ Created pcap directory: ${PCAP_DIR}`);
}

// Store latest decoded XML and payload in memory
let latestPayload = null;
let clients = new Set();

// Load pcap history from file if it exists
let pcapHistory = [];
if (fs.existsSync(PCAP_HISTORY_FILE)) {
  try {
    pcapHistory = JSON.parse(fs.readFileSync(PCAP_HISTORY_FILE, 'utf-8'));
    console.log(`✓ Loaded ${pcapHistory.length} pcap messages from history`);
  } catch (err) {
    console.warn('Could not load pcap history:', err.message);
  }
}

// WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('✓ Client connected');
  clients.add(ws);
  
  // Send latest XML and payload to newly connected client
  
  ws.on('close', () => {
    console.log('✗ Client disconnected');
    clients.delete(ws);
  });
});

// Save raw PCAP data to file
function savePcapToFile(payload) {
  try {
    // Save latest PCAP
    fs.writeFileSync(LATEST_PCAP_FILE, payload, 'utf-8');
    
    // Add to pcap history with timestamp
    const timestamp = new Date().toISOString();
    const pcapFileName = `pcap_${timestamp.replace(/[:.]/g, '-')}.pcap`;
    pcapHistory.push({ 
      timestamp, 
      pcapFile: pcapFileName,
      payload: payload
    });
    
    // Keep only last 100 messages in memory
    if (pcapHistory.length > 100) {
      pcapHistory = pcapHistory.slice(-100);
    }
    
    // Save pcap history
    fs.writeFileSync(PCAP_HISTORY_FILE, JSON.stringify(pcapHistory, null, 2), 'utf-8');
    
    // Also save individual PCAP file
    fs.writeFileSync(path.join(PCAP_DIR, pcapFileName), payload, 'utf-8');
  } catch (err) {
    console.error('Error saving PCAP:', err.message);
  }
}

// Broadcast to all connected clients
function broadcastDecodedPcap(payload) {
  latestPayload = payload;
  
  // Save XML and PCAP to disk
  savePcapToFile(payload);
  
  const message = JSON.stringify({ type: 'decoded_pcap', payload: payload });
  clients.forEach(client => {
    if (client.readyState === 1) {  // WebSocket.OPEN = 1
      client.send(message);
    }
  });
}

/*
function decodeWithPython(payload) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', [DECODER_SCRIPT, payload]);
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr || `decoder exited with code ${code}`));
      }
    });
  });
}
*/
     
async function pollAndDecode() {
  while (true) {
    try {
      const resp = await fetch(SPAT_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const data = await resp.json();
      const payload = data.spat || '00136E00382E4EEE997973CB8FA69DFB8000204000067A7028A82C00410D003BC07CC00408C8003000F801604800027001821A0020004A801010D0022C04AC430086001160080200A08C8003000C6006043400E001DA00D02180070001C10D000C401F0010086800F8022401C0430007C0';
      
      broadcastDecodedPcap(payload);
      console.log('✓ Broadcasted and stored payload and raw PCAP');
    } catch (err) {
      console.error('✗ Error:', err.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

console.log(`\n🚀 WebSocket server listening on ws://localhost:${WS_PORT}`);
console.log(`📁 Storing PCAP data in: ${PCAP_DIR}\n`);
pollAndDecode();   



