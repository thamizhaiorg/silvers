import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { db, formatCurrency } from '../lib/instant';
import { useAuth } from '../lib/auth-context';
import R2Image from '../components/ui/r2-image';
import { LoadingError, EmptyState } from '../components/ui/error-boundary';

interface FavoritesScreenProps {
  onClose: () => void;
  onNavigateToProduct?: (product: any) => void;
}

export default function FavoritesScreen({ onClose, onNavigateToProduct }: FavoritesScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Query favorites with product details
  const { isLoading, error, data } = db.useQuery({
    favorites: {
      $: {
        where: {
          userId: user?.id || '',
        },
        order: {
          createdAt: 'desc'
        }
      },
      product: {
        item: {}
      }
    }
  });

  // Also query products separately to ensure we can access them
  const { data: productsData } = db.useQuery({
    products: {}
  });

  const favorites = data?.favorites || [];

  // Remove from favorites
  const handleRemoveFavorite = async (favoriteId: string, productTitle: string) => {
    Alert.alert(
      'Remove from Favorites',
      `Remove "${productTitle}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.transact(db.tx.favorites[favoriteId].delete());
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          }
        }
      ]
    );
  };

  const renderFavoriteItem = ({ item }: { item: any }) => {
    // Try to get product from relationship first, then fallback to products query
    let product = item.product;
    if (!product && productsData?.products) {
      product = productsData.products.find((p: any) => p.id === item.productId);
    }
    
    if (!product) {
      console.log('No product found for favorite:', item);
      return null;
    }

    const firstItem = product.item?.[0];
    const price = firstItem?.price || product.price || 0;
    const salePrice = firstItem?.saleprice || product.saleprice;
    const displayPrice = salePrice && salePrice < price ? salePrice : price;

    return (
      <TouchableOpacity
        className="bg-gray-50 mx-4 mb-3 rounded-xl shadow-sm border border-gray-100"
        onPress={() => onNavigateToProduct?.(product)}
      >
        <View className="flex-row p-4">
          {/* Product Image */}
          <View className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 mr-4">
            {product.image ? (
              <R2Image
                url={product.image}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                fallback={
                  <View className="w-full h-full bg-gray-100 items-center justify-center">
                    <Feather name="image" size={24} color="#9CA3AF" />
                  </View>
                }
              />
            ) : (
              <View className="w-full h-full bg-gray-200 items-center justify-center">
                <Feather name="image" size={24} color="#9CA3AF" />
              </View>
            )}
          </View>

          {/* Product Details */}
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
              {product.title}
            </Text>
            
            {product.sku && (
              <Text className="text-sm text-gray-500 mb-2">
                SKU: {product.sku}
              </Text>
            )}

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                {salePrice && salePrice < price ? (
                  <>
                    <Text className="text-lg font-bold text-red-600">
                      {formatCurrency(salePrice)}
                    </Text>
                    <Text className="text-sm text-gray-500 line-through ml-2">
                      {formatCurrency(price)}
                    </Text>
                  </>
                ) : (
                  <Text className="text-lg font-bold text-gray-900">
                    {formatCurrency(displayPrice)}
                  </Text>
                )}
              </View>

              {/* Remove from favorites button */}
              <TouchableOpacity
                onPress={() => handleRemoveFavorite(item.id, product.title)}
                className="bg-white p-2 rounded-full shadow-sm"
              >
                <Feather name="heart" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600">Loading favorites...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <LoadingError
          error={error.toString()}
          onRetry={() => {
            // Query will automatically retry when component re-renders
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose} className="p-1">
              <Feather name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            
            <Text className="text-lg font-semibold text-gray-900">
              My Favorites
            </Text>
            
            <View className="w-8" />
          </View>
        </View>
      </View>

      {/* Favorites List */}
      {favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-silver-100 w-24 h-24 rounded-full items-center justify-center mb-6">
            <Feather name="heart" size={40} color="#378388" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-3">
            No favorites yet
          </Text>
          <Text className="text-gray-600 text-center mb-8 text-base leading-6">
            Start adding products to your favorites by tapping the heart icon when viewing product details.
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="bg-silver-500 px-8 py-4 rounded-xl shadow-sm"
          >
            <Text className="text-white font-semibold text-lg">
              Browse Products
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}