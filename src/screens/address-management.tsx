import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';

import { userCustomerService } from '../services/user-customer-service';
import { Address } from '../types/database';

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
  const [addresses, setAddresses] = useState<(Address & { id: string })[]>([]);
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAddresses = async () => {
    if (!user?.email) return;

    try {
      const customer = await userCustomerService.findCustomerByEmail(user.email);

      if (customer) {
        const customerAddresses = customer.addresses || [];
        const addressesWithIds = customerAddresses.map((addr, index) => ({
          ...addr,
          id: `addr_${index}` // Generate temporary IDs for addresses
        }));

        setAddresses(addressesWithIds);

        // Find default address
        if (customer.defaultAddress) {
          const defaultIndex = customerAddresses.findIndex(addr =>
            JSON.stringify(addr) === JSON.stringify(customer.defaultAddress)
          );
          setDefaultAddressId(defaultIndex >= 0 ? `addr_${defaultIndex}` : null);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user?.email) return;

    try {
      const address = addresses.find(addr => addr.id === addressId);
      if (!address) return;

      const customer = await userCustomerService.findCustomerByEmail(user.email);
      if (!customer) return;

      // Update customer with new default address
      await userCustomerService.updateCustomerProfile(customer.id, {
        defaultAddress: address
      });

      setDefaultAddressId(addressId);
      Alert.alert('Success', 'Default address updated');
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user?.email) return;

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
              const customer = await userCustomerService.findCustomerByEmail(user.email);
              if (!customer) return;

              const addressIndex = parseInt(addressId.replace('addr_', ''));
              const updatedAddresses = [...(customer.addresses || [])];
              updatedAddresses.splice(addressIndex, 1);

              // If deleting default address, clear default
              let newDefaultAddress = customer.defaultAddress;
              if (defaultAddressId === addressId) {
                newDefaultAddress = undefined;
              }

              await userCustomerService.updateCustomerProfile(customer.id, {
                addresses: updatedAddresses,
                defaultAddress: newDefaultAddress
              });

              await loadAddresses();
              Alert.alert('Success', 'Address deleted');
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
      address.address1,
      address.address2,
      `${address.city}, ${address.province} ${address.zip}`,
      address.country
    ].filter(Boolean);
    
    return parts.join('\n');
  };

  useEffect(() => {
    loadAddresses();
  }, [user?.email]);

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
