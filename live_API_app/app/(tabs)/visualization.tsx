import TrafficLight from '@/components/TrafficLight';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type LightState = 'stop-And-Remain' | 'protected-clearance' | 'protected-Movement-Allowed' | null;

type ParsedPhase = {
  phase: number | null;
  state: LightState;
  countdown: number | null;
  intersection_id: number | null;
};

export default function VisualizationScreen() {
  const [phases, setPhases] = useState<ParsedPhase[]>([]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [displayedCountdown, setDisplayedCountdown] = useState<number | null>(null);
  const [topIntersectionId, setTopIntersectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const live_spat_api_url = 'http://129.114.36.77:8080/spat_decoded';
  const fetchLiveSpat = async () => {
    try {
      const res = await fetch(live_spat_api_url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const movementStates = data?.states?.MovementState;
      if (!Array.isArray(movementStates)) {
        throw new Error('No MovementState array in response');
      }

      const intersectionIdRaw = data?.id?.id;
      const intersectionId =
        intersectionIdRaw !== undefined && intersectionIdRaw !== null
          ? Number(intersectionIdRaw)
          : null;
      setTopIntersectionId(Number.isNaN(intersectionId) ? null : intersectionId);

      const parsed: ParsedPhase[] = movementStates
        .map((movement: any) => {
          const signalGroupRaw = movement?.signalGroup;
          const signalGroup =
            signalGroupRaw !== undefined && signalGroupRaw !== null
              ? Number(signalGroupRaw)
              : null;

          const eventStateObj = movement?.['state-time-speed']?.MovementEvent?.eventState ?? {};
          const eventStateKey = Object.keys(eventStateObj)[0] as LightState | undefined;

          let state: LightState = null;
          if (
            eventStateKey === 'stop-And-Remain' ||
            eventStateKey === 'protected-clearance' ||
            eventStateKey === 'protected-Movement-Allowed'
          ) {
            state = eventStateKey;
          }



          const remainingEndTimeRaw =
            movement?.['state-time-speed']?.MovementEvent?.timing?.remainingTimeSec;

          const remainingEndTimeNum =
          remainingEndTimeRaw !== undefined && remainingEndTimeRaw !== null
              ? Number(remainingEndTimeRaw)
              : NaN;

          const countdown = Number.isNaN(remainingEndTimeRaw) ? null : remainingEndTimeNum;

          return {
            phase: Number.isNaN(signalGroup) ? null : signalGroup,
            state,
            countdown,
            intersection_id: Number.isNaN(intersectionId as number) ? null : intersectionId,
          };
        })
        .filter((phase) => phase.state !== null);

      setPhases(parsed);
      setError(null);

      // Keep phase index in range when API updates phase list size.
      setPhaseIndex((prev) => (parsed.length > 0 ? prev % parsed.length : 0));
    } catch (err) {
      console.error('Error fetching live SPaT:', err);
      setError(String(err));
      setPhases([]);
      setTopIntersectionId(null);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await fetchLiveSpat();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLiveSpat();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    const pollInterval = setInterval(fetchLiveSpat, 1000);
    return () => clearInterval(pollInterval);
  }, []);

  // Keep phase index in range if phase list changes.
  useEffect(() => {
    if (!phases || phases.length === 0) {
      setPhaseIndex(0);
      setDisplayedCountdown(null);
      return;
    }
    setPhaseIndex((prev) => prev % phases.length);
  }, [phases.length]);

  // Initialize countdown when phase changes or fresh data arrives.
  useEffect(() => {
    const current = phases[phaseIndex];
    if (!current) {
      setDisplayedCountdown(null);
      return;
    }
    setDisplayedCountdown(current.countdown ?? null);
  }, [phaseIndex, phases]);

  // Tick countdown smoothly between API polls.
  useEffect(() => {
    if (displayedCountdown === null) return;

    const tick = setInterval(() => {
      setDisplayedCountdown((prev) => {
        if (prev === null) return null;
        const next = Math.max(0, prev - 0.1);

        // Advance phase when timer ends.
        if (next <= 0 && phases.length > 1) {
          setPhaseIndex((idx) => (idx + 1) % phases.length);
        }

        return Number(next.toFixed(1));
      });
    }, 100);

    return () => clearInterval(tick);
  }, [displayedCountdown, phases.length]);

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
      {phases.length > 0 && (
        <Text style={styles.messageCounter}>
          Showing phase {phaseIndex + 1} of {phases.length}
        </Text>
      )}

      {(() => {
        const displayed = phases && phases.length ? phases[phaseIndex] : null;
        const displayedState = displayed?.state || null;
        const countdownToDisplay = displayedCountdown ?? displayed?.countdown ?? null;
        const displayedIntersection = displayed?.intersection_id ?? topIntersectionId ?? null;

        return (
          <View>
            <TrafficLight
              state={displayedState}
              countdown={countdownToDisplay}
              intersectionId={displayedIntersection}
            />
            {displayed?.phase !== null && (
              <Text style={styles.messageCounter}>Signal Group: {displayed?.phase}</Text>
            )}
          </View>
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
