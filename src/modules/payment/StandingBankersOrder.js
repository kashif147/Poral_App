import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApplication } from '../../contexts/applicationContext';
import { useLookup } from '../../contexts/lookupContext';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import DatePicker from '../../common/DatePicker';
import CheckboxWithLabel from '../../common/checkbox/CheckboxWithLabel';
import SignaturePad from '../../common/signaturePad';
import { Button } from '../../common/button';
import { Colors, hp, wp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useProfile } from '../../contexts/profileContext';
import {
  createPortalPaymentForm,
  getPaymentFormPrefill,
  getPortalPaymentForm,
  submitPortalPaymentForm,
  updatePortalPaymentForm,
  uploadPortalPaymentSignature,
} from '../../api/paymentForms.api';

const PAYMENT_FORM_TYPE = 'STANDING_ORDER';
const isPaymentApiSuccess = response => response?.status >= 200 && response?.status < 300;
const getPaymentApiErrorMessage = (response, fallback) => {
  const data = response?.data;
  if (!data) return response?.status ? `${fallback} (HTTP ${response.status})` : fallback;
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (typeof data.error === 'string') return data.error;
  return fallback;
};
const shouldRetryCreateAsPatch = response => {
  const status = response?.status;
  const msg = getPaymentApiErrorMessage(response, '').toLowerCase();
  return (
    status === 409 ||
    status === 400 ||
    status === 422 ||
    msg.includes('already exist') ||
    msg.includes('duplicate')
  );
};
const extractPortalPaymentForm = response => {
  const body = response?.data;
  if (!body || typeof body !== 'object') return null;
  if (body._id || body.id || body.formType) return body;
  const nested = body.data;
  if (nested && typeof nested === 'object' && (nested._id || nested.id || nested.formType)) {
    return nested;
  }
  return null;
};
const getPortalFormId = form => (form ? form._id ?? form.id ?? null : null);
const extractPortalFormId = response => {
  const fromForm = getPortalFormId(extractPortalPaymentForm(response));
  if (fromForm) return fromForm;
  const body = response?.data;
  if (!body || typeof body !== 'object') return null;
  const findId = (obj, depth = 0) => {
    if (!obj || typeof obj !== 'object' || depth > 4) return null;
    if (typeof obj._id === 'string' && obj._id.length > 0) return obj._id;
    for (const value of Object.values(obj)) {
      const found = findId(value, depth + 1);
      if (found) return found;
    }
    return null;
  };
  return findId(body);
};
const portalFormHasExistingRecord = portalForm => {
  if (!portalForm) return false;
  if (portalForm.unsaved === true) return false;
  if (portalForm.formType && portalForm.formType !== PAYMENT_FORM_TYPE) return false;
  return Boolean(portalForm._id || portalForm.id);
};
const cleanIban = iban => (iban || '').replace(/\s/g, '').toUpperCase();
const toIsoDate = value => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};
const pickNonEmpty = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
};
const formatIbanForDisplay = iban => cleanIban(iban).replace(/(.{4})/g, '$1 ').trim();
const extractPrefillForm = response =>
  response?.data?.data?.paymentForm ?? response?.data?.paymentForm ?? null;
const mergeStandingOrderData = (activeForm, prefillForm) => {
  const active = activeForm?.standingOrder || {};
  const prefill = prefillForm?.standingOrder || {};
  const activeDates = Array.isArray(active.signatureDates) ? active.signatureDates : [];
  const prefillDates = Array.isArray(prefill.signatureDates) ? prefill.signatureDates : [];
  return {
    debtorBankName: pickNonEmpty(active.debtorBankName, prefill.debtorBankName),
    debtorBankAddress: pickNonEmpty(active.debtorBankAddress, prefill.debtorBankAddress),
    debtorAccountName: pickNonEmpty(active.debtorAccountName, prefill.debtorAccountName),
    debtorIban: pickNonEmpty(active.debtorIban, prefill.debtorIban),
    debtorBic: pickNonEmpty(active.debtorBic, prefill.debtorBic),
    startDate: pickNonEmpty(active.startDate, prefill.startDate),
    signatureDatePrimary: pickNonEmpty(activeDates[0], prefillDates[0]),
    signatureDateSecondary: pickNonEmpty(activeDates[1], prefillDates[1]),
  };
};

const StandingBankersOrder = () => {
  const { subscriptionDetail, categoryData, getCategoryData } = useApplication();
  const { categoryLookups } = useLookup();
  const { profileDetail } = useProfile();
  const ibanInputRef = useRef(null);
  const [user, setUser] = useState(null);

  // Get category data
  const membershipCategory =
    subscriptionDetail?.subscriptionDetails?.membershipCategory;
    const resolvedMembershipNumber =
    profileDetail?.membershipNumber ||
    profileDetail?.membershipId ||
    user?.membershipNumber ||
    user?.membershipId ||
    null;

  // Form state
  const [formState, setFormState] = useState({
    bankName: '',
    branchAddress: '',
    authorization: false,
    accountName: '',
    accountNumber: '',
    bic: '',
    iban: '',
    message: resolvedMembershipNumber || '',
    frequency: 'Monthly',
    amount: '',
    startDate: '',
    numberOfPayments: 'indefinite',
    specificNumberOfPayments: '',
    accountHolderSignature: null,
    accountHolderSignatureDate: '',
    secondSignature: null,
    secondSignatureDate: '',
  });

  const [showValidation, setShowValidation] = useState(false);
  const [ibanError, setIbanError] = useState('');
  const signatureDrawLockRef = useRef(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePortalForm, setActivePortalForm] = useState(null);
  const [prefillPortalForm, setPrefillPortalForm] = useState(null);
  const [hasPortalDataApplied, setHasPortalDataApplied] = useState(false);

  const handleSignatureDrawingActive = active => {
    if (active) {
      signatureDrawLockRef.current += 1;
    } else {
      signatureDrawLockRef.current = Math.max(0, signatureDrawLockRef.current - 1);
    }
    setScrollEnabled(signatureDrawLockRef.current === 0);
  };

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

  // Fetch category data
  useEffect(() => {
    if (membershipCategory) {
      getCategoryData(membershipCategory, categoryLookups || []);
    }
  }, [membershipCategory, categoryLookups, getCategoryData]);

  // Set form state when category data is loaded
  useEffect(() => {
    if (hasPortalDataApplied) return;
    if (categoryData?.currentPricing?.price && user) {
      const priceInEuros = categoryData.currentPricing.price / 100;
      setFormState(prev => ({
        ...prev,
        amount: priceInEuros.toFixed(2),
        accountName:
          user?.userFirstName && user?.userLastName
            ? `${user.userFirstName} ${user.userLastName}`
            : user?.userName || '',
      }));
    }
  }, [categoryData, user, hasPortalDataApplied]);

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

  // Frequency options
  const frequencyOptions = [
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Quarterly', label: 'Quarterly' },
    { value: 'Annually', label: 'Annually' },
  ];

  // Beneficiary details
  const beneficiaryDetails = {
    accountName: 'Irish Nurses and Midwives Organization (INMO)',
    iban: 'IE99 BOFI 9000 1234 5678 99',
    reference: `${resolvedMembershipNumber} || '0000'`,
  };

  // Auto-populate branch address based on bank selection
  useEffect(() => {
    if (hasPortalDataApplied) return;
    if (formState.bankName) {
      const branchAddresses = {
        AIB: '12 Main St, Dublin (Auto-filled)',
        BOI: '15 Grafton St, Dublin (Auto-filled)',
        ULSTER: '20 College Green, Dublin (Auto-filled)',
        PERMANENT: "25 O'Connell St, Dublin (Auto-filled)",
        KBC: '30 Dame St, Dublin (Auto-filled)',
        REVOLUT: 'Online Banking (Auto-filled)',
        OTHER: 'Please enter branch address',
      };
      setFormState(prev => ({
        ...prev,
        branchAddress: branchAddresses[formState.bankName] || '',
      }));
    }
  }, [formState.bankName, hasPortalDataApplied]);

  useEffect(() => {
    const loadPortalPrefillAndActive = async () => {
      try {
        const [activeRes, prefillRes] = await Promise.all([
          getPortalPaymentForm(),
          profileDetail?.profileId
            ? getPaymentFormPrefill(profileDetail.profileId)
            : Promise.resolve(null),
        ]);
        const activeForm = isPaymentApiSuccess(activeRes)
          ? extractPortalPaymentForm(activeRes)
          : null;
        const prefillForm =
          prefillRes && isPaymentApiSuccess(prefillRes)
            ? extractPrefillForm(prefillRes)
            : null;
        setActivePortalForm(activeForm);
        setPrefillPortalForm(prefillForm);
      } catch (error) {
        console.error('Failed to load standing order prefill/active form:', error);
      }
    };
    loadPortalPrefillAndActive();
  }, [profileDetail?.profileId]);

  useEffect(() => {
    const merged = mergeStandingOrderData(activePortalForm, prefillPortalForm);
    if (!Object.values(merged).some(Boolean)) return;

    setFormState(prev => ({
      ...prev,
      bankName: pickNonEmpty(merged.debtorBankName, prev.bankName),
      branchAddress: pickNonEmpty(merged.debtorBankAddress, prev.branchAddress),
      accountName: pickNonEmpty(merged.debtorAccountName, prev.accountName),
      iban: pickNonEmpty(formatIbanForDisplay(merged.debtorIban), prev.iban),
      bic: pickNonEmpty(merged.debtorBic, prev.bic),
      startDate: pickNonEmpty(merged.startDate, prev.startDate),
      accountHolderSignatureDate: pickNonEmpty(
        merged.signatureDatePrimary,
        prev.accountHolderSignatureDate,
      ),
      secondSignatureDate: pickNonEmpty(
        merged.signatureDateSecondary,
        prev.secondSignatureDate,
      ),
      authorization: true,
    }));
    setHasPortalDataApplied(true);
  }, [activePortalForm, prefillPortalForm]);

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

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignatureChange = (signatureType, signatureData) => {
    setFormState(prev => ({
      ...prev,
      [signatureType]: signatureData,
    }));
  };

  const validateForm = () => {
    if (!formState.bankName) return false;
    if (!formState.branchAddress) return false;
    if (!formState.authorization) return false;
    if (!formState.accountName) return false;
    if (!formState.accountNumber) return false;
    if (!formState.iban) return false;
    const ibanValidation = validateIBAN(formState.iban);
    if (!ibanValidation.isValid) {
      setIbanError(ibanValidation.message);
      return false;
    }
    setIbanError('');
    if (!formState.frequency) return false;
    if (!formState.amount) return false;
    if (!formState.startDate) return false;
    if (!formState.accountHolderSignature) return false;
    if (
      formState.numberOfPayments === 'specific' &&
      !formState.specificNumberOfPayments
    ) {
      return false;
    }
    return true;
  };

  const handleSaveOrder = async () => {
    setShowValidation(true);
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const signatureDates = [
      toIsoDate(formState.accountHolderSignatureDate),
      toIsoDate(formState.secondSignatureDate),
    ].filter(Boolean);

    const createPayload = {
      formType: PAYMENT_FORM_TYPE,
      standingOrder: {
        debtorBankName: formState.bankName,
        debtorBankAddress: formState.branchAddress,
        debtorAccountName: formState.accountName,
        debtorIban: cleanIban(formState.iban),
        debtorBic: formState.bic || '',
        startDate: toIsoDate(formState.startDate),
        signatureDates,
      },
      gdpr: {
        consentCapturedAt: new Date().toISOString(),
      },
    };
    const patchPayload = {
      standingOrder: createPayload.standingOrder,
      gdpr: createPayload.gdpr,
    };

    setIsSubmitting(true);
    try {
      const existingRes = await getPortalPaymentForm();
      const existingForm = isPaymentApiSuccess(existingRes)
        ? extractPortalPaymentForm(existingRes)
        : null;
      const hasExisting = portalFormHasExistingRecord(existingForm);

      let saveRes = hasExisting
        ? await updatePortalPaymentForm(patchPayload)
        : await createPortalPaymentForm(createPayload);

      if (!hasExisting && !isPaymentApiSuccess(saveRes) && shouldRetryCreateAsPatch(saveRes)) {
        saveRes = await updatePortalPaymentForm(patchPayload);
      }

      if (!isPaymentApiSuccess(saveRes)) {
        throw new Error(
          getPaymentApiErrorMessage(saveRes, 'Failed to save standing order form. Please try again.'),
        );
      }

      let formId = extractPortalFormId(saveRes) ?? getPortalFormId(existingForm);
      if (!formId) {
        const reloadRes = await getPortalPaymentForm();
        const reloadedForm = isPaymentApiSuccess(reloadRes)
          ? extractPortalPaymentForm(reloadRes)
          : null;
        formId = getPortalFormId(reloadedForm);
      }
      if (!formId) {
        throw new Error('Payment form was saved but no form id was returned. Please refresh and try again.');
      }

      const signatures = [
        {
          slot: 0,
          imageBase64: formState.accountHolderSignature,
          signedDate: toIsoDate(formState.accountHolderSignatureDate),
        },
        {
          slot: 1,
          imageBase64: formState.secondSignature,
          signedDate: toIsoDate(formState.secondSignatureDate),
        },
      ].filter(item => item.imageBase64);

      for (const sig of signatures) {
        const uploadRes = await uploadPortalPaymentSignature(formId, {
          imageBase64: sig.imageBase64,
          slot: sig.slot,
          signedDate: sig.signedDate,
        });
        if (!isPaymentApiSuccess(uploadRes)) {
          throw new Error(
            getPaymentApiErrorMessage(uploadRes, 'Failed to upload signature. Please try again.'),
          );
        }
      }

      const submitRes = await submitPortalPaymentForm(formId);
      if (!isPaymentApiSuccess(submitRes)) {
        throw new Error(
          getPaymentApiErrorMessage(submitRes, 'Failed to submit standing order form. Please try again.'),
        );
      }

      Alert.alert('Success', 'Standing order submitted successfully!');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to submit standing order form');
    } finally {
      setIsSubmitting(false);
    }
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
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled">
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
              label="I/We hereby authorise and request you to debit my/our account."
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
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Account Name {showValidation && !formState.accountName && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.accountName}
              onChange={handleInputChange}
              field="accountName"
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
            <Text style={styles.label}>BIC</Text>
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
              placeholder="IE00 BOFI 9000 0000 0000 00"
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
            <Text style={styles.label}>Your Message (Optional)</Text>
            <InputField
              value={formState.message}
              onChange={handleInputChange}
              field="message"
              placeholder="Optional message"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Beneficiary Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.fruitSalad + '20' }]}>
              <Ionicons name="people-outline" size={24} color={Colors.fruitSalad} />
            </View>
            <Text style={styles.sectionTitle}>Beneficiary (Receivers) Details</Text>
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
        </View>

        {/* Payment Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.orange + '20' }]}>
              <Ionicons name="cash-outline" size={24} color={Colors.orange} />
            </View>
            <Text style={styles.sectionTitle}>Payment Details</Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Frequency</Text>
            <Picker
              selectedValue={formState.frequency}
              onValueChange={value => handlePickerChange('frequency', value)}
              enabled={true}>
              {frequencyOptions.map(option => (
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
              Amount {showValidation && !formState.amount && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.amount}
              onChange={handleInputChange}
              field="amount"
              placeholder="€ 50.00"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formField}>
            <DatePicker
              label="Start Date"
              name="startDate"
              required={true}
              value={formState.startDate}
              onChange={handleDateChange}
              showValidation={showValidation}
              disableAgeValidation={true}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Number of Payments</Text>
            <View style={[
              styles.numberOfPaymentsContainer,
              formState.numberOfPayments === 'indefinite' && styles.numberOfPaymentsContainerActive,
              formState.numberOfPayments === 'specific' && formState.specificNumberOfPayments && styles.numberOfPaymentsContainerActive
            ]}>
              <TouchableOpacity
                style={styles.indefiniteOption}
                onPress={() =>
                  setFormState(prev => ({
                    ...prev,
                    numberOfPayments: 'indefinite',
                    specificNumberOfPayments: '',
                  }))
                }
                activeOpacity={0.7}>
                <CheckboxWithLabel
                  label="Indefinite"
                  checked={formState.numberOfPayments === 'indefinite'}
                  onPress={() =>
                    setFormState(prev => ({
                      ...prev,
                      numberOfPayments: 'indefinite',
                      specificNumberOfPayments: '',
                    }))
                  }
                />
              </TouchableOpacity>
              <Text style={styles.orText}>or</Text>
              <View style={styles.specificNumberOption}>
                <InputField
                  value={formState.specificNumberOfPayments}
                  onChange={(value) => {
                    handleInputChange(value, null, 'specificNumberOfPayments');
                    if (value && formState.numberOfPayments === 'indefinite') {
                      setFormState(prev => ({
                        ...prev,
                        numberOfPayments: 'specific',
                      }));
                    } else if (!value && formState.numberOfPayments === 'specific') {
                      setFormState(prev => ({
                        ...prev,
                        numberOfPayments: 'indefinite',
                      }));
                    }
                  }}
                  field="specificNumberOfPayments"
                  placeholder="#"
                  keyboardType="numeric"
                  editable={true}
                  bgStyle={[
                    styles.specificNumberInput,
                    formState.numberOfPayments === 'specific' && formState.specificNumberOfPayments && styles.specificNumberInputActive
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Signatures Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.orange + '20' }]}>
              <Ionicons name="create-outline" size={24} color={Colors.orange} />
            </View>
            <Text style={styles.sectionTitle}>Signatures</Text>
          </View>

          <View style={styles.signatureField}>
            <Text style={styles.signatureLabel}>
              Account Holder Signature
            </Text>
            <SignaturePad
              label=""
              onSignatureChange={signature =>
                handleSignatureChange('accountHolderSignature', signature)
              }
              value={formState.accountHolderSignature}
              required={true}
              showValidation={showValidation}
              onDrawingActiveChange={handleSignatureDrawingActive}
            />
            <DatePicker
              label="Date"
              name="accountHolderSignatureDate"
              value={formState.accountHolderSignatureDate}
              onChange={handleDateChange}
              disableAgeValidation={true}
            />
          </View>

          <View style={styles.signatureField}>
            <Text style={styles.signatureLabel}>
              Second Signature (If Joint)
            </Text>
            <SignaturePad
              label=""
              onSignatureChange={signature =>
                handleSignatureChange('secondSignature', signature)
              }
              value={formState.secondSignature}
              required={false}
              showValidation={showValidation}
              onDrawingActiveChange={handleSignatureDrawingActive}
            />
            <DatePicker
              label="Date"
              name="secondSignatureDate"
              value={formState.secondSignatureDate}
              onChange={handleDateChange}
              disableAgeValidation={true}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={isSubmitting ? 'Submitting...' : 'Save Order'}
            onPress={handleSaveOrder}
            primary
            disabled={isSubmitting || !isFormValid}
            style={styles.saveButton}
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
  numberOfPaymentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    padding: wp(4),
    backgroundColor: Colors.lightgrey,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.divider,
    minHeight: wp(13),
  },
  numberOfPaymentsContainerActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  indefiniteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orText: {
    fontSize: hp(1.4),
    color: Colors.textSecondary,
    marginHorizontal: wp(2),
  },
  specificNumberOption: {
    flex: 1,
  },
  specificNumberInput: {
    width: wp(20),
    minWidth: wp(20),
  },
  specificNumberInputActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  signatureField: {
    marginBottom: hp(2),
  },
  signatureLabel: {
    fontSize: hp(1.4),
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: hp(1),
    textTransform: 'uppercase',
  },
  buttonContainer: {
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  saveButton: {
    marginBottom: hp(1),
  },
});

export default StandingBankersOrder;
