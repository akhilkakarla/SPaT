import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type TrafficLightState = 'stop-And-Remain' | 'protected-clearance' | 'protected-Movement-Allowed' | null;

type TrafficLightProps = {
  state: TrafficLightState;
  countdown: number | null;
  intersectionId: number | null;
};

export default function TrafficLight({ state, countdown, intersectionId }: TrafficLightProps) {
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
        s
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    margin: 16,
  },
  intersectionId: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
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
    color: '#333',
    textTransform: 'uppercase',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

