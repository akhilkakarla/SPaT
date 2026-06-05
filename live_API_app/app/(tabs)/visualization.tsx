import TrafficLight from '@/components/TrafficLight';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;

type LightState = 'stop-And-Remain' | 'protected-clearance' | 'protected-Movement-Allowed' | null;

type ParsedPhase = {
  phase: number | null;
  state: LightState;
  countdown: number | null;
  intersection_id: number | null;
};

export default function VisualizationScreen() {
  const [phases, setPhases] = useState<ParsedPhase[]>([]);
  const [phase, setPhase] = useState<ParsedPhase[]>([]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [displayedCountdown, setDisplayedCountdown] = useState<number | null>(null);
  const [topIntersectionId, setTopIntersectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSideBarOpen, setIsSideBarVisible] = useState(false);
  const sidebarTranslateX = useRef(new Animated.Value(100)).current;
  const [error, setError] = useState<string | null>(null);

  const live_spat_api_url = 'http://129.114.36.77:8080/spat_decoded';
  const backup_url = "http://192.168.86.222:5430/api/traffic_light_state";
  const fetchLiveSpat = async () => {
    try {
      var res = await fetch(live_spat_api_url);
      if (!res.ok){
        throw new Error(`HTTP ${res.status}`);
      } 

      /*
      else {
        res = await fetch(backup_url);
        if(!res.ok) throw new Error(`HTTP ${res.status}`)
      }
    */

      const data = await res.json();
      const movementStates = data?.states?.MovementState;
      const firstState = data?.states?.MovementState[0];
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

          const countdown = Number.isNaN(remainingEndTimeNum) ? null : remainingEndTimeNum;

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
    // Keep isFrozen state unchanged during refresh
  };

  const openSideBar = () => {
    setIsSideBarVisible(true)
    Animated.timing(sidebarTranslateX, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const closeSideBar = () => {
    setIsSideBarVisible(false)
    Animated.timing(sidebarTranslateX, {
      toValue: 100,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setIsSideBarVisible(false));
  };

  const renderSidebar = () => {
    return (
      <Modal visible = {isSideBarOpen} transparent animationType = 'none'>
        <TouchableWithoutFeedback onPress = {closeSideBar}>
          <View style = {{flex: 1}}></View>
        </TouchableWithoutFeedback>

        <Animated.View
          style = {[styles.sideBar, {transform: [{translateX: sidebarTranslateX}]}]}>

          <TouchableOpacity onPress = {closeSideBar}
            style = {styles.sideBarCloseButton}> 
            <Ionicons name = "close" size = {20} color="white"/>
          </TouchableOpacity>

          <TouchableOpacity style = {styles.sideBarOption}>
            <Text style = {styles.sideBarOptionsText}>North</Text>
          </TouchableOpacity>

          <TouchableOpacity style = {styles.sideBarOption}>
            <Text style = {styles.sideBarOptionsText}>South</Text>
          </TouchableOpacity>

          <TouchableOpacity style = {styles.sideBarOption}>
            <Text style = {styles.sideBarOptionsText}>East</Text>
          </TouchableOpacity>

          <TouchableOpacity style = {styles.sideBarOption}>
            <Text style = {styles.sideBarOptionsText}>West</Text>
          </TouchableOpacity>

        </Animated.View>
      </Modal>
    )
  }

  const setSignalPhase = (phase: number) => {
    // Display selected phase and freeze automatic switching
    setPhaseIndex(phase);
  };

  useEffect(() => {
    loadData();
    const pollInterval = setInterval(fetchLiveSpat, 1000);
    return () => clearInterval(pollInterval);
  }, []);

  // Keep phase index in range if phase list changes (only if not frozen).
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

  // Tick countdown smoothly between API polls (only if not frozen).
  useEffect(() => {
    if (displayedCountdown === null) return;

    const tick = setInterval(() => {
      setDisplayedCountdown((prev) => {
        if (prev === null) return null;
        const next = Math.max(0, prev - 0.1);

        // Advance phase exactly once when countdown crosses zero (if not frozen).
        if (prev >= 0 && next <= 0 && phases.length > 1) {
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
    <View style = {{flex: 1, backgroundColor:'rgba(95, 202, 255, 0.8)'}}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        <TouchableOpacity onPress = {openSideBar}
            style = {
              styles.menuButton
            }>

            <Ionicons name = "home" size = {24} color="black"/>

        </TouchableOpacity>

        {renderSidebar()}

        <Text style={styles.title}>Traffic Light Visualization: Live SPaT API</Text>
        <View style = {styles.messageCounter}>
          {phases.length > 0 && (
            <Text style={styles.messageCounterText}>
              Showing phase {phaseIndex + 1} of {phases.length}
            </Text>
          )}
            <Text style = {styles.messageCounterText}>
                Total Phases: {phases.length}
            </Text>
        </View>
          

        {(() => {
          const displayed = phases && phases.length ? phases[phaseIndex] : null;
          const displayedState = displayed?.state || null;
          const countdownToDisplay = displayedCountdown ?? displayed?.countdown ?? null;
          const displayedIntersection = displayed?.intersection_id ?? topIntersectionId ?? null;  

          return (
            <View>
                <View style = {{backgroundColor: 'rgba(95, 202, 255, 0.8)'}}>
                  <TrafficLight
                    state={displayedState}
                    countdown={countdownToDisplay}
                    intersectionId={displayedIntersection}
                  />
                </View>
              {displayed?.phase !== null && (
                <Text style={styles.messageCounter}>Signal Group: {displayed?.phase}</Text>
              )}

              {phases.length > 0 && (
                <View>
                  {phases.map((phase, index) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        backgroundColor: '#5596ea',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: 10,
                        padding: 10,
                        borderRadius: 8,
                      }}
                      onPress={() => {
                        setSignalPhase(index)
                      }}
                    >
                      <Text style={{color: 'black', fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>
                        Phase {index + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
    </View>

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
    alignItems: 'flex-end',
  },
  messageCounterText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    margin: 10,
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

  menuButton: {
    position: 'absolute',
    left: 10,
    top: 5,
    color: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    width: 30,
  },

  sideBar: {
    backgroundColor: '#5596ea',
    position: 'absolute',
    left: 0,
    width: deviceWidth * 0.22,
    height: deviceHeight,
    padding: 16,
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },

  sideBarCloseButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    padding: 8,
  },

  sideBarOption: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },

  sideBarOptionsText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
