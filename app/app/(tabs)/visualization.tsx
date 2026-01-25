import TrafficLight from '@/components/TrafficLight';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type TrafficLightState = {
  intersection_id: number | null;
  phase: number | null;
  state: 'stop-And-Remain' | 'protected-clearance' | 'protected-Movement-Allowed' | null;
  countdown: number | null;
  timestamp: number;
  error?: string;
};

type SpatMessage = {
  id: number;
  message_xml: string;
};

export default function VisualizationScreen() {
  const [trafficLightState, setTrafficLightState] = useState<TrafficLightState | null>(null);
  // support API returning multiple phases: when present we cycle through them every 2s
  const [phases, setPhases] = useState<any[] | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);    
  const [topIntersectionId, setTopIntersectionId] = useState<number | null>(null);
  const [phasesSignature, setPhasesSignature] = useState<string | null>(null);
  const [messages, setMessages] = useState<SpatMessage[] | null>(null);
  const [derivedPhases, setDerivedPhases] = useState<any[] | null>(null);
  const [frozenDerivedPhases, setFrozenDerivedPhases] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayedCountdown, setDisplayedCountdown] = useState<number | null>(null); // Live countdown for UI display
  
  // Use refs to track latest values for use in interval callbacks
  const phasesRef = useRef(phases);
  const frozenDerivedPhasesRef = useRef(frozenDerivedPhases);
  const phaseStartTimeRef = useRef<number | null>(null); // When current phase started (Date.now())
  const phaseInitialCountdownRef = useRef<number | null>(null); // Initial countdown value at start

  const API_BASE_URL = 'http://localhost:5430/api';

  // DEV helper: attempt to start a local Node API if we're running in a Node-capable
  // development environment (this is a best-effort helper and will silently fail
  // on real devices / most React Native runtimes where child_process isn't available).
 
  const fetchTrafficLightState = async (isRefresh: boolean = false) => {
      try {
        const res = await fetch(`${API_BASE_URL}/traffic_light_state`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        // If API returned multiple phases, store them and reset index
        if (data && Array.isArray(data.phases)) {
          const incomingSig = JSON.stringify(data.phases.map((p: any) => ({ phase: p.phase, state: p.state })));
          // If phases structure changed, reset index; otherwise preserve current index so cycling isn't interrupted
          if (incomingSig !== phasesSignature) {
            setPhases(data.phases || []);
            phasesRef.current = data.phases || [];
            // Only reset phase index on initial load, not on refresh
            if (!isRefresh) {
              setPhaseIndex(0);
            }
            setPhasesSignature(incomingSig);
          } else {
            // update phases content (e.g., refreshed countdowns) but keep index
            setPhases(data.phases || []);
            phasesRef.current = data.phases || [];
          }
          setTopIntersectionId(data.intersection_id || null);
          setTrafficLightState(null);

          // If we haven't frozen derived phases yet, freeze them now so UI behavior is deterministic
          if (!frozenDerivedPhases) {
            setDerivedPhases(data.phases || []);
            setFrozenDerivedPhases(data.phases || []);
            frozenDerivedPhasesRef.current = data.phases || [];
            setPhaseIndex(0);
          }
        } else {
          setPhases(null);
          setPhasesSignature(null);
          setTopIntersectionId(null);
          setTrafficLightState(data);
        }
      } catch (err) {
        console.error('Error fetching traffic light state:', err);
        setTrafficLightState({
          intersection_id: null,
          phase: null,
          state: null,
          countdown: null,
          timestamp: Date.now() / 1000,
          error: String(err),
        });
      }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/spat_messages`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }  
      const body = await res.json();
      setMessages(body.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(String(err));
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchTrafficLightState(), fetchMessages()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Only fetch messages on refresh - do NOT fetch traffic light state
    // This prevents interrupting the phase countdown cycle
    await fetchMessages();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    // Do NOT poll every 2 seconds - phases will cycle based on their countdown durations
    // The countdown timer will decrement locally on the frontend
  }, []);

  // Update refs when state changes
  useEffect(() => {
    phasesRef.current = phases;
  }, [phases]);
  
  useEffect(() => {
    frozenDerivedPhasesRef.current = frozenDerivedPhases;
  }, [frozenDerivedPhases]);

  // Local countdown timer: decrements every 100ms based on elapsed time since phase start
  useEffect(() => {
    // Initialize countdown values when phase index changes
    const phaseOrder = frozenDerivedPhasesRef.current || phasesRef.current;
    if (!phaseOrder || phaseOrder.length === 0 || !phases) return;

    const validIndex = phaseIndex >= 0 && phaseIndex < phaseOrder.length ? phaseIndex : 0;
    const currentPhase = phases[validIndex];
    
    if (!currentPhase || currentPhase.countdown === null) return;

    // Reset timer refs when phase changes
    phaseStartTimeRef.current = Date.now();
    phaseInitialCountdownRef.current = currentPhase.countdown;
    setDisplayedCountdown(currentPhase.countdown);

    // Countdown interval: decrement every 100ms based on elapsed time
    const countdownInterval = setInterval(() => {
      if (phaseStartTimeRef.current === null || phaseInitialCountdownRef.current === null) return;

      const elapsedMs = Date.now() - phaseStartTimeRef.current;
      const elapsedSec = elapsedMs / 1000;
      const newCountdown = Math.max(0, phaseInitialCountdownRef.current - elapsedSec);

      setDisplayedCountdown(Math.round(newCountdown * 10) / 10);
    }, 100);

    return () => clearInterval(countdownInterval);
  }, [phaseIndex, phases]);

  // Cycle through phases, waiting for the full countdown duration of each phase
  // Only depends on phaseIndex so it doesn't restart when phases updates via polling
  useEffect(() => {
    // Minimum display duration to ensure red lights stay visible
    const MIN_PHASE_DURATION_MS = 1500; // 1.5 seconds minimum per phase
    
    // Don't cycle if still loading or no phases yet
    if (loading || !phases || phases.length === 0) {
      console.log('[Phase Cycling] Skipping - loading:', loading, 'phases:', phases?.length ?? 0);
      return;
    }

    // Get the current phase's countdown value from refs (latest data)
    // Use frozenDerivedPhasesRef for phase structure/order, phasesRef for countdown values
    const phaseOrder = frozenDerivedPhasesRef.current || phasesRef.current;
    if (!phaseOrder || phaseOrder.length === 0) {
      console.log('[Phase Cycling] No phase order available');
      return;
    }
    
    // Use phasesRef for latest countdown values (updated every 2s via polling)
    const currentPhases = phasesRef.current || phaseOrder;
    
    if (!currentPhases || currentPhases.length === 0) {
      console.log('[Phase Cycling] No current phases data available');
      return;
    }
    
    // Ensure phaseIndex is valid
    const validIndex = phaseIndex >= 0 && phaseIndex < phaseOrder.length ? phaseIndex : 0;
    const currentPhase = currentPhases[validIndex];
    
    if (!currentPhase) {
      console.log(`[Phase Cycling] No phase data at index ${validIndex}`);
      return;
    }
    
    const countdown = typeof currentPhase.countdown === 'number' ? currentPhase.countdown : null;
    const phaseNumber = currentPhase?.phase ?? validIndex;
    const phaseState = currentPhase?.state ?? 'unknown';
    
    console.log(`[Phase Cycling] Phase ${phaseNumber} (index ${validIndex}): countdown=${countdown}s, state=${phaseState}`);
    
    // Calculate effective wait time: use countdown if available, but ensure minimum display duration
    let waitTimeMs = MIN_PHASE_DURATION_MS; // Default to minimum
    
    if (countdown !== null && countdown > 0 && !isNaN(countdown)) {
      // Use the countdown value but ensure it's at least MIN_PHASE_DURATION_MS
      const countdownMs = countdown * 1000;
      waitTimeMs = Math.max(MIN_PHASE_DURATION_MS, Math.min(countdownMs, 300000)); // Cap at 5 minutes
      console.log(`[Phase Cycling] Using countdown: ${countdown}s = ${countdownMs}ms, adjusted to ${waitTimeMs}ms`);
    } else {
      // Countdown is invalid, use minimum duration
      console.log(`[Phase Cycling] Countdown invalid (${countdown}), using minimum phase duration (${MIN_PHASE_DURATION_MS}ms)`);
    }
    
    console.log(`[Phase Cycling] Phase ${phaseNumber}: Waiting ${waitTimeMs}ms before next phase`);
    
    const timeoutId = setTimeout(() => {
      console.log(`[Phase Cycling] Timeout fired for phase ${phaseNumber}, moving to next phase`);
      setPhaseIndex((idx) => {
        const order = frozenDerivedPhasesRef.current || phasesRef.current;
        if (!order || order.length === 0) return 0;
        const nextIdx = (idx + 1) % order.length;
        console.log(`[Phase Cycling] Moving from phase index ${idx} to ${nextIdx}`);
        return nextIdx;
      });
    }, waitTimeMs);
    
    return () => {
      console.log(`[Phase Cycling] Cleaning up timeout for phase ${phaseNumber}`);
      clearTimeout(timeoutId);
    };
  }, [phaseIndex, loading]); // Depend on phaseIndex and loading status

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading traffic light data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Traffic Light Visualization</Text>
      
      {/* Traffic Light Component */}
      {/* displayedPhase is either the single returned state or the currently-cycled phase from the phases array */}
      {(() => {
        const active = frozenDerivedPhases || phases;
        const displayed = active && active.length ? active[phaseIndex] : trafficLightState;
        const displayedState = displayed?.state || null;
        const countdownToDisplay = displayedCountdown ?? displayed?.countdown ?? null;
        const displayedIntersection = displayed?.intersection_id ?? topIntersectionId ?? null;

        return (
          <TrafficLight
            state={displayedState}
            countdown={countdownToDisplay}
            intersectionId={displayedIntersection}
          />
        );
      })()}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>Error: {error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#333',
  },
  messageCard: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  messageId: {
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
  },
  messageXml: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#666',
  },
  error: {
    color: '#d32f2f',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  noData: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
