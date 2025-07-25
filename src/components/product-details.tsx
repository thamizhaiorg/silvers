import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency, db } from '../lib/instant';
import { useCart } from '../lib/cart-context';
import { useFavorites } from '../hooks/useFavorites';
import R2Image from './ui/r2-image';
import QuantitySelector from './ui/qty';

const { width: screenWidth } = Dimensions.get('window');

interface ProductDetailsProps {
  product: any;
  onClose: () => void;
}

interface ProductOption {
  name: string;
  values: string[];
}

export default function ProductDetailsScreen({ product, onClose }: ProductDetailsProps) {
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { isFavorited, toggleFavorite, isLoading: favoritesLoading } = useFavorites();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isProductFavorited = isFavorited(product.id);

  // Query product items (variants)
  const { data: itemData } = db.useQuery({
    items: {
      $: {
        where: {
          productId: product.id
        }
      }
    }
  });

  const items = itemData?.items || [];

  // Extract product options from items
  const productOptions: ProductOption[] = React.useMemo(() => {
    const options: ProductOption[] = [];
    const optionMap: Record<string, Set<string>> = {};

    items.forEach(item => {
      if (item.option1) {
        if (!optionMap.option1) optionMap.option1 = new Set();
        optionMap.option1.add(item.option1);
      }
      if (item.option2) {
        if (!optionMap.option2) optionMap.option2 = new Set();
        optionMap.option2.add(item.option2);
      }
      if (item.option3) {
        if (!optionMap.option3) optionMap.option3 = new Set();
        optionMap.option3.add(item.option3);
      }
    });

    // Convert to array format with proper names
    if (optionMap.option1) {
      options.push({
        name: 'Size', // You can customize this based on your product types
        values: Array.from(optionMap.option1)
      });
    }
    if (optionMap.option2) {
      options.push({
        name: 'Color',
        values: Array.from(optionMap.option2)
      });
    }
    if (optionMap.option3) {
      options.push({
        name: 'Material',
        values: Array.from(optionMap.option3)
      });
    }

    return options;
  }, [items]);

  // Find matching item based on selected options
  useEffect(() => {
    if (items.length === 0) return;

    if (productOptions.length === 0) {
      // No options, use first item
      setSelectedItem(items[0]);
      return;
    }

    // Find item that matches selected options
    const matchingItem = items.find(item => {
      const option1Match = !selectedOptions.Size || item.option1 === selectedOptions.Size;
      const option2Match = !selectedOptions.Color || item.option2 === selectedOptions.Color;
      const option3Match = !selectedOptions.Material || item.option3 === selectedOptions.Material;
      return option1Match && option2Match && option3Match;
    });

    setSelectedItem(matchingItem || items[0]);
  }, [selectedOptions, items, productOptions]);

  // Auto-select first option for each category if none selected
  useEffect(() => {
    const newSelectedOptions: Record<string, string> = {};
    productOptions.forEach(option => {
      if (!selectedOptions[option.name] && option.values.length > 0) {
        newSelectedOptions[option.name] = option.values[0];
      }
    });
    
    if (Object.keys(newSelectedOptions).length > 0) {
      setSelectedOptions(prev => ({ ...prev, ...newSelectedOptions }));
    }
  }, [productOptions]);

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleAddToCart = async () => {
    if (!selectedItem) {
      Alert.alert('Error', 'Please select product options');
      return;
    }

    setIsLoading(true);
    try {
      await addItem({
        productId: product.id,
        itemId: selectedItem.id,
        title: product.title,
        price: selectedItem.price || product.price || 0,
        quantity: quantity,
        sku: selectedItem.sku || product.sku || '',
        image: product.image,
        options: selectedOptions
      });

      Alert.alert(
        'Added to Cart',
        `${product.title} has been added to your cart`,
        [
          { text: 'Continue Shopping', onPress: () => onClose() },
          { text: 'View Cart', onPress: () => {
            // You can add navigation to cart here if needed
            onClose();
          }}
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPrice = selectedItem?.price || product.price || 0;
  const salePrice = selectedItem?.saleprice || product.saleprice;
  const hasDiscount = salePrice && salePrice < currentPrice;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose} className="mr-4">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 flex-1" numberOfLines={1}>
            {product.title}
          </Text>
          <TouchableOpacity 
            className="ml-4 bg-white p-2 rounded-full shadow-sm"
            onPress={() => toggleFavorite(product.id, product.title)}
            disabled={favoritesLoading}
          >
            <Feather 
              name="heart" 
              size={20} 
              color={isProductFavorited ? "#EF4444" : "#D1D5DB"}
              fill={isProductFavorited ? "#EF4444" : "transparent"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View className="bg-gray-50" style={{ height: screenWidth }}>
          {product.image ? (
            <R2Image
              url={product.image}
              style={{ width: '100%', height: '100%' }}
              fallback={
                <View className="w-full h-full bg-gray-100 items-center justify-center">
                  <MaterialCommunityIcons name="diamond-stone" size={64} color="#9CA3AF" />
                </View>
              }
            />
          ) : (
            <View className="w-full h-full bg-gray-100 items-center justify-center">
              <MaterialCommunityIcons name="diamond-stone" size={64} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="px-6 py-6">
          {/* Title and Price */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {product.title}
            </Text>
            
            <View className="flex-row items-center">
              {hasDiscount ? (
                <>
                  <Text className="text-2xl font-bold text-red-600 mr-3">
                    {formatCurrency(salePrice)}
                  </Text>
                  <Text className="text-lg text-gray-500 line-through">
                    {formatCurrency(currentPrice)}
                  </Text>
                </>
              ) : (
                <Text className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentPrice)}
                </Text>
              )}
            </View>
          </View>

          {/* Product Description */}
          {(product.description || product.excerpt) && (
            <View className="mb-6">
              <Text className="text-base text-gray-700 leading-6">
                {product.description || product.excerpt}
              </Text>
            </View>
          )}

          {/* Product Options */}
          {productOptions.map((option, index) => (
            <View key={index} className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                {option.name}
              </Text>
              <View className="flex-row flex-wrap">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.name] === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => handleOptionSelect(option.name, value)}
                      className={`mr-3 mb-3 px-4 py-3 rounded-lg border-2 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          isSelected ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Quantity Selector */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Quantity
            </Text>
            <QuantitySelector
              value={quantity}
              onValueChange={setQuantity}
              min={1}
              max={99}
              size="medium"
            />
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View 
        className="px-6 py-4 bg-white border-t border-gray-100"
        style={{ paddingBottom: Math.max(16, insets.bottom) }}
      >
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={isLoading}
          className={`py-4 rounded-lg items-center ${
            isLoading ? 'bg-gray-400' : 'bg-blue-600'
          }`}
        >
          <Text className="text-white font-semibold text-lg">
            {isLoading ? 'Adding...' : `Add to Cart • ${formatCurrency(currentPrice * quantity)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
