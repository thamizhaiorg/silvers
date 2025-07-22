import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../lib/instant';
import ProductDetailsScreen from '../../components/product-details';

export default function ProductDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Query the specific product
  const { isLoading, error, data } = db.useQuery({
    products: {
      $: {
        where: {
          id: id
        }
      }
    }
  });

  const product = data?.products?.[0];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg">Loading...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-red-500">Product not found</Text>
      </View>
    );
  }

  return (
    <ProductDetailsScreen
      product={product}
      onClose={() => router.back()}
    />
  );
}
