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
import { useTheme } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import ImagePreviewCard from './ImagePreviewCard'
import InsertItemModal from './InsertItemModal'
import { theme as appTheme } from '../utils/theme';

const { width: screenWidth } = Dimensions.get('window')

export default function FloatingImagePickerButton() {
  const [expanded, setExpanded] = useState(false)
  const [modalVisable, setModalVisable] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null >(null)
  const widgetHeight = useSharedValue(0)
  const opacity = useSharedValue(0)

  const theme = useTheme();
  const styles = createStyles(theme);

  const handlePress = () => {
    if (!expanded) {
      widgetHeight.value = withSpring(160)
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
      mediaTypes: ['images'],
      base64: true,
      aspect: [4, 3],
      allowsEditing: true,
      quality: 1,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
      setImageBase64(result.assets[0].base64 || null)
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
        mediaTypes: ['images'],
        base64: true,
        aspect: [4, 3],
        allowsEditing: true,
        quality: 1,
      })
  
      if (!result.canceled) {
        setImage(result.assets[0].uri)
        setImageBase64(result.assets[0].base64 || null)
        handlePress()
      }
  
      if (result.canceled) {
        alert('You did not select any image.')
      }
    }

  const handleManualEntry = () => {
    handlePress(); // Close the widget
    setModalVisable(true);
  };

  return (
    <View style={styles.absoluteContainer}>
      <Animated.View style={[styles.widgetContainer, widgetStyle]}>
        <Pressable style={styles.widgetButton} onPress={handlePickImage}>
          <Text style={styles.widgetButtonText}>Pick from Gallery</Text>
        </Pressable>
        <Pressable style={styles.widgetButton} onPress={handleTakePhoto}>
          <Text style={styles.widgetButtonText}>Take a Photo</Text>
        </Pressable>
        <Pressable style={styles.widgetButton} onPress={handleManualEntry}>
          <Text style={styles.widgetButtonText}>Manual Entry</Text>
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
          imageBase64={imageBase64}
        />
      )}
      {modalVisable && (
        <InsertItemModal onClear={() => setModalVisable(false)} />
      )}

    </View>
  )
}

const createStyles = (theme: typeof appTheme) => StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    alignItems: 'flex-end',
  },
  widgetContainer: {
    width: screenWidth * 0.6,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    padding: 10,
    justifyContent: 'space-evenly',
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 4,
  },
  widgetButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.roundness - 4,
    backgroundColor: theme.colors.accent,
    marginVertical: 4,
  },
  widgetButtonText: {
    color: theme.colors.surface,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    backgroundColor: theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
})
