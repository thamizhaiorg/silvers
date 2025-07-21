import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { addressService, CreateAddressData, Address } from '../services/address-service';

interface AddressFormProps {
  onClose: () => void;
  onSave?: () => void;
  address?: Address & { id?: string };
  isEditing?: boolean;
}

export default function AddressForm({ onClose, onSave, address, isEditing = false }: AddressFormProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
    isDefault: false
  });

  // Initialize form with existing address data
  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name || '',
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || 'United States',
        phone: address.phone || '',
        isDefault: address.isDefault || false
      });
    }
  }, [address]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.street?.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state?.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode?.trim()) {
      newErrors.zipCode = 'ZIP code is required';
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

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setIsLoading(true);

    try {
      const addressData: CreateAddressData = {
        name: formData.name,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone,
        isDefault: formData.isDefault,
      };

      let result;
      if (isEditing && address?.id) {
        // Update existing address
        result = await addressService.updateAddress(address.id, addressData);
      } else {
        // Create new address
        result = await addressService.createAddress(user.id, addressData);
      }

      if (result.success) {
        Alert.alert(
          'Success',
          isEditing ? 'Address updated successfully' : 'Address added successfully',
          [{ text: 'OK', onPress: () => { onSave?.(); onClose(); } }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to save address');
      }

    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setIsLoading(false);
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
            <Text className="text-lg font-semibold text-gray-900 mb-4">Contact Information</Text>

            {renderInput('name', 'Full Name', 'John Doe', { required: true })}
            {renderInput('phone', 'Phone', '+1 (555) 123-4567', { keyboardType: 'phone-pad' })}
          </View>

          {/* Address Information */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Address Information</Text>

            {renderInput('street', 'Street Address', '123 Main Street', { required: true })}

            <View className="flex-row gap-3">
              <View className="flex-1">
                {renderInput('city', 'City', 'New York', { required: true })}
              </View>
              <View className="flex-1">
                {renderInput('state', 'State', 'NY', { required: true, autoCapitalize: 'characters' })}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                {renderInput('zipCode', 'ZIP Code', '10001', { required: true, autoCapitalize: 'characters' })}
              </View>
              <View className="flex-1">
                {renderInput('country', 'Country', 'United States', { required: true })}
              </View>
            </View>

            {/* Default Address Toggle */}
            <View className="mt-4">
              <TouchableOpacity
                onPress={() => updateField('isDefault', !formData.isDefault)}
                className="flex-row items-center"
              >
                <View className={`w-5 h-5 rounded border-2 mr-3 ${formData.isDefault ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {formData.isDefault && (
                    <Feather name="check" size={12} color="white" style={{ alignSelf: 'center', marginTop: 1 }} />
                  )}
                </View>
                <Text className="text-base text-gray-700">Set as default address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View className="h-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
