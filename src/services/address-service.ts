import { db } from '../lib/instant';
import { id } from '@instantdb/react-native';
import { log } from '../lib/logger';

export interface Address {
  id: string;
  userId: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateAddressData {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}

class AddressService {
  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId: string): Promise<{ success: boolean; addresses?: Address[]; error?: string }> {
    try {
      log.info('Fetching user addresses', 'AddressService', { userId });

      // Use queryOnce for one-time data fetch
      const query = await db.queryOnce({
        addresses: {
          $: {
            where: {
              userId: userId
            }
          }
        }
      });

      const addresses = query.addresses || [];

      log.info('Successfully fetched user addresses', 'AddressService', {
        userId,
        count: addresses.length
      });

      return { success: true, addresses };
    } catch (error: any) {
      log.error('Error fetching user addresses', 'AddressService', error);
      return { success: false, error: error.message || 'Failed to fetch addresses' };
    }
  }

  /**
   * Create a new address for a user
   */
  async createAddress(userId: string, addressData: CreateAddressData): Promise<{ success: boolean; address?: Address; error?: string }> {
    try {
      log.info('Creating new address', 'AddressService', { userId, addressData });

      // If this is set as default, unset other default addresses first
      if (addressData.isDefault) {
        await this.unsetDefaultAddresses(userId);
      }

      const newId = id();
      const timestamp = new Date();

      const address: Address = {
        id: newId,
        userId,
        name: addressData.name,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        country: addressData.country || 'United States',
        phone: addressData.phone,
        isDefault: addressData.isDefault || false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await db.transact([
        db.tx.addresses[newId].update(address)
      ]);

      log.info('Successfully created address', 'AddressService', { addressId: newId, userId });
      return { success: true, address };
    } catch (error: any) {
      log.error('Error creating address', 'AddressService', error);
      return { success: false, error: error.message || 'Failed to create address' };
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressId: string, updates: Partial<CreateAddressData>): Promise<{ success: boolean; error?: string }> {
    try {
      log.info('Updating address', 'AddressService', { addressId, updates });

      // If setting as default, unset other default addresses for this user first
      if (updates.isDefault) {
        // First get the address to find the userId
        const query = await db.queryOnce({
          addresses: {
            $: {
              where: {
                id: addressId
              },
              limit: 1
            }
          }
        });

        const address = query.addresses?.[0];

        if (address) {
          await this.unsetDefaultAddresses(address.userId);
        }
      }

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await db.transact([
        db.tx.addresses[addressId].update(updateData)
      ]);

      log.info('Successfully updated address', 'AddressService', { addressId });
      return { success: true };
    } catch (error: any) {
      log.error('Error updating address', 'AddressService', error);
      return { success: false, error: error.message || 'Failed to update address' };
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<{ success: boolean; error?: string }> {
    try {
      log.info('Deleting address', 'AddressService', { addressId });

      await db.transact([
        db.tx.addresses[addressId].delete()
      ]);

      log.info('Successfully deleted address', 'AddressService', { addressId });
      return { success: true };
    } catch (error: any) {
      log.error('Error deleting address', 'AddressService', error);
      return { success: false, error: error.message || 'Failed to delete address' };
    }
  }

  /**
   * Set an address as default (unsets other defaults)
   */
  async setDefaultAddress(addressId: string): Promise<{ success: boolean; error?: string }> {
    try {
      log.info('Setting default address', 'AddressService', { addressId });

      // First get the address to find the userId
      const query = await db.queryOnce({
        addresses: {
          $: {
            where: {
              id: addressId
            },
            limit: 1
          }
        }
      });

      const address = query.addresses?.[0];
      
      if (!address) {
        return { success: false, error: 'Address not found' };
      }

      // Unset other default addresses for this user
      await this.unsetDefaultAddresses(address.userId);

      // Set this address as default
      await db.transact([
        db.tx.addresses[addressId].update({
          isDefault: true,
          updatedAt: new Date(),
        })
      ]);

      log.info('Successfully set default address', 'AddressService', { addressId });
      return { success: true };
    } catch (error: any) {
      log.error('Error setting default address', 'AddressService', error);
      return { success: false, error: error.message || 'Failed to set default address' };
    }
  }

  /**
   * Get the default address for a user
   */
  async getDefaultAddress(userId: string): Promise<{ success: boolean; address?: Address; error?: string }> {
    try {
      log.info('Fetching default address', 'AddressService', { userId });

      // Use queryOnce for one-time data fetch
      const query = await db.queryOnce({
        addresses: {
          $: {
            where: {
              userId: userId,
              isDefault: true
            },
            limit: 1
          }
        }
      });

      const address = query.addresses?.[0];

      log.info('Successfully fetched default address', 'AddressService', {
        userId,
        hasDefault: !!address
      });

      return { success: true, address };
    } catch (error: any) {
      log.error('Error fetching default address', 'AddressService', error);
      return { success: false, error: error.message || 'Failed to fetch default address' };
    }
  }

  /**
   * Private method to unset all default addresses for a user
   */
  private async unsetDefaultAddresses(userId: string): Promise<void> {
    try {
      // Use queryOnce to find default addresses
      const query = await db.queryOnce({
        addresses: {
          $: {
            where: {
              userId: userId,
              isDefault: true
            }
          }
        }
      });

      const defaultAddresses = query.addresses || [];

      if (defaultAddresses.length > 0) {
        const transactions = defaultAddresses.map(addr =>
          db.tx.addresses[addr.id].update({
            isDefault: false,
            updatedAt: new Date(),
          })
        );

        await db.transact(transactions);
      }
    } catch (error) {
      log.error('Error unsetting default addresses', 'AddressService', error);
      throw error;
    }
  }
}

export const addressService = new AddressService();
