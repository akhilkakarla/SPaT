import { Image } from 'expo-image';
import { Platform, StyleSheet, View, Text} from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style = {styles.title}>
        <Text style = {styles.titleText}>
            SPaT Live API
        </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  title: {
    alignItems: 'center',
  },

  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
});
