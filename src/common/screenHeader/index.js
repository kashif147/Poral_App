import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../utils/Styles';
import { IMAGES } from '../../assets/images';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useProfile } from '../../contexts/profileContext';
import { Label } from '../text/label';
import { useNotification } from '../../contexts/notificationContext';
import { fetchNotificationRequest } from '../../api/notification.api';

const ScreenHeader = ({ title, showBack, onBackPress }) => {
  const { profileDetail } = useProfile();
  const { unreadCount, setUnreadCountValue } = useNotification();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const syncUnreadCount = React.useCallback(async () => {
    try {
      const response = await fetchNotificationRequest({ page: 1, limit: 1 });
      if (response?.status === 200 && response?.data?.success) {
        const apiUnreadCount = response?.data?.data?.unreadCount;
        if (typeof apiUnreadCount === 'number') {
          setUnreadCountValue(apiUnreadCount);
        }
      }
    } catch (error) {
      // Keep existing count if sync fails
    }
  }, [setUnreadCountValue]);

  useFocusEffect(
    React.useCallback(() => {
      syncUnreadCount();
    }, [syncUnreadCount]),
  );

  const handleBack = () => {
    if (typeof onBackPress === 'function') {
      onBackPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.header,
        { paddingTop: Platform.OS === 'ios' ? insets.top + 8 : 16 },
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
              size={22}
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
            size={20}
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
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.muted,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 10,
    borderRadius: 8,
  },
  profileButton: {
    borderRadius: 18,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  notificationButton: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.danger,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});

export default ScreenHeader;
