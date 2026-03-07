import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../utils/Styles';
import { IMAGES } from '../../assets/images';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useProfile } from '../../contexts/profileContext';
import { Label } from '../text/label';
import { useNotification } from '../../contexts/notificationContext';

const ScreenHeader = ({ title, showBack }) => {
  const { profileDetail } = useProfile();
  const { unreadCount } = useNotification();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.header,
        { paddingTop: Platform.OS === 'ios' ? insets.top + 16 : 16 },
      ]}
    >
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back-outline"
              size={24}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        )}
        {title === 'Dashboard' && (
          <Image source={IMAGES.LOGO} style={styles.logo} />
        )}
        <Label style={styles.headerTitle}>{title}</Label>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={Colors.textPrimary}
          />
          {unreadCount > 0 && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileButton}
        >
          <Image
            source={
              profileDetail?.profileImage
                ? { uri: profileDetail.profileImage }
                : IMAGES.AVATAR
            }
            style={styles.headerAvatar}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  logo: {
    width: 35,
    height: 35,
    marginRight: 10,
  },
  profileButton: {
    // marginRight: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  notificationButton: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});

export default ScreenHeader;
