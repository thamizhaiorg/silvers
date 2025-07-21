import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface QuickActionButtonProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
}

function QuickActionButton({
  icon,
  title,
  subtitle,
  onPress,
  color = '#378388',
  backgroundColor = 'bg-white'
}: QuickActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${backgroundColor} rounded-2xl p-4 shadow-sm border border-gray-100 flex-1 mx-1`}
    >
      <View className="items-center">
        <View className="bg-silver-100 rounded-full p-3 mb-3">
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <Text className="text-gray-900 font-semibold text-sm text-center mb-1">
          {title}
        </Text>
        <Text className="text-gray-500 text-xs text-center">
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface MarketplaceQuickActionsProps {
  onWishlistPress?: () => void;
  onOrdersPress?: () => void;
  onSupportPress?: () => void;
  onOffersPress?: () => void;
}

export default function MarketplaceQuickActions({
  onWishlistPress,
  onOrdersPress,
  onSupportPress,
  onOffersPress
}: MarketplaceQuickActionsProps) {
  const quickActions = [
    {
      icon: 'heart-outline',
      title: 'Wishlist',
      subtitle: 'Saved items',
      onPress: onWishlistPress || (() => {}),
      color: '#EF4444'
    },
    {
      icon: 'package-variant',
      title: 'Orders',
      subtitle: 'Track orders',
      onPress: onOrdersPress || (() => {}),
      color: '#378388'
    },
    {
      icon: 'headset',
      title: 'Support',
      subtitle: 'Get help',
      onPress: onSupportPress || (() => {}),
      color: '#8B5CF6'
    },
    {
      icon: 'tag-outline',
      title: 'Offers',
      subtitle: 'Special deals',
      onPress: onOffersPress || (() => {}),
      color: '#F59E0B'
    }
  ];

  return (
    <View className="px-6 py-4 bg-white">
      <Text className="text-gray-900 text-lg font-semibold mb-4">
        Quick Access
      </Text>
      <View className="flex-row gap-3">
        {quickActions.map((action, index) => (
          <QuickActionButton
            key={index}
            icon={action.icon}
            title={action.title}
            subtitle={action.subtitle}
            onPress={action.onPress}
            color={action.color}
          />
        ))}
      </View>
    </View>
  );
}

interface TrendingBadgeProps {
  text: string;
}

export function TrendingBadge({ text }: TrendingBadgeProps) {
  return (
    <View className="bg-red-500 px-2 py-1 rounded-full">
      <Text className="text-white text-xs font-bold">
        🔥 {text}
      </Text>
    </View>
  );
}

interface PromoBannerProps {
  title: string;
  description: string;
  buttonText: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
}

export function PromoBanner({
  title,
  description,
  buttonText,
  onPress,
  backgroundColor = 'bg-silver-500',
  textColor = 'text-white'
}: PromoBannerProps) {
  return (
    <View className={`mx-6 mb-4 ${backgroundColor} rounded-2xl p-6`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text className={`${textColor} text-lg font-bold mb-1`}>
            {title}
          </Text>
          <Text className={`${textColor.replace('text-', 'text-').replace('-900', '-200')} text-sm`}>
            {description}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onPress}
          className="bg-white/20 px-4 py-2 rounded-full"
        >
          <Text className={textColor}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface CollectionHighlightProps {
  title: string;
  itemCount: number;
  imageUrl?: string;
  onPress: () => void;
}

export function CollectionHighlight({
  title,
  itemCount,
  imageUrl,
  onPress
}: CollectionHighlightProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mr-4"
      style={{ width: 160 }}
    >
      <View className="h-24 bg-silver-100 items-center justify-center">
        {imageUrl ? (
          // You can add image component here
          <MaterialCommunityIcons name="diamond-stone" size={32} color="#378388" />
        ) : (
          <MaterialCommunityIcons name="diamond-stone" size={32} color="#378388" />
        )}
      </View>
      <View className="p-3">
        <Text className="text-gray-900 font-semibold text-sm mb-1" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-gray-500 text-xs">
          {itemCount} items
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface FeaturedCollectionsProps {
  collections: Array<{
    id: string;
    title: string;
    itemCount: number;
    imageUrl?: string;
  }>;
  onCollectionPress: (collectionId: string) => void;
}

export function FeaturedCollections({
  collections,
  onCollectionPress
}: FeaturedCollectionsProps) {
  return (
    <View className="mb-6">
      <View className="px-6 mb-4">
        <Text className="text-gray-900 text-lg font-semibold">
          Featured Collections
        </Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 48 }}
      >
        {collections.map((collection) => (
          <CollectionHighlight
            key={collection.id}
            title={collection.title}
            itemCount={collection.itemCount}
            imageUrl={collection.imageUrl}
            onPress={() => onCollectionPress(collection.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
