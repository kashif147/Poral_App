import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const GRID_PADDING = 20;
const ITEMS_PER_ROW = 4;
const ITEM_GAP = 12;
const ITEM_WIDTH =
  (width - GRID_PADDING * 2 - ITEM_GAP * (ITEMS_PER_ROW - 1)) / ITEMS_PER_ROW;

const MEMBER_ONLY_ROUTES = ['Category', 'Membership', 'PaymentMethod', 'QueriesCases'];

const allMenuItems = [
  {
    id: 'category',
    label: 'Transfer of Request',
    icon: 'swap-horizontal',
    iconType: 'Ionicons',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    route: 'Category',
  },
  {
    id: 'membership',
    label: 'Change of Category',
    icon: 'star-outline',
    iconType: 'Ionicons',
    color: '#D97706',
    bgColor: '#FEF3C7',
    route: 'Membership',
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: 'document-text-outline',
    iconType: 'Ionicons',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    route: 'Resources',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    iconType: 'Ionicons',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    route: 'Profile',
  },
  {
    id: 'application',
    label: 'Application',
    icon: 'document-text-outline',
    iconType: 'Ionicons',
    color: '#1D4ED8',
    bgColor: '#DBEAFE',
    route: 'Application',
  },
  {
    id: 'paymentMethod',
    label: 'Payment Method',
    icon: 'card-outline',
    iconType: 'Ionicons',
    color: '#059669',
    bgColor: '#D1FAE5',
    route: 'PaymentMethod',
  },
  {
    id: 'queriesCases',
    label: 'Queries & Cases',
    icon: 'clipboard-list-outline',
    iconType: 'MaterialCommunityIcons',
    color: '#DB2777',
    bgColor: '#FCE7F3',
    route: 'QueriesCases',
  },
];

const MenuItemButton = ({ item, isLastInRow, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = toValue => {
    Animated.spring(scale, {
      toValue,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      style={[styles.menuItem, { marginRight: isLastInRow ? 0 : ITEM_GAP }]}
      onPress={onPress}
      onPressIn={() => animateTo(0.92)}
      onPressOut={() => animateTo(1)}
      activeOpacity={0.85}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          { backgroundColor: item.bgColor, transform: [{ scale }] },
        ]}
      >
        {item.iconType === 'Ionicons' ? (
          <Ionicons name={item.icon} size={26} color={item.color} />
        ) : (
          <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
        )}
      </Animated.View>
      <Text style={styles.menuLabel} numberOfLines={2}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

const PopupMenu = ({ visible, onClose, onNavigate, isMember = true }) => {
  const insets = useSafeAreaInsets();

  const menuItems = isMember
    ? allMenuItems
    : allMenuItems.filter(item => !MEMBER_ONLY_ROUTES.includes(item.route));

  const handleItemPress = item => {
    onNavigate(item.route);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.menuContainer, { paddingBottom: insets.bottom + 20 }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>More Options</Text>
              <Text style={styles.headerSubtitle}>
                Quick access to your account tools
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Menu Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.menuGrid}>
              {menuItems.map((item, index) => {
                const isLastInRow = (index + 1) % ITEMS_PER_ROW === 0;
                return (
                  <MenuItemButton
                    key={item.id}
                    item={item}
                    isLastInRow={isLastInRow}
                    onPress={() => handleItemPress(item)}
                  />
                );
              })}
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 22,
  },
  scrollContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 24,
    paddingBottom: GRID_PADDING,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  menuItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  menuLabel: {
    color: Colors.textPrimary,
    fontSize: 12.5,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 17,
  },
});

export default PopupMenu;