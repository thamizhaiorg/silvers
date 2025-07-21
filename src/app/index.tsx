import React, { useState, useEffect, useCallback, useRef } from "react";
import { Text, View, TouchableOpacity, BackHandler, Alert } from "react-native";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";
import AuthScreen from "../screens/auth";
import ProductsScreen from "../components/products";
import ProductFormScreen from "../components/prod-form";
import CollectionsScreen from "../components/collections";
import CollectionFormScreen from "../components/col-form";
import ProductsManagementScreen from "../components/prod-mgmt";
import CollectionsManagementScreen from "../components/col-mgmt";
import SquarePOS from "../components/square-pos";
import ReportsScreen from "../components/reports";
import ItemStock from "../components/item-stock";
import Options from "../components/options";
import MetafieldsSystem from "../components/metafields-system";
import Locations from "../components/locations";
import ItemsScreen from "../components/items";
import FilesScreen from "../components/files";
import ProfileScreen from "../screens/profile";
import OrderHistoryScreen from "../screens/order-history";
import OrderDetails from "../components/order-details";
import OrderHistoryDebug from "../components/order-history-debug";
import AddressManagementScreen from "../screens/address-management";
import AddressForm from "../components/address-form";
import CheckoutScreen from "../components/checkout";
import AddressSelector from "../components/address-selector";
import CategoryProductsScreen from "../components/category-products";

import BottomNavigation, { BottomTabScreen } from "../components/nav";
import CartScreen from "../components/cart";

import { StoreProvider } from "../lib/store-context";
import { log, trackError } from "../lib/logger";
import { Product, Collection, Item } from "../lib/instant";
import ErrorBoundary from "../components/ui/error-boundary";


type Screen =
  | 'sales'
  | 'reports'
  | 'products'
  | 'collections'
  | 'cart'
  | 'options'
  | 'metafields'
  | 'menu'
  | 'option-create'
  | 'option-edit'
  | 'items'
  | 'locations'
  | 'files'
  | 'profile'
  | 'order-history'
  | 'order-details'
  | 'order-debug'
  | 'address-management'
  | 'address-form'
  | 'checkout'
  | 'address-selector'
  | 'category';

interface NavigationData {
  productId?: string;
  product?: Product;
  categoryId?: string;
  categoryName?: string;
  [key: string]: unknown;
}

interface NavigationState {
  screen: Screen;
  showManagement: boolean;
  data?: NavigationData;
}

export default function Page() {
  const { user, isLoading } = useAuth();
  const { itemCount } = useCart();
  // Always start with products screen as the home screen
  const [currentScreen, setCurrentScreen] = useState<Screen>('products');
  const [isGridView, setIsGridView] = useState(false); // false = list view (default), true = grid view
  const [showManagement, setShowManagement] = useState(false); // false = product/collection list (default), true = management screen
  const [productFormProduct, setProductFormProduct] = useState<Product | null>(null); // Track product being edited in form
  const [isProductFormOpen, setIsProductFormOpen] = useState(false); // Track if product form is open
  const [productFormHasChanges, setProductFormHasChanges] = useState(false); // Track if product form has unsaved changes
  const [collectionFormCollection, setCollectionFormCollection] = useState<Collection | null>(null); // Track collection being edited in form
  const [isCollectionFormOpen, setIsCollectionFormOpen] = useState(false); // Track if collection form is open
  const [isItemStockOpen, setIsItemStockOpen] = useState(false); // Track if item stock screen is open
  const [itemStockItem, setItemStockItem] = useState<Item | null>(null); // Track item being managed in stock screen
  const [optionSetData, setOptionSetData] = useState<{id?: string, name?: string}>({});
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [checkoutAddress, setCheckoutAddress] = useState<any | null>(null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  // Bottom navigation state
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTabScreen>('home');

  // Navigation stack to track navigation history - always start with products screen
  const [navigationStack, setNavigationStack] = useState<NavigationState[]>([{
    screen: 'products',
    showManagement: false
  }]);



  // Function to go back using navigation stack
  const handleGoBack = useCallback(() => {
    if (navigationStack.length > 1) {
      // Remove current state and get previous state
      const newStack = [...navigationStack];
      newStack.pop(); // Remove current state
      const previousState = newStack[newStack.length - 1];

      if (previousState) {
        // Restore previous state
        setCurrentScreen(previousState.screen);
        setShowManagement(previousState.showManagement);
        if (previousState.data) {
          setOptionSetData(previousState.data);
        }
        // Clear navigation data when going back
        setNavigationData(null);

        // Update navigation stack
        setNavigationStack(newStack);
        return true;
      }
    }
    return false;
  }, [navigationStack]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // If product form is open, let it handle the back button
      if (isProductFormOpen) {
        return false; // Let the product form's back handler take over
      }

      // If collection form is open, close it and go back to previous screen
      if (isCollectionFormOpen) {
        setCollectionFormCollection(null);
        setIsCollectionFormOpen(false);
        return true;
      }

      // If item stock screen is open, close it
      if (isItemStockOpen) {
        closeItemStock();
        return true;
      }

      // If in management view, go back to list view
      if (showManagement && (currentScreen === 'products' || currentScreen === 'collections')) {
        setShowManagement(false);
        return true;
      }

      // Bottom navigation removed

      // For full-screen screens, handle back navigation based on context
      if (currentScreen === 'options' || currentScreen === 'metafields' || currentScreen === 'items' || currentScreen === 'locations' || currentScreen === 'files') {
        // If items screen was opened from product form, go back to product form
        if (currentScreen === 'items' && navigationData?.productId) {
          // Use the full product object if available, otherwise find by ID
          const productToOpen = navigationData.product || { id: navigationData.productId };
          setCurrentScreen('products'); // This will be handled by opening the product form
          setIsProductFormOpen(true);
          setProductFormProduct(productToOpen);
          setNavigationData(null);
          return true;
        }
        // For other screens or items without product context, go to products screen
        setCurrentScreen('products');
        setNavigationData(null);
        return true;
      }

      // For screens other than products, go back to products
      if (currentScreen !== 'products') {
        const didGoBack = handleGoBack();
        if (didGoBack) {
          return true;
        }
        // If no navigation history, go to products
        setCurrentScreen('products');
        setShowManagement(false);
        return true;
      }

      // If on products screen and no navigation history, allow default back behavior (exit app)
      if (currentScreen === 'products') {
        return false;
      }

      // Fallback: if navigation stack is empty or failed, go to products
      setCurrentScreen('products');
      setShowManagement(false);
      setNavigationData(null);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [currentScreen, showManagement, isProductFormOpen, isCollectionFormOpen, isItemStockOpen, handleGoBack, closeItemStock]);

  // Form handlers
  const openProductForm = useCallback((product?: any) => {
    setProductFormProduct(product || null);
    setIsProductFormOpen(true);
  }, []);

  const closeProductForm = useCallback(() => {
    setProductFormProduct(null);
    setIsProductFormOpen(false);
    setProductFormHasChanges(false);
  }, []);

  const openCollectionForm = useCallback((collection?: any) => {
    setCollectionFormCollection(collection || null);
    setIsCollectionFormOpen(true);
  }, []);

  const closeCollectionForm = useCallback(() => {
    setCollectionFormCollection(null);
    setIsCollectionFormOpen(false);
  }, []);

  const openItemStock = useCallback((item?: any) => {
    setItemStockItem(item || null);
    setIsItemStockOpen(true);
  }, []);

  const closeItemStock = useCallback(() => {
    setItemStockItem(null);
    setIsItemStockOpen(false);
  }, []);

  const handleCategoryNavigation = useCallback((categoryId: string, categoryName?: string) => {
    setNavigationData({ categoryId, categoryName });
    setCurrentScreen('category');
  }, []);

  const handleNavigate = useCallback((screen: Screen, data?: any) => {
    // If navigating from product form, close it first
    if (isProductFormOpen) {
      setProductFormProduct(null);
      setIsProductFormOpen(false);
      setProductFormHasChanges(false);
    }

    // If navigating from collection form, close it first
    if (isCollectionFormOpen) {
      setCollectionFormCollection(null);
      setIsCollectionFormOpen(false);
    }

    // Always redirect 'menu' navigation to products screen
    if (screen === 'menu') {
      screen = 'products';
    }

    // Save current state to navigation stack before navigating
    const currentState: NavigationState = {
      screen: currentScreen,
      showManagement,
      data: optionSetData
    };

    setCurrentScreen(screen);
    setNavigationData(data); // Store the navigation data

    // Reset management view when navigating to products/collections
    if (screen === 'products' || screen === 'collections') {
      setShowManagement(false);
    }
    // Handle option screen data
    if (screen === 'option-create' || screen === 'option-edit') {
      setOptionSetData(data || {});
    }

    // Add current state to navigation stack (but avoid duplicates of the same screen)
    setNavigationStack(prev => {
      const lastState = prev[prev.length - 1];
      if (lastState?.screen !== currentScreen) {
        return [...prev, currentState];
      }
      return prev;
    });
  }, [currentScreen, showManagement, optionSetData, isProductFormOpen, isCollectionFormOpen]);

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
    // If product form is open, render it full screen
    if (isProductFormOpen) {
      return (
        <ProductFormScreen
          product={productFormProduct}
          onClose={closeProductForm}
          onSave={() => {
            // Refresh will happen automatically due to real-time updates
          }}
          onNavigate={handleNavigate}
          onHasChangesChange={setProductFormHasChanges}
        />
      );
    }

    // If collection form is open, render it full screen
    if (isCollectionFormOpen) {
      return (
        <CollectionFormScreen
          collection={collectionFormCollection}
          onClose={closeCollectionForm}
          onSave={() => {
            // Refresh will happen automatically due to real-time updates
          }}
        />
      );
    }

    // If item stock screen is open, render it full screen
    if (isItemStockOpen) {
      return (
        <ItemStock
          item={itemStockItem}
          onClose={closeItemStock}
          onSave={() => {
            // Refresh will happen automatically due to real-time updates
          }}
        />
      );
    }

    // For products and collections screens, check if we should show management view
    if (currentScreen === 'products' && showManagement) {
      return <ProductsManagementScreen />;
    }

    if (currentScreen === 'collections' && showManagement) {
      return <CollectionsManagementScreen />;
    }

    // Otherwise render the main screens (default untoggled state)
    switch (currentScreen) {
      case 'sales':
        return <SquarePOS 
          onClose={() => handleNavigate('products')} 
          onOrderCreated={(orderId) => {
            // Optionally handle order creation success
            console.log('Order created:', orderId);
          }} 
        />;
      case 'reports':
        return <ReportsScreen
          onOpenMenu={() => handleNavigate('products')}
          onClose={() => handleNavigate('products')}
        />;
      case 'products':
        return <ProductsScreen
          isGridView={isGridView}
          onClose={() => {}} // No-op since products is now the home screen
          onNavigateToCart={() => handleNavigate('cart')}
          onNavigateToCategory={handleCategoryNavigation}
        />;
      case 'collections':
        return <CollectionsScreen
          isGridView={isGridView}
          onOpenForm={openCollectionForm}
          onClose={() => handleNavigate('products')}
        />;
      case 'cart':
        return <CartScreen
          onClose={() => handleNavigate('products')}
          onCheckout={() => handleNavigate('checkout')}
        />;
      case 'options':
        return <Options
          onClose={() => handleNavigate('products')}
          onOpenMenu={() => handleNavigate('products')}
        />;
      case 'metafields':
        return <MetafieldsSystem
          onClose={() => handleNavigate('products')}
        />;
      case 'items':
        return <ItemsScreen
          isGridView={isGridView}
          onItemFormOpen={(item) => {
            // Check if this is an inventory request
            if (item?.openInventory) {
              openItemStock(item);
            } else {
              // Handle regular item form opening if needed
              log.debug('Regular item form open', 'ItemsScreen', { item });
            }
          }}
          onClose={() => {
            // If items screen was opened from product form, go back to product form
            if (navigationData?.productId) {
              setIsProductFormOpen(true);
              setProductFormProduct({ id: navigationData.productId });
              setCurrentScreen('products');
              setNavigationData(null);
            } else {
              handleNavigate('products');
            }
          }}
          productId={navigationData?.productId} // Pass productId if provided in navigation data
        />;
      case 'locations':
        return <Locations
          onClose={() => handleNavigate('products')}
        />;
      case 'files':
        return <FilesScreen
          onClose={() => handleNavigate('products')}
        />;
      case 'profile':
        return <ProfileScreen
          onClose={() => handleNavigate('products')}
          onNavigateToOrderHistory={() => handleNavigate('order-debug')}
          onNavigateToAddresses={() => handleNavigate('address-management')}
        />;
      case 'order-history':
        return <OrderHistoryScreen
          onClose={() => handleNavigate('profile')}
          onOrderSelect={(order) => {
            setSelectedOrder(order);
            handleNavigate('order-details');
          }}
        />;
      case 'order-details':
        return selectedOrder ? (
          <OrderDetails
            order={selectedOrder}
            onClose={() => handleNavigate('order-history')}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text>Order not found</Text>
          </View>
        );
      case 'order-debug':
        return <OrderHistoryDebug onClose={() => handleNavigate('profile')} />;
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
          onNavigateToProduct={(product) => {
            // Handle product navigation if needed
            console.log('Navigate to product:', product.id);
          }}
        />;
      // All other cases default to products screen
      default:
        return <ProductsScreen
          isGridView={isGridView}
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
    <StoreProvider>
      <ErrorBoundary>
        <View className="flex flex-1">
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
    </StoreProvider>
  );
}

function MenuScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Section - Square POS Style */}
      <View className="bg-white px-6 pt-8 pb-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Square POS
        </Text>
        <Text className="text-lg text-gray-600">
          Manage your business inventory
        </Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-6 pt-8">
        {/* Quick Stats Cards */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-white p-4 rounded-xl border border-gray-200">
            <Text className="text-2xl font-bold text-gray-900">0</Text>
            <Text className="text-sm text-gray-600">Total Products</Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-xl border border-gray-200">
            <Text className="text-2xl font-bold text-gray-900">0</Text>
            <Text className="text-sm text-gray-600">Collections</Text>
          </View>
        </View>

        {/* Main Navigation Cards */}
        <View className="gap-4">
          {/* Removed Space navigation card to ensure all navigation to Sales is from Menu */}

          <TouchableOpacity
            onPress={() => onNavigate('sales')}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-xl">💰</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 mb-1">
                  Sales
                </Text>
                <Text className="text-gray-600">
                  Track sales performance
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNavigate('reports')}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-xl">📈</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 mb-1">
                  Reports
                </Text>
                <Text className="text-gray-600">
                  Real-time business reports
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNavigate('products')}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-orange-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-xl">📦</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 mb-1">
                  Products
                </Text>
                <Text className="text-gray-600">
                  Manage your product inventory
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNavigate('collections')}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-red-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-xl">🏷️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 mb-1">
                  Collections
                </Text>
                <Text className="text-gray-600">
                  Organize products into groups
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Section */}
        <View className="mt-auto mb-8">
          <View className="bg-white p-4 rounded-xl border border-gray-200">
            <Text className="text-sm text-gray-600 text-center">
              Powered by Instant DB • Real-time sync
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}


