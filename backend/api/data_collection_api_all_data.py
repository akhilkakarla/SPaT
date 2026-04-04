import threading
import time
import sys
import os
import psycopg2
from flask import Flask, jsonify
from flask_cors import CORS
     
try:
    from CV2X_Message import CV2X_Message
except ImportError:
    CV2X_Message = None
    print("Warning: CV2X_Message could not be imported. Traffic light endpoint may not work.")

app = Flask(__name__)
CORS(app)

# Global variable to store the current count
current_phase = 0
countdown = 0
counter = 0
time_until_next_phase = 0
signal_color = ''
current_state = ''
current_pcap_index = 0
current_intersection_id = None

input_file = '/Users/akhilkakarla/Desktop/SPaT/data/burnet_2025_09_11_14_01_01_cv2x0_rx.txt'

pcaps = []

def get_db_conn():
    return psycopg2.connect(
        dbname=os.getenv('SPAT_DB_NAME', 'spat_db'),
        user=os.getenv('SPAT_DB_USER', 'postgres'),
        password=os.getenv('SPAT_DB_PASSWORD', '1804'),
        host=os.getenv('SPAT_DB_HOST', 'localhost'),
        port=os.getenv('SPAT_DB_PORT', '5432')
    )

def collect_pcaps():
    with open(input_file, 'r') as text:
        text_string = text.read()
        for line in text_string.splitlines():
            code = '0013'
            index = line.find(code)
            if index != -1:
                pcaps.append(line[index:].strip())
        
collect_pcaps()

# Decode all pcaps and collect their SPAT data
decoded_pcaps = []
for i, pcap_hex in enumerate(pcaps):
    try:
        cv2x_msg = CV2X_Message(pcap_hex)
        spat_msg_decoded = cv2x_msg.interpret_spat()
        spat_dict = spat_msg_decoded()
        intersection_id = spat_dict['value'][1]['intersections'][0]['id']['id']
        intersection_phases = spat_dict['value'][1]['intersections'][0]['states']
        decoded_pcaps.append({
            'index': i,
            'intersection_id': intersection_id,
            'phases': intersection_phases,
            'spat_dict': spat_dict,
        })
        print(f"Decoded pcap {i}: intersection_id={intersection_id}, phases={len(intersection_phases)}")
    except Exception as e:
        print(f"ERROR decoding pcap {i}: {e}")

if not decoded_pcaps:
    print("ERROR: No pcaps could be decoded. Exiting.")
    sys.exit(1)


def background_loop():
    global current_phase
    global countdown
    global time_until_next_phase
    global current_state
    global signal_color
    global current_pcap_index
    global current_intersection_id

    while True:
        for pcap_data in decoded_pcaps:
            current_pcap_index = pcap_data['index']
            current_intersection_id = pcap_data['intersection_id']
            intersection_phases = pcap_data['phases']

            for phase in intersection_phases:
                counter = 0
                current_phase = int(phase.get('signalGroup'))
                min_end_time = phase['state-time-speed'][counter]['timing']['minEndTime']
                current_state = str(phase['state-time-speed'][counter]['eventState'])

                if current_state == 'protected-Movement-Allowed':
                    signal_color = 'green'
                elif current_state == 'stop-And-Remain':
                    signal_color = 'red'
                else:
                    signal_color = 'yellow'

                countdown = min_end_time / 10
                time_until_next_phase = countdown
                while time_until_next_phase > 0:
                    time.sleep(1)
                    time_until_next_phase -= 1
                    
            


@app.route('/status', methods=['GET'])
def get_status():
    """API endpoint to retrieve the current number."""
    return jsonify({
        "current_phase": current_phase,
        "countdown": countdown,
        "time_until_next_phase": time_until_next_phase,
        "current_state": current_state,
        "signal_color": signal_color,
        "current_pcap_index": current_pcap_index,
        "current_intersection_id": current_intersection_id,
        "total_pcaps": len(decoded_pcaps),
    })

'''
@app.route('/pcaps', methods=['GET'])
def get_pcaps():
    """API endpoint to display data for all decoded pcaps."""
    pcaps_data = []
    for p in decoded_pcaps:
        phases_summary = []
        for phase in p['phases']:
            sig = phase.get('signalGroup')
            state = phase['state-time-speed'][0]['eventState'] if phase.get('state-time-speed') else None
            min_end = phase['state-time-speed'][0]['timing']['minEndTime'] if phase.get('state-time-speed') else None
            phases_summary.append({
                "signal_group": sig,
                "event_state": state,
                "min_end_time": min_end,
            })
        pcaps_data.append({
            "index": p['index'],
            "intersection_id": p['intersection_id'],
            "phase_count": len(p['phases']),
            "phases": phases_summary,
        })
    return jsonify({
        "total_pcaps": len(decoded_pcaps),
        "pcaps": pcaps_data,
    })
'''

if __name__ == '__main__':
    # 1. Start the loop in a background thread
    thread = threading.Thread(target=background_loop, daemon=True)
    thread.start()

    # 2. Start the Flask API
    # Note: use_reloader=False prevents the thread from starting twice
    app.run(port=8085, debug=True, use_reloader=False)