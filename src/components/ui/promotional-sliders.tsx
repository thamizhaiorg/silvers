import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const { width: screenWidth } = Dimensions.get('window');

interface OfferCardProps {
  title: string;
  subtitle: string;
  discount?: string;
  backgroundColor: string;
  textColor?: string;
  onPress: () => void;
}

function OfferCard({
  title,
  subtitle,
  discount,
  backgroundColor,
  textColor = 'text-white',
  onPress
}: OfferCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${backgroundColor} rounded-2xl p-6 mr-4 shadow-sm`}
      style={{ width: screenWidth * 0.8, minHeight: 140 }}
    >
      <View className="flex-1 justify-between">
        <View>
          {discount && (
            <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-3">
              <Text className={`${textColor} text-sm font-bold`}>
                {discount}
              </Text>
            </View>
          )}
          <Text className={`${textColor} text-xl font-bold mb-2`}>
            {title}
          </Text>
          <Text className={`${textColor.replace('text-', 'text-').replace('-900', '-200')} text-sm`}>
            {subtitle}
          </Text>
        </View>
        
        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity className="bg-white/20 px-4 py-2 rounded-full">
            <Text className={`${textColor} font-semibold text-sm`}>
              Shop Now
            </Text>
          </TouchableOpacity>
          <MaterialCommunityIcons 
            name="arrow-right" 
            size={20} 
            color={textColor.includes('white') ? 'white' : '#374151'} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface PromoSliderProps {
  offers: Array<{
    id: string;
    title: string;
    subtitle: string;
    discount?: string;
    backgroundColor: string;
    textColor?: string;
  }>;
  onOfferPress: (offerId: string) => void;
}

export function PromoSlider({ offers, onOfferPress }: PromoSliderProps) {
  return (
    <View className="mb-4">
      <FlatList
        data={offers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 48 }}
        renderItem={({ item: offer }) => (
          <OfferCard
            title={offer.title}
            subtitle={offer.subtitle}
            discount={offer.discount}
            backgroundColor={offer.backgroundColor}
            textColor={offer.textColor}
            onPress={() => onOfferPress(offer.id)}
          />
        )}
      />
    </View>
  );
}

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  itemCount?: number;
  imageUrl?: string;
  onPress: (categoryId: string) => void;
}

function CategoryCard({
  id,
  name,
  icon,
  itemCount,
  imageUrl,
  onPress
}: CategoryCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(id)}
      className="bg-white rounded-2xl p-4 mr-4 shadow-sm border border-gray-100"
      style={{ width: 120 }}
    >
      <View className="items-center">
        {/* Image container with rounded corners */}
        <View className="w-16 h-16 rounded-2xl overflow-hidden mb-3 bg-silver-100">
          {imageUrl ? (
            <Image
              source={imageUrl}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View className="w-full h-full bg-silver-100 items-center justify-center">
              <MaterialCommunityIcons name={icon as any} size={28} color="#378388" />
            </View>
          )}
        </View>
        <Text className="text-gray-900 font-semibold text-sm text-center mb-1">
          {name}
        </Text>
        {itemCount !== undefined && (
          <Text className="text-gray-500 text-xs">
            {itemCount} items
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface CategorySliderProps {
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    itemCount?: number;
    imageUrl?: string;
  }>;
  onCategoryPress: (categoryId: string) => void;
}

export function CategorySlider({ categories, onCategoryPress }: CategorySliderProps) {
  return (
    <View className="mb-6">
      <View className="px-6 mb-4">
        <Text className="text-gray-900 text-lg font-semibold">
          Shop by Category
        </Text>
      </View>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 48 }}
        renderItem={({ item: category }) => (
          <CategoryCard
            id={category.id}
            name={category.name}
            icon={category.icon}
            itemCount={category.itemCount}
            imageUrl={category.imageUrl}
            onPress={onCategoryPress}
          />
        )}
      />
    </View>
  );
}

interface FlashSaleCardProps {
  title: string;
  originalPrice: number;
  salePrice: number;
  timeLeft: string;
  onPress: () => void;
}

function FlashSaleCard({
  title,
  originalPrice,
  salePrice,
  timeLeft,
  onPress
}: FlashSaleCardProps) {
  const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-[#378388] rounded-2xl p-6 mr-4 shadow-sm"
      style={{ width: screenWidth * 0.75 }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="bg-white/20 px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">
            🔥 FLASH SALE
          </Text>
        </View>
        <Text className="text-white text-xs font-medium">
          {timeLeft}
        </Text>
      </View>
      
      <Text className="text-white text-lg font-bold mb-2">
        {title}
      </Text>
      
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-white text-xl font-bold mr-2">
            ${salePrice}
          </Text>
          <Text className="text-white/70 text-sm line-through">
            ${originalPrice}
          </Text>
        </View>
        <View className="bg-white/20 px-3 py-1 rounded-full">
          <Text className="text-white text-sm font-bold">
            -{discount}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface FlashSaleSliderProps {
  sales: Array<{
    id: string;
    title: string;
    originalPrice: number;
    salePrice: number;
    timeLeft: string;
  }>;
  onSalePress: (saleId: string) => void;
}

export function FlashSaleSlider({ sales, onSalePress }: FlashSaleSliderProps) {
  if (sales.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="px-6 mb-4">
        <Text className="text-gray-900 text-lg font-semibold">
          ⚡ Flash Sales
        </Text>
      </View>
      <FlatList
        data={sales}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 48 }}
        renderItem={({ item: sale }) => (
          <FlashSaleCard
            title={sale.title}
            originalPrice={sale.originalPrice}
            salePrice={sale.salePrice}
            timeLeft={sale.timeLeft}
            onPress={() => onSalePress(sale.id)}
          />
        )}
      />
    </View>
  );
}

interface BannerCardProps {
  title: string;
  subtitle: string;
  buttonText: string;
  backgroundColor: string;
  onPress: () => void;
}

export function BannerCard({
  title,
  subtitle,
  buttonText,
  backgroundColor,
  onPress
}: BannerCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${backgroundColor} rounded-2xl p-6 mx-6 mb-6 shadow-sm`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text className="text-white text-xl font-bold mb-2">
            {title}
          </Text>
          <Text className="text-white/90 text-sm">
            {subtitle}
          </Text>
        </View>
        <TouchableOpacity className="bg-white/20 px-4 py-2 rounded-full">
          <Text className="text-white font-semibold">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
