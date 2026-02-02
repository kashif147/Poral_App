import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const PopupMenu = ({ visible, onClose, onNavigate }) => {
  const insets = useSafeAreaInsets();
  
  const menuItems = [
    {
      id: 'category',
      label: 'Transfer of Request',
      icon: 'swap-horizontal',
      iconType: 'Ionicons',
      color: '#4ECDC4',
      bgColor: '#E0F7F5',
      route: 'Category',
    },
    {
      id: 'membership',
      label: 'Change of Category',
      icon: 'star-outline',
      iconType: 'Ionicons',
      color: '#FFD93D',
      bgColor: '#FFF9E6',
      route: 'Membership',
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: 'document-text-outline',
      iconType: 'Ionicons',
      color: '#6C5CE7',
      bgColor: '#EDEBF7',
      route: 'Resources',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      iconType: 'Ionicons',
      color: '#74B9FF',
      bgColor: '#E3F2FD',
      route: 'Profile',
    },
    {
      id: 'paymentMethod',
      label: 'Payment Method',
      icon: 'card-outline',
      iconType: 'Ionicons',
      color: '#10B981',
      bgColor: '#D1FAE5',
      route: 'PaymentMethod',
    },
    {
        id: 'queriesCases',
        label: 'Queries & Cases',
        icon: 'clipboard-list-outline', 
        iconType: 'MaterialCommunityIcons',
        color: '#F472B6', 
        bgColor: '#FCE7F3',
        route: 'QueriesCases',
      },
  ];

  const handleItemPress = (item) => {
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
            <Text style={styles.headerTitle}>More Options</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Menu Grid */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.menuGrid}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                    {item.iconType === 'Ionicons' ? (
                      <Ionicons name={item.icon} size={28} color={item.color} />
                    ) : (
                      <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                    )}
                  </View>
                  <Text style={styles.menuLabel} numberOfLines={2}>{item.label}</Text>
                </TouchableOpacity>
              ))}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: (width - 60) / 4, // 4 items per row with padding
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
});

export default PopupMenu;
