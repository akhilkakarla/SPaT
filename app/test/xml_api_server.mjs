import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'stored_xml_data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const LATEST_FILE = path.join(DATA_DIR, 'latest.xml');

const app = express();
const PORT = 3001;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Parse XML string to extract phases and traffic light information
function parseXmlToPhases(xmlString) {
  try {
    const phases = [];
    
    // Extract all phase entries from XML
    // Look for patterns like <state> blocks containing phase information
    const stateMatches = xmlString.matchAll(/<state>([\s\S]*?)<\/state>/g);
    
    let intersectionId = null;
    
    // Try to extract intersection ID
    const intersectionMatch = xmlString.match(/<intersectionID>(\d+)<\/intersectionID>/);
    if (intersectionMatch) {
      intersectionId = parseInt(intersectionMatch[1]);
    }
    
    for (const match of stateMatches) {
      const stateBlock = match[1];
      
      // Extract signalGroup (phase number)
      const phaseMatch = stateBlock.match(/<signalGroup>(\d+)<\/signalGroup>/);
      if (!phaseMatch) continue;
      
      const phase = parseInt(phaseMatch[1]);
      
      // Extract eventState (RED, YELLOW, GREEN)
      const eventStateMatch = stateBlock.match(/<eventState>(.*?)<\/eventState>/);
      const eventState = eventStateMatch ? eventStateMatch[1].trim() : 'UNKNOWN';
      
      // Extract maxEndTime (countdown in deciseconds)
      const maxEndTimeMatch = stateBlock.match(/<maxEndTime>(\d+)<\/maxEndTime>/);
      let countdown = null;
      let maxEndTime = null;
      
      if (maxEndTimeMatch) {
        maxEndTime = parseInt(maxEndTimeMatch[1]);
        countdown = maxEndTime / 10; // Convert deciseconds to seconds
      }
      
      // Map event state to signal color
      let state = eventState;
      let color = 'UNKNOWN';
      
      if (eventState.includes('stop-And-Remain') || (eventState.toLowerCase().includes('stop') && eventState.toLowerCase().includes('remain'))) {
        color = 'RED';
        state = 'stop-And-Remain';
      } else if (eventState.includes('protected-clearance') || eventState.toLowerCase().includes('clearance')) {
        color = 'YELLOW';
        state = 'protected-clearance';
      } else if (eventState.includes('protected-Movement-Allowed') || (eventState.toLowerCase().includes('movement') && eventState.toLowerCase().includes('allowed'))) {
        color = 'GREEN';
        state = 'protected-Movement-Allowed';
      }
      
      phases.push({
        phase,
        state,
        color,
        eventState,
        maxEndTime,
        countdown: countdown !== null ? Math.round(countdown * 10) / 10 : null,
      });
    }
    
    return {
      intersection_id: intersectionId,
      phases: phases.length > 0 ? phases : null,
      raw_xml: xmlString,
    };
  } catch (err) {
    console.error('Error parsing XML:', err);
    return {
      intersection_id: null,
      phases: null,
      error: err.message,
      raw_xml: xmlString,
    };
  }
}

// Get history of all stored XMLs
app.get('/api/xml/history', (req, res) => {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return res.status(404).json({ error: 'No history found', files: [] });
    }
    
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    res.json({ success: true, files: history, count: history.length });
  } catch (err) {
    console.error('Error reading history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get latest XML with parsed phases
app.get('/api/xml/latest', (req, res) => {
  try {
    if (!fs.existsSync(LATEST_FILE)) {
      return res.status(404).json({ error: 'No latest XML found' });
    }
    
    const xml = fs.readFileSync(LATEST_FILE, 'utf-8');
    const parsed = parseXmlToPhases(xml);
    
    res.json(parsed);
  } catch (err) {
    console.error('Error reading latest XML:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get specific XML by index with parsed phases
app.get('/api/xml/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    
    if (!fs.existsSync(HISTORY_FILE)) {
      return res.status(404).json({ error: 'No history found' });
    }
    
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    
    if (index < 0 || index >= history.length) {
      return res.status(400).json({ error: `Index ${index} out of range [0, ${history.length - 1}]` });
    }
    
    const fileEntry = history[index];
    const filePath = path.join(DATA_DIR, fileEntry.xmlFile);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: ${fileEntry.xmlFile}` });
    }
    
    const xml = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseXmlToPhases(xml);
    parsed.timestamp = fileEntry.timestamp;
    
    res.json(parsed);
  } catch (err) {
    console.error('Error reading XML:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get XML metadata (without full content) with parsed phases
app.get('/api/xml/metadata/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    
    if (!fs.existsSync(HISTORY_FILE)) {
      return res.status(404).json({ error: 'No history found' });
    }
    
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    
    if (index < 0 || index >= history.length) {
      return res.status(400).json({ error: `Index ${index} out of range [0, ${history.length - 1}]` });
    }
    
    const fileEntry = history[index];
    const filePath = path.join(DATA_DIR, fileEntry.xmlFile);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: ${fileEntry.xmlFile}` });
    }
    
    const stats = fs.statSync(filePath);
    const xml = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseXmlToPhases(xml);
    
    res.json({
      success: true,
      index,
      timestamp: fileEntry.timestamp,
      file: fileEntry.xmlFile,
      size: stats.size,
      intersection_id: parsed.intersection_id,
      phases: parsed.phases,
    });
  } catch (err) {
    console.error('Error reading metadata:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all XMLs as JSON array with parsed phases
app.get('/api/xml/all', (req, res) => {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return res.status(404).json({ error: 'No history found', xmls: [] });
    }
    
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    const xmls = history.map((entry, index) => {
      const filePath = path.join(DATA_DIR, entry.xmlFile);
      
      if (!fs.existsSync(filePath)) {
        return {
          index,
          timestamp: entry.timestamp,
          file: entry.xmlFile,
          error: 'File not found',
        };
      }
      
      const xml = fs.readFileSync(filePath, 'utf-8');
      const parsed = parseXmlToPhases(xml);
      
      return {
        index,
        timestamp: entry.timestamp,
        file: entry.xmlFile,
        intersection_id: parsed.intersection_id,
        phases: parsed.phases,
        xmlContent: xml,
      };
    });
    
    res.json({ success: true, count: xmls.length, xmls });
  } catch (err) {
    console.error('Error reading XMLs:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', dataDir: DATA_DIR });
});

app.listen(PORT, () => {
  console.log(`\n📁 XML API Server running on http://localhost:${PORT}`);
  console.log(`📂 Serving from: ${DATA_DIR}\n`);
  console.log('Available endpoints:');
  console.log(`  GET /api/xml/history         - Get list of all stored XMLs`);
  console.log(`  GET /api/xml/latest          - Get latest XML`);
  console.log(`  GET /api/xml/:index          - Get XML at specific index`);
  console.log(`  GET /api/xml/metadata/:index - Get XML metadata (without content)`);
  console.log(`  GET /api/xml/all             - Get all XMLs with parsed data`);
  console.log(`  GET /health                  - Health check\n`);
});
