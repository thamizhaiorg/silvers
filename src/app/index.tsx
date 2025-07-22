import React, { useState, useEffect, useCallback } from "react";
import { Text, View, BackHandler } from "react-native";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";
import AuthScreen from "../screens/auth";
import ProductsScreen from "../components/products";
import CollectionsScreen from "../components/collections";
import ProfileScreen from "../screens/profile";


import AddressManagementScreen from "../screens/address-management";
import AddressForm from "../components/address-form";
import CheckoutScreen from "../components/checkout";
import AddressSelector from "../components/address-selector";
import CategoryProductsScreen from "../components/category-products";
import ProductDetailsScreen from "../components/product-details";
import BottomNavigation, { BottomTabScreen } from "../components/nav";
import CartScreen from "../components/cart";

import ErrorBoundary from "../components/ui/error-boundary";


type Screen =
  | 'products'
  | 'collections'
  | 'cart'
  | 'profile'
  | 'address-management'
  | 'address-form'
  | 'checkout'
  | 'address-selector'
  | 'category'
  | 'product-details';

interface NavigationData {
  categoryId?: string;
  categoryName?: string;
  product?: any;
  [key: string]: unknown;
}

export default function Page() {
  const { user, isLoading } = useAuth();
  const { itemCount } = useCart();
  // Always start with products screen as the home screen
  const [currentScreen, setCurrentScreen] = useState<Screen>('products');


  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);

  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [checkoutAddress, setCheckoutAddress] = useState<any | null>(null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  // Bottom navigation state
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTabScreen>('home');







  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // For screens other than products, go back to products
      if (currentScreen !== 'products') {
        setCurrentScreen('products');
        setNavigationData(null);
        return true;
      }

      // If on products screen, allow default back behavior (exit app)
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [currentScreen]);





  const handleCategoryNavigation = useCallback((categoryId: string, categoryName?: string) => {
    setNavigationData({ categoryId, categoryName });
    setCurrentScreen('category');
  }, []);

  const handleProductNavigation = useCallback((product: any) => {
    setNavigationData({ product });
    setCurrentScreen('product-details');
  }, []);

  const handleNavigate = useCallback((screen: Screen, data?: any) => {
    setCurrentScreen(screen);
    setNavigationData(data); // Store the navigation data
  }, []);

  // Handle bottom tab navigation
  const handleBottomTabPress = useCallback((tab: BottomTabScreen) => {
    setActiveBottomTab(tab);

    // Map bottom tabs to screens
    switch (tab) {
      case 'home':
        handleNavigate('products');
        break;
      case 'collections':
        handleNavigate('collections');
        break;
      case 'cart':
        handleNavigate('cart');
        break;
      case 'profile':
        handleNavigate('profile');
        break;
    }
  }, [handleNavigate]);

  const renderMainContent = () => {



    // Otherwise render the main screens (default untoggled state)
    switch (currentScreen) {
      case 'products':
        return <ProductsScreen
          onClose={() => {}} // No-op since products is now the home screen
          onNavigateToCart={() => handleNavigate('cart')}
          onNavigateToCategory={handleCategoryNavigation}
          onNavigateToProduct={handleProductNavigation}
        />;
      case 'collections':
        return <CollectionsScreen
          onClose={() => handleNavigate('products')}
        />;
      case 'cart':
        return <CartScreen
          onClose={() => handleNavigate('products')}
          onCheckout={() => handleNavigate('checkout')}
        />;

      case 'profile':
        return <ProfileScreen
          onClose={() => handleNavigate('products')}
          onNavigateToAddresses={() => handleNavigate('address-management')}
        />;


      case 'address-management':
        return <AddressManagementScreen
          onClose={() => handleNavigate('profile')}
          onAddAddress={() => {
            setSelectedAddress(null);
            handleNavigate('address-form');
          }}
          onEditAddress={(address) => {
            setSelectedAddress(address);
            handleNavigate('address-form');
          }}
        />;
      case 'address-form':
        return <AddressForm
          onClose={() => handleNavigate('address-management')}
          onSave={() => handleNavigate('address-management')}
          address={selectedAddress}
          isEditing={!!selectedAddress}
        />;
      case 'checkout':
        return (
          <>
            <CheckoutScreen
              onClose={() => handleNavigate('cart')}
              onSuccess={(orderId) => {
                handleNavigate('products');
                // Could navigate to order confirmation screen here
              }}
              onAddressSelect={() => setShowAddressSelector(true)}
              selectedAddress={checkoutAddress}
              onAddressChange={setCheckoutAddress}
            />
            <AddressSelector
              visible={showAddressSelector}
              onClose={() => setShowAddressSelector(false)}
              onSelectAddress={(address) => {
                setCheckoutAddress(address);
                setShowAddressSelector(false);
              }}
              onAddNewAddress={() => {
                setShowAddressSelector(false);
                setSelectedAddress(null);
                handleNavigate('address-form');
              }}
              selectedAddress={checkoutAddress}
            />
          </>
        );
      case 'category':
        return <CategoryProductsScreen
          categoryId={navigationData?.categoryId || ''}
          categoryName={navigationData?.categoryName}
          onClose={() => handleNavigate('products')}
          onNavigateToProduct={handleProductNavigation}
        />;
      case 'product-details':
        return navigationData?.product ? (
          <ProductDetailsScreen
            product={navigationData.product}
            onClose={() => handleNavigate('products')}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text>Product not found</Text>
          </View>
        );
      // All other cases default to products screen
      default:
        return <ProductsScreen
          onClose={() => {}} // No-op since products is now the home screen
          onNavigateToCart={() => handleNavigate('cart')}
        />;
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  // Show auth screen if user is not authenticated
  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <ErrorBoundary>
      <View className="flex-1">
        {/* All screens are now full-screen without header */}
        <ErrorBoundary>
          {renderMainContent()}
        </ErrorBoundary>
        {/* Bottom Navigation for main tab screens only */}
        {(currentScreen === 'products' || currentScreen === 'collections' || currentScreen === 'cart' || currentScreen === 'profile') && (
          <BottomNavigation
            activeTab={activeBottomTab}
            onTabPress={handleBottomTabPress}
            cartItemCount={itemCount}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}




