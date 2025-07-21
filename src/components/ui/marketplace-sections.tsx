import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

interface FeaturedBannerProps {
  title: string;
  subtitle: string;
  buttonText: string;
  onPress: () => void;
  backgroundColor?: string;
}

export function FeaturedBanner({
  title,
  subtitle,
  buttonText,
  onPress,
  backgroundColor = 'bg-silver-500'
}: FeaturedBannerProps) {
  return (
    <View className={`mx-6 mb-6 ${backgroundColor} rounded-2xl p-6`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white text-xl font-bold mb-1">
            {title}
          </Text>
          <Text className="text-silver-100 text-sm">
            {subtitle}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onPress}
          className="bg-white/20 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface QuickActionProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  color?: string;
}

export function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
  color = '#378388'
}: QuickActionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-1 mx-1"
    >
      <View className="items-center">
        <View className="bg-silver-100 rounded-full p-3 mb-3">
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <Text className="text-gray-900 font-semibold text-sm text-center mb-1">
          {title}
        </Text>
        <Text className="text-gray-500 text-xs text-center">
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface QuickActionsRowProps {
  actions: Array<{
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }>;
}

export function QuickActionsRow({ actions }: QuickActionsRowProps) {
  return (
    <View className="px-6 mb-6">
      <Text className="text-gray-900 text-lg font-semibold mb-4">
        Quick Actions
      </Text>
      <View className="flex-row gap-3">
        {actions.map((action, index) => (
          <QuickAction
            key={index}
            icon={action.icon}
            title={action.title}
            subtitle={action.subtitle}
            onPress={action.onPress}
          />
        ))}
      </View>
    </View>
  );
}

interface StatsCardProps {
  value: string;
  label: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatsCard({
  value,
  label,
  icon,
  trend,
  trendValue
}: StatsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'minus';
    }
  };

  return (
    <View className="bg-white/10 rounded-xl p-4 flex-1">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white text-2xl font-bold">{value}</Text>
        {icon && (
          <MaterialCommunityIcons name={icon as any} size={20} color="white" />
        )}
      </View>
      <Text className="text-silver-100 text-sm mb-1">{label}</Text>
      {trend && trendValue && (
        <View className="flex-row items-center">
          <Feather name={getTrendIcon()} size={12} color="white" />
          <Text className="text-white text-xs ml-1">{trendValue}</Text>
        </View>
      )}
    </View>
  );
}

interface StatsRowProps {
  stats: Array<{
    value: string;
    label: string;
    icon?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }>;
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <View className="flex-row mx-6 mb-6 gap-4">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          value={stat.value}
          label={stat.label}
          icon={stat.icon}
          trend={stat.trend}
          trendValue={stat.trendValue}
        />
      ))}
    </View>
  );
}

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  count?: number;
  onPress: (categoryId: string) => void;
}

export function CategoryCard({
  id,
  name,
  icon,
  count,
  onPress
}: CategoryCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(id)}
      className="bg-white/15 rounded-2xl p-4 mr-4 items-center min-w-[80px]"
    >
      <View className="bg-white/20 rounded-full p-3 mb-2">
        <MaterialCommunityIcons name={icon as any} size={24} color="white" />
      </View>
      <Text className="text-white text-sm font-medium text-center mb-1">
        {name}
      </Text>
      {count !== undefined && (
        <Text className="text-silver-200 text-xs">
          {count} items
        </Text>
      )}
    </TouchableOpacity>
  );
}

interface CategoriesScrollProps {
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    count?: number;
  }>;
  onCategoryPress: (categoryId: string) => void;
}

export function CategoriesScroll({
  categories,
  onCategoryPress
}: CategoriesScrollProps) {
  return (
    <View className="mb-6">
      <View className="px-6 mb-4">
        <Text className="text-white text-lg font-semibold">
          Shop by Category
        </Text>
      </View>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 48 }}
        renderItem={({ item: category }) => (
          <CategoryCard
            id={category.id}
            name={category.name}
            icon={category.icon}
            count={category.count}
            onPress={onCategoryPress}
          />
        )}
      />
    </View>
  );
}

interface SectionDividerProps {
  height?: number;
  backgroundColor?: string;
}

export function SectionDivider({
  height = 16,
  backgroundColor = 'bg-gray-50'
}: SectionDividerProps) {
  return (
    <View 
      className={`${backgroundColor} rounded-t-3xl`}
      style={{ height }}
    />
  );
}
