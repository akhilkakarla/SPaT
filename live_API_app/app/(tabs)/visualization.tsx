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

type SpatSnapshot = {
  pcap_index: number;
  intersection_id: number;
  phases: any[];
};

type SpatMessage = {
  id: number;
  message_xml: string;
  phases?: any[];
  intersection_id?: number;
};

export default function VisualizationScreen() {
  const [trafficLightState, setTrafficLightState] = useState<TrafficLightState | null>(null);
  // support API returning multiple phases: when present we cycle through them every 2s
  const [phases, setPhases] = useState<any[] | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);    
  const [topIntersectionId, setTopIntersectionId] = useState<number | null>(null);
  const [phasesSignature, setPhasesSignature] = useState<string | null>(null);
  const [messages, setMessages] = useState<SpatMessage[] | null>(null);
  const [snapshots, setSnapshots] = useState<SpatSnapshot[] | null>(null);
  const [snapshotIndex, setSnapshotIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
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
  const messagesRef = useRef(messages);
  const currentMessageIndexRef = useRef(currentMessageIndex);
  const snapshotsRef = useRef(snapshots);

  const API_BASE_URL = 'http://localhost:8000/api';

  // DEV helper: attempt to start a local Node API if we're running in a Node-capable
  // development environment (this is a best-effort helper and will silently fail
  // on real devices / most React Native runtimes where child_process isn't available).
 
  const fetchTrafficLightState = async (messageIndex?: number) => {
      try {
        const url =
          messageIndex !== undefined
            ? `${API_BASE_URL}/traffic_light_state/${messageIndex}`
            : `${API_BASE_URL}/traffic_light_state`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();

        // Full list: all pcaps as snapshots (xml_access_api.py)
        if (
          messageIndex === undefined &&
          data.snapshots &&
          Array.isArray(data.snapshots) &&
          data.snapshots.length > 0
        ) {
          setSnapshots(data.snapshots);
          snapshotsRef.current = data.snapshots;
          setSnapshotIndex(0);
          setCurrentMessageIndex(0);
          setMessages(
            data.snapshots.map((s: SpatSnapshot, idx: number) => ({
              id: s.pcap_index ?? idx,
              message_xml: `PCAP ${s.pcap_index ?? idx}`,
              phases: s.phases,
              intersection_id: s.intersection_id,
            })),
          );
          setTrafficLightState(null);
          return;
        }

        // Single pcap by index (same shape as before)
        if (messageIndex !== undefined && data && Array.isArray(data.phases)) {
          setPhases(data.phases || []);
          phasesRef.current = data.phases || [];
          setFrozenDerivedPhases(data.phases || []);
          frozenDerivedPhasesRef.current = data.phases || [];
          setTopIntersectionId(data.intersection_id ?? null);
          setPhaseIndex(0);
          setTrafficLightState(null);
          setPhasesSignature(
            JSON.stringify((data.phases || []).map((p: any) => ({ phase: p.phase, state: p.state }))),
          );
          return;
        }

        if (data && Array.isArray(data.phases)) {
          const incomingSig = JSON.stringify(data.phases.map((p: any) => ({ phase: p.phase, state: p.state })));
          if (incomingSig !== phasesSignature) {
            setPhases(data.phases || []);
            phasesRef.current = data.phases || [];
            setPhaseIndex(0);
            setPhasesSignature(incomingSig);
          } else {
            setPhases(data.phases || []);
            phasesRef.current = data.phases || [];
          }
          setTopIntersectionId(data.intersection_id || null);
          setTrafficLightState(null);
          setFrozenDerivedPhases(data.phases || []);
          frozenDerivedPhasesRef.current = data.phases || [];
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
      await fetchTrafficLightState();
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(String(err));
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await fetchTrafficLightState();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrafficLightState();
    setRefreshing(false);
  };

  // Update refs when state changes
  useEffect(() => {
    phasesRef.current = phases;
  }, [phases]);
  
  useEffect(() => {
    frozenDerivedPhasesRef.current = frozenDerivedPhases;
  }, [frozenDerivedPhases]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentMessageIndexRef.current = currentMessageIndex;
  }, [currentMessageIndex]);

  useEffect(() => {
    snapshotsRef.current = snapshots;
  }, [snapshots]);

  /** Apply phases for the current snapshot (cycles through pcaps[] on the server). */
  useEffect(() => {
    if (!snapshots || snapshots.length === 0) return;
    const idx = snapshotIndex >= 0 && snapshotIndex < snapshots.length ? snapshotIndex : 0;
    const snap = snapshots[idx];
    if (!snap?.phases?.length) return;

    setPhases(snap.phases);
    setFrozenDerivedPhases(snap.phases);
    phasesRef.current = snap.phases;
    frozenDerivedPhasesRef.current = snap.phases;
    setTopIntersectionId(snap.intersection_id ?? null);
    setPhaseIndex(0);
    setPhasesSignature(
      JSON.stringify(snap.phases.map((p: any) => ({ phase: p.phase, state: p.state }))),
    );
  }, [snapshots, snapshotIndex]);

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, []);

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

      if (newCountdown <= 0 && phaseOrder && phaseOrder.length > 0) {
        const snapList = snapshotsRef.current;
        const multiPcap = snapList && snapList.length > 1;

        if (phaseOrder.length === 1 && multiPcap) {
          setSnapshotIndex((si) => (si + 1) % snapList!.length);
          return;
        }

        if (phaseOrder.length > 1) {
          const nextPhaseIndex = (validIndex + 1) % phaseOrder.length;
          const wrappedToStart =
            nextPhaseIndex === 0 && validIndex === phaseOrder.length - 1;
          if (wrappedToStart && multiPcap) {
            setSnapshotIndex((si) => (si + 1) % snapList!.length);
          } else {
            setPhaseIndex(nextPhaseIndex);
          }
        }
      }
    }, 100);

    return () => clearInterval(countdownInterval);
  }, [phaseIndex, phases]);

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
      <Text style={styles.title}>Traffic Light Visualization: Live SPaT API</Text>
      {snapshots && snapshots.length > 0 && (
        <Text style={styles.messageCounter}>
          PCAP {snapshots[snapshotIndex]?.pcap_index ?? snapshotIndex + 1} — snapshot {snapshotIndex + 1} of{' '}
          {snapshots.length} (advances after each phase cycle)
        </Text>
      )}

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
  messageNavContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  messageCounter: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
