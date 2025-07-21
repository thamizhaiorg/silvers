// Test script to verify address functionality
import { addressService } from './services/address-service';

export async function testAddressService() {
  console.log('🧪 Testing Address Service...');
  
  const testUserId = 'test-user-123';
  
  try {
    // Test 1: Create a new address
    console.log('📝 Creating test address...');
    const createResult = await addressService.createAddress(testUserId, {
      name: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
      phone: '+1-555-0123',
      isDefault: true,
    });
    
    if (createResult.success) {
      console.log('✅ Address created successfully:', createResult.address?.id);
    } else {
      console.log('❌ Failed to create address:', createResult.error);
      return;
    }
    
    // Test 2: Get user addresses
    console.log('📋 Fetching user addresses...');
    const fetchResult = await addressService.getUserAddresses(testUserId);
    
    if (fetchResult.success) {
      console.log('✅ Addresses fetched successfully:', fetchResult.addresses?.length);
      console.log('📍 Addresses:', fetchResult.addresses);
    } else {
      console.log('❌ Failed to fetch addresses:', fetchResult.error);
    }
    
    // Test 3: Get default address
    console.log('🏠 Fetching default address...');
    const defaultResult = await addressService.getDefaultAddress(testUserId);
    
    if (defaultResult.success) {
      console.log('✅ Default address fetched:', defaultResult.address?.name);
    } else {
      console.log('❌ Failed to fetch default address:', defaultResult.error);
    }
    
    console.log('🎉 Address service test completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Export for use in components
export { addressService };
