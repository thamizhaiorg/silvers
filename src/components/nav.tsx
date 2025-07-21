import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export type BottomTabScreen = 'home' | 'collections' | 'cart' | 'profile';

interface BottomNavigationProps {
  activeTab: BottomTabScreen;
  onTabPress: (tab: BottomTabScreen) => void;
  cartItemCount?: number;
}

export default function BottomNavigation({ activeTab, onTabPress, cartItemCount = 0 }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();

  const tabs = [
    {
      key: 'home' as BottomTabScreen,
      label: 'Home',
      icon: 'home',
      iconLibrary: 'Feather' as const
    },
    {
      key: 'collections' as BottomTabScreen,
      label: 'Collections',
      icon: 'view-grid',
      iconLibrary: 'MaterialCommunityIcons' as const
    },
    {
      key: 'cart' as BottomTabScreen,
      label: 'Cart',
      icon: 'shopping-cart',
      iconLibrary: 'Feather' as const,
      badge: cartItemCount > 0 ? cartItemCount : undefined
    },
    {
      key: 'profile' as BottomTabScreen,
      label: 'Profile',
      icon: 'user',
      iconLibrary: 'Feather' as const
    }
  ];

  const renderIcon = (tab: typeof tabs[0], isActive: boolean) => {
    const iconColor = isActive ? '#3B82F6' : '#6B7280';
    const IconComponent = tab.iconLibrary === 'Feather' ? Feather : MaterialCommunityIcons;

    return (
      <View className="relative">
        <IconComponent
          name={tab.icon as any}
          size={24}
          color={iconColor}
        />
        {tab.badge && (
          <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
            <Text className="text-white text-xs font-medium">
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      className="bg-white border-t border-gray-200"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              className="flex-1 items-center justify-center py-3"
              activeOpacity={0.7}
            >
              {renderIcon(tab, isActive)}
              <Text
                className={`text-xs mt-1 ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
