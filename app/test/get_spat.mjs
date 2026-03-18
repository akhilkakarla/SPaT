import { spawn } from 'child_process';

const SPAT_URL = 'http://129.114.36.77:8080/spat';
const DECODER_SCRIPT = '/Users/akhilkakarla/Desktop/SPaT/backend/decoder.py';

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

async function getAndDecodeSpat() {
  let payload;

  try {
    const resp = await fetch(SPAT_URL);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    
    const data = await resp.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // Extract payload from API response
    // The API returns traffic light phase data, try different property names
    payload = data;
    console.log('Using payload for decoding:', payload);
    if(payload === undefined){
      console.log("PCAP is Undefined");
    }
  } catch (err) {
    console.warn('API unreachable (%s), using sample payload.', err.message);
  }

  // Decode the payload using Python script
  try {
    console.log('\nDecoding payload with decoder.py...');
    const decodedXml = await decodeWithPython(payload);
    console.log('Decoded SPaT (XML):');
    console.log(decodedXml);
  } catch (err) {
    console.error('Error decoding SPaT:', err.message);
  }
}

getAndDecodeSpat();

