import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import { IMAGES } from '../../assets/images';

const { width, height } = Dimensions.get('window');

const PopupMenu = ({ visible, onClose, onNavigate }) => {
  const menuItems = [
    {
      id: 'event',
      label: 'Event',
      icon: '🎉',
      route: 'Event',
    },
    {
      id: 'category',
      label: 'Category',
      icon: '📂',
      route: 'Category',
    },
    {
      id: 'courses',
      label: 'Courses',
      icon: '📚',
      route: 'Courses',
    },
    {
      id: 'membership',
      label: 'Membership',
      icon: '👑',
      route: 'Membership',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      route: 'Profile',
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
        <View style={styles.menuContainer}>
          {/* Handle bar */}
          <View style={styles.handleBar} />
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    backgroundColor: Colors.darkCharcoal,
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
    padding: wp(4),
    width: '100%',
    paddingBottom: hp(8), // Extra padding for safe area
  },
  handleBar: {
    width: wp(15),
    height: 4,
    backgroundColor: Colors.gray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: hp(2),
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '18%',
    alignItems: 'center',
    paddingVertical: hp(2),
    marginBottom: hp(1),
  },
  menuIcon: {
    fontSize: wp(6),
    marginBottom: hp(1),
  },
  menuLabel: {
    color: Colors.white,
    fontSize: wp(2.5),
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: wp(3),
  },
});

export default PopupMenu;
