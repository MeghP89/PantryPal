import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Modal,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  name: string
  quantity: number
  unit: string
  price: number
  onUpdate?: (updated: { name: string; quantity: number; unit: string; price: number }) => void
  onAddNewItem?: (newItem: { name: string; quantity: number; unit: string; price: number }) => void
}

export default function InventoryItem({ name, quantity, unit, price, onUpdate }: Props) {
  const [modalVisible, setModalVisible] = useState(false)
  const [editName, setEditName] = useState(name)
  const [editQuantity, setEditQuantity] = useState(String(quantity))
  const [editUnit, setEditUnit] = useState(unit)
  const [editPrice, setEditPrice] = useState(String(price))

  const handleSave = () => {
    const qty = Number(editQuantity)
    const prc = Number(editPrice)

    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.')
      return
    }
    if (!editUnit.trim()) {
      Alert.alert('Validation Error', 'Unit cannot be empty.')
      return
    }
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Quantity must be a positive number.')
      return
    }
    if (isNaN(prc) || prc < 0) {
      Alert.alert('Validation Error', 'Price must be a valid number (0 or higher).')
      return
    }

    onUpdate?.({
      name: editName.trim(),
      quantity: qty,
      unit: editUnit.trim(),
      price: prc
    })
    setModalVisible(false)
  }

  return (
    <>
      <View style={styles.item}>
        <View>
          <Text style={styles.itemName}>{name}</Text>
          <Text style={styles.itemDetails}>
            {quantity} {unit} · ${price.toFixed(2)}
          </Text>
        </View>
        <Pressable onPress={() => setModalVisible(true)} style={styles.editBtn}>
          <Ionicons name="pencil" size={18} color="#4CAF50" />
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Inventory Item</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.input}
              placeholder="e.g. Apples"
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              value={editQuantity}
              onChangeText={setEditQuantity}
              style={styles.input}
              placeholder="e.g. 5"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Unit</Text>
            <TextInput
              value={editUnit}
              onChangeText={setEditUnit}
              style={styles.input}
              placeholder="e.g. lbs"
            />

            <Text style={styles.label}>Price</Text>
            <TextInput
              value={editPrice}
              onChangeText={setEditPrice}
              style={styles.input}
              placeholder="e.g. 4.99"
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.save}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600'
  },
  itemDetails: {
    fontSize: 14,
    color: '#555'
  },
  editBtn: {
    padding: 6
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '85%',
    elevation: 6
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 4
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16
  },
  cancel: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  cancelText: {
    color: '#777',
    fontWeight: '500'
  },
  save: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8
  },
  saveText: {
    color: 'white',
    fontWeight: '600'
  }
})
