import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Button, Card, useTheme, Title } from 'react-native-paper';

type ConfirmationModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  itemName: string;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onConfirm,
  onDecline,
  itemName,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onDecline}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <Card style={styles.modalCard}>
          <Card.Content>
            <Title style={styles.modalTitle}>Add to Shopping List?</Title>
            <Text style={styles.modalText}>
              You have run out of <Text style={{ fontWeight: 'bold' }}>{itemName}</Text>. Would you like to add it to your shopping list?
            </Text>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button onPress={onDecline} mode="outlined" style={styles.button}>
              No
            </Button>
            <Button onPress={onConfirm} mode="contained" style={styles.button}>
              Yes, Add
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: theme.roundness * 2,
    elevation: 8,
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.text,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.secondaryText,
  },
  actions: {
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  button: {
    flex: 1,
    marginLeft: 8,
    minWidth: 90,
  },
});

export default ConfirmationModal;

