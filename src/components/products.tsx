import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Modal, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, formatCurrency } from '../lib/instant';
import ProductDetails from './product-details';
import { useStore } from '../lib/store-context';
import { log, trackError, PerformanceMonitor } from '../lib/logger';
import { LoadingError, EmptyState } from './ui/error-boundary';

import R2Image from './ui/r2-image';

interface ProductsScreenProps {
  isGridView?: boolean;
  onClose?: () => void;
}

type FilterCategory = 'All' | string; // 'All' or category ID

// Memoized product item component for better performance - Card design
const ProductItem = React.memo(({
  product,
  isSelected,
  isMultiSelectMode,
  onPress,
  onLongPress
}: {
  product: any;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      className={`m-2 rounded-lg overflow-hidden ${
        isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200'
      }`}
      style={{
        width: '45%', // Two cards per row with margin
        opacity: isMultiSelectMode && !isSelected ? 0.6 : 1,
      }}
    >
      {/* Multi-select checkbox - positioned absolutely */}
      {isMultiSelectMode && (
        <View className="absolute top-2 right-2 z-10">
          <View className={`w-6 h-6 rounded-full items-center justify-center ${
            isSelected ? 'bg-blue-600' : 'bg-white border-2 border-gray-300'
          }`}>
            {isSelected && (
              <Feather name="check" size={14} color="white" />
            )}
          </View>
        </View>
      )}

      {/* Product Image - Square aspect ratio */}
      <View className="w-full aspect-square bg-gray-100 overflow-hidden">
        {product.image ? (
          <R2Image
            url={product.image}
            style={{ width: '100%', height: '100%' }}
            fallback={
              <View className="w-full h-full bg-gray-100 items-center justify-center">
                <Text className="text-4xl">📦</Text>
              </View>
            }
          />
        ) : (
          <View className="w-full h-full bg-gray-100 items-center justify-center">
            <Text className="text-4xl">📦</Text>
          </View>
        )}
      </View>

      {/* Product Title */}
      <View className="p-3">
        <Text
          className="text-sm font-medium text-gray-900 text-center"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {product.title || 'Untitled Product'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default function ProductsScreen({ isGridView = false, onClose }: ProductsScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentStore } = useStore();
  const [showDetails, setShowDetails] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Removed custom BackHandler logic to allow default navigation behavior

  // Query products with their items and categories filtered by current store
  const { isLoading, error, data } = db.useQuery(
    currentStore?.id ? {
      products: {
        $: {
          where: {
            storeId: currentStore.id
          },
          order: {
            createdAt: 'desc' // Use consistent field naming
          }
        },
        item: {}, // Keep item relationship as it's working
        category: {} // Include category relationship
      },
      categories: {
        $: {
          order: {
            name: 'asc'
          }
        }
      }
    } : null // Don't query if no store selected
  );

  const products = data?.products || [];
  const categories = data?.categories || [];

  // Log query errors
  if (error) {
    trackError(new Error(`Products query failed: ${error}`), 'ProductsScreen');
  }



  // Filter products based on search and category - memoized for performance
  const filteredProducts = useMemo(() => {
    return PerformanceMonitor.measure('filter-products', () => {
      const searchTerm = searchQuery.toLowerCase();

      return products.filter((product: any) => {
        const title = product.title || '';
        const tags = product.tags || [];

        // Search filter - simplified to work with current schema
        const tagsString = Array.isArray(tags) ? tags.join(' ') : (typeof tags === 'string' ? tags : '');
        const matchesSearch = !searchTerm || (
          title.toLowerCase().includes(searchTerm) ||
          tagsString.toLowerCase().includes(searchTerm) ||
          (product.sku || '').toLowerCase().includes(searchTerm) ||
          (product.barcode || '').toLowerCase().includes(searchTerm) ||
          (product.description || '').toLowerCase().includes(searchTerm)
        );

        // Category filter
        let matchesCategory = true;
        if (activeFilter !== 'All') {
          // Filter by specific category ID
          matchesCategory = product.categoryId === activeFilter;
        }
        // 'All' filter shows everything (matchesCategory remains true)

        return matchesSearch && matchesCategory;
      });
    });
  }, [products, searchQuery, activeFilter]);





  const handleViewDetails = useCallback((product: any) => {
    setEditingProduct(product);
    setShowDetails(true);
  }, []);





  const handleLongPress = (product: any) => {
    if (!isMultiSelectMode) {
      setIsMultiSelectMode(true);
      setSelectedProducts(new Set([product.id]));
      setShowBottomDrawer(true);
    }
  };

  const handleProductSelect = useCallback((product: any) => {
    if (isMultiSelectMode) {
      const newSelected = new Set(selectedProducts);
      if (newSelected.has(product.id)) {
        newSelected.delete(product.id);
      } else {
        newSelected.add(product.id);
      }
      setSelectedProducts(newSelected);

      if (newSelected.size === 0) {
        setIsMultiSelectMode(false);
        setShowBottomDrawer(false);
      }
    } else {
      handleViewDetails(product);
    }
  }, [isMultiSelectMode, selectedProducts, handleViewDetails]);

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Products',
      `Delete ${selectedProducts.size} selected product(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletePromises = Array.from(selectedProducts).map(id =>
                db.transact(db.tx.products[id].delete())
              );
              await Promise.all(deletePromises);
              setSelectedProducts(new Set());
              setIsMultiSelectMode(false);
              setShowBottomDrawer(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete products');
            }
          },
        },
      ]
    );
  };

  const handleCancelMultiSelect = () => {
    setSelectedProducts(new Set());
    setIsMultiSelectMode(false);
    setShowBottomDrawer(false);
  };



  const handleDelete = (product: any) => {
    const productName = product.title || 'this product';
    Alert.alert(
      'Confirm Delete',
      `Delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => db.transact(db.tx.products[product.id].delete()),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg">Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-red-500">Error: {error.message}</Text>
      </View>
    );
  }

  // Show product details
  if (showDetails && editingProduct) {
    return (
      <ProductDetails
        product={editingProduct}
        onClose={() => {
          setShowDetails(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  // Filter Modal - Full screen with no spacing above
  if (showFilterModal) {
    return (
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-white">
          <View className="px-4 py-4">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Feather name="x" size={24} color="#374151" />
              </TouchableOpacity>

              <Text className="text-lg font-semibold text-gray-900">Filter by</Text>

              <TouchableOpacity>
                <Feather name="rotate-ccw" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Filter Options */}
        <View className="flex-1">
          {[
            'Product vendor',
            'Tag',
            'Status',
            'Category',
            'Sales channel',
            'Market',
            'Product type',
            'Collection',
            'Publishing error',
            'Gift cards',
            'Combined listings'
          ].map((filterOption, index) => (
            <TouchableOpacity
              key={index}
              className="px-4 py-4"
            >
              <Text className="text-base text-gray-700">{filterOption}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // Handle loading and error states
  if (error) {
    return (
      <LoadingError
        error={error.toString()}
        onRetry={() => {
          log.info('Retrying products query', 'ProductsScreen');
          // The query will automatically retry when component re-renders
        }}
      />
    );
  }

  if (!currentStore) {
    return (
      <EmptyState
        icon="package"
        title="No Products"
        description="Start by adding your first product"
      />
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">Products</Text>
      </View>

      {/* Search Bar - Clean design without add/filter buttons */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          {/* Search Icon */}
          <Feather name="search" size={20} color="#9CA3AF" />

          {/* Search Input */}
          <TextInput
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base text-gray-900 ml-3"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Category Filter Tabs - Scrollable */}
      <View className="bg-white border-b border-gray-100">
        <FlatList
          data={[{ id: 'All', name: 'All' }, ...categories]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveFilter(item.id)}
              className={`mr-6 pb-2 ${
                activeFilter === item.id ? 'border-b-2 border-blue-600' : ''
              }`}
            >
              <Text className={`text-base font-medium whitespace-nowrap ${
                activeFilter === item.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>


      {/* Products List */}
      <View className="flex-1">
        {filteredProducts.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8">
            <View className="items-center">
              <View className="w-16 h-16 bg-gray-200 items-center justify-center mb-4 rounded-lg">
                <Text className="text-2xl">📦</Text>
              </View>
              <Text className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No products found' :
                 activeFilter !== 'All' ? 'No products in this category' :
                 'No products yet'}
              </Text>
              <Text className="text-gray-500 text-center mb-6">
                {searchQuery ? 'Try adjusting your search terms or category filter' :
                 activeFilter !== 'All' ? 'Products will appear here when they are added to this category' :
                 'Start by adding your first product to the inventory'}
              </Text>

            </View>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={15}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item: product }) => (
              <ProductItem
                product={product}
                isSelected={selectedProducts.has(product.id)}
                isMultiSelectMode={isMultiSelectMode}
                onPress={() => handleProductSelect(product)}
                onLongPress={() => handleLongPress(product)}
              />
            )}
          />
        )}
      </View>

      {/* Bottom Drawer for Multi-select Actions - Fixed overlay issue */}
      {showBottomDrawer && (
        <View className="absolute bottom-0 left-0 right-0 bg-white px-4 py-4"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-medium text-gray-900">
              {selectedProducts.size} selected
            </Text>
            <TouchableOpacity onPress={handleCancelMultiSelect}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleDeleteSelected}
              className="flex-row items-center justify-center bg-red-50 py-3"
            >
              <Feather name="trash-2" size={18} color="#DC2626" />
              <Text className="text-red-600 font-medium ml-2 text-base">
                Delete Selected
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancelMultiSelect}
              className="flex-row items-center justify-center bg-gray-100 py-3"
            >
              <Text className="text-gray-700 font-medium text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


    </View>
  );
}
