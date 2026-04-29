import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApplication } from '../../contexts/applicationContext';
import { useProfile } from '../../contexts/profileContext';
import { useLookup } from '../../contexts/lookupContext';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import DatePicker from '../../common/DatePicker';
import SignaturePad from '../../common/signaturePad';
import { Button } from '../../common/button';
import { Colors, hp, wp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MONTHLY_DEDUCTION_AMOUNT = '19.00';

const SalaryDeduction = () => {
  const { personalDetail, professionalDetail, subscriptionDetail } = useApplication();
  const { profileDetail } = useProfile();
  const { workLocationLookups } = useLookup();
  const [user, setUser] = useState(null);

  const [formState, setFormState] = useState({
    name: '',
    employedAt: '',
    inmoNo: '',
    payrollStaffNo: '',
    commencing: '',
    signature: null,
    date: '',
  });
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        setUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const name =
      personalDetail?.personalInfo?.forename && personalDetail?.personalInfo?.surname
        ? `${personalDetail.personalInfo.forename} ${personalDetail.personalInfo.surname}`
        : user?.userFirstName && user?.userLastName
        ? `${user.userFirstName} ${user.userLastName}`
        : user?.userName || '';

    const inmoNo =
      profileDetail?.membershipNumber ||
      personalDetail?.personalInfo?.membershipNumber ||
      personalDetail?.membershipNumber ||
      personalDetail?.memberNumber ||
      '';

    const employedAt =
      professionalDetail?.professionalDetails?.workLocation ||
      professionalDetail?.workLocation ||
      '';

    const payrollStaffNo =
      subscriptionDetail?.subscriptionDetails?.payrollNo ||
      subscriptionDetail?.payrollNo ||
      '';

    setFormState(prev => ({
      ...prev,
      name,
      inmoNo: inmoNo ? String(inmoNo) : '',
      employedAt: employedAt ? String(employedAt) : '',
      payrollStaffNo: payrollStaffNo ? String(payrollStaffNo) : '',
    }));
  }, [personalDetail, professionalDetail, profileDetail, subscriptionDetail, user]);

  const workLocationOptions = useMemo(() => {
    const mappedWorkLocations = (workLocationLookups || [])
      .map(item => item?.lookup?.DisplayName || item?.lookup?.lookupname || '')
      .filter(Boolean);
    const uniqueWorkLocations = Array.from(new Set(mappedWorkLocations));
    const baseOptions = uniqueWorkLocations.map(name => ({
      value: name,
      label: name,
    }));

    if (
      formState.employedAt &&
      !baseOptions.some(option => option.value === formState.employedAt)
    ) {
      return [{ value: formState.employedAt, label: formState.employedAt }, ...baseOptions];
    }

    return baseOptions;
  }, [formState.employedAt, workLocationLookups]);

  const handleInputChange = (value, index, field) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = e => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignatureChange = signature => {
    setFormState(prev => ({
      ...prev,
      signature,
    }));
  };

  const validateForm = () => {
    return (
      !!formState.name &&
      !!formState.employedAt &&
      !!formState.inmoNo &&
      !!formState.payrollStaffNo &&
      !!formState.commencing &&
      !!formState.signature &&
      !!formState.date
    );
  };

  const handleSave = () => {
    setShowValidation(true);
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    console.log('Salary Deduction Data:', formState);
    Alert.alert('Success', 'Salary Deduction form saved successfully!');
  };

  const isFormValid = validateForm();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Salary Deduction Authorization</Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Name {showValidation && !formState.name && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.name}
              onChange={handleInputChange}
              field="name"
              placeholder="Block capitals"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Employed At {showValidation && !formState.employedAt && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <Picker
              selectedValue={formState.employedAt}
              onValueChange={value => handleInputChange(value, null, 'employedAt')}
              enabled={true}>
              <Picker.Item label="Select work location" value="" />
              {workLocationOptions.map(option => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Org No {showValidation && !formState.inmoNo && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.inmoNo}
              onChange={handleInputChange}
              field="inmoNo"
              placeholder="Membership number"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Payroll / Staff No {showValidation && !formState.payrollStaffNo && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.payrollStaffNo}
              onChange={handleInputChange}
              field="payrollStaffNo"
              placeholder="Enter payroll or staff number"
            />
          </View>

          <DatePicker
            label="Commencing"
            name="commencing"
            required={true}
            value={formState.commencing}
            onChange={handleDateChange}
            showValidation={showValidation}
            disableAgeValidation={true}
          />


          <View style={styles.signatureField}>
            <Text style={styles.signatureLabel}>
              Signature {showValidation && !formState.signature && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <SignaturePad
              label=""
              onSignatureChange={handleSignatureChange}
              value={formState.signature}
              required={true}
              showValidation={showValidation}
            />
          </View>

          <DatePicker
            label="Date"
            name="date"
            required={true}
            value={formState.date}
            onChange={handleDateChange}
            showValidation={showValidation}
            disableAgeValidation={true}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Save Authorization"
            onPress={handleSave}
            primary
            disabled={!isFormValid && showValidation}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(4),
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  formField: {
    marginBottom: hp(1.5),
  },
  label: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: hp(1),
  },
  requiredText: {
    color: Colors.red,
    fontSize: hp(1.4),
    fontWeight: '400',
  },
  signatureField: {
    marginBottom: hp(1.5),
  },
  signatureLabel: {
    fontSize: hp(1.4),
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: hp(1),
    textTransform: 'uppercase',
  },
  buttonContainer: {
    marginTop: hp(1),
    marginBottom: hp(2),
  },
});

export default SalaryDeduction;
