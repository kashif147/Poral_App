import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import { Wrapper } from '../../common/wrapper';
import { commonStyles } from '../../utils/Styles';
import PersonalInformation from '../application/PersonalInformation';
import { Button } from '../../common/button';
import { useApplication } from '../../contexts/applicationContext';
import { updatePersonalDetailRequest } from '../../api/application.api';
import { format } from 'date-fns';

const Profile = () => {
  const { personalDetail, getPersonalDetail } = useApplication();
  const applicationId = personalDetail?.ApplicationId;

  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({});

  // Hydrate local form state from context
  useEffect(() => {
    if (!personalDetail) return;
    setPersonalInfo({
      title: personalDetail?.personalInfo?.title || '',
      surname: personalDetail?.personalInfo?.surname || '',
      forename: personalDetail?.personalInfo?.forename || '',
      gender: personalDetail?.personalInfo?.gender || '',
      dob: personalDetail?.personalInfo?.dateOfBirth || '',
      countryPrimaryQualification: personalDetail?.personalInfo?.countryPrimaryQualification || '',
      personalEmail: personalDetail?.contactInfo?.personalEmail || '',
      mobileNo: personalDetail?.contactInfo?.mobileNumber || '',
      consent: personalDetail?.contactInfo?.consent ?? true,
      addressLine1: personalDetail?.contactInfo?.buildingOrHouse || '',
      addressLine2: personalDetail?.contactInfo?.streetOrRoad || '',
      addressLine3: personalDetail?.contactInfo?.areaOrTown || '',
      addressLine4: personalDetail?.contactInfo?.countyCityOrPostCode || '',
      eircode: personalDetail?.contactInfo?.eircode || '',
      preferredAddress: personalDetail?.contactInfo?.preferredAddress || '',
      preferredEmail: personalDetail?.contactInfo?.preferredEmail || '',
      homeWorkTelNo: personalDetail?.contactInfo?.telephoneNumber || '',
      country: personalDetail?.contactInfo?.country || '',
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
        countryPrimaryQualification: personalInfo.countryPrimaryQualification,
      };
      personalInfoPayload.personalInfo = {};
      Object.entries(personalFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') personalInfoPayload.personalInfo[k] = v; });

      const contactFields = {
        preferredAddress: personalInfo.preferredAddress,
        eircode: personalInfo.eircode,
        buildingOrHouse: personalInfo.addressLine1,
        streetOrRoad: personalInfo.addressLine2,
        areaOrTown: personalInfo.addressLine3,
        countyCityOrPostCode: personalInfo.addressLine4,
        country: personalInfo.country,
        mobileNumber: personalInfo.mobileNo,
        telephoneNumber: personalInfo.homeWorkTelNo,
        preferredEmail: personalInfo.preferredEmail,
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
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to update personal detail');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper style={commonStyles.screenContainer} title={'Profile'} showBack={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        <ScrollView contentContainerStyle={{ paddingVertical: 16, paddingBottom: hp(8), gap: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header card */}
          <View style={styles.cardHeader}>
            <View style={styles.avatarCircle}>
              <Text style={{ color: Colors.white, fontWeight: '700', fontSize: hp(2.2) }}>
                {String(personalInfo?.forename || 'U').charAt(0)}
              </Text>
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.nameText}>{`${personalInfo?.forename || ''} ${personalInfo?.surname || ''}`.trim() || '—'}</Text>
              <Text style={styles.subText}>{personalInfo?.personalEmail || personalInfo?.workEmail || 'No email'}</Text>
            </View>
          </View>

          {/* Personal Information form */}
          <View style={styles.cardBody}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <PersonalInformation
              formData={personalInfo}
              onFormDataChange={setPersonalInfo}
              showValidation={false}
            />
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <Button title={loading ? 'Saving…' : 'Save'} onPress={handleSave} primary style={{ flex: 1, marginRight: 8 }} />
              <Button title={'Cancel'} onPress={handleCancel} outlined style={{ flex: 1, marginLeft: 8 }} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 16, gap: 16 },
  cardHeader: {
    backgroundColor: '#1A1F23',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2F33',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  nameText: { color: Colors.white, fontWeight: '700', fontSize: hp(2.2) },
  subText: { color: '#93A1A1', marginTop: 2 },
  cardBody: {
    backgroundColor: '#1A1F23',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2F33',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  sectionTitle: { color: Colors.white, fontWeight: '700', marginBottom: 10, fontSize: hp(2.2) },
});

export default Profile;
