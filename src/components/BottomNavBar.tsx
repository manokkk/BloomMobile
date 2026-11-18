import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type MainTab = 'dashboard' | 'cycle' | 'checkin' | 'settings';

interface BottomNavBarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

const TABS: Array<{
  id: MainTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'flower-outline',
    activeIcon: 'flower',
  },
  {
    id: 'cycle',
    label: 'Cycle',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
  },
  {
    id: 'checkin',
    label: 'Check-In',
    icon: 'heart-outline',
    activeIcon: 'heart',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
  },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={21}
              color={isActive ? '#D23669' : '#8C8296'}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    shadowColor: '#D23669',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: '#FCE7F3',
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C8296',
  },
  tabLabelActive: {
    color: '#D23669',
    fontWeight: '700',
  },
});
