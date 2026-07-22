import { Magnetometer } from 'expo-sensors';
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
  const [heading, setHeading] = useState(0);
  const [direction, setDirection] = useState<CardinalDirection>('N');

  useEffect(() => {
    let subscription: any;

    try {
      // Set the update interval for the sensor
      Magnetometer.setUpdateInterval(100);

      // Check if addListener exists and is a function
      if (Magnetometer.addListener && typeof Magnetometer.addListener === 'function') {
        subscription = Magnetometer.addListener(({ x, y }: { x: number; y: number }) => {
          // Calculate heading from magnetometer x/y values
          let angle = Math.atan2(y, x) * (180 / Math.PI);
          // Adjust so 0 = North (convert from math angle to compass heading)
          let compass = (90 - angle) % 360;
          if (compass < 0) compass += 360;

          setHeading(Math.round(compass));
          setDirection(getDirection(compass));
        });
      } else {
        console.warn('Magnetometer.addListener is not available');
      }
    } catch (error) {
      console.error('Error setting up compass listener:', error);
    }

    return () => {
      try {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      } catch (error) {
        console.error('Error removing compass listener:', error);
      }
    };
  }, []);

  return { heading, direction };
}
