import "../global.css";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ErrorBoundary from "../components/ui/error-boundary";
import { AuthProvider } from "../lib/auth-context";
import { StoreProvider } from "../lib/store-context";
import { LocationProvider } from "../lib/location-context";
import { CartProvider } from "../lib/cart-context";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StoreProvider>
            <LocationProvider>
              <CartProvider>
                <ErrorBoundary>
                  <Slot />
                </ErrorBoundary>
              </CartProvider>
            </LocationProvider>
          </StoreProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
