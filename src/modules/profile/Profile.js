import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import PersonalInformation from '../application/PersonalInformation';
import { Button } from '../../common/button';
import { useApplication } from '../../contexts/applicationContext';
import { useProfile } from '../../contexts/profileContext';
import {
  createPersonalDetailRequest,
  updatePersonalDetailRequest,
} from '../../api/application.api';
import { updateProfileRequest } from '../../api/profile.api';
import { isDataFormat } from '../../helpers/date.helper';
import { isActiveApplicationPersonalDetail } from '../../helpers/applicationPayload.helper';
import { canAccessProfile, isProfileReadOnly } from '../../helpers/role.helper';

import moment from 'moment';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomSwitch from '../../common/switch';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { signOut } from '../../services/auth.services';
import { useMemberRole } from '../../hooks/useMemberRole';
import ScreenHeader from '../../common/screenHeader';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const pickField = (primary, fallback, empty = '') =>
  primary ?? fallback ?? empty;

/** Backend allows only "home" | "work" for contactInfo.preferredAddress (Joi / AppError). */
function mapPreferredAddressForApi(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const s = String(value).trim().toLowerCase();
  if (s === 'home' || s === 'work') {
    return s;
  }
  if (s === 'other') {
    return 'home';
  }
  return undefined;
}

const Profile = () => {
  const user = useSelector(state => state.auth.user);
  const {
    personalDetail,
    getPersonalDetail,
    subscriptionDetail,
    applicationStatus,
  } = useApplication();
  const { profileByIdDetail, getProfileByIdDetail, profileDetail } = useProfile();
  const { isMember } = useMemberRole();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [localProfileImage, setLocalProfileImage] = useState(null);
  
  // Communication preferences state
  const [emailNewsletter, setEmailNewsletter] = useState(true);
  const [promotionalOffers, setPromotionalOffers] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  const profileAccessArgs = useMemo(
    () => ({
      isMember,
      applicationStatus:
        applicationStatus ?? personalDetail?.applicationStatus,
      isActive: personalDetail
        ? isActiveApplicationPersonalDetail(personalDetail)
        : undefined,
    }),
    [isMember, applicationStatus, personalDetail],
  );

  const showProfile = useMemo(
    () => canAccessProfile(profileAccessArgs),
    [profileAccessArgs],
  );

  const isReadOnly = useMemo(
    () => isProfileReadOnly(profileAccessArgs),
    [profileAccessArgs],
  );

  const canEditProfile = showProfile && !isReadOnly;

  useEffect(() => {
    getPersonalDetail?.();
  }, [getPersonalDetail]);

  useEffect(() => {
    if (isMember && profileDetail?.profileId) {
      getProfileByIdDetail(profileDetail.profileId);
    }
  }, [isMember, profileDetail?.profileId, getProfileByIdDetail]);

  // Hydrate local form state from context (match web preference order)
  useEffect(() => {
    const profilePersonalInfo = profileByIdDetail?.personalInfo || {};
    const profileContactInfo = profileByIdDetail?.contactInfo || {};
    const profilePreferences = profileByIdDetail?.preferences || {};

    const appPersonalInfo = personalDetail?.personalInfo || {};
    const appContactInfo = personalDetail?.contactInfo || {};

    const userDefaults = {
      forename: user?.userFirstName || user?.firstName || '',
      surname: user?.userLastName || user?.lastName || '',
      personalEmail: user?.userEmail || user?.email || '',
      mobileNo: user?.userMobilePhone || user?.mobilePhone || '',
    };

    const personal = (profileValue, appValue, userValue = '') =>
      isMember
        ? pickField(profileValue, pickField(appValue, userValue))
        : pickField(appValue, pickField(profileValue, userValue));

    const contact = (profileValue, appValue, userValue = '') =>
      isMember
        ? pickField(profileValue, pickField(appValue, userValue))
        : pickField(appValue, pickField(profileValue, userValue));

    setPersonalInfo({
      title: personal(profilePersonalInfo.title, appPersonalInfo.title),
      surname: personal(
        profilePersonalInfo.surname,
        appPersonalInfo.surname,
        userDefaults.surname,
      ),
      forename: personal(
        profilePersonalInfo.forename,
        appPersonalInfo.forename,
        userDefaults.forename,
      ),
      gender: personal(profilePersonalInfo.gender, appPersonalInfo.gender),
      dob: personal(
        profilePersonalInfo.dateOfBirth,
        appPersonalInfo.dateOfBirth,
      ),
      countryPrimaryQualification: personal(
        profilePersonalInfo.countryPrimaryQualification,
        appPersonalInfo.countryPrimaryQualification,
      ),
      // Keep legacy alias in sync for any older callers
      primaryCountry: personal(
        profilePersonalInfo.countryPrimaryQualification,
        appPersonalInfo.countryPrimaryQualification,
      ),
      consent: isMember
        ? pickField(profilePreferences.consent, appContactInfo.consent, true)
        : pickField(appContactInfo.consent, profilePreferences.consent, true),
      addressLine1: contact(
        profileContactInfo.buildingOrHouse,
        appContactInfo.buildingOrHouse,
      ),
      addressLine2: contact(
        profileContactInfo.streetOrRoad,
        appContactInfo.streetOrRoad,
      ),
      addressLine3: contact(
        profileContactInfo.areaOrTown,
        appContactInfo.areaOrTown,
      ),
      addressLine4: contact(
        profileContactInfo.countyCityOrPostCode,
        appContactInfo.countyCityOrPostCode,
      ),
      eircode: contact(profileContactInfo.eircode, appContactInfo.eircode),
      preferredAddress: contact(
        profileContactInfo.preferredAddress,
        appContactInfo.preferredAddress,
      ),
      country: contact(profileContactInfo.country, appContactInfo.country),
      mobileNo: contact(
        profileContactInfo.mobileNumber,
        appContactInfo.mobileNumber,
        userDefaults.mobileNo,
      ),
      workTel: contact(
        profileContactInfo.telephoneNumber,
        appContactInfo.telephoneNumber,
      ),
      preferredEmail: contact(
        profileContactInfo.preferredEmail,
        appContactInfo.preferredEmail,
      ),
      personalEmail: contact(
        profileContactInfo.personalEmail,
        appContactInfo.personalEmail,
        userDefaults.personalEmail,
      ),
      workEmail: contact(
        profileContactInfo.workEmail,
        appContactInfo.workEmail,
      ),
    });
  }, [isMember, personalDetail, profileByIdDetail, user]);

  const handleImagePick = () => {
    Alert.alert(
      'Select Profile Photo',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const result = await launchCamera({
              mediaType: 'photo',
              quality: 0.5,
              includeBase64: true,
            });
             if (result.assets && result.assets.length > 0) {
              setLocalProfileImage(result.assets[0]);
              // Ideally upload here or save strictly for display
              // For now we persist it in local state
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const result = await launchImageLibrary({
              mediaType: 'photo',
              quality: 0.5,
              includeBase64: true,
            });
            if (result.assets && result.assets.length > 0) {
              setLocalProfileImage(result.assets[0]);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const buildPortalPayload = () => {
    const personalInfoData = { personalInfo: {}, contactInfo: {} };

    const personalFields = {
      title: personalInfo.title,
      surname: personalInfo.surname,
      forename: personalInfo.forename,
      gender: personalInfo.gender,
      dateOfBirth: personalInfo.dob && isDataFormat(personalInfo.dob),
      countryPrimaryQualification:
        personalInfo.countryPrimaryQualification ||
        personalInfo.primaryCountry ||
        '',
    };

    Object.entries(personalFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        personalInfoData.personalInfo[key] = value;
      }
    });

    const apiPreferredAddress = mapPreferredAddressForApi(
      personalInfo.preferredAddress,
    );

    const contactFields = {
      preferredAddress: apiPreferredAddress,
      eircode: personalInfo.eircode ?? '',
      buildingOrHouse: personalInfo.addressLine1,
      streetOrRoad: personalInfo.addressLine2 ?? '',
      areaOrTown: personalInfo.addressLine3 ?? '',
      countyCityOrPostCode: personalInfo.addressLine4,
      country: personalInfo.country ?? '',
      mobileNumber: personalInfo.mobileNo,
      telephoneNumber: personalInfo.workTel ?? '',
      preferredEmail: personalInfo.preferredEmail,
      personalEmail: personalInfo.personalEmail ?? '',
      workEmail: personalInfo.workEmail ?? '',
      consent: personalInfo.consent,
    };

    Object.entries(contactFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        personalInfoData.contactInfo[key] = value;
      }
    });

    return personalInfoData;
  };

  const buildProfilePayload = () => {
    const apiPreferredAddress = mapPreferredAddressForApi(
      personalInfo.preferredAddress,
    );

    const profilePayload = {
      personalInfo: {},
      contactInfo: {},
      preferences: {
        consent: !!personalInfo.consent,
      },
    };

    const personalFields = {
      title: personalInfo.title,
      surname: personalInfo.surname,
      forename: personalInfo.forename,
      gender: personalInfo.gender,
      dateOfBirth: personalInfo.dob && isDataFormat(personalInfo.dob),
      countryPrimaryQualification:
        personalInfo.countryPrimaryQualification ||
        personalInfo.primaryCountry ||
        '',
    };

    Object.entries(personalFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        profilePayload.personalInfo[key] = value;
      }
    });

    if (localProfileImage?.base64) {
      profilePayload.personalInfo.profileImage = `data:${localProfileImage.type};base64,${localProfileImage.base64}`;
    }

    const profileContactFields = {
      preferredAddress: apiPreferredAddress,
      buildingOrHouse: personalInfo.addressLine1,
      streetOrRoad: personalInfo.addressLine2 ?? '',
      areaOrTown: personalInfo.addressLine3 ?? '',
      eircode: personalInfo.eircode ?? '',
      countyCityOrPostCode: personalInfo.addressLine4,
      country: personalInfo.country ?? '',
      mobileNumber: personalInfo.mobileNo,
      telephoneNumber: personalInfo.workTel ?? '',
      preferredEmail: personalInfo.preferredEmail,
      personalEmail: personalInfo.personalEmail ?? '',
      workEmail: personalInfo.workEmail ?? '',
    };

    Object.entries(profileContactFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        profilePayload.contactInfo[key] = value;
      }
    });

    return profilePayload;
  };

  const handleSave = async () => {
    if (isReadOnly) {
      return;
    }

    setShowValidation(true);
    setLoading(true);

    try {
      // Members (incl. processed applications) → profile-service
      if (isMember) {
        if (!profileByIdDetail && !profileDetail?.profileId) {
          Alert.alert('Error', 'No profile found to update');
          setLoading(false);
          return;
        }

        const res = await updateProfileRequest(buildProfilePayload());
        if (res?.status === 200) {
          if (profileDetail?.profileId) {
            getProfileByIdDetail(profileDetail.profileId);
          }
          Alert.alert('Success', 'Personal detail updated successfully');
          setShowValidation(false);
          setShowPersonalInfoForm(false);
        } else {
          const errBody = res?.data;
          Alert.alert(
            'Error',
            errBody?.error?.message ||
              errBody?.message ||
              'Unable to update personal detail',
          );
        }
        return;
      }

      // Non-members (application not submitted) → portal-service create/update
      const portalPayload = buildPortalPayload();
      const applicationId =
        personalDetail?.ApplicationId || personalDetail?.applicationId;

      const res = applicationId
        ? await updatePersonalDetailRequest(applicationId, portalPayload)
        : await createPersonalDetailRequest(portalPayload);

      if (res?.status === 200) {
        getPersonalDetail?.();
        Alert.alert(
          'Success',
          applicationId
            ? 'Personal detail updated successfully'
            : 'Personal detail created successfully',
        );
        setShowValidation(false);
        setShowPersonalInfoForm(false);
      } else {
        const errBody = res?.data;
        Alert.alert(
          'Error',
          errBody?.error?.message ||
            errBody?.message ||
            'Unable to save personal detail',
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Use Redux signOut action which handles all cleanup and navigation
              await dispatch(signOut(navigation));
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Something went wrong during logout');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Dynamic Subscription Data
  const membershipCategory = subscriptionDetail?.subscriptionDetails?.membershipCategory || 'No Membership';
  const membershipStatus = subscriptionDetail?.subscriptionDetails?.membershipStatus || 'Inactive';
  const renewalDate = subscriptionDetail?.subscriptionDetails?.renewalDate;
  const isActive = membershipStatus.toLowerCase() === 'active';

  // Profile Image Source
  const profileImageSource = localProfileImage
    ? { uri: localProfileImage.uri }
    : profileByIdDetail?.personalInfo?.profileImage
      ? { uri: profileByIdDetail.personalInfo.profileImage } // Assuming URL or Base64
      : { uri: 'https://randomuser.me/api/portraits/women/44.jpg' }; // Fallback

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        {/* Header */}
        <ScreenHeader title="Profile" />

        <ScrollView contentContainerStyle={{ paddingBottom: hp(12) }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Profile Header Card */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {canEditProfile && isMember ? (
                <TouchableOpacity onPress={handleImagePick}>
                  <Image 
                    source={profileImageSource} 
                    style={styles.avatar}
                  />
                  <View style={styles.editBadge}>
                    <Ionicons name="camera" size={14} color={Colors.white} />
                  </View>
                </TouchableOpacity>
              ) : (
                <Image 
                  source={profileImageSource} 
                  style={styles.avatar}
                />
              )}
            </View>
            <Text style={styles.profileName}>
              {`${personalInfo?.forename || ''} ${personalInfo?.surname || ''}`.trim() || user?.fullName || user?.userFullName}
            </Text>
            <Text style={styles.profileId}>
              {isMember
                ? profileDetail?.membershipNumber
                  ? `Member ID: ${profileDetail.membershipNumber}`
                  : 'Member'
                : 'Non Member'}
            </Text>
            {canEditProfile && (
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => {
                  setShowValidation(false);
                  setShowPersonalInfoForm(true);
                }}
                activeOpacity={0.8}>
                <Ionicons name="create-outline" size={16} color={Colors.white} />
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
            {isReadOnly && (
              <Text style={styles.readOnlyHint}>
                Profile edits are locked while your application is under review.
              </Text>
            )}
          </View>

          {/* Personal Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {canEditProfile ? (
              <TouchableOpacity 
                style={styles.listItem} 
                onPress={() => {
                  setShowValidation(false);
                  setShowPersonalInfoForm(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.listItemIcon}>
                  <Ionicons name="person-outline" size={20} color={Colors.textPrimary} />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemLabel}>Full Name</Text>
                  <Text style={styles.listItemValue}>
                    {`${personalInfo?.title || ''} ${personalInfo?.forename || ''} ${personalInfo?.surname || ''}`.trim() || user?.fullName || user?.userFullName || '—'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.listItem}>
                <View style={styles.listItemIcon}>
                  <Ionicons name="person-outline" size={20} color={Colors.textPrimary} />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemLabel}>Full Name</Text>
                  <Text style={styles.listItemValue}>
                    {`${personalInfo?.title || ''} ${personalInfo?.forename || ''} ${personalInfo?.surname || ''}`.trim() || user?.fullName || user?.userFullName || '—'}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
              <View style={styles.listItemIcon}>
                <Ionicons name="mail-outline" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>Email Address</Text>
                <Text style={styles.listItemValue} numberOfLines={1}>
                  {personalInfo?.personalEmail || personalInfo?.workEmail || user?.email || '—'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
              <View style={styles.listItemIcon}>
                <Ionicons name="call-outline" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>Phone Number</Text>
                <Text style={styles.listItemValue}>
                  {personalInfo?.mobileNo || personalInfo?.workTel || '—'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
              <View style={styles.listItemIcon}>
                <Ionicons name="home-outline" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>Mailing Address</Text>
                <Text style={styles.listItemValue} numberOfLines={1}>
                  {`${personalInfo?.addressLine1 || ''}, ${personalInfo?.addressLine3 || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') || '—'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Membership Details Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Membership Details</Text>
            
            <View style={styles.listItem}>
              <View style={styles.listItemIcon}>
                <MaterialCommunityIcons name="medal-outline" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>Membership Level</Text>
                <Text style={styles.listItemValue}>{membershipCategory}</Text>
              </View>
            </View>

            <View style={styles.listItem}>
              <View style={styles.listItemIcon}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>Membership Status</Text>
                <Text style={styles.listItemValue}>
                  {renewalDate ? `Renews on ${moment(renewalDate).format('MMM DD, YYYY')}` : membershipStatus}
                </Text>
              </View>
              <View style={[styles.activeBadge, !isActive && { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.activeBadgeText, !isActive && { color: '#EF4444' }]}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>

          {/* Account & Security Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Account & Security</Text>
            
            <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
              <View style={styles.listItemIcon}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Communication Preferences Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Communication Preferences</Text>
            
            <View style={styles.listItem}>
              <Text style={styles.switchLabel}>Email Newsletter</Text>
              <CustomSwitch
                value={emailNewsletter}
                onValueChange={setEmailNewsletter}
              />
            </View>

            <View style={styles.listItem}>
              <Text style={styles.switchLabel}>Promotional Offers</Text>
              <CustomSwitch
                value={promotionalOffers}
                onValueChange={setPromotionalOffers}
              />
            </View>

            <View style={styles.listItem}>
              <Text style={styles.switchLabel}>Push Notifications</Text>
              <CustomSwitch
                value={pushNotifications}
                onValueChange={setPushNotifications}
              />
            </View>
          </View>

          {/* Log Out Button */}
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit Form Modal */}
      <Modal
        visible={showPersonalInfoForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowValidation(false);
          setShowPersonalInfoForm(false);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.formModal}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Edit Personal Information</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowValidation(false);
                  setShowPersonalInfoForm(false);
                }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <PersonalInformation
                formData={personalInfo}
                onFormDataChange={setPersonalInfo}
                showValidation={showValidation}
              />
            </ScrollView>

            <View style={styles.formActions}>
              <Button
                title={loading ? 'Saving…' : 'Save Changes'}
                onPress={handleSave}
                primary
                style={{ flex: 1 }}
                disabled={loading || isReadOnly}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setShowValidation(false);
                  setShowPersonalInfoForm(false);
                }}
                outlined
                style={{ flex: 1 }}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Header - Matching Application.js
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  headerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5A77B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Profile Header Card
  profileHeader: {
    backgroundColor: Colors.white,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  editProfileButton: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editProfileButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  readOnlyHint: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // Section Container
  sectionContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.3,
  },

  // List Items
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  listItemValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
  },

  // Switch Label
  switchLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },

  // Form Modal
  formModal: {
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginTop: hp(6),
    marginBottom: hp(3),
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  formScroll: {
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 12,
  },
});

export default Profile;
