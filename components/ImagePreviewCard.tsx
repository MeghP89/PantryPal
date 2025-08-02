import React, { use, useState } from 'react';
import {
  View,
  Image,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { extractNutritionalInfoFromLabel, extractBatchNutritionalInfoFromLabel } from '../utils/readNutritionalLabel';
import { theme as appTheme } from '../utils/theme';
import { useTheme } from 'react-native-paper';
import InsertItemModal from './InsertItemModal';
import LoadingComponent from './LoadingComponent';
import BatchInsertModal from './BatchInsertModal';

const { width: screenWidth } = Dimensions.get('window');

interface ImagePreviewPopupProps {
  imageUri: string | null;
  onClear: () => void;
  imageBase64: string | null;
}

type NutritionalItemData = {
  itemName: string;
  ServingUnit: string;
  AmountPerServing: number;
  TotalServings: number;
  ItemCategory:
    | 'Produce' | 'Dairy' | 'Meat' | 'Bakery' | 'Frozen' | 'Beverages'
    | 'Snacks' | 'Canned Goods' | 'Condiments' | 'Grains' | 'Seasonings' | 'Misc';
  CaloriesPerServing: number;
  CalorieUnit: string;
  NutritionalInfo: {
    NutrientName: string;
    NutrientAmount: number;
    NutrientUnit: string;
  }[];
  ItemQuantity?: number;
};

type ResponseSchema = {
  NutritionalItem: NutritionalItemData;
};

export default function ImagePreviewCard({
  imageUri,
  onClear,
  imageBase64,
}: ImagePreviewPopupProps) {
  const [nutrientItem, setNutrientItem] = useState<ResponseSchema | null>(null);
  const [batchItems, setBatchItems] = useState<NutritionalItemData[] | null>(null);
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const styles = createStyles(theme);

  const onUse = async (base64: string | null) => {
    if (!base64) {
      Alert.alert('Image data is missing.');
      return;
    }

    setLoading(true);
    try {
      const parsedItem = await extractNutritionalInfoFromLabel(base64);
      if (parsedItem) {
        setNutrientItem(parsedItem);
      } else {
        Alert.alert('Could not read the image.');
      }
    } catch (error) {
      console.error('Error extracting nutritional info:', error);
      Alert.alert('An error occurred while reading the image.');
    } finally {
      setLoading(false);
    }
  };

  const onBatchUse = async (base64: string | null) => {
    if (!base64) {
      Alert.alert('Image data is missing.');
      return;
    }

    setLoading(true);
    try {
      const parsedItems = await extractBatchNutritionalInfoFromLabel(base64);
      if (parsedItems && parsedItems.length > 0) {
        setBatchItems(parsedItems);
      } else {
        Alert.alert('Could not read any items from the image.');
      }
    } catch (error) {
      console.error('Error extracting batch nutritional info:', error);
      Alert.alert('An error occurred while reading the image for batch processing.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNutrientItem(null);
    setBatchItems(null);
    onClear();
  };

  if (loading) {
    return <LoadingComponent visible={true} message="Reading..." />;
  }

  if (batchItems) {
    return <BatchInsertModal itemsData={batchItems} onClear={handleClear} />;
  }

  if (nutrientItem) {
    return <InsertItemModal itemData={nutrientItem} onClear={handleClear} />;
  }

  if (imageUri) {
    return (
      <Modal visible={true} animationType="fade" transparent>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.centeredView}>
          <View style={styles.card}>
            <Pressable style={styles.closeButton} onPress={onClear}>
              <Ionicons name="close" size={20} color="#1B5E20" />
            </Pressable>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
            <Pressable
              style={styles.useButton}
              onPress={() => onUse(imageBase64)}
            >
              <Text style={styles.useButtonText}>Use (Single Item)</Text>
            </Pressable>
            <Pressable
              style={[styles.useButton, styles.batchButton]}
              onPress={() => onBatchUse(imageBase64)}
            >
              <Text style={styles.useButtonText}>Use (Batch Insert)</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const createStyles = (theme: typeof appTheme) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: screenWidth - 48,
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
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
    borderRadius: theme.roundness - 4,
    marginBottom: 16,
  },
  useButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.roundness - 4,
  },
  batchButton: {
    marginTop: 8,
    backgroundColor: theme.colors.accent,
  },
  useButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});

