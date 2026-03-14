import { spawn } from 'child_process';

const SPAT_URL = 'http://localhost:5430/api/traffic_light_state';
const DECODER_SCRIPT = '/Users/akhilkakarla/Desktop/SPaT/backend/decoder.py';

// Fallback sample payload (same as in backend/decoder.py) when API is unreachable
const SAMPLE_PCAP =
  '00134a4593d100801b3b5200001f207001046401310131001021a00e740fdc00c10d005320532008086803020343005043401ce812d803023200988098801c10d0053205320100868030203430';

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
    payload = await resp.text();
    console.log('Raw SPaT payload (from API):', payload);
  } catch (err) {
    console.warn('API unreachable (%s), using sample payload.', err.cause?.code || err.message);
    payload = SAMPLE_PCAP;
    console.log('Raw SPaT payload (sample):', payload);
  }

  try {
    const decodedSpat = await decodeWithPython(payload);
    console.log('Decoded SPaT (XML):');
    console.log(decodedSpat);
  } catch (err) {
    console.error('Error decoding SPaT:', err);
  }

}

getAndDecodeSpat();
