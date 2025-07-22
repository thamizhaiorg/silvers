import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';

import { userCustomerService } from '../services/user-customer-service';


interface ProfileScreenProps {
  onClose?: () => void;
  onNavigateToAddresses?: () => void;
}

export default function ProfileScreen({ onClose, onNavigateToAddresses }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { user, peopleaProfile, createPeopleaProfile, updatePeopleaProfile, signOut, linkUserToCustomer } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });



  // Address statistics state
  const [addressStats, setAddressStats] = useState({
    totalAddresses: 0,
    defaultAddress: null as any,
    recentAddresses: [] as any[]
  });



  // Load address statistics and link user to customer
  useEffect(() => {
    const loadAddressStats = async () => {
      if (!user?.email) return;

      try {
        // First ensure user is linked to customer
        await linkUserToCustomer();

        // Get customer record to access addresses
        const customer = await userCustomerService.findCustomerByEmail(user.email);

        if (customer) {
          const addresses = customer.addresses || [];
          const defaultAddress = customer.defaultAddress;

          setAddressStats({
            totalAddresses: addresses.length,
            defaultAddress: defaultAddress,
            recentAddresses: addresses.slice(0, 2) // Show 2 most recent
          });
        }
      } catch (error) {
        console.error('Error loading address stats:', error);
      }
    };

    loadAddressStats();
  }, [user?.email]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (peopleaProfile) {
      setFormData({
        name: peopleaProfile.name || '',
        phone: peopleaProfile.phone || '',
      });
    }
  }, [peopleaProfile]);





  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (peopleaProfile) {
        // Update existing profile
        await updatePeopleaProfile(formData);
      } else {
        // Create new profile
        await createPeopleaProfile(formData);
      }
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Profile save error:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (peopleaProfile) {
      setFormData({
        name: peopleaProfile.name || '',
        phone: peopleaProfile.phone || '',
      });
    }
    setIsEditing(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center justify-between bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">Profile</Text>
        
        {isEditing ? (
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={handleCancel} disabled={isLoading}>
              <Text className="text-gray-600 text-base">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={isLoading}>
              <Text className="text-blue-600 text-base font-medium">
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text className="text-blue-600 text-base font-medium">Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">

          {/* User Info */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-500 mb-1">Email</Text>
            <Text className="text-lg text-gray-900">{user?.email}</Text>
          </View>

          {/* Profile Form */}
          <View className="space-y-6">
            {/* Name Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Name</Text>
              {isEditing ? (
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-base border border-gray-200"
                  style={{ fontSize: 16 }}
                />
              ) : (
                <Text className="text-base text-gray-900 py-3">
                  {formData.name || peopleaProfile?.name || 'Not set'}
                </Text>
              )}
            </View>

            {/* Phone Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Phone</Text>
              {isEditing ? (
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg text-base border border-gray-200"
                  style={{ fontSize: 16 }}
                />
              ) : (
                <Text className="text-base text-gray-900 py-3">
                  {formData.phone || peopleaProfile?.phone || 'Not set'}
                </Text>
              )}
            </View>
          </View>

          {/* Address Management Card */}
          <View className="mt-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Delivery Addresses</Text>
            <TouchableOpacity
              onPress={onNavigateToAddresses}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                    <Feather name="map-pin" size={20} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-base font-medium text-gray-900">
                      {addressStats.totalAddresses} Address{addressStats.totalAddresses !== 1 ? 'es' : ''}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {addressStats.defaultAddress ? 'Default address set' : 'No default address'}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </View>

              {addressStats.defaultAddress ? (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Default Address</Text>
                  <View className="bg-gray-50 rounded-lg p-3">
                    <Text className="text-sm text-gray-900 font-medium">
                      {addressStats.defaultAddress.firstName} {addressStats.defaultAddress.lastName}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {addressStats.defaultAddress.address1}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {addressStats.defaultAddress.city}, {addressStats.defaultAddress.province} {addressStats.defaultAddress.zip}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="py-4">
                  <Text className="text-sm text-gray-500 text-center">
                    Add your delivery addresses for faster checkout.
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <View className="mt-12 pt-8 border-t border-gray-200">
            <TouchableOpacity
              onPress={handleSignOut}
              className="w-full py-4 bg-red-50 rounded-lg border border-red-200"
            >
              <Text className="text-red-600 text-center text-base font-medium">
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View className="mt-8 pt-6 border-t border-gray-100">
            <Text className="text-xs text-gray-400 text-center">
              TAR POS • Powered by InstantDB
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}