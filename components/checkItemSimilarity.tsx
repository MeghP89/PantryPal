import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { BlurView } from 'expo-blur';

interface CheckItemSimilarityProps {
  visible: boolean;
  newItemName: string | null;
  existingItemName: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CheckItemSimilarity({
  visible,
  newItemName,
  existingItemName,
  onConfirm,
  onCancel,
}: CheckItemSimilarityProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.centeredView}>
        <Card style={styles.card}>
          <Card.Title
            title="Similar Item Found"
            titleStyle={[styles.title, { color: theme.colors.primary }]}
          />
          <Card.Content>
            <Text style={styles.messageText}>
              An item named <Text style={styles.boldText}>"{existingItemName}"</Text> already exists.
            </Text>
            <Text style={styles.messageText}>
              Do you want to add this item named <Text style={styles.boldText}>"{existingItemName}"</Text>?
            </Text>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onCancel}
              style={[styles.button, { borderColor: theme.colors.error }]}
              labelStyle={{ color: theme.colors.error }}
            >
              Add Separately
            </Button>
            <Button
              mode="contained"
              onPress={onConfirm}
              style={styles.button}
              buttonColor={theme.colors.primary}
            >
              Add To Existing Item
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F1F8E9',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'center',
    color: '#1B5E20',
  },
  boldText: {
    fontWeight: 'bold',
  },
  actions: {
    justifyContent: 'space-around',
    paddingTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});
