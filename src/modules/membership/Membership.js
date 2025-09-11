import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Wrapper } from '../../common/wrapper';
import { commonStyles, Colors, wp, hp } from '../../utils/Styles';
import Picker from '../../common/picker';
import { InputField } from '../../common/inputField';
import { DatePicker } from '../../common/DatePicker';
import { Button } from '../../common/button';
import { useApplication } from '../../contexts/applicationContext';
import { updateProfessionalDetailRequest } from '../../api/application.api';

const membershipCategoryOptions = [
  { value: 'general', label: 'General (all grades)' },
  { value: 'postgraduate_student', label: 'Postgraduate Student' },
  { value: 'short_term_relief', label: 'Short-term/ Relief (under 15 hrs/wk average)' },
  { value: 'private_nursing_home', label: 'Private nursing home' },
  { value: 'affiliate_non_practicing', label: 'Affiliate members (non-practicing)' },
  { value: 'lecturing', label: 'Lecturing (employed in universities and IT institutes)' },
  { value: 'associate', label: 'Associate (not currently employed as a nurse/midwife)' },
  { value: 'retired_associate', label: 'Retired Associate' },
  { value: 'undergraduate_student', label: 'Undergraduate Student' },
];

const Membership = () => {
  const { personalDetail, professionalDetail } = useApplication?.() || {};
  const existing = professionalDetail?.professionalDetails || {};
  const applicationId = personalDetail?.ApplicationId;

  const [form, setForm] = useState({
    membershipCategory: '',
    studyLocation: '',
    graduationDate: '',
    retiredDate: '',
    pensionNo: '',
  });

  useEffect(() => {
    setForm({
      membershipCategory: existing.membershipCategory || '',
      studyLocation: existing.studyLocation || '',
      graduationDate: existing.graduationDate || '',
      retiredDate: existing.retiredDate || '',
      pensionNo: existing.pensionNo || '',
    });
  }, [existing.membershipCategory, existing.studyLocation, existing.graduationDate, existing.retiredDate, existing.pensionNo]);

  const onChangeField = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (!form.membershipCategory) {
      Alert.alert('Validation', 'Please select a membership category');
      return;
    }
    if (!applicationId) {
      Alert.alert('Error', 'Missing application id. Try again later.');
      return;
    }
    try {
      const payload = {
        professionalDetails: {
          membershipCategory: form.membershipCategory,
          studyLocation: form.studyLocation,
          graduationDate: form.graduationDate,
          retiredDate: form.retiredDate,
          pensionNo: form.pensionNo,
          isRetired: form.membershipCategory === 'retired_associate',
        },
      };
      const res = await updateProfessionalDetailRequest(applicationId, payload);
      if (res?.status === 200) {
        Alert.alert('Success', 'Membership category updated successfully');
      } else {
        Alert.alert('Error', res?.data?.message || 'Update failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const getMembershipCategoryLabel = (value) => {
    const option = membershipCategoryOptions.find(opt => opt.value === value);
    return option ? option.label : value || 'N/A';
  };

  return (
    <Wrapper style={commonStyles.screenContainer} title={'Membership'} showBack={false}>
      <View style={styles.container}>
        {/* Current category */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.cardTitle}>Current Membership Category</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getMembershipCategoryLabel(existing.membershipCategory) ? 'Active' : '—'}</Text>
            </View>
          </View>
          <Text style={styles.cardRowLabel}>Membership Category</Text>
          <Text style={styles.cardRowValue}>{getMembershipCategoryLabel(existing.membershipCategory)}</Text>
        </View>

        {/* Update form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Update Membership Category</Text>
          <Text style={styles.label}>Membership Category</Text>
          <View style={styles.pickerField}>
            <Picker
              selectedValue={form.membershipCategory}
              onValueChange={(val) => onChangeField({ membershipCategory: val })}
            >
              <Picker.Item label="Select membership category" value="" />
              {membershipCategoryOptions.map(opt => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </Picker>
          </View>
          <Text style={styles.helper}>Some selections may require contacting our Membership team.</Text>

          {form.membershipCategory === 'undergraduate_student' && (
            <View>
              <Text style={styles.label}>Study Location</Text>
              <View style={styles.pickerField}>
                <Picker
                  selectedValue={form.studyLocation}
                  onValueChange={(val) => onChangeField({ studyLocation: val })}
                >
                  <Picker.Item label="Select study location" value="" />
                  <Picker.Item label="Location 1" value="location1" />
                  <Picker.Item label="Location 2" value="location2" />
                  <Picker.Item label="Location 3" value="location3" />
                </Picker>
              </View>
              <Text style={styles.label}>Graduation Date</Text>
              <DatePicker
                name="graduationDate"
                value={form.graduationDate}
                onChange={({ target }) => onChangeField({ graduationDate: target.value })}
                disableAgeValidation
              />
            </View>
          )}

          {form.membershipCategory === 'retired_associate' && (
            <View>
              <Text style={styles.label}>Retired Date</Text>
              <DatePicker
                name="retiredDate"
                value={form.retiredDate}
                onChange={({ target }) => onChangeField({ retiredDate: target.value })}
                disableAgeValidation
              />
              <Text style={styles.label}>Pension No</Text>
              <View style={styles.inputField}>
                <InputField
                  value={form.pensionNo}
                  onChange={(txt) => onChangeField({ pensionNo: txt })}
                  placeholder="Enter your pension number"
                  holderTextColor={'#94A3B8'}
                />
              </View>
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <Button title="Update Membership Category" onPress={handleSubmit} primary style={styles.primaryBtn} textStyle={{ fontSize: hp(2), fontWeight: '700' }} />
          </View>
        </View>
      </View>
    </Wrapper>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#1A1F23',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2A2F33',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cardTitle: { color: Colors.white, fontWeight: '700', marginBottom: 10, fontSize: hp(2.2) },
  cardRowLabel: { color: '#93A1A1', fontSize: 12 },
  cardRowValue: { color: Colors.white, fontWeight: '600', marginTop: 6 },
  label: { color: Colors.white, fontWeight: '600', marginTop: 10 },
  helper: { color: '#93A1A1', fontSize: 12, marginTop: 6 },
  inputField: { marginTop: 6 },
  pickerField: { marginTop: 6, marginBottom: 6 },
  badge: { backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  primaryBtn: { marginTop: 4, borderRadius: 14, height: 48 },
});

export default Membership;