# How to Access Returned Traffic Signal Phases in visualization.tsx

## Overview
The SPaT_App_LiveSPaTAPI visualization component is designed to fetch and display traffic signal phase data from stored XML messages. Here's a complete guide on how to access and work with the traffic signal phase information.

## Architecture

### 1. Data Flow
```
stored_xml_data/ (XML files)
    ↓
stored_xml_api_server.mjs (Node.js on port 5430)
    ↓
visualization.tsx (React Native component)
    ↓
TrafficLight component (displays current phase)
```

### 2. Starting the API Server

First, start the stored_xml_api_server that serves the stored XML data:

```bash
cd /Users/akhilkakarla/Desktop/SPaT/app/test
npm install express cors
node stored_xml_api_server.mjs
```

The server will start on `http://localhost:5430/api` and will automatically serve data from:
- `/Users/akhilkakarla/Desktop/SPaT_App_LiveSPaTAPI/stored_xml_data/`

## API Endpoints

### Get Latest Traffic Light State
```
GET http://localhost:5430/api/traffic_light_state
```

Response format:
```json
{
  "intersection_id": 123,
  "phases": [
    {
      "phase": 1,
      "state": "stop-And-Remain",
      "color": "RED",
      "eventState": "stop-And-Remain",
      "maxEndTime": 250,
      "countdown": 25.0
    },
    {
      "phase": 2,
      "state": "protected-clearance",
      "color": "YELLOW",
      "countdown": 15.0
    },
    {
      "phase": 3,
      "state": "protected-Movement-Allowed",
      "color": "GREEN",
      "countdown": 30.0
    }
  ],
  "timestamp": 1711000000
}
```

### Get Specific XML by Index
```
GET http://localhost:5430/api/xml/0
```

Same response format as above - returns the parsed phases for that specific XML file.

### Get All SPaT Messages
```
GET http://localhost:5430/api/spat_messages
```

Returns:
```json
{
  "success": true,
  "count": 80,
  "messages": [
    {
      "id": 0,
      "message_xml": "<SPaTMessage>...</SPaTMessage>"
    },
    ...
  ]
}
```

### Get XML History
```
GET http://localhost:5430/api/xml/history
```

Returns metadata about all stored XML files.

## Accessing Phases in visualization.tsx

### 1. State Variables for Phase Data
```typescript
// Current phases being displayed
const [phases, setPhases] = useState<any[] | null>(null);

// Current phase index (0-based)
const [phaseIndex, setPhaseIndex] = useState(0);

// Intersection ID
const [topIntersectionId, setTopIntersectionId] = useState<number | null>(null);

// Current message index (which XML file)
const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

// Countdown timer display value (updates every 100ms)
const [displayedCountdown, setDisplayedCountdown] = useState<number | null>(null);

// Auto-loop toggle
const [autoLoopEnabled, setAutoLoopEnabled] = useState(true);
```

### 2. Fetching Phase Data
```typescript
// Fetch phases for a specific XML message by index
const fetchTrafficLightState = async (messageIndex?: number) => {
  try {
    const url = messageIndex !== undefined 
      ? `${STORED_XML_API}/xml/${messageIndex}` 
      : `${STORED_XML_API}/traffic_light_state`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    // Set the phases array
    setPhases(data.phases || []);
    setTopIntersectionId(data.intersection_id || null);
  } catch (err) {
    console.error('Error fetching phases:', err);
  }
};

// Fetch all XML messages
const fetchMessages = async () => {
  try {
    const res = await fetch(`${STORED_XML_API}/spat_messages`);
    const body = await res.json();
    setMessages(body.messages || []);
    
    // Load first message by default
    if (body.messages && body.messages.length > 0) {
      await fetchTrafficLightState(0);
    }
  } catch (err) {
    console.error('Error fetching messages:', err);
  }
};
```

### 3. Accessing the Current Phase Data
```typescript
// Get current phase object
const currentPhase = phases ? phases[phaseIndex] : null;

// Example: Access phase properties
if (currentPhase) {
  console.log(`Phase Number: ${currentPhase.phase}`);
  console.log(`State: ${currentPhase.state}`); // "stop-And-Remain", "protected-clearance", "protected-Movement-Allowed"
  console.log(`Color: ${currentPhase.color}`); // "RED", "YELLOW", "GREEN"
  console.log(`Countdown: ${currentPhase.countdown}`); // in seconds (e.g., 25.0)
}
```

### 4. Automatically Cycling Through Phases
The visualization automatically cycles through phases based on their countdown duration:

```typescript
// This effect handles phase cycling
useEffect(() => {
  if (!autoLoopEnabled || !phases || phases.length === 0) return;
  
  const currentPhase = phases[phaseIndex];
  const waitTimeMs = (currentPhase.countdown || 1.5) * 1000;
  
  const timeoutId = setTimeout(() => {
    const nextPhaseIndex = (phaseIndex + 1) % phases.length;
    
    // If we've cycled through all phases, move to next XML
    if (nextPhaseIndex === 0 && phaseIndex === phases.length - 1) {
      const nextMessageIdx = (currentMessageIndex + 1) % messages.length;
      setCurrentMessageIndex(nextMessageIdx);
      fetchTrafficLightState(nextMessageIdx);
    } else {
      setPhaseIndex(nextPhaseIndex);
    }
  }, waitTimeMs);
  
  return () => clearTimeout(timeoutId);
}, [phaseIndex, autoLoopEnabled]);
```

### 5. Displaying Phases in the UI
```typescript
// In the render section
{phases && phases.length > 0 ? (
  <View>
    <Text>Message {currentMessageIndex + 1} of {messages?.length}</Text>
    <Text>Phase {phaseIndex + 1} of {phases.length}</Text>
    <TrafficLight
      state={phases[phaseIndex].state}
      countdown={displayedCountdown}
      intersectionId={topIntersectionId}
    />
  </View>
) : (
  <Text>Loading phases...</Text>
)}
```

## Phase Object Structure

Each phase in the `phases` array has this structure:

```typescript
{
  phase: number;                    // Phase number (1, 2, 3, etc.)
  state: string;                    // "stop-And-Remain", "protected-clearance", "protected-Movement-Allowed"
  color: string;                    // "RED", "YELLOW", "GREEN"
  eventState: string;               // Raw event state from XML
  maxEndTime: number | null;        // Countdown in deciseconds (e.g., 250 = 25 seconds)
  countdown: number | null;         // Countdown in seconds (e.g., 25.0)
}
```

## Real-Time Countdown Display

The visualization updates a countdown timer every 100ms for smooth real-time display:

```typescript
useEffect(() => {
  const countdownInterval = setInterval(() => {
    if (phaseStartTimeRef.current === null) return;
    
    const elapsedMs = Date.now() - phaseStartTimeRef.current;
    const elapsedSec = elapsedMs / 1000;
    const newCountdown = Math.max(0, phaseInitialCountdownRef.current - elapsedSec);
    
    setDisplayedCountdown(Math.round(newCountdown * 10) / 10);
  }, 100);
  
  return () => clearInterval(countdownInterval);
}, [phaseIndex]);
```

## Toggling Auto-Loop

Users can pause/resume auto-cycling through XMLs:

```typescript
<Text 
  onPress={() => setAutoLoopEnabled(!autoLoopEnabled)}
>
  {autoLoopEnabled ? '⏸ Auto-Loop ON' : '▶ Auto-Loop OFF'}
</Text>
```

## Troubleshooting

### Issue: "Error fetching phases"
- **Solution**: Make sure the stored_xml_api_server.mjs is running on port 5430
- Run: `node stored_xml_api_server.mjs`

### Issue: "No stored XML files found"
- **Solution**: Verify XML files exist in `/Users/akhilkakarla/Desktop/SPaT_App_LiveSPaTAPI/stored_xml_data/`
- Check that `history.json` exists in that folder

### Issue: Phases not displaying in TrafficLight component
- **Solution**: Check that:
  1. `phases` array is populated (not null/empty)
  2. `phaseIndex` is valid (0 to phases.length-1)
  3. `phases[phaseIndex].state` has a valid value

### Issue: Countdown not decrementing
- **Solution**: Verify the countdown timer effect is running:
  ```typescript
  console.log(`Countdown: ${displayedCountdown}`);
  ```

## API Response Examples

### Example: Get phases for message index 5
```bash
curl http://localhost:5430/api/xml/5
```

Response:
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
    },
    {
      "phase": 3,
      "state": "protected-clearance",
      "color": "YELLOW",
      "countdown": 5.0
    }
  ]
}
```

## Complete Example: Accessing Phase Data

```typescript
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import TrafficLight from '@/components/TrafficLight';

export default function PhaseVisualization() {
  const [phases, setPhases] = useState<any[] | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [displayedCountdown, setDisplayedCountdown] = useState<number | null>(null);

  const API = 'http://localhost:5430/api';

  // Load phases
  useEffect(() => {
    const fetchPhases = async () => {
      const res = await fetch(`${API}/traffic_light_state`);
      const data = await res.json();
      setPhases(data.phases);
    };
    
    fetchPhases();
  }, []);

  // Cycle through phases
  useEffect(() => {
    if (!phases || phases.length === 0) return;
    
    const waitTime = (phases[phaseIndex].countdown || 1.5) * 1000;
    const timer = setTimeout(() => {
      setPhaseIndex((p) => (p + 1) % phases.length);
    }, waitTime);
    
    return () => clearTimeout(timer);
  }, [phaseIndex, phases]);

  if (!phases) return <Text>Loading...</Text>;

  const currentPhase = phases[phaseIndex];

  return (
    <View>
      <Text>Intersection: {/* intersection_id */}</Text>
      <Text>Phase {phaseIndex + 1} of {phases.length}</Text>
      <Text>State: {currentPhase.state}</Text>
      <Text>Color: {currentPhase.color}</Text>
      <Text>Countdown: {displayedCountdown}s</Text>
      
      <TrafficLight
        state={currentPhase.state}
        countdown={displayedCountdown}
      />
    </View>
  );
}
```

## Summary

1. **Start the API**: `node stored_xml_api_server.mjs` on port 5430
2. **Fetch phases**: Use `fetchTrafficLightState()` to load phase data
3. **Access current phase**: Use `phases[phaseIndex]` to get the active phase object
4. **Display data**: Pass phase data to TrafficLight component
5. **Auto-cycle**: The visualization automatically cycles through phases based on countdown
6. **Loop through XMLs**: Auto-loops through all stored XML messages when enabled

The returned traffic signal phases are now fully accessible and displayable in the visualization component!
