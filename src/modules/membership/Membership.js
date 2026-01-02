import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import Picker from '../../common/picker';
import { InputField } from '../../common/inputField';
import { DatePicker } from '../../common/DatePicker';
import { Button } from '../../common/button';
import { useApplication } from '../../contexts/applicationContext';
import { updateProfessionalDetailRequest } from '../../api/application.api';
import ScreenHeader from '../../common/screenHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  const applicationId = personalDetail?.applicationId;

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
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <ScreenHeader title="Membership" />

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Membership Category Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Current Membership</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <View style={styles.infoCardIcon}>
                  <Ionicons name="medal-outline" size={24} color={Colors.primary} />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>Membership Category</Text>
                  <Text style={styles.infoCardValue}>
                    {getMembershipCategoryLabel(existing.membershipCategory)}
                  </Text>
                </View>
                {existing.membershipCategory && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Active</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Update Membership Category Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Update Membership Category</Text>
            
            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Membership Category *</Text>
                <View style={styles.pickerContainer}>
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
                <Text style={styles.helperText}>
                  Some selections may require contacting our Membership team.
                </Text>
              </View>

              {/* Undergraduate Student Fields */}
              {form.membershipCategory === 'undergraduate_student' && (
                <View style={styles.conditionalFields}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Study Location</Text>
                    <View style={styles.pickerContainer}>
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
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Graduation Date</Text>
                    <DatePicker
                      name="graduationDate"
                      value={form.graduationDate}
                      onChange={({ target }) => onChangeField({ graduationDate: target.value })}
                      disableAgeValidation
                    />
                  </View>
                </View>
              )}

              {/* Retired Associate Fields */}
              {form.membershipCategory === 'retired_associate' && (
                <View style={styles.conditionalFields}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Retired Date</Text>
                    <DatePicker
                      name="retiredDate"
                      value={form.retiredDate}
                      onChange={({ target }) => onChangeField({ retiredDate: target.value })}
                      disableAgeValidation
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Pension No</Text>
                    <View style={styles.inputContainer}>
                      <InputField
                        value={form.pensionNo}
                        onChange={(txt) => onChangeField({ pensionNo: txt })}
                        placeholder="Enter your pension number"
                        holderTextColor={Colors.textSecondary}
                      />
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <Button 
                  title="Update Membership Category" 
                  onPress={handleSubmit} 
                  primary 
                  style={styles.submitButton} 
                  textStyle={styles.submitButtonText} 
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: hp(12),
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.Gray88,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: Colors.fruitSalad,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.Gray88,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: Colors.lightgrey,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.Gray88,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  conditionalFields: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.Gray88,
  },
  inputContainer: {
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 12,
    height: 52,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: hp(2),
    fontWeight: '700',
  },
});

export default Membership;