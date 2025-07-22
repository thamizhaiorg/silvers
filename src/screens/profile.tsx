import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { userCustomerService } from '../services/user-customer-service';


interface ProfileScreenProps {
  onClose?: () => void;
  onNavigateToAddresses?: () => void;
  onNavigateToOrders?: () => void;
}

export default function ProfileScreen({ onClose, onNavigateToAddresses, onNavigateToOrders }: ProfileScreenProps) {
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

  // Order statistics state
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    recentOrders: [] as any[]
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
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Minimal Header */}
      <View className="px-6 py-4 bg-white">
        <Text className="text-2xl font-light text-gray-900">Profile</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">

          {/* User Card */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-lg font-medium text-gray-900 mb-1">
                  {formData.name || peopleaProfile?.name || 'Your Name'}
                </Text>
                <Text className="text-gray-500">{user?.email}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              >
                <Feather name={isEditing ? "check" : "edit-2"} size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {isEditing && (
              <View className="space-y-4 pt-4 border-t border-gray-100">
                <View>
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-base"
                    style={{ fontSize: 16 }}
                  />
                </View>
                <View>
                  <TextInput
                    value={formData.phone}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                    placeholder="Phone number"
                    keyboardType="phone-pad"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-base"
                    style={{ fontSize: 16 }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isLoading}
                  className="bg-blue-600 rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-medium">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* My Orders Card */}
          <TouchableOpacity
            onPress={onNavigateToOrders}
            className="bg-white rounded-2xl p-6 mb-4 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-blue-100 rounded-2xl items-center justify-center mr-4">
                <Feather name="shopping-bag" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-medium text-gray-900">My Orders</Text>
                <Text className="text-gray-500">View order history</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>

          {/* Delivery Addresses Card */}
          <TouchableOpacity
            onPress={onNavigateToAddresses}
            className="bg-white rounded-2xl p-6 mb-4 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-green-100 rounded-2xl items-center justify-center mr-4">
                <Feather name="map-pin" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-medium text-gray-900">Delivery Addresses</Text>
                <Text className="text-gray-500">Manage shipping addresses</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </View>
          </TouchableOpacity>

          {/* Sign Out Card */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-white rounded-2xl p-6 mb-8 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-red-100 rounded-2xl items-center justify-center mr-4">
                <Feather name="log-out" size={20} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-medium text-red-600">Sign Out</Text>
                <Text className="text-gray-500">Sign out of your account</Text>
              </View>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}