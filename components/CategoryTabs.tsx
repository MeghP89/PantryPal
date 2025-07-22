import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

interface Props {
  categories: string[]
  selected: string
  onSelect: (category: string) => void
}

export default function CategoryTabs({ categories, selected, onSelect }: Props) {
  return (
    <View style={styles.tabs}>
      {categories.map(category => (
        <Pressable
          key={category}
          onPress={() => onSelect(category)}
          style={({ pressed }) => [
            styles.tab,
            selected === category && styles.tabActive,
            pressed && styles.tabPressed
          ]}
        >
          <Text
            style={[
              styles.tabText,
              selected === category && styles.tabTextActive
            ]}
          >
            {category}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    justifyContent: 'flex-start'
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#ccc',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#f7f7f7',
    transitionDuration: '150ms'
  },
  tabActive: {
    backgroundColor: '#66bb6a',
    borderColor: '#66bb6a',
    shadowColor: '#66bb6a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  tabPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  tabTextActive: {
    color: '#fff'
  }
})
