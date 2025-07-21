import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { db, formatCurrency } from '../lib/instant';
import { useStore } from '../lib/store-context';
import { useCart } from '../lib/cart-context';
import R2Image from './ui/r2-image';
import Button from './ui/Button';
import QuantitySelector from './ui/qty';

interface ProductDetailsProps {
  product: any;
  onClose: () => void;
  onNavigateToCart?: () => void;
}

export default function ProductDetails({ product, onClose, onNavigateToCart }: ProductDetailsProps) {
  const insets = useSafeAreaInsets();
  const { currentStore } = useStore();
  const { addItem, hasItem, items, itemCount } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);



  // Query product with full details and relationships
  const { data, isLoading, error } = db.useQuery(
    product?.id ? {
      products: {
        $: {
          where: {
            id: product.id
          }
        },
        item: {},
        category: {},
        brand: {},
        type: {},
        vendor: {},
        collection: {}
      }
    } : null
  );

  const productData = data?.products?.[0] || product;
  const variants = productData.item || [];

  // Set default variant if none selected
  React.useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  const handleAddToCart = useCallback(async () => {
    if (!currentStore || !productData) {
      Alert.alert('Error', 'Missing store or product data');
      return;
    }

    try {
      const cartItem = {
        productId: productData.id,
        itemId: selectedVariant?.id,
        title: productData.title || 'Product',
        image: productData.image,
        price: selectedVariant?.price || productData.price || 0,
        quantity: quantity,
        sku: selectedVariant?.sku || productData.sku,
        variantTitle: getVariantTitle(selectedVariant),
      };

      await addItem(cartItem);

      Alert.alert(
        'Added to Cart',
        `${quantity} ${productData.title}${cartItem.variantTitle ? ` (${cartItem.variantTitle})` : ''} added to cart`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => onNavigateToCart?.() }
        ]
      );

    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  }, [currentStore, productData, selectedVariant, quantity, addItem, onNavigateToCart]);

  const getVariantTitle = (variant: any) => {
    if (!variant) return '';
    const options = [variant.option1, variant.option2, variant.option3].filter(Boolean);
    return options.join(' / ');
  };

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.saleprice && selectedVariant.saleprice < selectedVariant.price
        ? selectedVariant.saleprice
        : selectedVariant.price || productData.price || 0;
    }
    return productData.saleprice && productData.saleprice < productData.price
      ? productData.saleprice
      : productData.price || 0;
  };

  const getOriginalPrice = () => {
    if (selectedVariant) {
      return selectedVariant.saleprice && selectedVariant.saleprice < selectedVariant.price
        ? selectedVariant.price
        : null;
    }
    return productData.saleprice && productData.saleprice < productData.price
      ? productData.price
      : null;
  };

  const isInStock = () => {
    // For now, always return true to allow adding to cart
    // In a real app, you would check actual inventory levels
    return true;
  };



  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-100">
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <Feather name="arrow-left" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">Product Details</Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-600 mr-2">Cart: {itemCount}</Text>
              <View className="w-6" />
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View className="bg-white">
          <View className="aspect-square bg-gray-50">
            {productData.image ? (
              <R2Image
                url={productData.image}
                style={{ width: '100%', height: '100%' }}
                fallback={
                  <View className="w-full h-full bg-gray-50 items-center justify-center">
                    <Feather name="image" size={64} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-3 text-base">No Image</Text>
                  </View>
                }
              />
            ) : (
              <View className="w-full h-full bg-gray-50 items-center justify-center">
                <Feather name="image" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 mt-3 text-base">No Image</Text>
              </View>
            )}
          </View>
        </View>

        {/* Product Info */}
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {productData.title || 'Untitled Product'}
          </Text>

          {productData.blurb && (
            <Text className="text-gray-600 mb-4 text-base leading-6">
              {productData.blurb}
            </Text>
          )}

          {/* Price */}
          <View className="mb-6">
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-bold text-gray-900">
                {formatCurrency(getCurrentPrice())}
              </Text>
              {getOriginalPrice() && (
                <Text className="text-lg text-gray-500 line-through ml-2">
                  {formatCurrency(getOriginalPrice())}
                </Text>
              )}
            </View>

            {/* Stock Status */}
            <View className="mt-2">
              {isInStock() ? (
                <Text className="text-green-600 font-medium">In Stock</Text>
              ) : (
                <Text className="text-red-600 font-medium">Out of Stock</Text>
              )}
            </View>
          </View>

          {/* Variant Selection */}
          {variants.length > 1 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Options</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-3">
                  {variants.map((variant: any) => (
                    <TouchableOpacity
                      key={variant.id}
                      onPress={() => setSelectedVariant(variant)}
                      className={`px-4 py-3 border rounded-lg ${
                        selectedVariant?.id === variant.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <Text className={`font-medium ${
                        selectedVariant?.id === variant.id
                          ? 'text-blue-600'
                          : 'text-gray-900'
                      }`}>
                        {getVariantTitle(variant) || variant.sku || `Option ${variants.indexOf(variant) + 1}`}
                      </Text>
                      {variant.price && (
                        <Text className={`text-sm mt-1 ${
                          selectedVariant?.id === variant.id
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        }`}>
                          {formatCurrency(variant.price)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Quantity Selector */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Quantity</Text>
            <QuantitySelector
              value={quantity}
              onValueChange={setQuantity}
              min={1}
              max={selectedVariant?.totalOnHand || 99}
            />
          </View>
        </View>

        {/* Description */}
        {productData.description && (
          <View className="px-4 py-6 border-t border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Description</Text>
            <Text className="text-gray-700 leading-6 text-base">{productData.description}</Text>
          </View>
        )}

        {/* Additional Info */}
        <View className="px-4 py-6 border-t border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Product Details</Text>

          <View className="space-y-4">
            {productData.sku && (
              <View className="flex-row">
                <Text className="text-gray-600 w-24">SKU</Text>
                <Text className="text-gray-900 flex-1">{productData.sku}</Text>
              </View>
            )}

            {productData.category?.name && (
              <View className="flex-row">
                <Text className="text-gray-600 w-24">Category</Text>
                <Text className="text-gray-900 flex-1">{productData.category.name}</Text>
              </View>
            )}

            {productData.brand?.name && (
              <View className="flex-row">
                <Text className="text-gray-600 w-24">Brand</Text>
                <Text className="text-gray-900 flex-1">{productData.brand.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Fixed Add to Cart Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4"
        style={{ paddingBottom: insets.bottom + 8 }}>



        <TouchableOpacity
          onPress={handleAddToCart}
          className={`py-4 rounded-lg items-center ${
            isInStock() ? 'bg-blue-600' : 'bg-gray-400'
          }`}
          disabled={!isInStock()}
        >
          <Text className="text-white font-semibold text-lg">
            Add to Cart
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
