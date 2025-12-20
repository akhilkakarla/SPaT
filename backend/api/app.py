from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import os
import sys
import time

# Add the j2735_decoder directory to the path so we can import the modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'SPaT_copy', 'j2735_decoder'))

try:
    from CV2X_Message import CV2X_Message
except ImportError:
    CV2X_Message = None
    print("Warning: CV2X_Message could not be imported. Traffic light endpoint may not work.")

app = Flask(__name__)
CORS(app)


def get_db_conn():
    return psycopg2.connect(
        dbname=os.getenv('SPAT_DB_NAME', 'spat_db'),
        user=os.getenv('SPAT_DB_USER', 'postgres'),
        password=os.getenv('SPAT_DB_PASSWORD', '1804'),
        host=os.getenv('SPAT_DB_HOST', 'localhost'),
        port=os.getenv('SPAT_DB_PORT', '5432')
    )


@app.route('/api/spat_messages', methods=['GET'])
def spat_messages():
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('SELECT id, message_xml FROM spat_messages ORDER BY id DESC LIMIT 100;')
        rows = cur.fetchall()
        messages = [{'id': r[0], 'message_xml': r[1]} for r in rows]
        cur.close()
        conn.close()
        return jsonify({'messages': messages}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def extract_payloads_from_file(input_file):
    """Extract payloads from the data file similar to visualize_db_spats.py"""
    payloads = []
    try:
        with open(input_file, 'r') as text:
            text_string = text.read()
            for line in text_string.splitlines():
                index = line.find('0013')
                if index != -1:
                    payloads.append(line[index:].strip())
        return payloads
    except Exception as e:
        print(f"Error reading file: {e}")
        return []


def get_traffic_light_state(payload):
    """Process a payload and extract traffic light state information"""
    if CV2X_Message is None:
        return None
        
    try:
        cv2x_msg = CV2X_Message(payload)
        
        if cv2x_msg.uper_data and cv2x_msg.uper_data[0:4] == '0013':
            spat_msg_decoded = cv2x_msg.interpret_spat()
            
            if spat_msg_decoded:
                spat_dict = spat_msg_decoded()
                intersection_id = spat_dict['value'][1]['intersections'][0]['id']['id']
                intersection_phases = spat_dict['value'][1]['intersections'][0]['states']
                
                # Get UTC time for countdown calculation
                utc_time = time.gmtime()
                utc_min = utc_time.tm_min
                utc_sec = utc_time.tm_sec
                utc_deci = int((time.time() % 1) * 10)
                current_sec = utc_min * 60 + utc_sec
                
                # Find phase 7 (as per visualization script)
                for phase in intersection_phases:
                    current_phase = int(phase.get('signalGroup', 0))
                    if current_phase == 7:
                        current_state = str(phase['state-time-speed'][0]['eventState'])
                        min_end_time = phase['state-time-speed'][0]['timing']['maxEndTime']
                        
                        # Calculate countdown
                        time_end_sec = min_end_time / 10
                        countdown = round(time_end_sec - (current_sec + utc_deci / 10.0), 2)
                        
                        return {
                            'intersection_id': intersection_id,
                            'phase': current_phase,
                            'state': current_state,
                            'countdown': max(0, countdown),  # Ensure non-negative
                            'timestamp': time.time()
                        }
        return None
    except Exception as e:
        print(f"Error processing payload: {e}")
        return None


@app.route('/api/traffic_light_state', methods=['GET'])
def traffic_light_state():
    """Returns the current traffic light state for visualization"""
    try:
        # Get the data file path (adjust as needed)
        data_file = os.path.join(
            os.path.dirname(__file__),
            '..',
            'SPaT_copy',
            'data',
            'burnet_2025_09_11_14_01_01_cv2x0_rx.txt'
        )
        data_file = os.path.abspath(data_file)
        
        # Extract payloads
        payloads = extract_payloads_from_file(data_file)
        
        if not payloads:
            return jsonify({'error': 'No payloads found in data file'}), 404
        
        # Try to get state from the latest few payloads
        for payload in payloads[-10:]:  # Check last 10 payloads
            if payload:
                state = get_traffic_light_state(payload)
                if state:
                    return jsonify(state), 200
        
        return jsonify({
            'error': 'Could not extract traffic light state from available payloads',
            'intersection_id': None,
            'phase': None,
            'state': None,
            'countdown': None
        }), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # For development only. Use a proper WSGI server in production.
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5430)), debug=True)
