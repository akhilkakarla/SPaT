import TrafficLight from '@/components/TrafficLight';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type TrafficLightState = {
  intersection_id: number | null;
  phase: number | null;
  state: 'stop-And-Remain' | 'protected-clearance' | 'protected-Movement-Allowed' | null;
  countdown: number | null;
  timestamp: number;
  error?: string;
};

type SpatMessage = {
  id: number;
  message_xml: string;
};

export default function VisualizationScreen() {
  const [trafficLightState, setTrafficLightState] = useState<TrafficLightState | null>(null);
  const [messages, setMessages] = useState<SpatMessage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:5430/api';

  const fetchTrafficLightState = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/traffic_light_state`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setTrafficLightState(data);
    } catch (err) {
      console.error('Error fetching traffic light state:', err);
      setTrafficLightState({
        intersection_id: null,
        phase: null,
        state: null,
        countdown: null,
        timestamp: Date.now() / 1000,
        error: String(err),
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/spat_messages`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const body = await res.json();
      setMessages(body.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(String(err));
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchTrafficLightState(), fetchMessages()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTrafficLightState(), fetchMessages()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();

    // Auto-refresh traffic light state every 2 seconds
    const interval = setInterval(() => {
      fetchTrafficLightState();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
      <Text style={styles.title}>Traffic Light Visualization</Text>
      
      {/* Traffic Light Component */}
      <TrafficLight
        state={trafficLightState?.state || null}
        countdown={trafficLightState?.countdown || null}
        intersectionId={trafficLightState?.intersection_id || null}
      />

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