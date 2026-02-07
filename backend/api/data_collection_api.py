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

input_file = '/Users/akhilkakarla/Desktop/SPaT/data/burnet_2025_09_11_14_01_01_cv2x0_rx.txt'

pcaps = []

xmls = []

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

cv2x_msg = CV2X_Message(pcaps[345])

try:  
    spat_msg_decoded = cv2x_msg.interpret_spat()
except Exception as e:
    print(f"ERROR: {e}")
        
spat_dict = spat_msg_decoded()
intersection_id = spat_dict['value'][1]['intersections'][0]['id']['id']
intersection_phases = spat_dict['value'][1]['intersections'][0]['states']
    

def background_loop():
    global current_phase
    global countdown
    global time_until_next_phase
    global current_state
    global signal_color
    
    for phase in intersection_phases:
        counter = 0
        current_phase = int(phase.get('signalGroup'))
        min_end_time = phase['state-time-speed'][counter]['timing']['minEndTime']
        current_state = str(phase['state-time-speed'][counter]['eventState'])

        if(current_state == 'protected-Movement-Allowed'):
            signal_color = 'green'
        elif(current_state == 'stop-And-Remain'):
            signal_color = 'red'
        else:
            signal_color = 'yellow'
        
        countdown = min_end_time / 10
        time_until_next_phase = countdown
        while(time_until_next_phase > 0):
            time_until_next_phase -= 1
            time.sleep(1)
        
        if(time_until_next_phase <= 0):
            continue
        counter += 1
        

@app.route('/status', methods=['GET'])
def get_status():
    """API endpoint to retrieve the current number."""
    return jsonify({"current_phase": current_phase, "countdown": countdown, "time_until_next_phase": time_until_next_phase, "current_state": current_state, "signal_color": signal_color})

if __name__ == '__main__':
    # 1. Start the loop in a background thread
    thread = threading.Thread(target=background_loop, daemon=True)
    thread.start()

    # 2. Start the Flask API
    # Note: use_reloader=False prevents the thread from starting twice
    app.run(port=8082, debug=True, use_reloader=False)

    
    
    
    

'''
import psycopg2
from flask import Flask, jsonify
import threading
import time
from decoder import decoder
import os
import sys
    
app = Flask(__name__)

pcap_data_file = open("burnet_2025_09_11_14_01_01_cv2x0_rx.txt", 'r')

text = pcap_data_file.read()

pcaps = []

xmls = []

def get_db_conn():
    return psycopg2.connect(
        dbname=os.getenv('SPAT_DB_NAME', 'spat_db'),
        user=os.getenv('SPAT_DB_USER', 'postgres'),
        password=os.getenv('SPAT_DB_PASSWORD', '1804'),
        host=os.getenv('SPAT_DB_HOST', 'localhost'),
        port=os.getenv('SPAT_DB_PORT', '5432')
    )
    
    
def background_loop():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute('SELECT id, message_xml FROM spat_messages ORDER BY id ASC LIMIT 1;')
        
    
for pcap in pcaps:
    try: 
        decoded_pcap = decoder(pcap)
        xmls.append(str(decoded_pcap))
    except Exception as e:
        print(f"Error {e}")
'''
