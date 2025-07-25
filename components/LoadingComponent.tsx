import React from 'react';
import { View, StyleSheet, Modal, Text, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';

interface LoadingComponentProps {
  visible: boolean;
  message?: string;
}

export default function LoadingComponent({ visible, message = 'Loading...' }: LoadingComponentProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.centeredView}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 24,
    backgroundColor: '#F1F8E9',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  messageText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
  },
});
