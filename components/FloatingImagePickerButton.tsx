import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import ImagePreviewCard from './ImagePreviewCard'

const { width: screenWidth } = Dimensions.get('window')

export default function FloatingImagePickerButton() {
  const [expanded, setExpanded] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const widgetHeight = useSharedValue(0)
  const opacity = useSharedValue(0)

  const handlePress = () => {
    if (!expanded) {
      widgetHeight.value = withSpring(140)
      opacity.value = withTiming(1)
      setExpanded(true)
    } else {
      widgetHeight.value = withSpring(0)
      opacity.value = withTiming(0)
      setExpanded(false)
    }
  }

  const widgetStyle = useAnimatedStyle(() => ({
    height: widgetHeight.value,
    opacity: opacity.value,
  }))

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
      handlePress()
    }
  }

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      alert('Camera permission is required.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
      handlePress()
    }
  }

  return (
    <View style={styles.absoluteContainer}>
      <Animated.View style={[styles.widgetContainer, widgetStyle]}>
        <Pressable style={styles.widgetButton} onPress={handlePickImage}>
          <Text style={styles.widgetButtonText}>Pick from Gallery</Text>
        </Pressable>
        <Pressable style={styles.widgetButton} onPress={handleTakePhoto}>
          <Text style={styles.widgetButtonText}>Take a Photo</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.fabContainer}>
        <Pressable style={styles.fabButton} onPress={handlePress}>
          <Ionicons name={expanded ? 'close' : 'add'} size={28} color="white" />
        </Pressable>
      </View>
      {image && (
        <ImagePreviewCard
          imageUri={image}
          onClear={() => setImage(null)}
          onUse={() => console.log('using image')}
        />
      )}

    </View>
  )
}

const styles = StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    alignItems: 'flex-end',
  },
  widgetContainer: {
    width: screenWidth * 0.6,
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    padding: 10,
    justifyContent: 'space-evenly',
    overflow: 'hidden',
    marginBottom: 12,
  },
  widgetButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#388E3C',
    marginVertical: 4,
  },
  widgetButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    backgroundColor: '#2E7D32',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
})
