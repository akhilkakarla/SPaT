import threading
import time
from flask import Flask, jsonify

app = Flask(__name__)

# Global variable to store the current count
current_number = 0

def background_loop():
    """A function that updates the global counter every second."""
    global current_number
    i = 0
    while(True):
        current_number = i
        # print(f"Loop is at: {current_number}")
        i = i + 1
        if(i == 10):
            i = 0
        time.sleep(2)  # Pause so you have time to test the API

@app.route('/status', methods=['GET'])
def get_status():
    """API endpoint to retrieve the current number."""
    return jsonify({"current_number": current_number})

if __name__ == '__main__':
    # 1. Start the loop in a background thread
    thread = threading.Thread(target=background_loop, daemon=True)
    thread.start()

    # 2. Start the Flask API
    # Note: use_reloader=False prevents the thread from starting twice
    app.run(port=8080, debug=True, use_reloader=False)
