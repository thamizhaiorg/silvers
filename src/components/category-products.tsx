import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, formatCurrency } from '../lib/instant';

import ProductGrid, { EmptyProductGrid } from './ui/product-grid';

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

  // Query products and categories
  const { isLoading, error, data } = db.useQuery({
    products: {
      category: {}
    },
    categories: {}
  });

  const products = data?.products || [];
  const categories = data?.categories || [];

  // Find the current category
  const currentCategory = categories.find(cat => cat.id === categoryId) || {
    id: categoryId,
    name: categoryName || 'Category'
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product: any) => {
      if (!product) return false;

      // Category filter
      const matchesCategory = product.categoryId === categoryId || 
                             (product.category && product.category.id === categoryId);

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
      {/* Header */}
      <View className="bg-[#378388] px-6 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={onClose}
            className="bg-white/20 p-2 rounded-full"
          >
            <Feather name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 mx-4">
            <Text className="text-white text-xl font-bold text-center">
              {currentCategory.name}
            </Text>
            <Text className="text-white/80 text-sm text-center">
              {filteredProducts.length} products
            </Text>
          </View>
          
          <TouchableOpacity className="bg-white/20 p-2 rounded-full">
            <Feather name="search" size={20} color="white" />
          </TouchableOpacity>
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
            {/* Category Info Banner */}
            <View className="px-6 py-4 bg-silver-50 border-b border-gray-100">
              <View className="flex-row items-center">
                <View className="bg-[#378388] rounded-full p-3 mr-4">
                  <MaterialCommunityIcons 
                    name="diamond-stone" 
                    size={24} 
                    color="white" 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    {currentCategory.name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Explore our collection of {currentCategory.name?.toLowerCase()}
                  </Text>
                </View>
              </View>
            </View>

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
