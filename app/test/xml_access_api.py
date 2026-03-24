from flask import Flask, jsonify
from flask_cors import CORS
from decoder import decoder
import os
import sys
import time
import json
import re


# Add the j2735_decoder directory to the path so we can import the modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'SPaT_copy', 'j2735_decoder'))

try:
    from CV2X_Message import CV2X_Message
except ImportError:
    CV2X_Message = None
    print("Warning: CV2X_Message could not be imported. Traffic light endpoint may not work.")

pcaps_file = '/Users/akhilkakarla/Desktop/SPaT/app/test/stored_pcap_data/pcap_history.json'

app = Flask(__name__)
CORS(app)

# Parse all XMLs in the stored_xml_data folder and store traffic signal phases
current_index = 0
pcaps = []
xmls = []
        
with open(pcaps_file, 'r') as text:
    text_string = text.read()
    try:
        for line in text_string.splitlines():
            index = line.find('0013')
            if index != -1:
                pcaps.append(line[index:].strip().rstrip('"'))
    except Exception as e:
        print(f"ERROR: {e}")
        
for pcap in pcaps:
    decoded_pcap = decoder(pcap)
    xmls.append(str(decoded_pcap))

print(len(pcaps))
    
@app.route('/api/spat_messages', methods=['GET'])
def spat_messages():
        try:
            for xml in xmls:
                return jsonify({'spat_messages': xml}), 200
        except Exception as e:
            print(f"ERROR: {e}")
            return jsonify({'error': str(e)}), 500
        
def writeTime(endTime, currentSec, currentDecSec):
    """Calculate the phase's state time remaining - same as visualize_db_spats.py"""
    currentTime = currentSec + currentDecSec / 10.0
    countdown = round(endTime - currentTime, 2)
    # Ensure countdown is at least 0.1 seconds to prevent phases from appearing to have no duration
    if countdown < 0.1:
        countdown = 0.1
    return countdown


def get_signal_color(state):
    """Map state to signal color - same as visualize_db_spats.py"""
    if not state:
        return 'UNKNOWN'
    state_str = str(state).strip()
    if 'stop-And-Remain' in state_str or 'stop' in state_str.lower() and 'remain' in state_str.lower():
        return 'RED'
    elif 'protected-clearance' in state_str or 'clearance' in state_str.lower():
        return 'YELLOW'
    elif 'protected-Movement-Allowed' in state_str or 'movement' in state_str.lower() and 'allowed' in state_str.lower():
        return 'GREEN'
    return 'UNKNOWN'

@app.route('/api/traffic_light_state', methods=['GET'])
def traffic_light_state():
    """Returns all traffic light phases using the same methodology as visualize_db_spats.py"""
    try:
        if CV2X_Message is None:
            return jsonify({'error': 'CV2X_Message not available'}), 500
        
        # Get the data file path (same as visualize_db_spats.py)
        data_file = os.path.join(
            os.path.dirname(__file__),
            '..',
            'SPaT_copy',
            'data',
            'burnet_2025_09_11_14_01_01_cv2x0_rx.txt'
        )
        data_file = os.path.abspath(data_file)
        
        # Extract payloads from file (same as visualize_db_spats.py)
        payloads = pcaps[0]
        
        if not payloads:
            return jsonify({
                'error': 'No payloads found in data file',
                'intersection_id': None,
                'phases': []
            }), 404
        
        # Use the first payload (same as visualize_db_spats.py uses payloads[0])
        pcap_data = pcaps[0] if payloads else None
        
        if not pcap_data or len(pcap_data) == 0:
            return jsonify({
                'error': 'No valid payload data',
                'intersection_id': None,
                'phases': []
            }), 404
        
        # Parse C-V2X pcap message (same as visualize_db_spats.py)
        cv2x_msg = CV2X_Message(pcap_data)
        
        if cv2x_msg is None or not cv2x_msg.uper_data or cv2x_msg.uper_data[0:4] != '0013':
            return jsonify({
                'error': 'Invalid SPaT message',
                'intersection_id': None,
                'phases': []
            }), 404
        
        # Decode SPaT message (same as visualize_db_spats.py)
        try:
            spat_msg_decoded = cv2x_msg.interpret_spat()
        except Exception as e:
            return jsonify({    
                'error': f'Error decoding SPaT: {str(e)}',
                'intersection_id': None,
                'phases': []              
            }), 500
        
        if not spat_msg_decoded:
            return jsonify({
                'error': 'Could not decode SPaT message',
                'intersection_id': None,
                'phases': []
            }), 404
        
        # Get intersection data (same structure as visualize_db_spats.py)
        spat_dict = spat_msg_decoded()
        intersection_id = spat_dict['value'][1]['intersections'][0]['id']['id']
        intersection_phases = spat_dict['value'][1]['intersections'][0]['states']
        
        # Get UTC time for countdown calculation (same as visualize_db_spats.py)
        # Recalculate time on every request to ensure accurate countdown
        utc_time = time.gmtime()
        utc_min = utc_time.tm_min
        utc_sec = utc_time.tm_sec
        utc_deci = int((time.time() % 1) * 10)
        current_sec = utc_min * 60 + utc_sec  # Seconds since start of hour
        
        # Extract all phases (same methodology as visualize_db_spats.py)
        phases = []
        for phase in intersection_phases:
            try:
                counter = 0
                current_phase = int(phase.get('signalGroup'))
                current_state = str(phase['state-time-speed'][counter]['eventState'])
                
                # Get timing information - minEndTime is in deciseconds
                min_end_time = phase['state-time-speed'][counter]['timing']['minEndTime']
            
                
                # Calculate countdown (EXACTLY as visualize_db_spats.py does it)
                # maxEndTime is in deciseconds, convert to seconds
                # In SPaT, maxEndTime represents seconds within the current UTC minute (0-60)
                # So we need to make it absolute by adding it to the start of the current minute
                time_end_sec = min_end_time / 10.0  # Convert deciseconds to seconds
                
                # Make it absolute: add to start of current minute
                # But wait - if time_end_sec is already > 60, it might wrap to next minute
                # Let's check: if time_end_sec > 60, subtract 60 to get seconds in current minute
                time_end_sec_in_minute = time_end_sec % 60.0
                
                # Convert to absolute seconds since start of hour
                absolute_end_sec = (utc_min * 60) + time_end_sec_in_minute
                
                # If the absolute end time is less than current time, it means it's in the next cycle (next minute)
                if absolute_end_sec <= current_sec:
                    absolute_end_sec += 60.0  # Wrap to next minute
                
                # Calculate countdown using writeTime (same as visualize_db_spats.py)
                countdown = writeTime(absolute_end_sec, current_sec, utc_deci)
                
                # Ensure countdown is non-negative
                countdown = max(0, countdown)

                # Debug: print timing info
                print(f"Phase {current_phase}: state={current_state}, maxEndTime={min_end_time}ds ({time_end_sec}s), abs_end={absolute_end_sec}s, current={current_sec}s, countdown={countdown:.1f}s")
                
                phases.append({
                    'phase': current_phase,
                    'state': current_state,
                    'countdown': countdown,
                    'intersection_id': intersection_id
                })
                
                counter += 1
                print("Phase being looped: ", current_phase)

            except Exception as e:
                print(f"Error processing phase {phase.get('signalGroup', 'unknown')}: {e}")
                continue
        
        return jsonify({
            'intersection_id': intersection_id,
            'phases': phases
        }), 200
        
    except Exception as e:
        print(f"Error in traffic_light_state endpoint: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    
    # For development only. Use a proper WSGI server in production.
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8000)), debug=True)