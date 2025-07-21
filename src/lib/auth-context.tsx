import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@instantdb/react-native';
import { db } from './instant';
import { id } from '@instantdb/react-native';
import { userCustomerService, Customer } from '../services/user-customer-service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  peopleaProfile: PeopleaProfile | null;
  createPeopleaProfile: (data: Partial<PeopleaProfile>) => Promise<void>;
  updatePeopleaProfile: (data: Partial<PeopleaProfile>) => Promise<void>;
  customerProfile: Customer | null;
  linkUserToCustomer: (storeId: string) => Promise<void>;
}

interface PeopleaProfile {
  id: string;
  userId: string;
  name?: string;
  profileImage?: string;
  phone?: string;
  bio?: string;
  createdAt: Date;
  updatedAt?: Date;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading, user, error } = db.useAuth();
  const [peopleaProfile, setPeopleaProfile] = useState<any | null>(null);
  const [customerProfile, setCustomerProfile] = useState<Customer | null>(null);

  // Query peoplea profile when user is authenticated
  const { data: peopleaData } = db.useQuery(
    user ? {
      peoplea: {
        $: {
          where: {
            userId: user.id,
          },
        },
      },
    } : null
  );

  // Update peoplea profile when data changes
  useEffect(() => {
    if (peopleaData?.peoplea && peopleaData.peoplea.length > 0) {
      setPeopleaProfile(peopleaData.peoplea[0]);
    } else {
      setPeopleaProfile(null);
    }
  }, [peopleaData]);

  // Note: linkUserToCustomer is now called manually with storeId from components

  const linkUserToCustomer = async (storeId: string) => {
    if (!user || !user.email || !storeId) return;

    try {
      const result = await userCustomerService.findOrCreateCustomerForUser(user, {
        name: peopleaProfile?.name,
        phone: peopleaProfile?.phone
      }, storeId);

      if (result.success && result.customer) {
        setCustomerProfile(result.customer);
      }
    } catch (error) {
      console.error('Error linking user to customer:', error);
    }
  };

  const signOut = async () => {
    try {
      await db.auth.signOut();
      setPeopleaProfile(null);
    } catch (error) {
      throw error;
    }
  };

  const createPeopleaProfile = async (data: Partial<PeopleaProfile>) => {
    if (!user) {
      throw new Error('User must be authenticated to create profile');
    }

    try {
      const profileId = id();
      const now = new Date();
      
      const profileData = {
        userId: user.id,
        name: data.name || '',
        profileImage: data.profileImage || '',
        phone: data.phone || '',
        bio: data.bio || '',
        createdAt: now.getTime(),
        updatedAt: now.getTime(),
      };

      await db.transact([
        db.tx.peoplea[profileId].update(profileData)
      ]);

      // The profile will be automatically updated through the query
    } catch (error) {
      throw error;
    }
  };

  const updatePeopleaProfile = async (data: Partial<PeopleaProfile>) => {
    if (!user || !peopleaProfile) {
      throw new Error('User must be authenticated and have a profile to update');
    }

    try {
      const updateData = {
        ...data,
        updatedAt: new Date().getTime(),
      };

      await db.transact([
        db.tx.peoplea[peopleaProfile.id].update(updateData)
      ]);

      // The profile will be automatically updated through the query
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error: error?.message || null,
    signOut,
    peopleaProfile,
    createPeopleaProfile,
    updatePeopleaProfile,
    customerProfile,
    linkUserToCustomer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { PeopleaProfile };
