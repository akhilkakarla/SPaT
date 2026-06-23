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
  const [home, setHomeScreen] = useState<'none' | 'flex'>('flex');
  const [north, setNorthScreen] = useState<'none' | 'flex'>('none');
  const [south, setSouthScreen] = useState<'none' | 'flex'>('none');
  const [east, setEastScreen] = useState<'none' | 'flex'>('none');
  const [west, setWestScreen] = useState<'none' | 'flex'>('none');

  const live_spat_api_url = 'http://129.114.36.77:8080/spat_decoded';
  const backup_url = "http://192.168.86.222:5430/api/traffic_light_state";
  const fetchLiveSpat = async () => {
    try {
      var res = await fetch(live_spat_api_url);
      if (!res.ok){
        throw new Error(`HTTP ${res.status}`);
      } 

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

  const showHomeScreen = () => {
    setHomeScreen('flex');
    setNorthScreen('none');
    setSouthScreen('none');
    setEastScreen('none');
    setWestScreen('none');
  };

  const showNorthScreen = () => {
    setHomeScreen('none');
    setNorthScreen('flex');
    setSouthScreen('none');
    setEastScreen('none');
    setWestScreen('none');
  };

  const showSouthScreen = () => {
    setHomeScreen('none');
    setNorthScreen('none');
    setSouthScreen('flex');
    setEastScreen('none');
    setWestScreen('none');
  };

  const showEastScreen = () => {
    setHomeScreen('none');
    setNorthScreen('none');
    setSouthScreen('none');
    setEastScreen('flex');
    setWestScreen('none');
  };

  const showWestScreen = () => {
    setHomeScreen('none');
    setNorthScreen('none');
    setSouthScreen('none');
    setEastScreen('none');
    setWestScreen('flex');
  };

  const returnNorthPhases = () => {
    const northSignalGroups = [1, 2, 22];
    const northPhases = phases.filter(
      (phase) => phase.phase !== null && northSignalGroups.includes(phase.phase),
    );
    return northPhases.length > 0 ? (
      <View>
        {northPhases.map((phase, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: 'rgba(126, 153, 235, 0.65)',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 10,
              padding: 10,
              borderRadius: 8,
            }}
            onPress={() => setPhaseIndex(index)}
          >
            <Text 
              style={{
                color: '#ffff',
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
              Signal Group {phase.phase}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ) : (
      <Text style={styles.noData}>No north phases available</Text>
    );
  };

  const returnSouthPhases = () => {
    const southSignalGroups = [5, 6, 26];
    const southPhases = phases.filter(
      (phase) => phase.phase !== null && southSignalGroups.includes(phase.phase),
    );
    return southPhases.length > 0 ? (
      <View>
        {southPhases.map((phase, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: 'rgba(126, 153, 235, 0.65)',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 10,
              padding: 10,
              borderRadius: 8,
            }}
            onPress={() => setPhaseIndex(index)}
          >
            <Text 
              style={{
                color: '#ffff',
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
              Signal Group {phase.phase}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ) : (
      <Text style={styles.noData}>No south phases available</Text>
    );
  };

  const returnEastPhases = () => {
    const eastSignalGroups = [3, 4, 24];
    const eastPhases = phases.filter(
      (phase) => phase.phase !== null && eastSignalGroups.includes(phase.phase),
    );
    return eastPhases.length > 0 ? (
      <View>
        {eastPhases.map((phase, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: 'rgba(126, 153, 235, 0.65)',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 10,
              padding: 10,
              borderRadius: 8,
            }}
            onPress={() => setPhaseIndex(index)}
          >
            <Text 
              style={{
                color: '#ffff',
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
              Signal Group {phase.phase}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ) : (
      <Text style={styles.noData}>No east phases available</Text>
    );
  };

  const returnWestPhases = () => {
    const westSignalGroups = [7, 8, 28];
    const westPhases = phases.filter(
      (phase) => phase.phase !== null && westSignalGroups.includes(phase.phase),
    );
    return westPhases.length > 0 ? (
      <View>
        {westPhases.map((phase, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: 'rgba(126, 153, 235, 0.65)',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 10,
              padding: 10,
              borderRadius: 8,
            }}
            onPress={() => setPhaseIndex(index)}
          >
            <Text 
              style={{
                color: '#ffff',
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
              Signal Group {phase.phase}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ) : (
      <Text style={styles.noData}>No west phases available</Text>
    );
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
          
          <TouchableOpacity onPress={showHomeScreen}
            style={styles.sideBarOption}>
            <Text style={styles.sideBarOptionsText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showNorthScreen}
            style={styles.sideBarOption}>
            <Text style={styles.sideBarOptionsText}>North</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showSouthScreen}
            style={styles.sideBarOption}>
            <Text style={styles.sideBarOptionsText}>South</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showEastScreen}
            style={styles.sideBarOption}>
            <Text style={styles.sideBarOptionsText}>East</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showWestScreen}
            style={styles.sideBarOption}>
            <Text style={styles.sideBarOptionsText}>West</Text>
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
    <View style={styles.screenBackground}>
      <View style={styles.glassWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >

        <TouchableOpacity onPress = {openSideBar}
            style = {styles.menuButton}>

            <Ionicons name = "menu-outline" size = {24} color="black"/>

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
                <View>
                  <TrafficLight
                    state={displayedState}
                    countdown={countdownToDisplay}
                    intersectionId={displayedIntersection}
                    signalGroup={displayed?.phase ?? null}
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
                        backgroundColor: 'rgba(126, 153, 235, 0.65)',
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
                      <Text style={{color: '#ffff', fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>
                        Phase {phase.phase}
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






        <View style = {{display: north}}>
          <View style={styles.glassWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >

        <TouchableOpacity onPress = {openSideBar}
            style = {styles.menuButton}>

            <Ionicons name = "menu-outline" size = {24} color="black"/>

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
                <View>
                  <TrafficLight
                    state={displayedState}
                    countdown={countdownToDisplay}
                    intersectionId={displayedIntersection}
                    signalGroup={displayed?.phase ?? null}
                  />
                </View>
              {displayed?.phase !== null && (
                <Text style={styles.messageCounter}>Signal Group: {displayed?.phase}</Text>
              )}

              {returnNorthPhases()}
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
        </View>



        <View style = {{display: south}}>
          <View style={styles.glassWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >

        <TouchableOpacity onPress = {openSideBar}
            style = {styles.menuButton}>

            <Ionicons name = "menu-outline" size = {24} color="black"/>

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
                <View>
                  <TrafficLight
                    state={displayedState}
                    countdown={countdownToDisplay}
                    intersectionId={displayedIntersection}
                    signalGroup={displayed?.phase ?? null}
                  />
                </View>
              {displayed?.phase !== null && (
                <Text style={styles.messageCounter}>Signal Group: {displayed?.phase}</Text>
              )}

              {phases.length > 0 && (
                <View>
                  {returnSouthPhases()}
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
        </View>



        <View style = {{display: east}}>
          <View style={styles.glassWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >

        <TouchableOpacity onPress = {openSideBar}
            style = {styles.menuButton}>

            <Ionicons name = "menu-outline" size = {24} color="black"/>

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
                <View>
                  <TrafficLight
                    state={displayedState}
                    countdown={countdownToDisplay}
                    intersectionId={displayedIntersection}
                    signalGroup={displayed?.phase ?? null}
                  />
                </View>
              {displayed?.phase !== null && (
                <Text style={styles.messageCounter}>Signal Group: {displayed?.phase}</Text>
              )}

              {phases.length > 0 && (
                <View>
                  {returnEastPhases()}
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
        </View>



        <View style = {{display: west}}>
          <View style={styles.glassWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >

        <TouchableOpacity onPress = {openSideBar}
            style = {styles.menuButton}>

            <Ionicons name = "menu-outline" size = {24} color="black"/>

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
                <View>
                  <TrafficLight
                    state={displayedState}
                    countdown={countdownToDisplay}
                    intersectionId={displayedIntersection}
                    signalGroup={displayed?.phase ?? null}
                  />
                </View>
              {displayed?.phase !== null && (
                <Text style={styles.messageCounter}>Signal Group: {displayed?.phase}</Text>
              )}

              {phases.length > 0 && (
                <View>
                  {returnWestPhases()}
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
        </View>
        
    </View>

  );
}

const styles = StyleSheet.create({
  screenBackground: {
    flex: 1,
    backgroundColor: '#071427',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  messageNavContainer: {
    marginBottom: 18,
    padding: 12,
    backgroundColor: 'transparent',
    borderRadius: 14,
    alignItems: 'center' as const,
  },

  messageCounter: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#dbe9ff',
    alignItems: 'flex-end',
  },

  messageCounterText: {
    color: '#dbe9ff',
    fontSize: 16,
    fontWeight: '700',
    margin: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#ffffff',
  },
  messageCard: {
    marginBottom: 14,
    padding: 16,
    borderWidth: 0,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(8px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  messageId: {
    fontWeight: '700',
    marginBottom: 6,
    color: '#e6f0ff',
  },
  messageXml: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#9fb0c8',
  },
  error: {
    color: '#ff8b94',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.06)',
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
  },
  noData: {
    color: '#9aa4b2',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },

  menuButton: {
    position: 'absolute',
    left: 14,
    top: 12,
    color: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: '#ffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  sideBar: {
    backgroundColor: 'black',
    position: 'absolute',
    left: 0,
    width: Math.min(deviceWidth * 0.72, 340),
    height: deviceHeight,
    padding: 20,
    paddingTop: 36,
    elevation: 18,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },

  glassWrapper: {
    flex: 1,
    margin: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },

  sideBarCloseButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    padding: 8,
  },

  sideBarOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(126, 153, 235, 0.65)',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  sideBarOptionsText: {
    color: '#eaf4ff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
});