import React, { useState } from 'react'
import {
  View,
  Image,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { extractNutritionalInfoFromLabel } from '../utils/readReceipt' 
import EditItemModal from './EditItem'

const { width: screenWidth } = Dimensions.get('window')

interface ImagePreviewPopupProps {
  visible: boolean
  imageUri: string | null
  imageBase64: string | null
  onClear: () => void
}

type ResponseSchema = {
  NutritionalItem: {
    itemName: string;
    ServingUnit: string;
    NumberOfServings: number;
    TotalServings: number;
    ItemCategory:
      | "Produce"
      | "Dairy"
      | "Meat"
      | "Bakery"
      | "Frozen"
      | "Beverages"
      | "Snacks"
      | "Canned Goods"
      | "Condiments"
      | "Grains"
      | "Seasonings"
      | "Misc";
    CaloriesPerServing: number;
    CalorieUnit: string;
    NutritionalInfo: {
      NutrientName: string;
      NutrientAmount: number;
      NutrientUnit: string;
    }[];
    ItemQuantity: number;
  };
};

export default function ImagePreviewPopup({
  visible,
  imageUri,
  onClear,
  imageBase64,
}: ImagePreviewPopupProps) {
  const [nutrientItem, setNutrientItem] = useState<ResponseSchema | null>(null)

  const onUse = async (imageBase64: string | null) => {
    if(imageBase64) {
      console.log('pressed me')
      const parsedItem = await extractNutritionalInfoFromLabel(imageBase64)
      if (parsedItem)
        console.log(parsedItem.NutritionalItem.itemName)
        parsedItem.NutritionalItem.ItemQuantity = 1
        setNutrientItem(parsedItem)
    } else {
      Alert.alert('ImageBase64 is null')
    }
  }
  return (
    <>
      {nutrientItem != null ? (
        <EditItemModal itemData={nutrientItem} onClear={onClear}/>
      )
        :
        (<Modal visible={visible} animationType="fade" transparent>
          {/* Blur background */}
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.centeredView}>
            <View style={styles.card}>
              <Pressable style={styles.closeButton} onPress={onClear}>
                <Ionicons name="close" size={20} color="#1B5E20" />
              </Pressable>

              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

              <Pressable style={styles.useButton} onPress={async () => onUse(imageBase64)}>
                <Text style={styles.useButtonText}>Use This Image</Text>
              </Pressable>
            </View>
          </View>
        </Modal>)
      }
    </>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: screenWidth - 48,
    padding: 16,
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
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 1,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  useButton: {
    marginTop: 16,
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  useButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
})
