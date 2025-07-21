import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { useStore } from '../lib/store-context';
import { userCustomerService } from '../services/user-customer-service';
import { Address } from '../types/database';

interface AddressFormProps {
  onClose: () => void;
  onSave?: () => void;
  address?: Address & { id?: string };
  isEditing?: boolean;
}

export default function AddressForm({ onClose, onSave, address, isEditing = false }: AddressFormProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentStore } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Address>({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    country: 'United States',
    zip: '',
    phone: ''
  });

  // Initialize form with existing address data
  useEffect(() => {
    if (address) {
      setFormData({
        firstName: address.firstName || '',
        lastName: address.lastName || '',
        company: address.company || '',
        address1: address.address1 || '',
        address2: address.address2 || '',
        city: address.city || '',
        province: address.province || '',
        country: address.country || 'United States',
        zip: address.zip || '',
        phone: address.phone || ''
      });
    }
  }, [address]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.address1?.trim()) {
      newErrors.address1 = 'Address is required';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.province?.trim()) {
      newErrors.province = 'State/Province is required';
    }

    if (!formData.zip?.trim()) {
      newErrors.zip = 'ZIP/Postal code is required';
    }

    if (!formData.country?.trim()) {
      newErrors.country = 'Country is required';
    }

    // Validate phone if provided
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    if (!user?.email || !currentStore?.id) {
      Alert.alert('Error', 'User or store not found');
      return;
    }

    setIsLoading(true);

    try {
      const customer = await userCustomerService.findOrCreateCustomerForUser(user, undefined, currentStore.id);
      
      if (!customer.success || !customer.customer) {
        Alert.alert('Error', 'Failed to find customer record');
        return;
      }

      const existingAddresses = customer.customer.addresses || [];
      let updatedAddresses: Address[];

      if (isEditing && address?.id) {
        // Update existing address
        const addressIndex = parseInt(address.id.replace('addr_', ''));
        updatedAddresses = [...existingAddresses];
        updatedAddresses[addressIndex] = formData;
      } else {
        // Add new address
        updatedAddresses = [...existingAddresses, formData];
      }

      // Update customer with new addresses
      await userCustomerService.updateCustomerProfile(customer.customer.id, {
        addresses: updatedAddresses
      });

      Alert.alert(
        'Success', 
        isEditing ? 'Address updated successfully' : 'Address added successfully',
        [{ text: 'OK', onPress: () => { onSave?.(); onClose(); } }]
      );

    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof Address, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderInput = (
    field: keyof Address,
    label: string,
    placeholder: string,
    options?: {
      multiline?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      required?: boolean;
    }
  ) => {
    const hasError = !!errors[field];
    
    return (
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {label}
          {options?.required && <Text className="text-red-500"> *</Text>}
        </Text>
        <TextInput
          value={formData[field] || ''}
          onChangeText={(text) => updateField(field, text)}
          placeholder={placeholder}
          multiline={options?.multiline}
          numberOfLines={options?.multiline ? 3 : 1}
          keyboardType={options?.keyboardType || 'default'}
          autoCapitalize={options?.autoCapitalize || 'words'}
          className={`w-full px-4 py-3 bg-white rounded-lg text-base border ${
            hasError ? 'border-red-300' : 'border-gray-200'
          }`}
          style={{ fontSize: 16, textAlignVertical: options?.multiline ? 'top' : 'center' }}
        />
        {hasError && (
          <Text className="text-red-500 text-sm mt-1">{errors[field]}</Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose} className="mr-4">
            <Feather name="x" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1">
            {isEditing ? 'Edit Address' : 'Add Address'}
          </Text>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg ${isLoading ? 'bg-gray-300' : 'bg-blue-600'}`}
          >
            <Text className={`font-medium ${isLoading ? 'text-gray-500' : 'text-white'}`}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Personal Information */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Personal Information</Text>
            
            <View className="flex-row gap-3">
              <View className="flex-1">
                {renderInput('firstName', 'First Name', 'John', { required: true })}
              </View>
              <View className="flex-1">
                {renderInput('lastName', 'Last Name', 'Doe', { required: true })}
              </View>
            </View>

            {renderInput('company', 'Company', 'Company name (optional)')}
            {renderInput('phone', 'Phone', '+1 (555) 123-4567', { keyboardType: 'phone-pad' })}
          </View>

          {/* Address Information */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Address Information</Text>
            
            {renderInput('address1', 'Address Line 1', '123 Main Street', { required: true })}
            {renderInput('address2', 'Address Line 2', 'Apartment, suite, etc. (optional)')}
            
            <View className="flex-row gap-3">
              <View className="flex-1">
                {renderInput('city', 'City', 'New York', { required: true })}
              </View>
              <View className="flex-1">
                {renderInput('province', 'State/Province', 'NY', { required: true, autoCapitalize: 'characters' })}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                {renderInput('zip', 'ZIP/Postal Code', '10001', { required: true, autoCapitalize: 'characters' })}
              </View>
              <View className="flex-1">
                {renderInput('country', 'Country', 'United States', { required: true })}
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View className="h-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
