import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function getDirection(degrees: number): string {
  if (degrees >= 337.5 || degrees < 22.5) return 'N';
  if (degrees >= 22.5 && degrees < 67.5) return 'NE';
  if (degrees >= 67.5 && degrees < 112.5) return 'E';
  if (degrees >= 112.5 && degrees < 157.5) return 'SE';
  if (degrees >= 157.5 && degrees < 202.5) return 'S';
  if (degrees >= 202.5 && degrees < 247.5) return 'SW';
  if (degrees >= 247.5 && degrees < 292.5) return 'W';
  if (degrees >= 292.5 && degrees < 337.5) return 'NW';
  return 'N';
}

export default function CompassScreen(): React.ReactElement {
  const [heading, setHeading] = useState<number>(0);
  const [direction, setDirection] = useState<string>('N');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startCompass(): Promise<void> {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      subscription = await Location.watchHeadingAsync((headingData) => {
        const degrees: number = Math.round(headingData.trueHeading);
        setHeading(degrees);
        setDirection(getDirection(degrees));
      });
    }

    startCompass();

    return (): void => {
      subscription?.remove();
    };
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.direction}>{direction}</Text>
      <Text style={styles.degrees}>{heading}°</Text>
      <Text style={styles.label}>Point phone to navigate</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#000',
  },
  direction: {
    fontSize: 80,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  degrees: {
    fontSize: 32,
    color: '#888',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginTop: 16,
  },
  error: {
    fontSize: 16,
    color: 'red',
  },
});