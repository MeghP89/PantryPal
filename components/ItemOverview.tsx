import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal
} from "react-native";
import {
  Text,
  Card,
  IconButton,
} from "react-native-paper";
import { BlurView } from "expo-blur";
import Svg, { Circle } from 'react-native-svg';

type NutritionalItem = {
  id: string;
  itemName: string;
  ServingUnit: string;
  AmountPerServing: number;
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
  ItemQuantity: number;
  NutritionalInfo: {
    NutrientName: string;
    NutrientAmount: number;
    NutrientUnit: string;
  }[];
};

interface ItemOverviewProps {
  itemData: NutritionalItem;
  getCategoryColor: (category: string) => string;
  onClose: () => void;
  onEdit: () => void;
}

// Circular Progress Component
const CircularProgress = ({ 
  percentage, 
  size = 60, 
  strokeWidth = 6, 
  color = "#4CAF50",
  backgroundColor = "#E0E0E0"
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// Nutrient Circle Component
const NutrientCircle = ({ 
  nutrient, 
  color, 
  maxValue = 100 
}: { 
  nutrient: { NutrientAmount: number; NutrientUnit: string; NutrientName: string };
  color: string;
  maxValue?: number;
}) => {
  const percentage = Math.min((nutrient.NutrientAmount / maxValue) * 100, 100);
  
  return (
    <View style={styles.nutrientCircleContainer}>
      <View style={styles.circleWrapper}>
        <CircularProgress
          percentage={percentage}
          size={70}
          strokeWidth={8}
          color={color}
        />
        <View style={styles.circleContent}>
          <Text style={styles.nutrientValue}>
            {nutrient.NutrientAmount}
          </Text>
          <Text style={styles.nutrientUnit}>
            {nutrient.NutrientUnit}
          </Text>
        </View>
      </View>
      <Text style={styles.nutrientLabel} numberOfLines={1}>
        {nutrient.NutrientName.replace(/total |dietary /gi, '').trim()}
      </Text>
    </View>
  );
};

export default function ItemOverView({ 
  itemData, 
  getCategoryColor, 
  onClose, 
  onEdit 
}: ItemOverviewProps) {
  // Get the main macronutrients with better organization
  const getMainNutrients = (nutrients: NutritionalItem["NutritionalInfo"]) => {
    const findNutrient = (keywords: string[]) => 
      nutrients.find(n => 
        keywords.some(keyword => 
          n.NutrientName.toLowerCase().includes(keyword.toLowerCase())
        )
      );

    return {
      protein: findNutrient(['protein']),
      carbs: findNutrient(['carb', 'carbohydrate']),
      fat: findNutrient(['total fat', 'fat']) && 
           !findNutrient(['trans fat', 'saturated fat']) ? 
           findNutrient(['total fat', 'fat']) : null,
      fiber: findNutrient(['fiber', 'fibre']),
      sugar: findNutrient(['sugar']),
      sodium: findNutrient(['sodium'])
    };
  };

  const mainNutrients = getMainNutrients(itemData.NutritionalInfo);
  
  // Filter out null nutrients and create array for mapping
  const nutrientArray = [
    { key: 'protein', nutrient: mainNutrients.protein, color: '#FF6B6B', maxValue: 50 },
    { key: 'carbs', nutrient: mainNutrients.carbs, color: '#4ECDC4', maxValue: 300 },
    { key: 'fat', nutrient: mainNutrients.fat, color: '#45B7D1', maxValue: 65 },
    { key: 'fiber', nutrient: mainNutrients.fiber, color: '#96CEB4', maxValue: 25 }
  ].filter(item => item.nutrient !== null && item.nutrient !== undefined);

  const additionalNutrients = [
    { key: 'sugar', nutrient: mainNutrients.sugar },
    { key: 'sodium', nutrient: mainNutrients.sodium }
  ].filter(item => item.nutrient !== null && item.nutrient !== undefined);

  return (
    <Modal visible={true} animationType="slide" transparent>
        <BlurView intensity={60} tint="dark" style={styles.overlay}>
          <TouchableOpacity 
            onPress={onClose} 
            activeOpacity={0.8}
            key={`item-overview-${itemData.id}`}
            >
            <Card style={styles.overviewCard}>
                <Card.Content style={styles.overviewContent}>
                {/* Header Row */}
                <View style={styles.overviewHeader}>
                    <View style={styles.overviewItemInfo}>
                    <Text style={styles.overviewItemName} numberOfLines={2}>
                        {itemData.itemName}
                    </Text>
                    <Text style={styles.overviewServingInfo}>
                        {itemData.AmountPerServing} {itemData.ServingUnit} • Qty: {itemData.ItemQuantity}
                    </Text>
                    </View>
                    <View style={styles.rightHeader}>
                    <View style={styles.overviewCalories}>
                        <Text style={styles.overviewCaloriesNumber}>
                        {itemData.CaloriesPerServing}
                        </Text>
                        <Text style={styles.overviewCaloriesLabel}>cal</Text>
                    </View>
                    <IconButton
                        icon="pencil"
                        size={20}
                        onPress={onEdit}
                        style={styles.overviewEditButton}
                        key={`edit-btn-${itemData.id}`}
                    />
                    <IconButton
                        icon="close"
                        size={20}
                        onPress={onClose}
                        style={styles.overviewEditButton}
                        key={`close-btn-${itemData.id}`}
                    />
                    </View>
                </View>

                {/* Macronutrients Circles */}
                {nutrientArray.length > 0 && (
                    <View style={styles.macroCirclesContainer}>
                    <Text style={styles.sectionTitle}>Macronutrients</Text>
                    <View style={styles.macroCirclesRow}>
                        {nutrientArray.map((item) => (
                        <NutrientCircle
                            key={`${itemData.id}-${item.key}`}
                            nutrient={item.nutrient!}
                            color={item.color}
                            maxValue={item.maxValue}
                        />
                        ))}
                    </View>
                    </View>
                )}

                {/* Additional Info Row */}
                {additionalNutrients.length > 0 && (
                    <View style={styles.additionalSection}>
                    <Text style={styles.sectionTitle}>Additional Info</Text>
                    <View style={styles.additionalRow}>
                        {additionalNutrients.map((item) => (
                        <View key={`${itemData.id}-additional-${item.key}`} style={styles.additionalItem}>
                            <Text style={styles.additionalValue}>
                            {item.nutrient!.NutrientAmount}{item.nutrient!.NutrientUnit}
                            </Text>
                            <Text style={styles.additionalLabel}>
                            {item.nutrient!.NutrientName}
                            </Text>
                        </View>
                        ))}
                    </View>
                    </View>
                )}

                {/* Category Badge */}
                <View style={styles.overviewCategoryContainer}>
                    <View 
                    style={[
                        styles.overviewCategoryDot, 
                        { backgroundColor: getCategoryColor(itemData.ItemCategory) }
                    ]} 
                    />
                    <Text style={styles.overviewCategoryText}>{itemData.ItemCategory}</Text>
                </View>
                </Card.Content>
            </Card>
          </TouchableOpacity>
        </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(107, 54, 0, 0.56)", // dark green transparent overlay
    justifyContent: "center",
  },
  overviewCard: {
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  overviewContent: {
    padding: 20,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  overviewItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  overviewItemName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1b5e20',
    marginBottom: 6,
    lineHeight: 28,
  },
  overviewServingInfo: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewCalories: {
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  overviewCaloriesNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f57c00',
  },
  overviewCaloriesLabel: {
    fontSize: 12,
    color: '#f57c00',
    fontWeight: '600',
    marginTop: -2,
  },
  overviewEditButton: {
    margin: -4,
    marginLeft: 10,
    backgroundColor: '#f5f5f5',
  },
  
  // Section styling
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  
  // Macro circles styling
  macroCirclesContainer: {
    marginBottom: 24,
  },
  macroCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  nutrientCircleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  circleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutrientValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
  },
  nutrientUnit: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 60,
  },
  
  // Additional nutrients styling
  additionalSection: {
    marginBottom: 20,
  },
  additionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  additionalItem: {
    alignItems: 'center',
    flex: 1,
  },
  additionalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b5e20',
    marginBottom: 4,
  },
  additionalLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Category styling
  overviewCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  overviewCategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  overviewCategoryText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
});