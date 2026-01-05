from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import os
import sys
import time
import threading

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


def writeTime(endTime, currentSec, currentDecSec):
    """Calculate the phase's state time remaining - same as visualize_db_spats.py"""
    currentTime = currentSec + currentDecSec / 10.0
    countdown = round(endTime - currentTime, 2)
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


def display_phases_loop():
    """Background thread that loops through all signal phases with 2-second delays - same as visualize_db_spats.py"""
    while True:
        try:
            if CV2X_Message is None:
                print("CV2X_Message not available, waiting...")
                continue
            
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
            payloads = extract_payloads_from_file(data_file)
            
            if not payloads:
                print("No payloads found in data file for display loop, waiting...")
                continue
            
            # Use the first payload (same as visualize_db_spats.py uses payloads[0])
            pcap_data = payloads[0] if payloads else None
            
            if not pcap_data or len(pcap_data) == 0:
                print("No valid payload data for display loop, waiting...")
                continue
            
            # Parse C-V2X pcap message (same as visualize_db_spats.py)
            cv2x_msg = CV2X_Message(pcap_data)
            
            if cv2x_msg is None or not cv2x_msg.uper_data or cv2x_msg.uper_data[0:4] != '0013':
                print("Invalid SPaT message for display loop, waiting...")
                continue
            
            # Decode SPaT message (same as visualize_db_spats.py)
            try:
                spat_msg_decoded = cv2x_msg.interpret_spat()
                time.sleep(2)
            except Exception as e:
                print(f"Error decoding SPaT in display loop: {e}")
                continue
            
            if not spat_msg_decoded:
                print("Could not decode SPaT message for display loop, waiting...")
                continue
            
            # Get intersection data (same structure as visualize_db_spats.py)
            spat_dict = spat_msg_decoded()
            intersection_id = spat_dict['value'][1]['intersections'][0]['id']['id']
            intersection_phases = spat_dict['value'][1]['intersections'][0]['states']
            
            print(f"\n=== Starting phase loop for Intersection {intersection_id} with {len(intersection_phases)} phases ===\n")
            
            # Loop through all phases (same as visualize_db_spats.py)
            for phase in intersection_phases:
                try:
                    # Get the current phase, state, and end time of the phase
                    current_phase = int(phase.get('signalGroup'))
                    current_state = str(phase['state-time-speed'][0]['eventState'])
                    min_end_time = phase['state-time-speed'][0]['timing']['maxEndTime']
                    
                    # Get the current time (for calculating remaining time) - recalculate each iteration
                    utc_time = time.gmtime()
                    utc_min = utc_time.tm_min
                    utc_sec = utc_time.tm_sec
                    utc_deci = int((time.time() % 1) * 10)
                    current_sec = utc_min * 60 + utc_sec
                    
                    # Calculate the current time until next state (same as visualize_db_spats.py)
                    time_end_sec = min_end_time / 10.0
                    time_end_sec_in_minute = time_end_sec % 60.0
                    absolute_end_sec = (utc_min * 60) + time_end_sec_in_minute
                    
                    if absolute_end_sec <= current_sec:
                        absolute_end_sec += 60.0
                    
                    countdown = writeTime(absolute_end_sec, current_sec, utc_deci)
                    countdown = max(0, countdown)
                    
                    # Get signal color based on state
                    color = get_signal_color(current_state)
                    
                    # Display phase information (same format as visualize_db_spats.py)
                    print(f"Phase {current_phase}: Signal Color = {color} | State = {current_state} | Countdown = {countdown:.1f}s")
                    
                    # Sleep 2 seconds before looping to next phase (same as visualize_db_spats.py)
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"Error processing phase in display loop: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
            
            print("\n=== Completed phase loop, restarting ===\n")
            
        except Exception as e:
            print(f"Error in display_phases_loop: {e}")
            import traceback
            traceback.print_exc()


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
        payloads = extract_payloads_from_file(data_file)
        
        if not payloads:
            return jsonify({
                'error': 'No payloads found in data file',
                'intersection_id': None,
                'phases': []
            }), 404
        
        # Use the first payload (same as visualize_db_spats.py uses payloads[0])
        pcap_data = payloads[0] if payloads else None
        
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
                current_phase = int(phase.get('signalGroup'))
                current_state = str(phase['state-time-speed'][0]['eventState'])
                
                # Get timing information - maxEndTime is in deciseconds
                min_end_time = phase['state-time-speed'][0]['timing']['maxEndTime']
                
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
            except Exception as e:
                print(f"Error processing phase {phase.get('signalGroup', 'unknown')}: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        return jsonify({
            'intersection_id': intersection_id,
            'phases': phases
        }), 200
        
    except Exception as e:
        print(f"Error in traffic_light_state endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Start background thread to loop through phases with 2-second delays
    display_thread = threading.Thread(target=display_phases_loop, daemon=True, name='display_phases_loop')
    display_thread.start()
    print("Started background thread to loop through traffic phases with 2-second delays")
    
    # For development only. Use a proper WSGI server in production.
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5430)), debug=True)
