import TrafficLight from '@/components/TrafficLight';
import { useAppTheme } from '@/hooks/theme-context';
import { useCompass, type CardinalDirection } from '@/hooks/useCompass';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

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
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [displayedCountdown, setDisplayedCountdown] = useState<number | null>(null);
  const [topIntersectionId, setTopIntersectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSideBarOpen, setIsSideBarVisible] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const sidebarTranslateX = useRef(new Animated.Value(100)).current;
  const [error, setError] = useState<string | null>(null);
  const [home, setHomeScreen] = useState<'none' | 'flex'>('flex');
  const [north, setNorthScreen] = useState<'none' | 'flex'>('none');
  const [south, setSouthScreen] = useState<'none' | 'flex'>('none');
  const [east, setEastScreen] = useState<'none' | 'flex'>('none');
  const [west, setWestScreen] = useState<'none' | 'flex'>('none');
  const [direction, setDirectionScreen] = useState<'none' | 'flex'>('none');
  const { heading, direction: currentDirection } = useCompass();
  const { theme, setTheme } = useAppTheme();
  const isDark = theme === 'dark';
  const palette = isDark
    ? {
        background: '#071427',
        panel: 'rgba(17, 24, 39, 0.9)',
        panelAlt: 'rgba(15, 23, 42, 0.82)',
        card: 'rgba(148, 163, 184, 0.12)',
        softCard: 'rgba(15, 23, 42, 0.7)',
        text: '#f8fbff',
        textSoft: '#dce7ff',
        textMuted: '#9aa4b2',
        textStrong: '#1f2937',
        border: 'rgba(148, 163, 184, 0.28)',
        button: '#ffffff',
        buttonText: '#111827',
        accent: '#4a7dff',
        accentSoft: 'rgba(74, 125, 255, 0.12)',
        header: '#0f172a',
        sidebar: '#020817',
        overlay: 'rgba(15, 23, 42, 0.45)',
        modal: '#ffffff',
        modalText: '#1a1a1a',
        modalMuted: '#666666',
      }
    : {
        background: '#f3f7ff',
        panel: '#ffffff',
        panelAlt: '#eef4ff',
        card: '#eaf1ff',
        softCard: '#f8faff',
        text: '#111827',
        textSoft: '#1f2937',
        textMuted: '#5b6472',
        textStrong: '#111827',
        border: '#dfe7f5',
        button: '#ffffff',
        buttonText: '#111827',
        accent: '#3b82f6',
        accentSoft: 'rgba(59, 130, 246, 0.12)',
        header: '#e8eefc',
        sidebar: '#e2e8f0',
        overlay: 'rgba(15, 23, 42, 0.12)',
        modal: '#ffffff',
        modalText: '#1a1a1a',
        modalMuted: '#666666',
      };
  const [visibility, setVisibility] = useState(false);

  const live_spat_api_url = 'http://129.114.36.77:8080/spat_decoded';
  const backup_url = "http://192.168.86.222:5430/api/traffic_light_state";
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const fetchLiveSpat = async () => {
    try {
      var res = await fetch(live_spat_api_url);
      if (!res.ok) {
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
    closeSettingsDropdown();
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

  const closeSettingsDropdown = () => {
    setIsSettingsDropdownOpen(false);
  };

  const toggleSettingsDropdown = () => {
    setIsSettingsDropdownOpen((prev) => !prev);
  };

  const openVisibilityModal = () => {
    closeSettingsDropdown();
    setVisibility(true);
  };

  const closeVisibilityModal = () => {
    setVisibility(false);
  };

  const handleThemeSelect = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
    closeVisibilityModal();
  };

  const showVisibility = () => (
    <Modal
      visible={visibility}
      transparent
      animationType="fade"
      onRequestClose={closeVisibilityModal}
    >
      <View style={[styles.visibilityModalOverlay, { backgroundColor: palette.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeVisibilityModal}
        />

        <View style={[styles.visibilityModalCard, { backgroundColor: palette.modal, shadowColor: isDark ? '#000' : '#94a3b8' }]}>
          <Text style={[styles.visibilityModalTitle, { color: palette.modalText }]}>Appearance</Text>
          <Text style={[styles.visibilityModalSubtitle, { color: palette.modalMuted }]}>
            Choose light or dark mode for the app
          </Text>

          <TouchableOpacity
            style={[
              styles.visibilityModalOption,
              { borderColor: palette.border, backgroundColor: theme === 'light' ? palette.accentSoft : 'transparent' },
              theme === 'light' && styles.visibilityModalOptionSelected,
            ]}
            onPress={() => handleThemeSelect('light')}
          >
            <Ionicons name="sunny-outline" size={20} color={palette.modalText} />
            <Text style={[styles.visibilityModalOptionText, { color: palette.modalText }]}>Light Mode</Text>
            {theme === 'light' && (
              <Ionicons name="checkmark-circle" size={20} color={palette.accent} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.visibilityModalOption,
              { borderColor: palette.border, backgroundColor: theme === 'dark' ? palette.accentSoft : 'transparent' },
              theme === 'dark' && styles.visibilityModalOptionSelected,
            ]}
            onPress={() => handleThemeSelect('dark')}
          >
            <Ionicons name="moon-outline" size={20} color={palette.modalText} />
            <Text style={[styles.visibilityModalOptionText, { color: palette.modalText }]}>Dark Mode</Text>
            {theme === 'dark' && (
              <Ionicons name="checkmark-circle" size={20} color={palette.accent} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.visibilityModalCloseButton}
            onPress={closeVisibilityModal}
          >
            <Text style={[styles.visibilityModalCloseText, { color: palette.modalMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const showHomeScreen = () => {
    setHomeScreen('flex');
    setNorthScreen('none');
    setSouthScreen('none');
    setEastScreen('none');
    setWestScreen('none');
    setDirectionScreen('none');
  };

  const showNorthScreen = () => {
    setHomeScreen('none');
    setNorthScreen('flex');
    setSouthScreen('none');
    setEastScreen('none');
    setWestScreen('none');
    setDirectionScreen('none');
  };

  const showSouthScreen = () => {
    setHomeScreen('none');
    setNorthScreen('none');
    setSouthScreen('flex');
    setEastScreen('none');
    setWestScreen('none');
    setDirectionScreen('none');
  };

  const showEastScreen = () => {
    setHomeScreen('none');
    setNorthScreen('none');
    setSouthScreen('none');
    setEastScreen('flex');
    setWestScreen('none');
    setDirectionScreen('none');
  };

  const showWestScreen = () => {
    setHomeScreen('none');
    setNorthScreen('none');
    setSouthScreen('none');
    setEastScreen('none');
    setWestScreen('flex');
    setDirectionScreen('none');
  };

  const showDirectionPhase = () => {
    setHomeScreen('none');
    setNorthScreen('none');
    setSouthScreen('none');
    setEastScreen('none');
    setWestScreen('none');
    setDirectionScreen('flex');
  };

  {/*
  const returnNorthPhases = () => {
    const northSignalGroups = [1, 2, 22];
    const northPhases = phases.filter(
      (phase) => phase.phase !== null && northSignalGroups.includes(phase.phase),
    );
    return northPhases.length > 0 ? (
      <View>
        {northPhases.map((phase) => {
          const actualIndex = phases.indexOf(phase);
          return (
          <TouchableOpacity
            key={actualIndex}
            style={{
              backgroundColor: 'rgba(126, 153, 235, 0.65)',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 10,
              padding: 10,
              borderRadius: 8,
            }}
            onPress={() => setPhaseIndex(actualIndex)}
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
        );
        })}
      </View>
    ) : (
      <Text style={styles.noData}>No north phases available</Text>
    );
  };
*/}

  const returnNorthPhases = () => {
    const northSignalGroups = [1, 2, 22];
    const northPhases = phases.filter(
      (phase) => phase.phase !== null && northSignalGroups.includes(phase.phase),
    );

    return northPhases.length > 0 ? (
      <View>
        {isMobile ? (
          <ScrollView
            horizontal
            pagingEnabled
            scrollEnabled={northPhases.length > 1}
            nestedScrollEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToAlignment="center"
            contentContainerStyle={styles.directionPhasesMobileDeck}
          >
            {northPhases.map((phase) => {
              const actualIndex = phases.indexOf(phase);
              return (
                <View key={actualIndex} style={styles.directionPhaseItemMobile}>
                  <TrafficLight
                    state={phase.state}
                    countdown={phase.countdown}
                    intersectionId={phase.intersection_id ?? topIntersectionId ?? null}
                    signalGroup={phase.phase}
                  />
                </View>
              );
            })}
          </ScrollView>
        ) : (
          // Horizontal layout for computer/web
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.directionPhasesRow}
          >
            {northPhases.map((phase) => {
              const actualIndex = phases.indexOf(phase);
              return (
                <View key={actualIndex} style={styles.directionPhaseItem}>
                  <TrafficLight
                    state={phase.state}
                    countdown={phase.countdown}
                    intersectionId={phase.intersection_id ?? topIntersectionId ?? null}
                    signalGroup={phase.phase}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}
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
        {isMobile ? (
          <ScrollView
            horizontal
            pagingEnabled
            scrollEnabled={southPhases.length > 1}
            nestedScrollEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToAlignment="center"
            contentContainerStyle={styles.directionPhasesMobileDeck}
          >
            {southPhases.map((phase) => {
              const actualIndex = phases.indexOf(phase);
              return (
                <View key={actualIndex} style={styles.directionPhaseItemMobile}>
                  <TrafficLight
                    state={phase.state}
                    countdown={phase.countdown}
                    intersectionId={phase.intersection_id ?? topIntersectionId ?? null}
                    signalGroup={phase.phase}
                  />
                </View>
              );
            })}
          </ScrollView>
        ) : (
          // Horizontal layout for computer/web
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.directionPhasesRow}
          >
            {southPhases.map((phase) => {
              const actualIndex = phases.indexOf(phase);
              return (
                <View key={actualIndex} style={styles.directionPhaseItem}>
                  <TrafficLight
                    state={phase.state}
                    countdown={phase.countdown}
                    intersectionId={phase.intersection_id ?? topIntersectionId ?? null}
                    signalGroup={phase.phase}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    ) : (
      <Text style={styles.noData}>No north phases available</Text>
    );
  };

  const returnEastPhases = () => {
    const eastSignalGroups = [3, 4, 24];
    const eastPhases = phases.filter(
      (phase) => phase.phase !== null && eastSignalGroups.includes(phase.phase),
    );

    return eastPhases.length > 0 ? (
      <View>
        {isMobile ? (
          <ScrollView
            horizontal
            pagingEnabled
            scrollEnabled={eastPhases.length > 1}
            nestedScrollEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToAlignment="center"
            contentContainerStyle={styles.directionPhasesMobileDeck}
          >
            {eastPhases.map((phase) => {
              const actualIndex = phases.indexOf(phase);
              return (
                <View key={actualIndex} style={styles.directionPhaseItemMobile}>
                  <TrafficLight
                    state={phase.state}
                    countdown={phase.countdown}
                    intersectionId={phase.intersection_id ?? topIntersectionId ?? null}
                    signalGroup={phase.phase}
                  />
                </View>
              );
            })}
          </ScrollView>
        ) : (
          // Horizontal layout for computer/web
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.directionPhasesRow}
          >
            {eastPhases.map((phase) => {
              const actualIndex = phases.indexOf(phase);
              return (
                <View key={actualIndex} style={styles.directionPhaseItem}>
                  <TrafficLight
                    state={phase.state}
                    countdown={phase.countdown}
                    intersectionId={phase.intersection_id ?? topIntersectionId ?? null}
                    signalGroup={phase.phase}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    ) : (
      <Text style={styles.noData}>No north phases available</Text>
    );
  };

  const returnWestPhases = () => {
    const westSignalGroups = [7, 8, 28];
    const westPhases = phases.filter(
      (phase) => phase.phase !== null && westSignalGroups.includes(phase.phase),
    );

    return westPhases.length > 0 ? (
      <View>
        {isMobile ? (
          <ScrollView
            horizontal
            pagingEnabled
            scrollEnabled={westPhases.length > 1}
            nestedScrollEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToAlignment="center"
            contentContainerStyle={styles.directionPhasesMobileDeck}
          >
            {westPhases.map((phase) => {
              const actualIndex = phases.indexOf(phase);
              return (
                <View key={actualIndex} style={styles.directionPhaseItemMobile}>
                  <TrafficLight
                    state={phase.state}
                    countdown={phase.countdown}
                    intersectionId={phase.intersection_id ?? topIntersectionId ?? null}
                    signalGroup={phase.phase}
                  />
                </View>
              );
            })}
          </ScrollView>
        ) : (
          // Horizontal layout for computer/web
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.directionPhasesRow}
          >
            {westPhases.map((phase) => {
              const actualIndex = phases.indexOf(phase);
              return (
                <View key={actualIndex} style={styles.directionPhaseItem}>
                  <TrafficLight
                    state={phase.state}
                    countdown={phase.countdown}
                    intersectionId={phase.intersection_id ?? topIntersectionId ?? null}
                    signalGroup={phase.phase}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    ) : (
      <Text style={styles.noData}>No north phases available</Text>
    );
  };

  const getSignalGroupsForDirection = (dir: CardinalDirection): number[] => {
    switch (dir) {
      case 'N':
      case 'NE':
      case 'NW':
        return [1, 2, 22];
      case 'S':
      case 'SE':
      case 'SW':
        return [5, 6, 26];
      case 'E':
        return [3, 4, 24];
      case 'W':
        return [7, 8, 28];
      default:
        return [];
    }
  };

  const returnPhasesByDirection = () => {
    const signalGroups = getSignalGroupsForDirection(currentDirection);
    const directionPhases = phases.filter(
      (phase) => phase.phase !== null && signalGroups.includes(phase.phase),
    );

    return directionPhases.length > 0 ? (
      <View>
        <Text style={[styles.directionLabel, { color: palette.text, backgroundColor: isDark ? 'rgba(126, 153, 235, 0.22)' : 'rgba(126, 153, 235, 0.12)' }]}>
          Direction: {currentDirection} ({heading}°)
        </Text>
        {isMobile ? (
          <ScrollView
            horizontal
            pagingEnabled
            scrollEnabled={directionPhases.length > 1}
            nestedScrollEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToAlignment="center"
            contentContainerStyle={styles.directionPhasesMobileDeck}
          >
            {directionPhases.map((phase) => {
              const actualIndex = phases.indexOf(phase);
              return (
                <View key={actualIndex} style={styles.directionPhaseItemMobile}>
                  <TrafficLight
                    state={phase.state}
                    countdown={phase.countdown}
                    intersectionId={phase.intersection_id ?? topIntersectionId ?? null}
                    signalGroup={phase.phase}
                  />
                </View>
              );
            })}
          </ScrollView>
        ) : (
          // Horizontal layout for computer/web
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.directionPhasesRow}
          >
            {directionPhases.map((phase) => {
              const actualIndex = phases.indexOf(phase);
              return (
                <View key={actualIndex} style={styles.directionPhaseItem}>
                  <TrafficLight
                    state={phase.state}
                    countdown={phase.countdown}
                    intersectionId={phase.intersection_id ?? topIntersectionId ?? null}
                    signalGroup={phase.phase}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    ) : (
      <View>
        <Text style={[styles.directionLabel, { color: palette.text, backgroundColor: isDark ? 'rgba(126, 153, 235, 0.22)' : 'rgba(126, 153, 235, 0.12)' }]}>
          Direction: {currentDirection} ({heading}°)
        </Text>
        <Text style={[styles.noData, { color: palette.textMuted }]}>No phases available for {currentDirection}</Text>
      </View>
    );
  };

  const decodeDirection = (dir: CardinalDirection) => {
    switch (dir) {
      case 'N':
        return 'North';
      case 'NE':
        return 'Northeast';
      case 'E':
        return 'East';
      case 'SE':
        return 'Southeast';
      case 'S':
        return 'South';
      case 'SW':
        return 'Southwest';
      case 'W':
        return 'West';
      case 'NW':
        return 'Northwest';
      default:
        return 'North';
    }
  };

  const renderHeaderButtons = () => (
    <View style={styles.headerButtons}>
      <TouchableOpacity onPress={openSideBar} style={[styles.menuButton, { backgroundColor: palette.button, shadowColor: isDark ? '#000' : '#8aa2d8' }]}>
        <Ionicons name="menu-outline" size={24} color={palette.buttonText} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={toggleSettingsDropdown}
        style={[styles.settingsButton, { backgroundColor: palette.button, shadowColor: isDark ? '#000' : '#8aa2d8' }]}
      >
        <Ionicons name="settings" size={24} color={palette.buttonText} />
      </TouchableOpacity>
    </View>
  );

  const renderSettingsDropdown = () => (
    <Modal
      visible={isSettingsDropdownOpen}
      transparent
      animationType="fade"
      onRequestClose={closeSettingsDropdown}
    >
      <View style={[styles.settingsDropdownOverlay, { backgroundColor: palette.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeSettingsDropdown}
        />

        <View style={styles.settingsDropdownContainer}>
          <View style={[styles.settingsDropdown, { backgroundColor: palette.modal, shadowColor: isDark ? '#000' : '#8aa2d8' }]}>
            <TouchableOpacity
              style={styles.settingsDropdownOption}
              onPress={openVisibilityModal}
            >
              <Ionicons name="contrast-outline" size={18} color={palette.modalText} />
              <Text style={[styles.settingsDropdownText, { color: palette.modalText }]}>Visibility</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSidebar = () => {
    return (
      <Modal visible={isSideBarOpen} transparent animationType='none'>
        <TouchableWithoutFeedback onPress={closeSideBar}>
          <View style={{ flex: 1 }}></View>
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.sideBar, { backgroundColor: palette.sidebar, transform: [{ translateX: sidebarTranslateX }] }]}>

          <TouchableOpacity onPress={closeSideBar}
            style={styles.sideBarCloseButton}>
            <Ionicons name="close" size={20} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={showHomeScreen}
            style={styles.sideBarOption}>
            <Text style={[styles.sideBarOptionsText, { color: isDark ? '#eaf4ff' : '#0f172a' }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showNorthScreen}
            style={styles.sideBarOption}>
            <Text style={[styles.sideBarOptionsText, { color: isDark ? '#eaf4ff' : '#0f172a' }]}>North</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showSouthScreen}
            style={styles.sideBarOption}>
            <Text style={[styles.sideBarOptionsText, { color: isDark ? '#eaf4ff' : '#0f172a' }]}>South</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showEastScreen}
            style={styles.sideBarOption}>
            <Text style={[styles.sideBarOptionsText, { color: isDark ? '#eaf4ff' : '#0f172a' }]}>East</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showWestScreen}
            style={styles.sideBarOption}>
            <Text style={[styles.sideBarOptionsText, { color: isDark ? '#eaf4ff' : '#0f172a' }]}>West</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showDirectionPhase}
            style={styles.sideBarOption}>
            <Text style={[styles.sideBarOptionsText, { color: isDark ? '#eaf4ff' : '#0f172a' }]}>Signals In Direction</Text>
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
      <View style={[styles.container, { backgroundColor: palette.background }]}> 
        <ActivityIndicator color={isDark ? '#f8fbff' : '#0f172a'} />
        <Text style={{ marginTop: 8, color: palette.text }}>Loading traffic light data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screenBackground, { backgroundColor: palette.background }]}>
      {renderSettingsDropdown()}
      {showVisibility()}
      <View style={{ display: home, flex: 1 }}>
        <View style={[styles.glassWrapper, { backgroundColor: palette.panel, borderColor: palette.border }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >

            {renderHeaderButtons()}

            {renderSidebar()}

            <Text style={[styles.title, { color: palette.text }]}>Traffic Light Visualization: Live SPaT API</Text>

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
                    <Text style={[styles.messageCounter, { color: palette.textSoft }]}>Signal Group: {displayed?.phase}</Text>
                  )}

                  <View style={[styles.messageCounterHome, { alignItems: 'center' }] }>
                    {phases.length > 0 && (
                      <Text style={[styles.messageCounterHomeText, { color: palette.textSoft }]}>
                        Showing phase {phaseIndex + 1} of {phases.length}
                      </Text>
                    )}
                    <Text style={[styles.messageCounterHomeText, { color: palette.textSoft }]}>
                      Total Phases: {phases.length}
                    </Text>
                  </View>

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
                          <Text style={{ color: '#ffff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
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
      </View>






      <View style={{ display: north, flex: 1 }}>
        <View style={[styles.glassWrapper, { backgroundColor: palette.panel, borderColor: palette.border }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {renderHeaderButtons()}

            {renderSidebar()}

            <Text style={styles.title}>Traffic Light Visualization: Live SPaT API</Text>
            <View style={styles.messageCounter}>
              {phases.length > 0 && (
                <Text style={styles.messageCounterText}>
                  Showing phase {phaseIndex + 1} of {phases.length}
                </Text>
              )}
              <Text style={styles.messageCounterText}>
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
                  {returnNorthPhases()}
                </View>

              );
            })()}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>Error: {error}</Text>
              </View>
            )}

            <View style={styles.extraSpacing}>

            </View>
          </ScrollView>
        </View>
      </View>






      <View style={{ display: south, flex: 1 }}>
        <View style={[styles.glassWrapper, { backgroundColor: palette.panel, borderColor: palette.border }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >

            {renderHeaderButtons()}

            {renderSidebar()}

            <Text style={[styles.title, { color: palette.text }]}>Traffic Light Visualization: Live SPaT API</Text>
            <View style={[styles.messageCounter, { alignItems: 'flex-end' }]}>
              {phases.length > 0 && (
                <Text style={[styles.messageCounterText, { color: palette.textSoft }]}>
                  Showing phase {phaseIndex + 1} of {phases.length}
                </Text>
              )}
              <Text style={[styles.messageCounterText, { color: palette.textSoft }]}>
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
                  {returnSouthPhases()}
                </View>

              );
            })()}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>Error: {error}</Text>
              </View>
            )}

            <View style={styles.extraSpacing}>

            </View>
          </ScrollView>
        </View>
      </View>








      <View style={{ display: east, flex: 1 }}>
        <View style={[styles.glassWrapper, { backgroundColor: palette.panel, borderColor: palette.border }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >

            {renderHeaderButtons()}

            {renderSidebar()}

            <Text style={[styles.title, { color: palette.text }]}>Traffic Light Visualization: Live SPaT API</Text>
            <View style={[styles.messageCounter, { alignItems: 'flex-end' }]}>
              {phases.length > 0 && (
                <Text style={[styles.messageCounterText, { color: palette.textSoft }]}>
                  Showing phase {phaseIndex + 1} of {phases.length}
                </Text>
              )}
              <Text style={[styles.messageCounterText, { color: palette.textSoft }]}>
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
                  {returnEastPhases()}
                </View>

              );
            })()}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>Error: {error}</Text>
              </View>
            )}

            <View style={styles.extraSpacing}>

            </View>

          </ScrollView>
        </View>
      </View>





      <View style={{ display: west, flex: 1 }}>
        <View style={[styles.glassWrapper, { backgroundColor: palette.panel, borderColor: palette.border }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >

            {renderHeaderButtons()}

            {renderSidebar()}

            <Text style={[styles.title, { color: palette.text }]}>Traffic Light Visualization: Live SPaT API</Text>
            <View style={[styles.messageCounter, { alignItems: 'flex-end' }]}>
              {phases.length > 0 && (
                <Text style={[styles.messageCounterText, { color: palette.textSoft }]}>
                  Showing phase {phaseIndex + 1} of {phases.length}
                </Text>
              )}
              <Text style={[styles.messageCounterText, { color: palette.textSoft }]}>
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
                  {returnWestPhases()}
                </View>

              );
            })()}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>Error: {error}</Text>
              </View>
            )}

            <View style={styles.extraSpacing}>

            </View>
          </ScrollView>
        </View>
      </View>

      <View style={{ display: direction, flex: 1, }}>
        <View style={[styles.glassWrapper, { backgroundColor: palette.panel, borderColor: palette.border }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >

            <View style = {styles.signalsInDirectionHeader}>
              <Text style = {styles.signalsInDirectionHeaderText}>Direction: {decodeDirection(currentDirection)}</Text>
            </View>

            {renderHeaderButtons()}

            {renderSidebar()}

            <Text style={[styles.title, { color: palette.text }]}>Traffic Light Visualization: Live SPaT API</Text>

            {(() => {
              return (
                <View>
                  {returnPhasesByDirection()}
                </View>
              );
            })()}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>Error: {error}</Text>
              </View>
            )}

            <View style={styles.extraSpacing}>
            </View>
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
    paddingTop: 70,
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

  messageCounterHome: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#dbe9ff',
    alignItems: 'center',
  },

  messageCounterText: {
    color: '#dbe9ff',
    fontSize: 16,
    fontWeight: '700',
    margin: 8,
  },

  messageCounterHomeText: {
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
  directionPhasesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    margin: 20,
  },
  directionPhaseItem: {
    width: deviceWidth * 0.3,
  },

  headerButtons: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },

  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    margin: 0,
  },

  settingsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    margin: 0,
  },

  settingsDropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },

  settingsDropdownContainer: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 2,
  },

  settingsDropdown: {
    minWidth: 190,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },

  settingsDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  settingsDropdownText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  visibilityModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 24,
  },

  visibilityModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },

  visibilityModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },

  visibilityModalSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 18,
  },

  visibilityModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },

  visibilityModalOptionSelected: {
    borderColor: '#4a7dff',
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },

  visibilityModalOptionText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  visibilityModalCloseButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },

  visibilityModalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },

  sideBar: {
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
    borderWidth: 1,
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
    textAlign: 'center',
  },

  extraSpacing: {
    marginTop: 20,
  },
  directionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(126, 153, 235, 0.3)',
    borderRadius: 8,
  },
  directionPhasesColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  directionPhasesMobileDeck: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 8,
    paddingRight: 8,
  },
  directionPhaseItemVertical: {
    marginVertical: 12,
    width: deviceWidth * 0.8,
  },

  directionPhaseItemMobile: {
    width: deviceWidth - 54,
    marginRight: 16,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  signalsInDirectionHeader: {
    alignItems: 'center',
    marginTop: 20,
  },

  signalsInDirectionHeaderText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 28,
  },
});