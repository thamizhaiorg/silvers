import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { id } from '@instantdb/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { db } from '../lib/instant';
import { formatCurrency } from '../lib/order-calculations';

interface MyOrdersScreenProps {
  onClose?: () => void;
  onOrderSelect?: (order: any) => void;
}

interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  lineTotal: number;
  sku?: string;
  variantTitle?: string;
  taxAmount?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: Date;
  items: OrderItem[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export default function MyOrdersScreen({ onClose, onOrderSelect }: MyOrdersScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Use InstantDB reactive query to get orders by customer email
  const { data, isLoading, error } = db.useQuery(
    user?.email ? {
      orders: {
        $: {
          where: {
            customerEmail: user.email
          },
          order: {
            createdAt: 'desc'
          }
        },
        orderitems: {}
      }
    } : null
  );

  // Transform orders with their items
  const orders: Order[] = data?.orders?.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    shippingAmount: order.shippingAmount,
    discountAmount: order.discountAmount,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    createdAt: new Date(order.createdAt),
    items: order.orderitems || [],
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone
  })) || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const createTestOrder = async () => {
    if (!user?.email) return;

    try {
      const orderId = id();
      const orderNumber = 'TEST-' + Date.now().toString().slice(-6);

      const orderData = {
        orderNumber,
        referenceId: orderId,
        createdAt: new Date(),
        customerEmail: user.email,
        customerName: 'Test Customer',
        status: 'completed',
        fulfillmentStatus: 'fulfilled',
        paymentStatus: 'paid',
        subtotal: 50.00,
        taxAmount: 4.00,
        shippingAmount: 5.00,
        total: 59.00,
      };

      const item1Id = id();
      const item2Id = id();

      const orderItems = [
        {
          id: item1Id,
          title: 'Test Product 1',
          quantity: 2,
          price: 15.00,
          lineTotal: 30.00,
          sku: 'TEST-001',
          variantTitle: 'Medium / Blue',
          taxAmount: 2.40,
        },
        {
          id: item2Id,
          title: 'Test Product 2',
          quantity: 1,
          price: 20.00,
          lineTotal: 20.00,
          sku: 'TEST-002',
          taxAmount: 1.60,
        }
      ];

      await db.transact([
        db.tx.orders[orderId].update(orderData),
        ...orderItems.map(item => db.tx.orderitems[item.id].update(item)),
        ...orderItems.map(item =>
          db.tx.orders[orderId].link({ orderitems: item.id })
        )
      ]);

      Alert.alert('Success', 'Test order with items created!');
    } catch (error) {
      console.error('Error creating test order:', error);
      Alert.alert('Error', 'Failed to create test order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOrderItem = (item: OrderItem, index: number) => {
    const safeTitle = item.title || 'Unknown Item';
    const safeQuantity = item.quantity || 0;
    const safePrice = item.price || 0;
    const safeLineTotal = item.lineTotal || 0;
    const safeSku = item.sku || '';
    const safeVariantTitle = item.variantTitle || '';
    const safeTaxAmount = item.taxAmount || 0;

    return (
      <View key={index} className="flex-row items-start justify-between py-3 border-b border-gray-50">
        <View className="flex-1 mr-3">
          <Text className="text-sm font-medium text-gray-900 mb-1">
            {safeTitle}
          </Text>
          {safeVariantTitle !== '' && (
            <Text className="text-xs text-gray-500 mb-1">
              {safeVariantTitle}
            </Text>
          )}
          {safeSku !== '' && (
            <Text className="text-xs text-gray-400">
              SKU: {safeSku}
            </Text>
          )}
          <View className="flex-row items-center mt-2">
            <Text className="text-sm text-gray-600">
              Qty: {safeQuantity.toString()}
            </Text>
            <Text className="text-sm text-gray-600 ml-4">
              {formatCurrency(safePrice)} each
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-sm font-medium text-gray-900">
            {formatCurrency(safeLineTotal)}
          </Text>
          {safeTaxAmount > 0 && (
            <Text className="text-xs text-gray-500 mt-1">
              Tax: {formatCurrency(safeTaxAmount)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderOrderSummary = (order: Order) => {
    const safeSubtotal = order.subtotal || 0;
    const safeTaxAmount = order.taxAmount || 0;
    const safeShippingAmount = order.shippingAmount || 0;
    const safeDiscountAmount = order.discountAmount || 0;
    const safeTotal = order.total || 0;

    return (
      <View className="mt-4 pt-4 border-t border-gray-200">
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-gray-600">Subtotal</Text>
          <Text className="text-sm text-gray-900">{formatCurrency(safeSubtotal)}</Text>
        </View>
        {safeTaxAmount > 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Tax</Text>
            <Text className="text-sm text-gray-900">{formatCurrency(safeTaxAmount)}</Text>
          </View>
        )}
        {safeShippingAmount > 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Shipping</Text>
            <Text className="text-sm text-gray-900">{formatCurrency(safeShippingAmount)}</Text>
          </View>
        )}
        {safeDiscountAmount > 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-green-600">Discount</Text>
            <Text className="text-sm text-green-600">-{formatCurrency(safeDiscountAmount)}</Text>
          </View>
        )}
        <View className="flex-row justify-between pt-2 border-t border-gray-200">
          <Text className="text-base font-semibold text-gray-900">Total</Text>
          <Text className="text-base font-semibold text-gray-900">{formatCurrency(safeTotal)}</Text>
        </View>
      </View>
    );
  };

  const renderOrderCard = (order: Order) => {
    const isExpanded = expandedOrders.has(order.id);
    const safeOrderNumber = order.orderNumber || 'Unknown';
    const safeStatus = order.status || 'pending';
    const safePaymentStatus = order.paymentStatus || 'pending';
    const safeTotal = order.total || 0;
    const safeItems = order.items || [];
    const itemCount = safeItems.length;

    return (
      <View key={order.id} className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
        {/* Order Header */}
        <TouchableOpacity
          onPress={() => toggleOrderExpansion(order.id)}
          className="flex-row items-center justify-between mb-4"
        >
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              Order #{safeOrderNumber}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              {formatDate(order.createdAt)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className={'px-3 py-1 rounded-full ' + getStatusColor(safeStatus) + ' mr-3'}>
              <Text className={'text-sm font-medium ' + getStatusColor(safeStatus).split(' ')[0]}>
                {getStatusText(safeStatus)}
              </Text>
            </View>
            <Feather 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6B7280" 
            />
          </View>
        </TouchableOpacity>

        {/* Items Summary */}
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-2">
            {itemCount.toString()} {itemCount === 1 ? 'item' : 'items'}
          </Text>
          
          {!isExpanded && safeItems.slice(0, 2).map((item, index) => {
            const safeTitle = item.title || 'Unknown Item';
            const safeQuantity = item.quantity || 0;
            const safeVariantTitle = item.variantTitle || '';
            const safeLineTotal = item.lineTotal || 0;
            
            return (
              <View key={index} className="flex-row items-center justify-between py-1">
                <View className="flex-1">
                  <Text className="text-sm text-gray-700" numberOfLines={1}>
                    {safeQuantity.toString()}x {safeTitle}
                    {safeVariantTitle !== '' && (
                      <Text className="text-gray-500"> • {safeVariantTitle}</Text>
                    )}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600 ml-2">
                  {formatCurrency(safeLineTotal)}
                </Text>
              </View>
            );
          })}
          
          {!isExpanded && itemCount > 2 && (
            <Text className="text-sm text-gray-500 mt-1">
              +{(itemCount - 2).toString()} more {itemCount - 2 === 1 ? 'item' : 'items'}
            </Text>
          )}
        </View>

        {/* Expanded Items */}
        {isExpanded && (
          <View className="mb-4 border-t border-gray-100 pt-4">
            <Text className="text-base font-medium text-gray-900 mb-3">Order Items</Text>
            {safeItems.map(renderOrderItem)}
            {renderOrderSummary(order)}
          </View>
        )}

        {/* Order Total */}
        {!isExpanded && (
          <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
            <View>
              <Text className="text-lg font-semibold text-gray-900">
                {formatCurrency(safeTotal)}
              </Text>
              <Text className="text-sm text-gray-500">
                {safePaymentStatus === 'paid' ? 'Paid' : 'Payment ' + safePaymentStatus}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
        <Feather name="shopping-bag" size={32} color="#9CA3AF" />
      </View>
      <Text className="text-xl font-medium text-gray-900 mb-2">No Orders Yet</Text>
      <Text className="text-gray-500 text-center mb-6">
        When you place your first order, it will appear here.
      </Text>
      <View className="space-y-3">
        <TouchableOpacity
          onPress={onClose}
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-medium">Start Shopping</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={createTestOrder}
          className="bg-gray-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-medium">Create Test Order (Debug)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-light text-gray-900">My Orders</Text>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading orders...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 text-center mb-4">
            Error loading orders: {error?.message || 'Unknown error'}
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            className="bg-blue-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
            />
          }
        >
          <View className="px-6 py-4">
            {orders.map(renderOrderCard)}
          </View>
        </ScrollView>
      )}
    </View>
  );
}