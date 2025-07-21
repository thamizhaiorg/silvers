// Order History service for user-specific order management
import { db } from '../lib/instant';
import { log, trackError } from '../lib/logger';
import { User } from '@instantdb/react-native';


export interface OrderHistoryItem {
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
    option1?: string;
    option2?: string;
    option3?: string;
  }>;
}

export interface OrderHistoryFilters {
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  search?: string;
}

export interface OrderHistorySummary {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  ordersByStatus: Record<string, number>;
  ordersByMonth: Array<{
    month: string;
    count: number;
    total: number;
  }>;
}

export class OrderHistoryService {
  
  /**
   * Get order history for a user
   */
  async getUserOrderHistory(
    userEmail: string,
    filters?: OrderHistoryFilters,
    limit?: number,
    offset?: number
  ): Promise<{ success: boolean; orders?: OrderHistoryItem[]; error?: string }> {
    try {
      log.info('Fetching user order history', 'OrderHistoryService', {
        userEmail,
        filters,
        limit,
        offset
      });

      // Build query conditions
      const whereConditions: any = {
        customerEmail: userEmail
      };

      // Add status filters
      if (filters?.status && filters.status !== 'all') {
        whereConditions.status = filters.status;
      }
      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        whereConditions.paymentStatus = filters.paymentStatus;
      }
      if (filters?.fulfillmentStatus && filters.fulfillmentStatus !== 'all') {
        whereConditions.fulfillmentStatus = filters.fulfillmentStatus;
      }

      // Query orders with order items
      const query = await db.queryOnce({
        orders: {
          $: {
            where: whereConditions,
            order: {
              createdAt: 'desc'
            },
            limit: limit || 50,
            offset: offset || 0
          },
          orderitems: {}
        }
      });

      let orders = query.orders || [];

      // Apply client-side filters for complex conditions
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        orders = orders.filter(order => 
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customerName?.toLowerCase().includes(searchLower) ||
          order.notes?.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.dateRange) {
        orders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          const start = filters.dateRange?.start;
          const end = filters.dateRange?.end;
          
          if (start && orderDate < start) return false;
          if (end && orderDate > end) return false;
          return true;
        });
      }

      // Transform to OrderHistoryItem format
      const orderHistory: OrderHistoryItem[] = orders.map(order => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined
      }));

      return { success: true, orders: orderHistory };

    } catch (error: any) {
      log.error('Error fetching user order history', 'OrderHistoryService', error);
      trackError(error, 'OrderHistoryService.getUserOrderHistory');
      return { success: false, error: error.message || 'Failed to fetch order history' };
    }
  }

  /**
   * Get order history summary statistics
   */
  async getUserOrderSummary(userEmail: string): Promise<{
    success: boolean;
    summary?: OrderHistorySummary;
    error?: string
  }> {
    try {
      log.info('Fetching user order summary', 'OrderHistoryService', { userEmail });

      // Get all orders for the user
      const result = await this.getUserOrderHistory(userEmail);

      if (!result.success || !result.orders) {
        return { success: false, error: result.error };
      }

      const orders = result.orders;
      
      // Calculate summary statistics
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = orders.length > 0 ? orders[0].createdAt : undefined;

      // Group orders by status
      const ordersByStatus: Record<string, number> = {};
      orders.forEach(order => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      });

      // Group orders by month (last 12 months)
      const ordersByMonth: Array<{ month: string; count: number; total: number }> = [];
      const monthMap = new Map<string, { count: number; total: number }>();

      orders.forEach(order => {
        const monthKey = new Date(order.createdAt).toISOString().substring(0, 7); // YYYY-MM
        const existing = monthMap.get(monthKey) || { count: 0, total: 0 };
        monthMap.set(monthKey, {
          count: existing.count + 1,
          total: existing.total + order.total
        });
      });

      // Convert to array and sort by month
      monthMap.forEach((value, key) => {
        ordersByMonth.push({
          month: key,
          count: value.count,
          total: value.total
        });
      });

      ordersByMonth.sort((a, b) => b.month.localeCompare(a.month));

      const summary: OrderHistorySummary = {
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate,
        ordersByStatus,
        ordersByMonth: ordersByMonth.slice(0, 12) // Last 12 months
      };

      return { success: true, summary };

    } catch (error: any) {
      log.error('Error fetching user order summary', 'OrderHistoryService', error);
      trackError(error, 'OrderHistoryService.getUserOrderSummary');
      return { success: false, error: error.message || 'Failed to fetch order summary' };
    }
  }

  /**
   * Get a specific order by ID for the user
   */
  async getUserOrder(
    userEmail: string,
    orderId: string
  ): Promise<{ success: boolean; order?: OrderHistoryItem; error?: string }> {
    try {
      log.info('Fetching user order', 'OrderHistoryService', { userEmail, orderId });

      const whereConditions: any = {
        id: orderId,
        customerEmail: userEmail
      };

      const query = await db.queryOnce({
        orders: {
          $: {
            where: whereConditions
          },
          orderitems: {}
        }
      });

      const orders = query.orders || [];

      if (orders.length === 0) {
        return { success: false, error: 'Order not found or access denied' };
      }

      const order = orders[0];
      const orderHistory: OrderHistoryItem = {
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined
      };

      return { success: true, order: orderHistory };

    } catch (error: any) {
      log.error('Error fetching user order', 'OrderHistoryService', error);
      trackError(error, 'OrderHistoryService.getUserOrder');
      return { success: false, error: error.message || 'Failed to fetch order' };
    }
  }

  /**
   * Search orders by order number or customer name
   */
  async searchUserOrders(
    userEmail: string,
    searchQuery: string,
    limit?: number
  ): Promise<{ success: boolean; orders?: OrderHistoryItem[]; error?: string }> {
    try {
      log.info('Searching user orders', 'OrderHistoryService', { userEmail, searchQuery });

      const result = await this.getUserOrderHistory(userEmail, {
        search: searchQuery
      }, limit);

      return result;

    } catch (error: any) {
      log.error('Error searching user orders', 'OrderHistoryService', error);
      trackError(error, 'OrderHistoryService.searchUserOrders');
      return { success: false, error: error.message || 'Failed to search orders' };
    }
  }

  /**
   * Get recent orders for quick access
   */
  async getRecentUserOrders(
    userEmail: string,
    limit: number = 5
  ): Promise<{ success: boolean; orders?: OrderHistoryItem[]; error?: string }> {
    try {
      return await this.getUserOrderHistory(userEmail, undefined, limit);
    } catch (error: any) {
      log.error('Error fetching recent user orders', 'OrderHistoryService', error);
      return { success: false, error: error.message || 'Failed to fetch recent orders' };
    }
  }
}

// Export singleton instance
export const orderHistoryService = new OrderHistoryService();
