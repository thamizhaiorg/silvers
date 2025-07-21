import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';

import { addressService, Address } from '../services/address-service';
import { db } from '../lib/instant';

interface AddressManagementScreenProps {
  onClose: () => void;
  onAddAddress?: () => void;
  onEditAddress?: (address: Address & { id: string }) => void;
}

export default function AddressManagementScreen({
  onClose,
  onAddAddress,
  onEditAddress
}: AddressManagementScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Use InstantDB's reactive query for real-time updates
  const { data, isLoading, error } = db.useQuery(
    user?.id ? {
      addresses: {
        $: {
          where: {
            userId: user.id
          }
        }
      }
    } : null
  );

  const addresses = data?.addresses || [];
  const defaultAddress = addresses.find(addr => addr.isDefault);
  const defaultAddressId = defaultAddress?.id || null;

  const handleRefresh = async () => {
    setRefreshing(true);
    // InstantDB automatically refreshes, but we can trigger a manual refresh if needed
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user?.id) return;

    try {
      const result = await addressService.setDefaultAddress(addressId);

      if (result.success) {
        Alert.alert('Success', 'Default address updated');
        // InstantDB will automatically update the UI via reactive query
      } else {
        Alert.alert('Error', result.error || 'Failed to set default address');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await addressService.deleteAddress(addressId);

              if (result.success) {
                Alert.alert('Success', 'Address deleted');
                // InstantDB will automatically update the UI via reactive query
              } else {
                Alert.alert('Error', result.error || 'Failed to delete address');
              }
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          }
        }
      ]
    );
  };

  const formatAddress = (address: Address) => {
    const parts = [
      address.street,
      `${address.city}, ${address.state} ${address.zipCode}`,
      address.country
    ].filter(Boolean);

    return parts.join('\n');
  };



  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose} className="mr-4">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1">Delivery Addresses</Text>
          <TouchableOpacity onPress={onAddAddress}>
            <Feather name="plus" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="px-4 py-4">
          {isLoading ? (
            <View className="py-12">
              <Text className="text-center text-gray-500">Loading addresses...</Text>
            </View>
          ) : addresses.length === 0 ? (
            <View className="py-12">
              <View className="items-center">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Feather name="map-pin" size={24} color="#9CA3AF" />
                </View>
                <Text className="text-lg font-medium text-gray-900 mb-2">
                  No addresses yet
                </Text>
                <Text className="text-gray-500 text-center mb-6">
                  Add your delivery addresses for faster checkout
                </Text>
                <TouchableOpacity
                  onPress={onAddAddress}
                  className="bg-blue-600 rounded-lg px-6 py-3"
                >
                  <Text className="text-white font-medium">Add First Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            addresses.map((address) => (
              <View key={address.id} className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-lg font-semibold text-gray-900">
                        {address.firstName} {address.lastName}
                      </Text>
                      {defaultAddressId === address.id && (
                        <View className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                          <Text className="text-xs font-medium text-green-800">Default</Text>
                        </View>
                      )}
                    </View>
                    {address.company && (
                      <Text className="text-sm text-gray-600 mb-1">{address.company}</Text>
                    )}
                    <Text className="text-sm text-gray-700 leading-5">
                      {formatAddress(address)}
                    </Text>
                    {address.phone && (
                      <Text className="text-sm text-gray-600 mt-1">{address.phone}</Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                  <View className="flex-row items-center gap-4">
                    {defaultAddressId !== address.id && (
                      <TouchableOpacity
                        onPress={() => handleSetDefault(address.id)}
                        className="flex-row items-center"
                      >
                        <Feather name="star" size={16} color="#6B7280" />
                        <Text className="text-sm text-gray-600 ml-1">Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => onEditAddress?.(address)}
                      className="flex-row items-center"
                    >
                      <Feather name="edit-2" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-1">Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteAddress(address.id)}
                    className="flex-row items-center"
                  >
                    <Feather name="trash-2" size={16} color="#EF4444" />
                    <Text className="text-sm text-red-500 ml-1">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Bottom Padding */}
        <View className="h-8" />
      </ScrollView>

      {/* Floating Add Button */}
      {addresses.length > 0 && (
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            onPress={onAddAddress}
            className="w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg"
          >
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
