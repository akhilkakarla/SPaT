import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'stored_xml_data');
const PCAP_DIR = path.join(__dirname, 'stored_pcap_data');
const LATEST_FILE = path.join(DATA_DIR, 'latest.xml');
const LATEST_PCAP_FILE = path.join(PCAP_DIR, 'latest.pcap');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const PCAP_HISTORY_FILE = path.join(PCAP_DIR, 'pcap_history.json');

const SPAT_URL = 'http://129.114.36.77:8080/spat';
const DECODER_SCRIPT = '/Users/akhilkakarla/Desktop/SPaT/backend/decoder.py';
const WS_PORT = 8765;

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`✓ Created data directory: ${DATA_DIR}`);
}

// Create pcap directory if it doesn't exist
if (!fs.existsSync(PCAP_DIR)) {
  fs.mkdirSync(PCAP_DIR, { recursive: true });
  console.log(`✓ Created pcap directory: ${PCAP_DIR}`);
}

// Store latest decoded XML and payload in memory
let latestDecodedXml = null;
let latestPayload = null;
let clients = new Set();
let xmlHistory = [];
// Load history from file if it exists
if (fs.existsSync(HISTORY_FILE)) {
  try {
    xmlHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    console.log(`✓ Loaded ${xmlHistory.length} messages from history`);
  } catch (err) {
    console.warn('Could not load history:', err.message);
  }
}

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
  if (latestDecodedXml) {
    ws.send(JSON.stringify({ type: 'decoded_xml', data: latestDecodedXml, payload: latestPayload }));
  }
  
  ws.on('close', () => {
    console.log('✗ Client disconnected');
    clients.delete(ws);
  });
});

// Save XML and payload to file
function saveXmlToFile(xml, payload) {
  try {
    // Save latest XML
    fs.writeFileSync(LATEST_FILE, xml, 'utf-8');
    
    // Add to history with timestamp and payload
    const timestamp = new Date().toISOString();
    const xmlFileName = `xml_${timestamp.replace(/[:.]/g, '-')}.xml`;
    xmlHistory.push({ 
      timestamp, 
      xmlFile: xmlFileName,
      payload: payload
    });
    
    // Keep only last 100 messages in memory
    if (xmlHistory.length > 100) {
      xmlHistory = xmlHistory.slice(-100);
    }
    
    // Save history
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(xmlHistory, null, 2), 'utf-8');
    
    // Also save individual XML file
    fs.writeFileSync(path.join(DATA_DIR, xmlFileName), xml, 'utf-8');
  } catch (err) {
    console.error('Error saving XML:', err.message);
  }
}

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
function broadcastDecodedXml(xml, payload) {
  latestDecodedXml = xml;
  latestPayload = payload;
  
  // Save XML and PCAP to disk
  saveXmlToFile(xml, payload);
  savePcapToFile(payload);
  
  const message = JSON.stringify({ type: 'decoded_xml', data: xml, payload: payload });
  clients.forEach(client => {
    if (client.readyState === 1) {  // WebSocket.OPEN = 1
      client.send(message);
    }
  });
}

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

async function pollAndDecode() {
  while (true) {
    try {
      const resp = await fetch(SPAT_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const data = await resp.json();
      const payload = data.phases?.[0]?.payload || '00136E00382E4EEE997973CB8FA69DFB8000204000067A7028A82C00410D003BC07CC00408C8003000F801604800027001821A0020004A801010D0022C04AC430086001160080200A08C8003000C6006043400E001DA00D02180070001C10D000C401F0010086800F8022401C0430007C0';
      
      const decodedXml = await decodeWithPython(payload);
      broadcastDecodedXml(decodedXml, payload);
      console.log('✓ Broadcasted and stored decoded XML with payload and raw PCAP');
    } catch (err) {
      console.error('✗ Error:', err.message);
    }
    
    // Poll every 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

console.log(`\n🚀 WebSocket server listening on ws://localhost:${WS_PORT}`);
console.log(`📁 Storing XML data in: ${DATA_DIR}\n`);
pollAndDecode();   



