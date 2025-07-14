import FloatingImagePickerButton from '../../components/FloatingImagePickerButton'
import React, { useState } from 'react'
import { View, Image, StyleSheet } from 'react-native'

export default function InventoryScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <View style={styles.container}>
      {/* Your inventory screen content here */}

      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={{ width: 200, height: 200 }} />
      )}

      <FloatingImagePickerButton />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F8E9', // Light green background
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
})


