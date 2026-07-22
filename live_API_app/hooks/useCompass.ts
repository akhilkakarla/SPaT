import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type CardinalDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

function getDirection(degrees: number): CardinalDirection {
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

export function useCompass() {
  const [heading, setHeading] = useState<number>(0);
  const [direction, setDirection] = useState<CardinalDirection>('N');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let isActive = true;

    async function setupCompass(): Promise<void> {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isActive) return;

        if (status !== 'granted') {
          setError('Location permission denied');
          setIsAvailable(false);
          return;
        }

        subscription = await Location.watchHeadingAsync((headingData) => {
          if (!isActive) return;

          const degrees = Math.round(headingData.trueHeading);
          setHeading(degrees);
          setDirection(getDirection(degrees));
        });
      } catch (err) {
        console.error('Error setting up compass:', err);
        if (isActive) {
          setError('Compass unavailable on this device');
          setIsAvailable(false);
        }
      }
    }

    setupCompass();

    return (): void => {
      isActive = false;
      try {
        subscription?.remove();
      } catch (err) {
        console.error('Error removing compass listener:', err);
      }
    };
  }, []);

  return { heading, direction, isAvailable, error };
}