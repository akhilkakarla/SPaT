# Quick Start: Accessing Traffic Signal Phases

## TL;DR - What You Need to Do

### Step 1: Start the API Server
```bash
cd /Users/akhilkakarla/Desktop/SPaT/app/test
node stored_xml_api_server.mjs
```

This serves the stored XML messages on `http://localhost:5430/api`

### Step 2: The Phases are Now Accessible in visualization.tsx

The component automatically:
- ✅ Fetches all stored XML messages
- ✅ Parses traffic signal phases from each XML
- ✅ Displays current phase with traffic light color
- ✅ Cycles through phases based on countdown duration
- ✅ Loops through all XML messages
- ✅ Updates countdown timer every 100ms

### Step 3: Access Phase Data in Your Code

```typescript
// The phases array contains all phases for current XML
const [phases, setPhases] = useState<any[] | null>(null);

// Current phase being displayed
const currentPhase = phases ? phases[phaseIndex] : null;

// Access phase properties:
// - currentPhase.phase (number)
// - currentPhase.state ("stop-And-Remain" | "protected-clearance" | "protected-Movement-Allowed")
// - currentPhase.color ("RED" | "YELLOW" | "GREEN")
// - currentPhase.countdown (seconds, e.g., 25.0)
```

## Phase Response Structure

When you fetch `/api/traffic_light_state` or `/api/xml/:index`, you get:

```json
{
  "intersection_id": 12345,
  "phases": [
    {
      "phase": 1,
      "state": "stop-And-Remain",
      "color": "RED",
      "countdown": 25.0
    },
    {
      "phase": 2,
      "state": "protected-Movement-Allowed",
      "color": "GREEN",
      "countdown": 30.0
    }
  ]
}
```

## Available API Endpoints

- `GET /api/traffic_light_state` - Latest phases
- `GET /api/xml/:index` - Phases for specific XML
- `GET /api/spat_messages` - All raw XML messages
- `GET /api/xml/history` - List of all XML files
- `GET /api/xml/latest` - Latest XML parsed
- `GET /api/xml/all` - All XMLs parsed

## What the Visualization Does

1. **Loads** all stored XML messages on startup
2. **Parses** each XML to extract signal phases
3. **Displays** the current phase with TrafficLight component
4. **Cycles** through phases automatically based on countdown
5. **Loops** through all XML messages when auto-play is enabled
6. **Updates** countdown timer every 100ms for smooth display

## File Locations

- **API Server**: `/Users/akhilkakarla/Desktop/SPaT/app/test/stored_xml_api_server.mjs`
- **Visualization**: `/Users/akhilkakarla/Desktop/SPaT_App_LiveSPaTAPI/app/(tabs)/visualization.tsx`
- **Stored XML Data**: `/Users/akhilkakarla/Desktop/SPaT_App_LiveSPaTAPI/stored_xml_data/`
- **Full Guide**: `/Users/akhilkakarla/Desktop/SPaT/app/test/PHASE_ACCESS_GUIDE.md`

## Troubleshooting

**Phases not showing?**
- Make sure `node stored_xml_api_server.mjs` is running
- Check that XML files exist in stored_xml_data folder

**Countdown not decrementing?**
- This is normal if countdown is 0 or less
- Countdown updates every 100ms based on elapsed time

**Auto-loop not working?**
- Toggle the "Auto-Loop" button in the UI
- Check console for errors

---

**That's it!** The traffic signal phases are now accessible in the visualization component and will automatically cycle through all stored XMLs with realistic countdown timers.
