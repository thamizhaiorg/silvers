import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { SectionDivider } from './marketplace-sections';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCategoryPress?: (category: string) => void;
  onNavigateToFavorites?: () => void;
  favoritesCount?: number;
}



export default function HeroSection({
  searchQuery,
  onSearchChange,
  onCategoryPress,
  onNavigateToFavorites,
  favoritesCount = 0,
}: HeroSectionProps) {

  return (
    <View className="bg-silver-500">
      {/* Main Hero Header */}
      <View className="px-6 pt-6 pb-4">
        {/* Store Header with Cart */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">
              SKJ Silversmith
            </Text>
            <Text className="text-silver-100 text-sm mt-1">
              Handcrafted Silver Jewelry & Accessories
            </Text>
          </View>

          {/* Favorites Button */}
          <TouchableOpacity
            onPress={onNavigateToFavorites}
            className="relative bg-white/20 p-3 rounded-full"
          >
            <Feather name="heart" size={22} color="white" />
            {favoritesCount > 0 && (
              <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] h-4 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-white/95 rounded-2xl px-4 py-3 flex-row items-center shadow-sm">
          <Feather name="search" size={18} color="#378388" />
          <TextInput
            placeholder="Search handcrafted jewelry & accessories..."
            value={searchQuery}
            onChangeText={onSearchChange}
            className="flex-1 text-base text-gray-900 ml-3"
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Feather name="x" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Section Divider */}
      <SectionDivider />
    </View>
  );
}
