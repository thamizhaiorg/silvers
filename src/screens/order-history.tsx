import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { db, formatCurrency } from '../lib/instant';
import { useStore } from '../lib/store-context';

interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  subtotal: number;
  discountAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  total: number;
  totalPaid?: number;
  totalRefunded?: number;
  notes?: string;
  tags?: string;
  createdAt: Date;
  updatedAt?: Date;
  orderitems?: Array<{
    id: string;
    title: string;
    quantity: number; // Fixed: use quantity instead of qty
    price: number;
    saleprice?: number;
    sku?: string;
  }>;
}

interface OrderHistoryScreenProps {
  onClose: () => void;
  onOrderSelect?: (order: Order) => void;
}

export default function OrderHistoryScreen({ onClose, onOrderSelect }: OrderHistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentStore } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Query user's orders by matching email and store
  const { data: ordersData, isLoading, error } = db.useQuery(
    user?.email && currentStore?.id ? {
      orders: {
        $: {
          where: {
            customerEmail: user.email,
            storeId: currentStore.id,
          },
          order: {
            createdAt: 'desc'
          }
        },
        orderitems: {}
      }
    } : null
  );

  const orders = ordersData?.orders || [];

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // The query will automatically refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'partial':
        return 'text-blue-600';
      case 'refunded':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatOrderDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose} className="mr-4">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1">Order History</Text>
          <View className="w-6" />
        </View>
      </View>

      {/* Search and Filter */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search orders..."
            className="flex-1 ml-2 text-base"
            style={{ fontSize: 16 }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-full border ${
                  statusFilter === option.value
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    statusFilter === option.value ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Orders List */}
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
              <Text className="text-center text-gray-500">Loading orders...</Text>
            </View>
          ) : error ? (
            <View className="py-12">
              <Text className="text-center text-red-500">Error loading orders</Text>
            </View>
          ) : filteredOrders.length === 0 ? (
            <View className="py-12">
              <View className="items-center">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Feather name="shopping-bag" size={24} color="#9CA3AF" />
                </View>
                <Text className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
                </Text>
                <Text className="text-gray-500 text-center">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Your order history will appear here once you make your first purchase'
                  }
                </Text>
              </View>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => onOrderSelect?.(order)}
                className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      #{order.orderNumber}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {formatOrderDate(order.createdAt)}
                    </Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.total)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className={`px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      <Text className="text-xs font-medium capitalize">
                        {order.status}
                      </Text>
                    </View>
                    <Text className={`text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </View>

                {order.orderitems && order.orderitems.length > 0 && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-sm text-gray-600">
                      {order.orderitems.length} item{order.orderitems.length !== 1 ? 's' : ''}
                      {order.orderitems.length <= 2 && (
                        <Text className="text-gray-500">
                          {' • '}
                          {order.orderitems.map(item => item.title).join(', ')}
                        </Text>
                      )}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bottom Padding */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
