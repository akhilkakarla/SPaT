from flask import Flask, jsonify
from flask_cors import CORS
from decoder import decoder
import threading
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


def _phases_from_pcap_hex(pcap_data):
    """
    Decode one hex pcap payload to intersection_id + phases list.
    Returns None if this payload should be skipped.
    """
    if not pcap_data or len(pcap_data) == 0:
        return None

    try:
        cv2x_msg = CV2X_Message(pcap_data)
    except Exception as e:
        print(f"CV2X_Message failed: {e}")
        return None

    if cv2x_msg is None or not cv2x_msg.uper_data or cv2x_msg.uper_data[0:4] != '0013':
        return None

    try:
        spat_msg_decoded = cv2x_msg.interpret_spat()
    except Exception as e:
        print(f"interpret_spat failed: {e}")
        return None

    if not spat_msg_decoded:
        return None

    spat_dict = spat_msg_decoded()
    intersection_id = spat_dict['value'][1]['intersections'][0]['id']['id']
    intersection_phases = spat_dict['value'][1]['intersections'][0]['states']

    utc_time = time.gmtime()
    utc_min = utc_time.tm_min
    utc_sec = utc_time.tm_sec
    utc_deci = int((time.time() % 1) * 10)
    current_sec = utc_min * 60 + utc_sec

    phases = []
    for phase in intersection_phases:
        try:
            counter = 0
            current_phase = int(phase.get('signalGroup'))
            current_state = str(phase['state-time-speed'][counter]['eventState'])
            min_end_time = phase['state-time-speed'][counter]['timing']['minEndTime']

            time_end_sec = min_end_time / 10.0
            time_end_sec_in_minute = time_end_sec % 60.0
            absolute_end_sec = (utc_min * 60) + time_end_sec_in_minute
            if absolute_end_sec <= current_sec:
                absolute_end_sec += 60.0

            countdown = writeTime(absolute_end_sec, current_sec, utc_deci)
            countdown = max(0, countdown)

            print(
                f"Phase {current_phase}: state={current_state}, maxEndTime={min_end_time}ds "
                f"({time_end_sec}s), abs_end={absolute_end_sec}s, current={current_sec}s, countdown={countdown:.1f}s"
            )

            phases.append({
                'phase': current_phase,
                'state': current_state,
                'countdown': countdown,
                'intersection_id': intersection_id,
            })
            counter += 1
        except Exception as e:
            print(f"Error processing phase {phase.get('signalGroup', 'unknown')}: {e}")
            continue

    return {'intersection_id': intersection_id, 'phases': phases}


@app.route('/api/traffic_light_state', methods=['GET'])
def traffic_light_state():
    """Return all decoded pcaps as `snapshots`, plus first pcap as `phases` for compatibility."""
    try:
        if CV2X_Message is None:
            return jsonify({'error': 'CV2X_Message not available'}), 500

        if not pcaps:
            return jsonify({'error': 'No pcaps loaded', 'snapshots': []}), 404

        snapshots = []
        for i, pcap_data in enumerate(pcaps):
            result = _phases_from_pcap_hex(pcap_data)
            if not result or not result['phases']:
                continue
            snapshots.append({
                'pcap_index': i,
                'intersection_id': result['intersection_id'],
                'phases': result['phases'],
            })

        if not snapshots:
            return jsonify({
                'error': 'No valid SPaT messages decoded from pcaps',
                'snapshots': [],
            }), 404

        first = snapshots[0]
        data_obj = {
            str(s['pcap_index']): {
                'intersection_id': s['intersection_id'],
                'phases': s['phases'],
            }
            for s in snapshots
        }

        return jsonify({
            'snapshots': snapshots,
            'intersection_id': first['intersection_id'],
            'phases': first['phases'],
            'data': data_obj,
        }), 200

    except Exception as e:
        print(f"Error in traffic_light_state endpoint: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/traffic_light_state/<int:pcap_index>', methods=['GET'])
def traffic_light_state_by_index(pcap_index):
    """Return phases for a single pcap by index into `pcaps[]`."""
    try:
        if CV2X_Message is None:
            return jsonify({'error': 'CV2X_Message not available'}), 500

        if pcap_index < 0 or pcap_index >= len(pcaps):
            return jsonify({
                'error': 'Invalid pcap index',
                'intersection_id': None,
                'phases': [],
            }), 404

        result = _phases_from_pcap_hex(pcaps[pcap_index])
        if not result:
            return jsonify({
                'error': 'Could not decode SPaT for this pcap',
                'intersection_id': None,
                'phases': [],
            }), 404

        return jsonify({
            'pcap_index': pcap_index,
            'intersection_id': result['intersection_id'],
            'phases': result['phases'],
        }), 200

    except Exception as e:
        print(f"Error in traffic_light_state_by_index: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    #thread = threading.Thread(target=traffic_light_state, daemon=True)
    #thread.start()
    
    # For development only. Use a proper WSGI server in production.
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8000)), debug=True)