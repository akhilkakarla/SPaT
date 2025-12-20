# How to Display the SPaT Traffic Light Visualization

The tkinter visualization in `visualize_db_spats.py` creates a desktop GUI showing real-time traffic light states. Here are two ways to display it:

## Option 1: Run the Python Script Directly (Desktop Only)

**Prerequisites:**
- Python 3.x installed
- Required Python packages (install with `pip install -r requirements.txt`)

**Steps:**

1. Navigate to the decoder directory:
   ```bash
   cd /Users/akhilkakarla/Desktop/SPaT_App_Backend/SPaT_copy/j2735_decoder
   ```

2. Install dependencies if needed:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the visualization script:
   ```bash
   python visualize_db_spats.py
   ```

   **Note:** Make sure the data file path in the script is correct (line 44).

4. A tkinter window will open showing:
   - A traffic light visualization (red/yellow/green)
   - Countdown timer for the current phase
   - Intersection ID
   - Real-time updates every second

**Important:** This only works on desktop (macOS, Windows, Linux) - tkinter is not available on mobile devices.

---

## Option 2: Integrate with React Native App (Recommended for Mobile)

Since tkinter won't work on mobile, you can create an API endpoint that provides the traffic light state data and recreate the visualization in React Native.

### Step 1: Create an API Endpoint for Traffic Light State

Add this endpoint to your Flask API (`api/app.py`):

```python
@app.route('/api/traffic_light_state', methods=['GET'])
def traffic_light_state():
    """
    Returns the current traffic light state for visualization.
    Processes the latest SPaT message and extracts:
    - Intersection ID
    - Current phase
    - Current state (stop-And-Remain, protected-clearance, protected-Movement-Allowed)
    - Time remaining until next state change
    """
    try:
        # Get latest SPaT message from database
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('SELECT message_xml FROM spat_messages ORDER BY id DESC LIMIT 1;')
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return jsonify({'error': 'No SPaT messages found'}), 404
        
        # Parse the XML and extract traffic light state
        # You'll need to add XML parsing logic here similar to visualize_db_spats.py
        # This is a placeholder structure:
        return jsonify({
            'intersection_id': 871,
            'current_phase': 7,
            'current_state': 'protected-Movement-Allowed',  # or 'stop-And-Remain', 'protected-clearance'
            'countdown': 15.5,  # seconds remaining
            'timestamp': time.time()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### Step 2: Create React Native Traffic Light Component

Update your `visualization.tsx` to display the traffic light visualization:

```typescript
// Add traffic light visualization component
// Use react-native-svg or simple View components to recreate the traffic light
```

---

## Quick Test: Run the Desktop Visualization

To quickly test the desktop visualization:

```bash
cd /Users/akhilkakarla/Desktop/SPaT_App_Backend/SPaT_copy/j2735_decoder
python visualize_db_spats.py
```

The window should open and display the traffic light animation!

