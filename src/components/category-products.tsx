import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, formatCurrency } from '../lib/instant';

import ProductGrid, { EmptyProductGrid } from './ui/product-grid';
import { Image } from 'expo-image';

interface CategoryProductsScreenProps {
  categoryId: string;
  categoryName?: string;
  onClose: () => void;
  onNavigateToProduct?: (product: any) => void;
}

export default function CategoryProductsScreen({
  categoryId,
  categoryName,
  onClose,
  onNavigateToProduct
}: CategoryProductsScreenProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onClose]);

  // Query products only (removed categories query since we use hardcoded categories)
  const { isLoading, error, data } = db.useQuery({
    products: {
      $: {
        order: {
          createdAt: 'desc'
        }
      }
    }
  });

  const products = data?.products || [];

  // Hardcoded categories with images (same as in products.tsx)
  const categories = [
    { id: 'chuttis', name: 'Chuttis', image: require('../../assets/categories/head2.jpg') },
    { id: 'earrings', name: 'Earrings', image: require('../../assets/categories/earings.webp') },
    { id: 'noserings', name: 'Nose rings', image: require('../../assets/categories/nose.jpg') },
    { id: 'necklaces', name: 'Necklaces', image: require('../../assets/categories/necklace.webp') },
    { id: 'bracelets', name: 'Bracelets', image: require('../../assets/categories/bracelets.webp') },
    { id: 'hipchains', name: 'Hipchains', image: require('../../assets/categories/waistchain.webp') },
    { id: 'anklets', name: 'Anklets', image: require('../../assets/categories/anklets.webp') }
  ];

  // Find the current category
  const currentCategory = categories.find(cat => cat.id === categoryId) || {
    id: categoryId,
    name: categoryName || 'Category',
    image: undefined
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product: any) => {
      if (!product) return false;

      // Category filter - check if product's categoryId matches the selected category
      const matchesCategory = product.categoryId === categoryId;

      // Search filter
      const searchTerm = searchQuery.toLowerCase();
      const title = product.title || '';
      const tags = product.tags || [];
      const tagsString = Array.isArray(tags) ? tags.join(' ') : (typeof tags === 'string' ? tags : '');

      const matchesSearch = !searchTerm || (
        title.toLowerCase().includes(searchTerm) ||
        tagsString.toLowerCase().includes(searchTerm) ||
        (product.sku || '').toLowerCase().includes(searchTerm) ||
        (product.barcode || '').toLowerCase().includes(searchTerm) ||
        (product.description || '').toLowerCase().includes(searchTerm)
      );

      return matchesCategory && matchesSearch;
    });
  }, [products, categoryId, searchQuery]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center" style={{ paddingTop: insets.top }}>
        <Text className="text-gray-500">Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center" style={{ paddingTop: insets.top }}>
        <Text className="text-red-500">Error loading products</Text>
        <TouchableOpacity onPress={onClose} className="mt-4 bg-silver-500 px-4 py-2 rounded-full">
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Category Card with Search */}
      <View className="bg-gray-50 px-6 pt-6 pb-4">
        <View className="bg-[#378388] rounded-2xl p-6 shadow-sm">
          {/* Category Image and Info */}
          <View className="items-center mb-4">
            <View className="w-24 h-24 rounded-2xl overflow-hidden mb-3 bg-white/20">
              {currentCategory.image ? (
                <Image
                  source={currentCategory.image}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-full h-full bg-white/20 items-center justify-center">
                  <MaterialCommunityIcons name="diamond-stone" size={36} color="white" />
                </View>
              )}
            </View>
            <Text className="text-white font-bold text-2xl text-center mb-1">
              {currentCategory.name}
            </Text>
            <Text className="text-white/80 text-sm text-center">
              Discover our beautiful collection
            </Text>
          </View>

          {/* Search Bar */}
          <View className="bg-white/95 rounded-2xl px-4 py-3 flex-row items-center">
            <Feather name="search" size={18} color="#378388" />
            <TextInput
              placeholder={`Search in ${currentCategory.name}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-base text-gray-900 ml-3"
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Products Grid */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {filteredProducts.length === 0 ? (
          <EmptyProductGrid
            searchQuery={searchQuery}
            activeFilter={currentCategory.name}
            onClearSearch={() => setSearchQuery('')}
            onClearFilter={onClose}
          />
        ) : (
          <View className="bg-white flex-1">

            <ProductGrid
              products={filteredProducts}
              selectedProducts={new Set()}
              isMultiSelectMode={false}
              onProductPress={(product) => {
                if (onNavigateToProduct) {
                  onNavigateToProduct(product);
                } else {
                  console.log('Navigate to product:', product.id);
                }
              }}
              onProductLongPress={(product) => {
                console.log('Long press product:', product.id);
              }}
            />
          </View>
        )}

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
