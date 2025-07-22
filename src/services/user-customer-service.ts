// User-Customer relationship service
import { db } from '../lib/instant';
import { log, trackError } from '../lib/logger';
import { id } from '@instantdb/react-native';
import { User } from '@instantdb/react-native';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  addresses?: any[];
  defaultAddress?: any;
  lastOrderDate?: Date;
  totalOrders?: number;
  totalSpent?: number;
  notes?: string;
  tags?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserCustomerProfile {
  userId: string;
  customerId?: string;
  email: string;
  isLinked: boolean;
  linkedAt?: Date;
}

export class UserCustomerService {
  
  /**
   * Find or create a customer record for the authenticated user
   */
  async findOrCreateCustomerForUser(user: User, profileData?: {
    name?: string;
    phone?: string;
  }): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    try {
      if (!user.email) {
        return { success: false, error: 'User email is required' };
      }

      log.info('Finding or creating customer for user', 'UserCustomerService', {
        userId: user.id,
        email: user.email
      });

      // First, try to find existing customer by email
      const existingCustomer = await this.findCustomerByEmail(user.email);

      if (existingCustomer) {
        log.info('Found existing customer', 'UserCustomerService', { customerId: existingCustomer.id });
        return { success: true, customer: existingCustomer };
      }

      // Create new customer record
      const customerData = {
        name: profileData?.name || user.email.split('@')[0], // Use email prefix as default name
        email: user.email,
        phone: profileData?.phone,
        createdAt: new Date(),
        totalOrders: 0,
        totalSpent: 0,
      };

      const customerId = id();

      await db.transact([
        db.tx.customers[customerId].update(customerData)
      ]);

      const newCustomer: Customer = {
        id: customerId,
        ...customerData
      };

      log.info('Created new customer for user', 'UserCustomerService', { 
        customerId, 
        userId: user.id 
      });

      return { success: true, customer: newCustomer };

    } catch (error: any) {
      log.error('Error finding or creating customer for user', 'UserCustomerService', error);
      trackError(error, 'UserCustomerService.findOrCreateCustomerForUser');
      return { success: false, error: error.message || 'Failed to find or create customer' };
    }
  }

  /**
   * Find customer by email address
   */
  async findCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      // Query customers by email using InstantDB
      const whereConditions = {
        email: email
      };

      const query = await db.queryOnce({
        customers: {
          $: {
            where: whereConditions,
            limit: 1
          }
        }
      });

      const customers = query.customers || [];

      if (customers.length > 0) {
        const customer = customers[0];
        return {
          ...customer,
          createdAt: new Date(customer.createdAt),
          updatedAt: customer.updatedAt ? new Date(customer.updatedAt) : undefined,
          lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : undefined
        };
      }

      return null;
    } catch (error: any) {
      log.error('Error finding customer by email', 'UserCustomerService', error);
      return null;
    }
  }

  /**
   * Update customer profile information
   */
  async updateCustomerProfile(customerId: string, updates: {
    name?: string;
    phone?: string;
    notes?: string;
    defaultAddress?: any;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      log.info('Updating customer profile', 'UserCustomerService', { customerId, updates });

      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await db.transact([
        db.tx.customers[customerId].update(updateData)
      ]);

      return { success: true };
    } catch (error: any) {
      log.error('Error updating customer profile', 'UserCustomerService', error);
      trackError(error, 'UserCustomerService.updateCustomerProfile');
      return { success: false, error: error.message || 'Failed to update customer profile' };
    }
  }

  /**
   * Get customer order statistics
   */
  async getCustomerOrderStats(customerEmail: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: Date;
    recentOrders: any[];
  }> {
    try {
      // Query orders by customer email
      const whereConditions = {
        customerEmail: customerEmail
      };

      const query = await db.queryOnce({
        orders: {
          $: {
            where: whereConditions,
            order: {
              createdAt: 'desc'
            }
          }
        }
      });

      const orders = query.orders || [];

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const lastOrderDate = orders.length > 0 ? new Date(orders[0].createdAt) : undefined;
      const recentOrders = orders.slice(0, 5); // Get 5 most recent orders

      return {
        totalOrders,
        totalSpent,
        lastOrderDate,
        recentOrders
      };
    } catch (error: any) {
      log.error('Error getting customer order stats', 'UserCustomerService', error);
      return {
        totalOrders: 0,
        totalSpent: 0,
        recentOrders: []
      };
    }
  }

  /**
   * Update customer order statistics after a new order
   */
  async updateCustomerOrderStats(customerEmail: string): Promise<void> {
    try {
      const customer = await this.findCustomerByEmail(customerEmail);
      if (!customer) return;

      const stats = await this.getCustomerOrderStats(customerEmail);

      await db.transact([
        db.tx.customers[customer.id].update({
          totalOrders: stats.totalOrders,
          totalSpent: stats.totalSpent,
          lastOrderDate: stats.lastOrderDate,
          updatedAt: new Date()
        })
      ]);

      log.info('Updated customer order stats', 'UserCustomerService', {
        customerId: customer.id,
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent
      });
    } catch (error: any) {
      log.error('Error updating customer order stats', 'UserCustomerService', error);
    }
  }

  /**
   * Link user profile data to customer record
   */
  async linkUserProfileToCustomer(user: User, profileData: {
    name?: string;
    phone?: string;
  }): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    try {
      if (!user.email) {
        return { success: false, error: 'User email is required' };
      }

      // Find or create customer
      const result = await this.findOrCreateCustomerForUser(user, {
        name: profileData.name,
        phone: profileData.phone
      });

      if (!result.success || !result.customer) {
        return result;
      }

      // Update customer with profile data
      const updateResult = await this.updateCustomerProfile(result.customer.id, {
        name: profileData.name,
        phone: profileData.phone
      });

      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }

      return { success: true, customer: result.customer };
    } catch (error: any) {
      log.error('Error linking user profile to customer', 'UserCustomerService', error);
      trackError(error, 'UserCustomerService.linkUserProfileToCustomer');
      return { success: false, error: error.message || 'Failed to link user profile to customer' };
    }
  }
}

// Export singleton instance
export const userCustomerService = new UserCustomerService();
