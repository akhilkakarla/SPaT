import React from 'react';
import { StyleSheet, Text, View, Dimensions} from 'react-native';

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

type TrafficLightState = 'stop-And-Remain' | 'protected-clearance' | 'protected-Movement-Allowed' | null;

type TrafficLightProps = {
  state: TrafficLightState;
  countdown: number | null;
  intersectionId: number | null;
  signalGroup: number | null;
};

export default function TrafficLight({ state, countdown, intersectionId, signalGroup}: TrafficLightProps) {
  const getLightColors = () => {
    switch (state) {
      case 'stop-And-Remain':
        return { red: '#FF0000', yellow: '#666666', green: '#666666' };
      case 'protected-clearance':
        return { red: '#666666', yellow: '#FFFF00', green: '#666666' };
      case 'protected-Movement-Allowed':
        return { red: '#666666', yellow: '#666666', green: '#00FF00' };
      default:
        return { red: '#666666', yellow: '#666666', green: '#666666' };
    }
  };

  const colors = getLightColors();

  return (
    <View style={styles.container}>
      {intersectionId && (
        <Text style={styles.intersectionId}>Intersection ID: {intersectionId}</Text>
      )}
      
      <View style={styles.lightContainer}>
        {/* Traffic Light Background */}
        <View style={styles.lightBackground}>
          {/* Red Light */}
          <View style={[styles.light, { backgroundColor: colors.red }]} />
          
          {/* Yellow Light */}
          <View style={[styles.light, { backgroundColor: colors.yellow }]} />
          
          {/* Green Light */}
          <View style={[styles.light, { backgroundColor: colors.green }]} />
  </View>
        {/* Countdown Timer */}
        {countdown !== null && state && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              {countdown.toFixed(1)}s
            </Text>
          </View>
        )}
      </View>
      
      {/* State Label */}
      {state && (
        <Text style={styles.stateText}>
          {state === 'stop-And-Remain' && 'STOP'}
          {state === 'protected-clearance' && 'SLOW DOWN'}
          {state === 'protected-Movement-Allowed' && 'GO'}
        </Text>
      )}
      
      {!state && (
        <Text style={styles.noDataText}>No traffic light data available</Text>
      )}

      <View style = {styles.signalGroupLabel}>
        <Text style = {styles.signalGroupLabelText}>Signal Group {signalGroup}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    margin: 16,
  },
  intersectionId: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#ffff',
  },
  lightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  lightBackground: {
    width: 100,
    height: 300,
    backgroundColor: '#000',
    borderRadius: 50,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  light: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#333',
  },
  countdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 50,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#333',
  },
  countdownText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  stateText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#ffff',
    textTransform: 'uppercase',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
  signalGroupLabel: {
    backgroundColor: 'rgba(126, 153, 235, 0.65)',
    borderRadius: 5,
    width: 180,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signalGroupLabelText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

