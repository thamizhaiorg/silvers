import { useState } from 'react';
import { Alert } from 'react-native';
import { db, id } from '../lib/instant';
import { useAuth } from '../lib/auth-context';

export function useFavorites() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Query user's favorites
  const { data: favoritesData } = db.useQuery({
    favorites: {
      $: {
        where: {
          userId: user?.id || '',
        }
      }
    }
  });

  const favorites = favoritesData?.favorites || [];
  const favoriteProductIds = favorites.map(fav => fav.productId);

  // Check if a product is favorited
  const isFavorited = (productId: string) => {
    return favoriteProductIds.includes(productId);
  };

  // Toggle favorite status
  const toggleFavorite = async (productId: string, productTitle?: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add favorites');
      return;
    }

    setIsLoading(true);
    try {
      const existingFavorite = favorites.find(fav => fav.productId === productId);
      
      if (existingFavorite) {
        // Remove from favorites
        await db.transact(db.tx.favorites[existingFavorite.id].delete());
      } else {
        // Add to favorites
        const favoriteId = id();
        await db.transact(
          db.tx.favorites[favoriteId].update({
            productId,
            userId: user.id,
            createdAt: new Date(),
          })
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  // Add to favorites
  const addToFavorites = async (productId: string, productTitle?: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add favorites');
      return;
    }

    if (isFavorited(productId)) {
      return; // Already favorited
    }

    setIsLoading(true);
    try {
      const favoriteId = id();
      await db.transact(
        db.tx.favorites[favoriteId].update({
          productId,
          userId: user.id,
          createdAt: new Date(),
        })
      );
    } catch (error) {
      console.error('Error adding to favorites:', error);
      Alert.alert('Error', 'Failed to add to favorites');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (productId: string) => {
    if (!user) return;

    const existingFavorite = favorites.find(fav => fav.productId === productId);
    if (!existingFavorite) return;

    setIsLoading(true);
    try {
      await db.transact(db.tx.favorites[existingFavorite.id].delete());
    } catch (error) {
      console.error('Error removing from favorites:', error);
      Alert.alert('Error', 'Failed to remove from favorites');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    favorites,
    favoriteProductIds,
    favoritesCount: favorites.length,
    isFavorited,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    isLoading,
  };
}