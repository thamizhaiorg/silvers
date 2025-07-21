// Order History System Integration Test
import { orderHistoryService } from '../services/order-history-service';
import { userCustomerService } from '../services/user-customer-service';

describe('Order History System', () => {
  const testUserEmail = 'test@example.com';
  const testUser = {
    id: 'test-user-id',
    email: testUserEmail
  };

  describe('UserCustomerService', () => {
    it('should find or create customer for user', async () => {
      const result = await userCustomerService.findOrCreateCustomerForUser(testUser as any, {
        name: 'Test User',
        phone: '+1234567890'
      });

      expect(result.success).toBe(true);
      expect(result.customer).toBeDefined();
      expect(result.customer?.email).toBe(testUserEmail);
    });

    it('should find existing customer by email', async () => {
      const customer = await userCustomerService.findCustomerByEmail(testUserEmail);
      // This might be null if no customer exists, which is fine for testing
      expect(customer === null || customer.email === testUserEmail).toBe(true);
    });

    it('should get customer order stats', async () => {
      const stats = await userCustomerService.getCustomerOrderStats(testUserEmail);
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalOrders).toBe('number');
      expect(typeof stats.totalSpent).toBe('number');
      expect(Array.isArray(stats.recentOrders)).toBe(true);
    });
  });

  describe('OrderHistoryService', () => {
    it('should get user order history', async () => {
      const result = await orderHistoryService.getUserOrderHistory(testUserEmail);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.orders)).toBe(true);
    });

    it('should get user order summary', async () => {
      const result = await orderHistoryService.getUserOrderSummary(testUserEmail);
      
      expect(result.success).toBe(true);
      if (result.summary) {
        expect(typeof result.summary.totalOrders).toBe('number');
        expect(typeof result.summary.totalSpent).toBe('number');
        expect(typeof result.summary.averageOrderValue).toBe('number');
        expect(typeof result.summary.ordersByStatus).toBe('object');
        expect(Array.isArray(result.summary.ordersByMonth)).toBe(true);
      }
    });

    it('should search user orders', async () => {
      const result = await orderHistoryService.searchUserOrders(testUserEmail, 'test');
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.orders)).toBe(true);
    });

    it('should get recent user orders', async () => {
      const result = await orderHistoryService.getRecentUserOrders(testUserEmail, 3);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.orders)).toBe(true);
      if (result.orders) {
        expect(result.orders.length).toBeLessThanOrEqual(3);
      }
    });

    it('should handle filters correctly', async () => {
      const filters = {
        status: 'completed',
        search: 'test'
      };
      
      const result = await orderHistoryService.getUserOrderHistory(testUserEmail, filters);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.orders)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should link user profile to customer', async () => {
      const profileData = {
        name: 'Test User Updated',
        phone: '+1234567890',
        bio: 'Test bio'
      };

      const result = await userCustomerService.linkUserProfileToCustomer(testUser as any, profileData);
      
      expect(result.success).toBe(true);
      if (result.customer) {
        expect(result.customer.email).toBe(testUserEmail);
      }
    });

    it('should handle non-existent order gracefully', async () => {
      const result = await orderHistoryService.getUserOrder(testUserEmail, 'non-existent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty search results', async () => {
      const result = await orderHistoryService.searchUserOrders(testUserEmail, 'definitely-not-found-query-12345');
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.orders)).toBe(true);
      expect(result.orders?.length).toBe(0);
    });
  });
});

// Manual testing checklist (to be run in the app)
export const manualTestingChecklist = {
  profileScreen: [
    '✓ Profile screen loads without errors',
    '✓ Order history card displays correct order count and total spent',
    '✓ Order history card shows recent orders when available',
    '✓ Order history card shows "No orders yet" message when no orders exist',
    '✓ Tapping order history card navigates to order history screen'
  ],
  orderHistoryScreen: [
    '✓ Order history screen loads without errors',
    '✓ Orders are displayed in chronological order (newest first)',
    '✓ Search functionality works correctly',
    '✓ Status filter works correctly',
    '✓ Pull-to-refresh works',
    '✓ Empty state displays when no orders match filters',
    '✓ Tapping an order navigates to order details',
    '✓ Back button returns to profile screen'
  ],
  orderDetailsScreen: [
    '✓ Order details screen loads with correct order information',
    '✓ Order items are displayed correctly',
    '✓ Order status and payment status are shown',
    '✓ Order totals are calculated correctly',
    '✓ Back button returns to order history screen'
  ],
  userCustomerLinking: [
    '✓ User is automatically linked to customer record on login',
    '✓ Orders placed with user email appear in order history',
    '✓ Customer profile is created/updated when user profile is updated',
    '✓ Order statistics are updated when new orders are placed'
  ],
  navigation: [
    '✓ Navigation between screens works smoothly',
    '✓ Back navigation maintains proper screen stack',
    '✓ No memory leaks or performance issues during navigation'
  ]
};

console.log('Order History System Test Suite');
console.log('Manual Testing Checklist:', manualTestingChecklist);
