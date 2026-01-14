import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApplication } from '../../contexts/applicationContext';
import { useLookup } from '../../contexts/lookupContext';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import CheckboxWithLabel from '../../common/checkbox/CheckboxWithLabel';
import { Button } from '../../common/button';
import { Colors, hp, wp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';

const DirectDebit = () => {
  const { personalDetail, subscriptionDetail, categoryData, getCategoryData } = useApplication();
  const { categoryLookups } = useLookup();
  const ibanInputRef = useRef(null);
  const [user, setUser] = useState(null);

  // Get category data
  const membershipCategory =
    subscriptionDetail?.subscriptionDetails?.membershipCategory;

  // Form state
  const [formState, setFormState] = useState({
    bankName: '',
    branchAddress: '',
    authorization: false,
    accountHolderName: '',
    accountNumber: '',
    bic: '',
    iban: '',
    personalAddress: '',
    personalTelephone: '',
    personalEmail: '',
  });

  const [showValidation, setShowValidation] = useState(false);
  const [ibanError, setIbanError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Load user data
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

  // Bank list
  const bankOptions = [
    { value: 'AIB', label: 'Allied Irish Banks (AIB)' },
    { value: 'BOI', label: 'Bank of Ireland' },
    { value: 'ULSTER', label: 'Ulster Bank' },
    { value: 'PERMANENT', label: 'Permanent TSB' },
    { value: 'KBC', label: 'KBC Bank' },
    { value: 'REVOLUT', label: 'Revolut' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Beneficiary details (hardcoded)
  const beneficiaryDetails = {
    accountName: 'Global Services Ltd.',
    iban: 'GB12 CPBK 9876 5432 1098 76',
    reference: `REF: MEM-2023-${user?.id || '0000'}`,
  };

  // Fetch category data
  useEffect(() => {
    if (membershipCategory) {
      getCategoryData(membershipCategory, categoryLookups || []);
    }
  }, [membershipCategory, categoryLookups, getCategoryData]);

  // Auto-populate user data
  useEffect(() => {
    if (!personalDetail && !user) return;

    // Account Holder Name
    const accountHolderName =
      personalDetail?.personalInfo?.forename &&
      personalDetail?.personalInfo?.surname
        ? `${personalDetail.personalInfo.forename} ${personalDetail.personalInfo.surname}`
        : user?.userFirstName && user?.userLastName
        ? `${user.userFirstName} ${user.userLastName}`
        : user?.userName || '';

    // Personal Address
    const contactInfo = personalDetail?.contactInfo || {};
    const addressParts = [
      contactInfo.buildingOrHouse,
      contactInfo.streetOrRoad,
      contactInfo.areaOrTown,
      contactInfo.countyCityOrPostCode,
    ].filter(Boolean);
    const personalAddress = addressParts.join(', ') || '';

    // Personal Telephone
    const personalTelephone =
      contactInfo.mobileNumber || user?.userMobilePhone || '';

    // Personal Email
    const personalEmail =
      contactInfo.personalEmail || user?.userEmail || '';

    setFormState(prev => ({
      ...prev,
      accountHolderName,
      personalAddress,
      personalTelephone,
      personalEmail,
    }));
  }, [personalDetail, user]);

  // Auto-populate branch address based on bank selection
  useEffect(() => {
    if (formState.bankName) {
      const branchAddresses = {
        AIB: '123 Financial District, London, EC1A 1BB, United Kingdom',
        BOI: '15 Grafton St, Dublin, Ireland',
        ULSTER: '20 College Green, Dublin, Ireland',
        PERMANENT: "25 O'Connell St, Dublin, Ireland",
        KBC: '30 Dame St, Dublin, Ireland',
        REVOLUT: 'Online Banking',
        OTHER: 'Please enter branch address',
      };
      setFormState(prev => ({
        ...prev,
        branchAddress: branchAddresses[formState.bankName] || '',
      }));
    }
  }, [formState.bankName]);

  // IBAN formatting function - adds spaces every 4 characters
  const formatIBAN = (value, cursorPosition = null) => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    let cursorInCleaned = cursorPosition;
    if (cursorPosition !== null && cursorPosition >= 0) {
      const beforeCursor = value.substring(0, cursorPosition);
      const spacesBefore = (beforeCursor.match(/\s/g) || []).length;
      cursorInCleaned = Math.max(0, cursorPosition - spacesBefore);
    }
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    if (
      cursorPosition !== null &&
      cursorInCleaned !== null &&
      cursorInCleaned >= 0
    ) {
      const groupsBeforeCursor = Math.floor(Math.max(0, cursorInCleaned) / 4);
      const newCursorPosition = Math.min(
        cursorInCleaned + groupsBeforeCursor,
        formatted.length,
      );
      return { formatted, cursorPosition: Math.max(0, newCursorPosition) };
    }
    return { formatted, cursorPosition: null };
  };

  // IBAN validation function
  const validateIBAN = iban => {
    if (!iban) return { isValid: false, message: 'IBAN is required' };
    const cleaned = iban.replace(/\s/g, '');
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    if (!ibanRegex.test(cleaned)) {
      return {
        isValid: false,
        message: 'Invalid IBAN format. Format: CC00 XXXX XXXX XXXX...',
      };
    }
    if (cleaned.length < 15 || cleaned.length > 34) {
      return {
        isValid: false,
        message: 'IBAN must be between 15 and 34 characters',
      };
    }
    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
    const numericString = rearranged
      .split('')
      .map(char => {
        const code = char.charCodeAt(0);
        return code >= 65 && code <= 90 ? code - 55 : char;
      })
      .join('');
    let remainder = '';
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder + numericString[i]) % 97;
    }
    if (remainder !== 1) {
      return {
        isValid: false,
        message: 'Invalid IBAN check digits',
      };
    }
    return { isValid: true, message: '' };
  };

  // Email validation
  const validateEmail = email => {
    if (!email) return { isValid: false, message: 'Email is required' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Invalid email format' };
    }
    return { isValid: true, message: '' };
  };

  const handleInputChange = (value, index, field) => {
    if (field === 'iban') {
      const { formatted } = formatIBAN(value);
      setFormState(prev => ({
        ...prev,
        iban: formatted,
      }));
      if (formatted) {
        const validation = validateIBAN(formatted);
        if (validation.isValid) {
          setIbanError('');
        } else {
          if (formatted.replace(/\s/g, '').length > 4) {
            setIbanError(validation.message);
          } else {
            setIbanError('');
          }
        }
      } else {
        setIbanError('');
      }
      return;
    }

    if (field === 'personalEmail') {
      setFormState(prev => ({
        ...prev,
        personalEmail: value,
      }));
      if (value) {
        const validation = validateEmail(value);
        if (validation.isValid) {
          setEmailError('');
        } else {
          setEmailError(validation.message);
        }
      } else {
        setEmailError('');
      }
      return;
    }

    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePickerChange = (field, value) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formState.bankName) return false;
    if (!formState.branchAddress) return false;
    if (!formState.authorization) return false;
    if (!formState.accountHolderName) return false;
    if (!formState.accountNumber) return false;
    if (!formState.iban) return false;
    const ibanValidation = validateIBAN(formState.iban);
    if (!ibanValidation.isValid) {
      setIbanError(ibanValidation.message);
      return false;
    }
    setIbanError('');
    if (!formState.personalAddress) return false;
    if (!formState.personalTelephone) return false;
    if (!formState.personalEmail) return false;
    const emailValidation = validateEmail(formState.personalEmail);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message);
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleConfirm = () => {
    setShowValidation(true);
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const formData = {
      ...formState,
      beneficiaryDetails,
      totalAmount: categoryData?.currentPricing?.price
        ? categoryData.currentPricing.price / 100
        : 0,
      currency: categoryData?.currentPricing?.currency || 'EUR',
    };

    console.log('Direct Debit Form Data:', formData);
    Alert.alert('Success', 'Direct Debit authorization submitted successfully!');
  };

  // Calculate total amount
  const totalAmount = categoryData?.currentPricing?.price
    ? categoryData.currentPricing.price / 100
    : 0;
  const currency = categoryData?.currentPricing?.currency || 'EUR';
  const currencySymbol = currency.toUpperCase() === 'EUR' ? '€' : currency;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Your Account Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="card-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Your Account Details</Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Bank Name {showValidation && !formState.bankName && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <Picker
              selectedValue={formState.bankName}
              onValueChange={value => handlePickerChange('bankName', value)}
              enabled={true}>
              <Picker.Item label="Select your bank..." value="" />
              {bankOptions.map(option => (
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
              Branch Address {showValidation && !formState.branchAddress && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.branchAddress}
              onChange={handleInputChange}
              field="branchAddress"
              placeholder="Auto-populated from system"
              editable={false}
            />
          </View>

          <View style={styles.checkboxContainer}>
            <CheckboxWithLabel
              label="Authorization Declaration"
              checked={formState.authorization}
              onPress={() =>
                setFormState(prev => ({
                  ...prev,
                  authorization: !prev.authorization,
                }))
              }
              required={true}
              showValidation={showValidation}
            />
            <Text style={styles.checkboxDescription}>
              By signing up to this form, I have authorised a recurring debit
              to my bank account.
            </Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Account Holder Name {showValidation && !formState.accountHolderName && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.accountHolderName}
              onChange={handleInputChange}
              field="accountHolderName"
              placeholder="e.g. John Doe"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Account Number {showValidation && !formState.accountNumber && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.accountNumber}
              onChange={handleInputChange}
              field="accountNumber"
              placeholder="e.g. 12345678"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>BIC (Swift Code)</Text>
            <InputField
              value={formState.bic}
              onChange={handleInputChange}
              field="bic"
              placeholder="e.g. ABCDGB22"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              IBAN {showValidation && !formState.iban && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              TextInputRef={ibanInputRef}
              value={formState.iban}
              onChange={handleInputChange}
              field="iban"
              placeholder="GB29 ABCD 1234 5678 9012 34"
              maxLength={34}
              autoCapitalize="characters"
            />
            {ibanError && (
              <Text style={styles.errorText}>{ibanError}</Text>
            )}
            {formState.iban && !ibanError && (
              <Text style={styles.successText}>Valid IBAN format</Text>
            )}
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Personal Address {showValidation && !formState.personalAddress && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.personalAddress}
              onChange={handleInputChange}
              field="personalAddress"
              placeholder="Auto-populated from profile"
              editable={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Personal Telephone {showValidation && !formState.personalTelephone && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.personalTelephone}
              onChange={handleInputChange}
              field="personalTelephone"
              placeholder="Auto-populated from profile"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Personal Email {showValidation && !formState.personalEmail && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.personalEmail}
              onChange={handleInputChange}
              field="personalEmail"
              placeholder="Auto-populated from profile"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailError && (
              <Text style={styles.errorText}>{emailError}</Text>
            )}
            {formState.personalEmail && !emailError && (
              <Text style={styles.successText}>Valid email format</Text>
            )}
          </View>
        </View>

        {/* Beneficiary Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.fruitSalad + '20' }]}>
              <Ionicons name="people-outline" size={24} color={Colors.fruitSalad} />
            </View>
            <Text style={styles.sectionTitle}>Beneficiary Details</Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Account Name</Text>
            <InputField
              value={beneficiaryDetails.accountName}
              editable={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>IBAN</Text>
            <InputField
              value={beneficiaryDetails.iban}
              editable={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Receiver Message (Reference)</Text>
            <InputField
              value={beneficiaryDetails.reference}
              editable={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Total Amount</Text>
            <View style={styles.totalAmountContainer}>
              <Text style={styles.totalAmountText}>
                {currencySymbol}{totalAmount.toFixed(2)} {currency}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Confirm Direct Debit"
            onPress={handleConfirm}
            primary
            style={styles.confirmButton}
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
  checkboxContainer: {
    marginVertical: hp(1.5),
    padding: wp(4),
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  checkboxDescription: {
    fontSize: hp(1.4),
    color: Colors.textSecondary,
    marginTop: hp(1),
    marginLeft: wp(9),
  },
  errorText: {
    color: Colors.red,
    fontSize: hp(1.4),
    marginTop: hp(0.5),
  },
  successText: {
    color: Colors.fruitSalad,
    fontSize: hp(1.4),
    marginTop: hp(0.5),
  },
  totalAmountContainer: {
    padding: wp(4),
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  totalAmountText: {
    fontSize: hp(2),
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  confirmButton: {
    marginBottom: hp(1),
  },
});

export default DirectDebit;
