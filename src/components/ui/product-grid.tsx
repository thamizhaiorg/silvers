import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../../lib/instant';
import R2Image from './r2-image';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 48 = padding (24) * 2

interface ProductCardProps {
  product: any;
  onPress: () => void;
}

function ProductCard({
  product,
  onPress
}: ProductCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg overflow-hidden mb-4"
      style={{
        width: cardWidth,
      }}
    >

      {/* Product Image */}
      <View className="bg-gray-50" style={{ height: cardWidth }}>
        {product.image ? (
          <R2Image
            url={product.image}
            style={{ width: '100%', height: '100%' }}
            fallback={
              <View className="w-full h-full bg-gray-100 items-center justify-center">
                <MaterialCommunityIcons name="diamond-stone" size={32} color="#9CA3AF" />
              </View>
            }
          />
        ) : (
          <View className="w-full h-full bg-gray-100 items-center justify-center">
            <MaterialCommunityIcons name="diamond-stone" size={32} color="#9CA3AF" />
          </View>
        )}
      </View>

      {/* Product Name Only */}
      <View className="p-3">
        <Text className="text-sm font-medium text-gray-900 text-center" numberOfLines={2}>
          {product.title || 'Untitled Product'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface ProductGridProps {
  products: any[];
  onProductPress: (product: any) => void;
}

export default function ProductGrid({
  products,
  onProductPress
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <View className="justify-center items-center py-20 px-8">
        <View className="items-center">
          <View className="w-24 h-24 bg-silver-100 items-center justify-center mb-6 rounded-3xl">
            <MaterialCommunityIcons name="diamond-stone" size={40} color="#378388" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-3 text-center">
            No products found
          </Text>
          <Text className="text-gray-500 text-center leading-6 max-w-sm">
            Try adjusting your search terms or browse different categories
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="px-6 py-4">
      <View className="flex-row flex-wrap justify-between">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => onProductPress(product)}
          />
        ))}
      </View>
    </View>
  );
}

interface ProductGridHeaderProps {
  title: string;
  itemCount?: number;
  onSortPress?: () => void;
  onFilterPress?: () => void;
}

export function ProductGridHeader({
  title,
  itemCount,
  onSortPress,
  onFilterPress
}: ProductGridHeaderProps) {
  return (
    <View className="px-6 py-4 border-b border-gray-100 bg-white">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-semibold text-gray-900">
            {title}
          </Text>
          {itemCount !== undefined && (
            <Text className="text-sm text-gray-500 mt-1">
              {itemCount} items
            </Text>
          )}
        </View>

        <View className="flex-row gap-3">
          {onSortPress && (
            <TouchableOpacity
              onPress={onSortPress}
              className="p-2 rounded-full bg-gray-100"
            >
              <MaterialCommunityIcons name="sort" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}

          {onFilterPress && (
            <TouchableOpacity
              onPress={onFilterPress}
              className="p-2 rounded-full bg-gray-100"
            >
              <MaterialCommunityIcons name="filter-variant" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

interface EmptyProductGridProps {
  searchQuery?: string;
  activeFilter?: string;
  onClearSearch?: () => void;
  onClearFilter?: () => void;
}

export function EmptyProductGrid({
  searchQuery,
  activeFilter,
  onClearSearch,
  onClearFilter
}: EmptyProductGridProps) {
  const getEmptyMessage = () => {
    if (searchQuery) {
      return {
        title: 'No products found',
        description: 'Try adjusting your search terms or browse different categories',
        action: onClearSearch ? 'Clear search' : undefined
      };
    }
    
    if (activeFilter && activeFilter !== 'All') {
      return {
        title: 'No products in this category',
        description: 'Products will appear here when they are added to this category',
        action: onClearFilter ? 'View all products' : undefined
      };
    }
    
    return {
      title: 'No products yet',
      description: 'Start building your collection by adding your first product',
      action: undefined
    };
  };

  const message = getEmptyMessage();

  return (
    <View className="justify-center items-center py-20 px-8">
      <View className="items-center">
        <View className="w-24 h-24 bg-silver-100 items-center justify-center mb-6 rounded-3xl">
          <MaterialCommunityIcons name="diamond-stone" size={40} color="#378388" />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-3 text-center">
          {message.title}
        </Text>
        <Text className="text-gray-500 text-center leading-6 max-w-sm mb-6">
          {message.description}
        </Text>
        
        {message.action && (
          <TouchableOpacity
            onPress={searchQuery ? onClearSearch : onClearFilter}
            className="bg-silver-500 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">
              {message.action}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
