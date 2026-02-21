import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import PersonalInformation from '../application/PersonalInformation';
import { Button } from '../../common/button';
import { useApplication } from '../../contexts/applicationContext';
import { useProfile } from '../../contexts/profileContext';
import { updatePersonalDetailRequest } from '../../api/application.api';
import { updateProfileRequest } from '../../api/profile.api';
import { isDataFormat } from '../../helpers/date.helper';

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

const Profile = () => {
  const user = useSelector(state => state.auth.user);
  const { personalDetail, getPersonalDetail, subscriptionDetail } = useApplication();
  const { profileByIdDetail, getProfileByIdDetail, profileDetail } = useProfile();
  const { isMember } = useMemberRole();
  const applicationId = personalDetail?.applicationId;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({});
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [localProfileImage, setLocalProfileImage] = useState(null);
  
  // Communication preferences state
  const [emailNewsletter, setEmailNewsletter] = useState(true);
  const [promotionalOffers, setPromotionalOffers] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Hydrate local form state from context
  useEffect(() => {
    if (!personalDetail && !profileByIdDetail) return;

    const profilePersonalInfo = profileByIdDetail?.personalInfo || {};
    const profileContactInfo = profileByIdDetail?.contactInfo || {};
    const profilePreferences = profileByIdDetail?.preferences || {};

    const appPersonalInfo = personalDetail?.personalInfo || {};
    const appContactInfo = personalDetail?.contactInfo || {};

    setPersonalInfo({
      // Personal info - prefer profile, fallback to application
      title: profilePersonalInfo.title ?? appPersonalInfo.title ?? '',
      surname: profilePersonalInfo.surname ?? appPersonalInfo.surname ?? '',
      forename: profilePersonalInfo.forename ?? appPersonalInfo.forename ?? '',
      gender: profilePersonalInfo.gender ?? appPersonalInfo.gender ?? '',
      dob: profilePersonalInfo.dateOfBirth ?? appPersonalInfo.dateOfBirth ?? '',
      primaryCountry: profilePersonalInfo.countryPrimaryQualification ?? appPersonalInfo.countryPrimaryQualification ?? '',
      
      // Consent - prefer profile preferences, fallback to application contactInfo
      consent: profilePreferences.consent ?? appContactInfo.consent ?? true,
      
      // Address Information - prefer profile, fallback to application
      addressLine1: profileContactInfo.buildingOrHouse ?? appContactInfo.buildingOrHouse ?? '',
      addressLine2: profileContactInfo.streetOrRoad ?? appContactInfo.streetOrRoad ?? '',
      addressLine3: profileContactInfo.areaOrTown ?? appContactInfo.areaOrTown ?? '',
      addressLine4: profileContactInfo.countyCityOrPostCode ?? appContactInfo.countyCityOrPostCode ?? '',
      eircode: profileContactInfo.eircode ?? appContactInfo.eircode ?? '',
      preferredAddress: profileContactInfo.preferredAddress ?? appContactInfo.preferredAddress ?? '',
      country: profileContactInfo.country ?? appContactInfo.country ?? '',
      
      // Contact Information - prefer profile, fallback to application
      mobileNo: profileContactInfo.mobileNumber ?? appContactInfo.mobileNumber ?? '',
      workTel: profileContactInfo.telephoneNumber ?? appContactInfo.telephoneNumber ?? '',
      preferredEmail: profileContactInfo.preferredEmail ?? appContactInfo.preferredEmail ?? '',
      personalEmail: profileContactInfo.personalEmail ?? appContactInfo.personalEmail ?? '',
      workEmail: profileContactInfo.workEmail ?? appContactInfo.workEmail ?? '',
    });
  }, [personalDetail, profileByIdDetail]);

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

  const handleSave = async () => {
    setLoading(true);
    try {
      // Build payload for application API
      const personalInfoData = {};
      const personalFields = {
        title: personalInfo.title,
        surname: personalInfo.surname,
        forename: personalInfo.forename,
        gender: personalInfo.gender,
        dateOfBirth: personalInfo.dob && isDataFormat(personalInfo.dob),
        countryPrimaryQualification: personalInfo.primaryCountry ?? '',
      };

      personalInfoData.personalInfo = {};
      Object.entries(personalFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          personalInfoData.personalInfo[key] = value;
        }
      });

      const contactFields = {
        preferredAddress: personalInfo.preferredAddress,
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

      personalInfoData.contactInfo = {};
      Object.entries(contactFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          personalInfoData.contactInfo[key] = value;
        }
      });

      // Build payload for profile API (preferences.consent)
      const profileContactFields = {
        preferredAddress: personalInfo.preferredAddress,
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

      const profilePayload = {
        personalInfo: personalInfoData.personalInfo,
        contactInfo: {},
        preferences: {
          consent: !!personalInfo.consent,
        },
      };

      if (localProfileImage?.base64) {
         // Assuming API might accept base64 image in a field like 'profilePhoto' or 'avatar'
         // If not supported by backend, this might be ignored or error out.
         // We are sending it as 'profileImage' for now based on common patterns.
         profilePayload.personalInfo.profileImage = `data:${localProfileImage.type};base64,${localProfileImage.base64}`;
      }

      Object.entries(profileContactFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          profilePayload.contactInfo[key] = value;
        }
      });

      // Update both APIs if they exist (matching web version)
      const requests = [];

      if (personalDetail?.applicationId) {
        requests.push(updatePersonalDetailRequest(personalDetail.applicationId, personalInfoData));
      }

      if (profileByIdDetail) {
        requests.push(updateProfileRequest(profilePayload));
      }

      if (!requests.length) {
        Alert.alert('Error', 'No application or profile found to update');
        setLoading(false);
        return;
      }

      const responses = await Promise.all(requests);
      const allOk = responses.every(res => res?.status === 200);

      if (allOk) {
        Alert.alert('Success', 'Personal detail updated successfully');
        if (personalDetail?.applicationId) {
          getPersonalDetail?.();
        }
        if (profileDetail?.profileId) {
          getProfileByIdDetail(profileDetail.profileId);
        }
        setShowPersonalInfoForm(false);
      } else {
        const firstError = responses.find(r => r?.status !== 200);
        Alert.alert('Error', firstError?.data?.message ?? 'Unable to update personal detail');
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
              {isMember ? (
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
              {profileDetail?.membershipNumber ? `Member ID: ${profileDetail.membershipNumber}` : profileDetail?.profileId ? 'Member' : 'Non Member'}
            </Text>
          </View>

          {/* Personal Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {isMember ? (
              <TouchableOpacity 
                style={styles.listItem} 
                onPress={() => setShowPersonalInfoForm(!showPersonalInfoForm)}
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

          {/* Edit Form Modal (shown when clicking items) */}
          {showPersonalInfoForm && (
            <View style={styles.formModal}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Edit Personal Information</Text>
                <TouchableOpacity onPress={() => setShowPersonalInfoForm(false)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <PersonalInformation
                formData={personalInfo}
                onFormDataChange={setPersonalInfo}
                showValidation={false}
              />
              
              <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
                <Button 
                  title={loading ? 'Saving…' : 'Save Changes'} 
                  onPress={handleSave} 
                  primary 
                  style={{ flex: 1 }}
                  disabled={loading}
                />
                <Button 
                  title={'Cancel'} 
                  onPress={() => setShowPersonalInfoForm(false)} 
                  outlined 
                  style={{ flex: 1 }}
                  disabled={loading}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
});

export default Profile;
