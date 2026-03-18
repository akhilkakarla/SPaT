import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the stored XML data from SPaT_App_LiveSPaTAPI
const STORED_XML_DATA_DIR = path.join(__dirname, '../../SPaT_App_LiveSPaTAPI/stored_xml_data');
const HISTORY_FILE = path.join(STORED_XML_DATA_DIR, 'history.json');
const LATEST_FILE = path.join(STORED_XML_DATA_DIR, 'latest.xml');

const app = express();
const PORT = 5430;

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

// Get traffic light state from the latest stored XML
// Returns phases array just like the original API
app.get('/api/traffic_light_state', (req, res) => {
  try {
    if (!fs.existsSync(LATEST_FILE)) {
      return res.status(404).json({
        intersection_id: null,
        phase: null,
        state: null,
        countdown: null,
        timestamp: Date.now() / 1000,
        error: 'No latest XML found',
      });
    }
    
    const xml = fs.readFileSync(LATEST_FILE, 'utf-8');
    const parsed = parseXmlToPhases(xml);
    
    // Return in the format expected by visualization.tsx
    res.json({
      intersection_id: parsed.intersection_id,
      phases: parsed.phases || [],
      timestamp: Date.now() / 1000,
    });
  } catch (err) {
    console.error('Error reading latest XML:', err);
    res.status(500).json({
      intersection_id: null,
      phase: null,
      state: null,
      countdown: null,
      timestamp: Date.now() / 1000,
      error: err.message,
    });
  }
});

// Get all SPaT messages from stored XML files
// Returns array of SpatMessage objects with message_xml content
app.get('/api/spat_messages', (req, res) => {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return res.status(404).json({ error: 'No message history found', messages: [] });
    }
    
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    const messages = [];
    
    // Load each XML file and include it in the messages array
    history.forEach((fileEntry, index) => {
      try {
        const filePath = path.join(STORED_XML_DATA_DIR, fileEntry.xmlFile);
        if (fs.existsSync(filePath)) {
          const xml = fs.readFileSync(filePath, 'utf-8');
          messages.push({
            id: index,
            message_xml: xml,
          });
        }
      } catch (err) {
        console.warn(`Failed to load XML file ${fileEntry.xmlFile}:`, err);
      }
    });
    
    res.json({
      success: true,
      messages: messages,
      count: messages.length,
    });
  } catch (err) {
    console.error('Error reading SPaT messages:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get history of all stored XMLs (metadata)
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
    const filePath = path.join(STORED_XML_DATA_DIR, fileEntry.xmlFile);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: ${fileEntry.xmlFile}` });
    }
    
    const xml = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseXmlToPhases(xml);
    
    res.json(parsed);
  } catch (err) {
    console.error('Error reading XML:', err);
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

// Get all XMLs with parsed phases
app.get('/api/xml/all', (req, res) => {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return res.status(404).json({ error: 'No history found', xmls: [] });
    }
    
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    const xmls = [];
    
    history.forEach((fileEntry, index) => {
      try {
        const filePath = path.join(STORED_XML_DATA_DIR, fileEntry.xmlFile);
        if (fs.existsSync(filePath)) {
          const xml = fs.readFileSync(filePath, 'utf-8');
          const parsed = parseXmlToPhases(xml);
          xmls.push({
            index,
            ...parsed,
          });
        }
      } catch (err) {
        console.warn(`Failed to load XML file ${fileEntry.xmlFile}:`, err);
      }
    });
    
    res.json({ success: true, xmls, count: xmls.length });
  } catch (err) {
    console.error('Error reading XMLs:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Start server
app.listen(PORT, () => {
  console.log(`Stored XML API server listening on port ${PORT}`);
  console.log(`Data directory: ${STORED_XML_DATA_DIR}`);
  console.log(`Available endpoints:`);
  console.log(`  GET /api/traffic_light_state - Get latest traffic light state with phases`);
  console.log(`  GET /api/spat_messages - Get all SPaT messages from stored XMLs`);
  console.log(`  GET /api/xml/latest - Get latest XML with parsed phases`);
  console.log(`  GET /api/xml/:index - Get XML at specific index`);
  console.log(`  GET /api/xml/history - Get history metadata`);
  console.log(`  GET /api/xml/all - Get all XMLs with parsed phases`);
  console.log(`  GET /health - Health check`);
});
