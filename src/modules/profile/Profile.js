import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import PersonalInformation from '../application/PersonalInformation';
import { Button } from '../../common/button';
import { useApplication } from '../../contexts/applicationContext';
import { updatePersonalDetailRequest } from '../../api/application.api';
import { format } from 'date-fns';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomSwitch from '../../common/switch';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { signOut } from '../../services/auth.services';
import ScreenHeader from '../../common/screenHeader';
import { signOutFromAzureB2C } from '../../helpers/webviewAuth.helper';
import { deleteHeaders, deleteUser } from '../../helpers/auth.helper';
import { deleteVerifier } from '../../helpers/verifier.helper';

const Profile = () => {
  const { personalDetail, getPersonalDetail } = useApplication();
  const applicationId = personalDetail?.applicationId;
  const insets = useSafeAreaInsets();
  // const dispatch = useDispatch();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({});
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  
  // Communication preferences state
  const [emailNewsletter, setEmailNewsletter] = useState(true);
  const [promotionalOffers, setPromotionalOffers] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Hydrate local form state from context - matching PersonalInformation field names
  useEffect(() => {
    if (!personalDetail) return;
    setPersonalInfo({
      // Basic Information
      title: personalDetail?.personalInfo?.title || '',
      surname: personalDetail?.personalInfo?.surname || '',
      forename: personalDetail?.personalInfo?.forename || '',
      gender: personalDetail?.personalInfo?.gender || '',
      dob: personalDetail?.personalInfo?.dateOfBirth || '',
      primaryCountry: personalDetail?.personalInfo?.countryPrimaryQualification || '',
      
      // Consent
      consent: personalDetail?.contactInfo?.consent ?? true,
      
      // Address Information
      addressLine1: personalDetail?.contactInfo?.buildingOrHouse || '',
      addressLine2: personalDetail?.contactInfo?.streetOrRoad || '',
      addressLine3: personalDetail?.contactInfo?.areaOrTown || '',
      addressLine4: personalDetail?.contactInfo?.countyCityOrPostCode || '',
      eircode: personalDetail?.contactInfo?.eircode || '',
      preferredAddress: personalDetail?.contactInfo?.preferredAddress || '',
      country: personalDetail?.contactInfo?.country || '',
      
      // Contact Information
      mobileNo: personalDetail?.contactInfo?.mobileNumber || '',
      workTel: personalDetail?.contactInfo?.telephoneNumber || '',
      preferredEmail: personalDetail?.contactInfo?.preferredEmail || '',
      personalEmail: personalDetail?.contactInfo?.personalEmail || '',
      workEmail: personalDetail?.contactInfo?.workEmail || '',
    });
  }, [personalDetail]);

  const handleCancel = () => {
    // Reset to server values
    if (!personalDetail) return;
    setPersonalInfo(prev => ({ ...prev }));
    Alert.alert('Cancelled', 'Changes discarded');
  };

  const handleSave = async () => {
    if (!applicationId) { Alert.alert('Error', 'Missing application id.'); return; }
    setLoading(true);
    try {
      const personalInfoPayload = {};
      const personalFields = {
        title: personalInfo.title,
        surname: personalInfo.surname,
        forename: personalInfo.forename,
        gender: personalInfo.gender,
        dateOfBirth: personalInfo.dob,
        countryPrimaryQualification: personalInfo.primaryCountry,
      };
      personalInfoPayload.personalInfo = {};
      Object.entries(personalFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') personalInfoPayload.personalInfo[k] = v; });

      const contactFields = {
        preferredAddress: personalInfo.preferredAddress ? personalInfo.preferredAddress.toLowerCase() : personalInfo.preferredAddress,
        eircode: personalInfo.eircode,
        buildingOrHouse: personalInfo.addressLine1,
        streetOrRoad: personalInfo.addressLine2,
        areaOrTown: personalInfo.addressLine3,
        countyCityOrPostCode: personalInfo.addressLine4,
        country: personalInfo.country,
        mobileNumber: personalInfo.mobileNo,
        telephoneNumber: personalInfo.workTel,
        preferredEmail: personalInfo.preferredEmail ? personalInfo.preferredEmail.toLowerCase() : personalInfo.preferredEmail,
        personalEmail: personalInfo.personalEmail,
        workEmail: personalInfo.workEmail,
        consent: personalInfo.consent,
      };
      personalInfoPayload.contactInfo = {};
      Object.entries(contactFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') personalInfoPayload.contactInfo[k] = v; });

      const res = await updatePersonalDetailRequest(applicationId, personalInfoPayload);
      if (res?.status === 200) {
        Alert.alert('Success', 'Personal detail updated');
        getPersonalDetail?.();
        setShowPersonalInfoForm(false);
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to update personal detail');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
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
              
              // Remove tokens, user data, and verifier from storage
              await deleteHeaders();
              await deleteUser();
              await deleteVerifier();
              
              // Sign out from Azure B2C
              await signOutFromAzureB2C();
              
              // Navigate to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        {/* Header */}
        <ScreenHeader title="Profile" />

        <ScrollView contentContainerStyle={{ paddingBottom: hp(12) }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Profile Header Card */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} 
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="pencil" size={14} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>
              {`${personalInfo?.forename || ''} ${personalInfo?.surname || ''}`.trim() || 'User Name'}
            </Text>
            <Text style={styles.profileId}>Member ID: 12345678</Text>
          </View>

          {/* Personal Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
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
                  {`${personalInfo?.title || ''} ${personalInfo?.forename || ''} ${personalInfo?.surname || ''}`.trim() || '—'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
              <View style={styles.listItemIcon}>
                <Ionicons name="mail-outline" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>Email Address</Text>
                <Text style={styles.listItemValue} numberOfLines={1}>
                  {personalInfo?.personalEmail || personalInfo?.workEmail || '—'}
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
                <Text style={styles.listItemValue}>Gold Tier</Text>
              </View>
            </View>

            <View style={styles.listItem}>
              <View style={styles.listItemIcon}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>Membership Status</Text>
                <Text style={styles.listItemValue}>Renews on Dec 31, 2024</Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
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
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
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
