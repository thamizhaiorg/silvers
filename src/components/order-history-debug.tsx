import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';

import { db, formatCurrency } from '../lib/instant';
import { orderHistoryService } from '../services/order-history-service';
import { userCustomerService } from '../services/user-customer-service';

interface OrderHistoryDebugProps {
  onClose: () => void;
}

export default function OrderHistoryDebug({ onClose }: OrderHistoryDebugProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'User email not available');
      return;
    }

    setIsLoading(true);
    const info: any = {
      userEmail: user.email,
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Check raw orders query
      console.log('🔍 Checking raw orders query...');
      const rawQuery = await db.queryOnce({
        orders: {
          $: {
            where: {
              customerEmail: user.email
            },
            order: { createdAt: 'desc' }
          },
          orderitems: {}
        }
      });
      info.rawOrdersCount = rawQuery.orders?.length || 0;
      info.rawOrders = rawQuery.orders?.slice(0, 3) || [];

      // 2. Check all orders
      console.log('🔍 Checking all orders...');
      const allOrdersQuery = await db.queryOnce({
        orders: {
          $: {
            order: { createdAt: 'desc' }
          }
        }
      });
      info.allOrders = allOrdersQuery.orders?.length || 0;
      info.sampleOrders = allOrdersQuery.orders?.slice(0, 3).map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        total: order.total,
        createdAt: order.createdAt
      })) || [];

      // 3. Check customer records
      console.log('🔍 Checking customer records...');
      const customer = await userCustomerService.findCustomerByEmail(user.email);
      info.customerRecord = customer ? {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent
      } : null;

      // 4. Check order history service
      console.log('🔍 Testing order history service...');
      const historyResult = await orderHistoryService.getUserOrderHistory(user.email);
      info.orderHistoryService = {
        success: historyResult.success,
        ordersCount: historyResult.orders?.length || 0,
        error: historyResult.error
      };

      // 5. Check order summary
      console.log('🔍 Testing order summary service...');
      const summaryResult = await orderHistoryService.getUserOrderSummary(user.email);
      info.orderSummaryService = {
        success: summaryResult.success,
        summary: summaryResult.summary,
        error: summaryResult.error
      };

      // 6. Check address management
      console.log('🔍 Testing address management...');
      const customerRecord = await userCustomerService.findCustomerByEmail(user.email);
      info.addressManagement = {
        customerFound: !!customerRecord,
        addressCount: customerRecord?.addresses?.length || 0,
        hasDefaultAddress: !!customerRecord?.defaultAddress,
        addresses: customerRecord?.addresses?.slice(0, 2) || []
      };

      console.log('🎯 Debug Info:', info);
      setDebugInfo(info);

    } catch (error) {
      console.error('❌ Debug error:', error);
      info.error = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(info);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestOrder = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'User email not available');
      return;
    }

    try {
      setIsLoading(true);

      // First ensure customer exists
      const customerResult = await userCustomerService.findOrCreateCustomerForUser(user, {
        name: user.email.split('@')[0]
      });

      if (!customerResult.success) {
        Alert.alert('Error', 'Failed to create customer: ' + customerResult.error);
        return;
      }

      // Create a test order
      const orderId = `test-${Date.now()}`;
      const orderNumber = `TEST-${Date.now().toString().slice(-6)}`;
      
      const orderData = {
        orderNumber,
        referenceId: orderId,
        createdAt: new Date(),
        customerId: customerResult.customer?.id,
        customerName: customerResult.customer?.name,
        customerEmail: user.email,
        status: 'completed',
        fulfillmentStatus: 'fulfilled',
        paymentStatus: 'paid',
        subtotal: 25.00,
        taxAmount: 2.00,
        total: 27.00,
        notes: 'Test order for debugging'
      };

      await db.transact([
        db.tx.orders[orderId].update(orderData)
      ]);

      Alert.alert('Success', 'Test order created successfully!');
      runDiagnostics(); // Refresh diagnostics

    } catch (error) {
      console.error('Error creating test order:', error);
      Alert.alert('Error', 'Failed to create test order: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [user?.email]);

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose} className="mr-4">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1">Order History Debug</Text>
          <TouchableOpacity onPress={runDiagnostics} disabled={isLoading}>
            <Feather name="refresh-cw" size={24} color={isLoading ? "#9CA3AF" : "#3B82F6"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Actions */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Actions</Text>
          <TouchableOpacity
            onPress={createTestOrder}
            disabled={isLoading}
            className="bg-blue-600 rounded-lg p-3 mb-2"
          >
            <Text className="text-white text-center font-medium">
              {isLoading ? 'Creating...' : 'Create Test Order'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={runDiagnostics}
            disabled={isLoading}
            className="bg-gray-600 rounded-lg p-3"
          >
            <Text className="text-white text-center font-medium">
              {isLoading ? 'Running...' : 'Run Diagnostics'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Debug Info */}
        <View className="bg-white rounded-xl p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Debug Information</Text>
          <ScrollView className="max-h-96">
            <Text className="font-mono text-xs text-gray-700">
              {JSON.stringify(debugInfo, null, 2)}
            </Text>
          </ScrollView>
        </View>

        {/* Quick Stats */}
        {debugInfo.rawOrdersCount !== undefined && (
          <View className="bg-white rounded-xl p-4 mt-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</Text>
            <View className="space-y-2">
              <Text className="text-gray-700">
                📧 User Email: {debugInfo.userEmail}
              </Text>
              <Text className="text-gray-700">
                📦 User Orders: {debugInfo.rawOrdersCount}
              </Text>
              <Text className="text-gray-700">
                📋 All Orders: {debugInfo.allOrders}
              </Text>
              <Text className="text-gray-700">
                👤 Customer Record: {debugInfo.customerRecord ? '✅ Found' : '❌ Not Found'}
              </Text>
              <Text className="text-gray-700">
                🔧 Order History Service: {debugInfo.orderHistoryService?.success ? '✅ Working' : '❌ Error'}
              </Text>
              <Text className="text-gray-700">
                📍 Address Management: {debugInfo.addressManagement?.customerFound ? '✅ Working' : '❌ Error'}
              </Text>
              <Text className="text-gray-700">
                🏠 Saved Addresses: {debugInfo.addressManagement?.addressCount || 0}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
