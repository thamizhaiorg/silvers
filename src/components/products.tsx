import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Modal, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, formatCurrency } from '../lib/instant';


import { log, trackError, PerformanceMonitor } from '../lib/logger';
import { LoadingError, EmptyState } from './ui/error-boundary';
import HeroSection from './ui/hero-section';
import ProductGrid, { ProductGridHeader, EmptyProductGrid } from './ui/product-grid';
import { PromoSlider, CategorySlider, FlashSaleSlider } from './ui/promotional-sliders';

import R2Image from './ui/r2-image';

interface ProductsScreenProps {
  onClose?: () => void;
  onNavigateToCart?: () => void;
  onNavigateToCategory?: (categoryId: string, categoryName?: string) => void;
}

type FilterCategory = 'All' | string; // 'All' or category ID

// Note: ProductItem component moved to ProductGrid component for better organization

// Helper function to get category icon based on category name
const getCategoryIcon = (categoryName: string | undefined | null): string => {
  if (!categoryName) return 'diamond-stone';
  const name = categoryName.toLowerCase();
  if (name.includes('ring')) return 'circle-outline';
  if (name.includes('necklace')) return 'link-variant';
  if (name.includes('earring')) return 'circle-double';
  if (name.includes('bracelet')) return 'watch';
  if (name.includes('pendant')) return 'diamond-stone';
  if (name.includes('chain')) return 'link';
  if (name.includes('charm')) return 'star-outline';
  return 'diamond-stone'; // default icon
};

export default function ProductsScreen({ onClose, onNavigateToCart, onNavigateToCategory }: ProductsScreenProps) {
  const insets = useSafeAreaInsets();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');

  // Removed custom BackHandler logic to allow default navigation behavior

  // Query products with their items and categories
  const { isLoading, error, data } = db.useQuery({
    products: {
      $: {
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
  });

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

      return (products || []).filter((product: any) => {
        if (!product) return false;

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
        if (activeFilter !== 'All' && activeFilter) {
          // Filter by specific category ID or category name
          matchesCategory = product.categoryId === activeFilter ||
                           (product.category && product.category.id === activeFilter) ||
                           (product.category && product.category.name && activeFilter &&
                            product.category.name.toLowerCase() === activeFilter.toLowerCase());
        }
        // 'All' filter shows everything (matchesCategory remains true)

        return matchesSearch && matchesCategory;
      });
    });
  }, [products, searchQuery, activeFilter]);





  const handleProductPress = useCallback((product: any) => {
    // Navigate to product details view for customers
    console.log('View product:', product.title);
  }, []);



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



  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bounces={true}
        nestedScrollEnabled={true}
      >
        {/* Hero Section */}
        <HeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCategoryPress={(categoryId) => {
            setActiveFilter(categoryId === 'All' ? 'All' : categoryId);
          }}
          onNavigateToCart={onNavigateToCart}
          cartItemCount={0}
        />

        {/* Promotional Offers Slider */}
        <PromoSlider
          offers={[
            {
              id: 'new-collection',
              title: 'New Collection',
              subtitle: 'Discover our latest handcrafted silver pieces',
              discount: 'NEW',
              backgroundColor: 'bg-[#378388]',
              textColor: 'text-white'
            },
            {
              id: 'summer-sale',
              title: 'Summer Sale',
              subtitle: 'Up to 30% off on selected jewelry',
              discount: '30% OFF',
              backgroundColor: 'bg-[#378388]',
              textColor: 'text-white'
            },
            {
              id: 'free-shipping',
              title: 'Free Shipping',
              subtitle: 'On orders over $100',
              backgroundColor: 'bg-[#378388]',
              textColor: 'text-white'
            }
          ]}
          onOfferPress={(offerId) => {
            console.log('Offer pressed:', offerId);
            // Handle offer navigation
          }}
        />

        {/* Category Slider */}
        <CategorySlider
          categories={(categories || []).map(category => ({
            id: category?.id || '',
            name: category?.name || 'Unknown',
            icon: getCategoryIcon(category?.name),
            itemCount: (products || []).filter(p => p?.categoryId === category?.id).length
          }))}
          onCategoryPress={(categoryId) => {
            if (categoryId && onNavigateToCategory) {
              const category = categories.find(cat => cat.id === categoryId);
              onNavigateToCategory(categoryId, category?.name);
            }
          }}
        />

        {/* Flash Sale Slider */}
        <FlashSaleSlider
          sales={[
            {
              id: 'flash-1',
              title: 'Silver Ring Collection',
              originalPrice: 299,
              salePrice: 199,
              timeLeft: '2h 15m left'
            },
            {
              id: 'flash-2',
              title: 'Elegant Necklace Set',
              originalPrice: 450,
              salePrice: 299,
              timeLeft: '1h 45m left'
            }
          ]}
          onSalePress={(saleId) => {
            console.log('Flash sale pressed:', saleId);
            // Handle flash sale navigation
          }}
        />



        {/* Category Filter Tabs */}
        <View className="bg-white py-4 mb-2">
          <FlatList
            data={[{ id: 'All', name: 'All' }, ...categories]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setActiveFilter(item.id)}
                onLongPress={() => {
                  if (item.id !== 'All' && onNavigateToCategory) {
                    // Long press to navigate to category screen
                    onNavigateToCategory(item.id, item.name);
                  }
                }}
                className={`mr-3 px-5 py-3 rounded-full ${
                  activeFilter === item.id
                    ? 'bg-silver-500 shadow-sm'
                    : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  activeFilter === item.id ? 'text-white' : 'text-gray-600'
                }`}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Products Section */}
        <View className="bg-white flex-1">
          {/* Section Header */}
          <ProductGridHeader
            title={activeFilter === 'All' ? 'All Products' : `${activeFilter} Collection`}
            itemCount={filteredProducts.length}
          />

          {/* Products Grid or Empty State */}
          {filteredProducts.length === 0 ? (
            <EmptyProductGrid
              searchQuery={searchQuery}
              activeFilter={activeFilter}
              onClearSearch={() => setSearchQuery('')}
              onClearFilter={() => setActiveFilter('All')}
            />
          ) : (
            <ProductGrid
              products={filteredProducts}
              onProductPress={handleProductPress}
            />
          )}
        </View>

        {/* Bottom spacing for navigation */}
        <View className="h-24" />
      </ScrollView>




    </View>
  );
}
