import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApplication } from '../../contexts/applicationContext';
import { useProfile } from '../../contexts/profileContext';
import { useLookup } from '../../contexts/lookupContext';
import { InputField } from '../../common/inputField';
import CheckboxWithLabel from '../../common/checkbox/CheckboxWithLabel';
import DatePicker from '../../common/DatePicker';
import SignaturePad from '../../common/signaturePad';
import { Button } from '../../common/button';
import { Colors, hp, wp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  createPortalPaymentForm,
  getMyPortalPaymentForms,
  getPaymentFormPrefill,
  getPortalPaymentForm,
  submitPortalPaymentForm,
  updatePortalPaymentForm,
  uploadPortalPaymentSignature,
} from '../../api/paymentForms.api';
import {
  extractMyPortalPaymentForms,
  extractPaymentFormPrefill,
  extractPortalPaymentForm,
  getActivePaymentFormForProfile,
  getUniqueMandateReferenceFromForm,
  hasCreditorOrganizationDetails,
  isPaymentApiSuccess,
  mapCreditorOrganizationDetails,
  mapDirectDebitFromPortal,
  mergePaymentFormWithPrefill,
  normalizePortalPaymentForm,
} from '../../helpers/paymentForm.helper';

const EEA_SEPA_COUNTRIES = [
  'Ireland',
  'United Kingdom',
  'Austria',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Italy',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Monaco',
  'Netherlands',
  'Norway',
  'Poland',
  'Portugal',
  'Romania',
  'San Marino',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'Andorra',
];

const isEeaSepaCountry = country => {
  if (!country) return true;
  return EEA_SEPA_COUNTRIES.some(
    c => c.toLowerCase() === country.trim().toLowerCase(),
  );
};

const PAYMENT_FORM_TYPE = 'DD_MANDATE';
const EMPTY_CREDITOR_DETAILS = {
  name: '',
  identifier: '',
  address: '',
  city: '',
  postCode: '',
  country: '',
};

const getPaymentApiErrorMessage = (response, fallback) => {
  const data = response?.data;
  if (!data) {
    return response?.status
      ? `${fallback} (HTTP ${response.status})`
      : fallback;
  }
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

const getPortalFormId = form => {
  if (!form) return null;
  return form._id ?? form.id ?? null;
};

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

const toIsoDate = value => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const cleanIban = iban => (iban || '').replace(/\s/g, '').toUpperCase();

const DirectDebit = () => {
  const { personalDetail, subscriptionDetail, categoryData, getCategoryData } =
    useApplication();
  const { profileDetail } = useProfile();
  const { categoryLookups } = useLookup();
  const ibanInputRef = useRef(null);
  const signatureDrawLockRef = useRef(0);
  const [user, setUser] = useState(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const membershipCategory =
    subscriptionDetail?.subscriptionDetails?.membershipCategory;

  const membershipNo =
    profileDetail?.membershipNumber ||
    subscriptionDetail?.subscriptionDetails?.membershipNo ||
    subscriptionDetail?.subscriptionDetails?.membershipNumber ||
    '';

  const [formState, setFormState] = useState({
    paymentType: 'recurrent',
    authorization: false,
    memberName: '',
    memberAddress: '',
    memberCity: '',
    memberPostCode: '',
    memberCountry: 'Ireland',
    iban: '',
    bic: '',
    signature: null,
    secondSignature: null,
    signatureDate: '',
  });

  const [showValidation, setShowValidation] = useState(false);
  const [ibanError, setIbanError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalForm, setPortalForm] = useState(null);
  const [activePortalForm, setActivePortalForm] = useState(null);
  const [prefillForm, setPrefillForm] = useState(null);
  const [portalFormLoading, setPortalFormLoading] = useState(true);

  const handleSignatureDrawingActive = active => {
    if (active) {
      signatureDrawLockRef.current += 1;
    } else {
      signatureDrawLockRef.current = Math.max(0, signatureDrawLockRef.current - 1);
    }
    setScrollEnabled(signatureDrawLockRef.current === 0);
  };

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
    if (membershipCategory) {
      getCategoryData(membershipCategory, categoryLookups || []);
    }
  }, [membershipCategory, categoryLookups, getCategoryData]);

  const seedPortalForm = useMemo(() => {
    if (activePortalForm) {
      return mergePaymentFormWithPrefill(activePortalForm, prefillForm);
    }
    return prefillForm;
  }, [activePortalForm, prefillForm]);

  const formSource = useMemo(() => {
    const base = normalizePortalPaymentForm(seedPortalForm ?? portalForm);
    const prefill = normalizePortalPaymentForm(prefillForm);
    return mergePaymentFormWithPrefill(base, prefill) ?? prefill ?? base;
  }, [seedPortalForm, portalForm, prefillForm]);

  const organizationDetails = useMemo(() => {
    return mapCreditorOrganizationDetails(formSource) ?? EMPTY_CREDITOR_DETAILS;
  }, [formSource]);

  const uniqueMandateReference = useMemo(() => {
    const fromForm = getUniqueMandateReferenceFromForm(formSource);
    return fromForm || membershipNo || `MEM-${user?.id || '0000'}`;
  }, [formSource, membershipNo, user?.id]);

  const formSourceKey = useMemo(() => {
    if (!formSource) return '';
    const mandate = formSource.directDebitMandate;
    return [
      formSource._id,
      formSource.id,
      formSource.status,
      formSource.unsaved,
      mandate?.debtorName,
      mandate?.debtorIban,
      mandate?.debtorAddress,
      mandate?.debtorCity,
    ].join('|');
  }, [formSource]);

  useEffect(() => {
    let cancelled = false;

    const loadPortalForms = async () => {
      setPortalFormLoading(true);
      try {
        const [portalRes, mineRes] = await Promise.all([
          getPortalPaymentForm(),
          getMyPortalPaymentForms(),
        ]);

        if (cancelled) return;

        const loadedPortalForm = isPaymentApiSuccess(portalRes)
          ? extractPortalPaymentForm(portalRes)
          : null;
        setPortalForm(loadedPortalForm);

        if (isPaymentApiSuccess(mineRes)) {
          const paymentForms = extractMyPortalPaymentForms(mineRes);
          const activeForm = getActivePaymentFormForProfile(
            paymentForms,
            'Direct Debit',
          );
          setActivePortalForm(activeForm);
        } else {
          setActivePortalForm(null);
        }
      } catch (error) {
        console.error('Failed to load portal payment form:', error);
        if (!cancelled) {
          setPortalForm(null);
          setActivePortalForm(null);
        }
      } finally {
        if (!cancelled) {
          setPortalFormLoading(false);
        }
      }
    };

    loadPortalForms();

    return () => {
      cancelled = true;
    };
  }, [profileDetail?.profileId]);

  useEffect(() => {
    let cancelled = false;

    const loadPrefill = async () => {
      const profileId = profileDetail?.profileId;
      if (!profileId) return;

      const base = normalizePortalPaymentForm(seedPortalForm ?? portalForm);
      if (
        hasCreditorOrganizationDetails(base) &&
        String(base?.status || '').toLowerCase() === 'active'
      ) {
        return;
      }

      try {
        const res = await getPaymentFormPrefill(profileId);
        if (cancelled || !isPaymentApiSuccess(res)) return;

        const prefill = extractPaymentFormPrefill(res);
        if (!prefill || cancelled) return;

        setPrefillForm(prefill);
      } catch (error) {
        console.error('Failed to load direct debit prefill:', error);
      }
    };

    loadPrefill();

    return () => {
      cancelled = true;
    };
  }, [profileDetail?.profileId, seedPortalForm, portalForm]);

  useEffect(() => {
    if (portalFormLoading || !formSource) {
      return;
    }

    const mapped = mapDirectDebitFromPortal(formSource);
    const contactInfo = personalDetail?.contactInfo || {};
    const profileName =
      personalDetail?.personalInfo?.forename &&
      personalDetail?.personalInfo?.surname
        ? `${personalDetail.personalInfo.forename} ${personalDetail.personalInfo.surname}`
        : user?.userFirstName && user?.userLastName
          ? `${user.userFirstName} ${user.userLastName}`
          : user?.userName || '';
    const profileAddress = [
      contactInfo.buildingOrHouse,
      contactInfo.streetOrRoad,
    ]
      .filter(Boolean)
      .join(', ');

    const isActiveRecord =
      String(formSource?.status || '').toLowerCase() === 'active';

    setFormState(prev => ({
      ...prev,
      ...mapped,
      memberName: isActiveRecord
        ? mapped.memberName || prev.memberName
        : mapped.memberName || profileName || prev.memberName,
      memberAddress: isActiveRecord
        ? mapped.memberAddress || prev.memberAddress
        : mapped.memberAddress || profileAddress || prev.memberAddress,
      memberCity: isActiveRecord
        ? mapped.memberCity || prev.memberCity
        : mapped.memberCity || contactInfo.areaOrTown || prev.memberCity,
      memberPostCode: isActiveRecord
        ? mapped.memberPostCode || prev.memberPostCode
        : mapped.memberPostCode ||
          contactInfo.eircode ||
          contactInfo.countyCityOrPostCode ||
          prev.memberPostCode,
      memberCountry: isActiveRecord
        ? mapped.memberCountry || prev.memberCountry
        : mapped.memberCountry || contactInfo.country || prev.memberCountry,
      iban: mapped.iban || prev.iban,
      bic: mapped.bic || prev.bic,
      paymentType: mapped.paymentType || prev.paymentType,
      authorization:
        mapped.authorization !== undefined
          ? mapped.authorization
          : prev.authorization,
      signatureDate: mapped.signatureDate || prev.signatureDate,
    }));
  }, [
    formSource,
    formSourceKey,
    portalFormLoading,
    personalDetail,
    user,
  ]);

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
      setFormState(prev => ({ ...prev, iban: formatted }));

      if (formatted) {
        const validation = validateIBAN(formatted);
        if (validation.isValid) {
          setIbanError('');
        } else if (formatted.replace(/\s/g, '').length > 4) {
          setIbanError(validation.message);
        } else {
          setIbanError('');
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

  const handleDateChange = e => {
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

  const requiresMemberAddress = !isEeaSepaCountry(formState.memberCountry);
  const orgName = organizationDetails.name;

  const isFormValid = useMemo(() => {
    if (!formState.authorization) return false;
    if (!formState.paymentType) return false;
    if (!formState.memberName) return false;
    if (!formState.iban) return false;
    if (!validateIBAN(formState.iban).isValid) return false;
    if (requiresMemberAddress && !formState.memberAddress) return false;
    if (!formState.signature) return false;
    if (!formState.signatureDate) return false;
    return true;
  }, [formState, requiresMemberAddress]);

  const validateForm = () => {
    if (!formState.iban) {
      return false;
    }
    const ibanValidation = validateIBAN(formState.iban);
    if (!ibanValidation.isValid) {
      setIbanError(ibanValidation.message);
      return false;
    }
    setIbanError('');
    return isFormValid;
  };

  const handleConfirm = async () => {
    setShowValidation(true);
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const createPayload = {
      formType: PAYMENT_FORM_TYPE,
      directDebitMandate: {
        debtorName: formState.memberName,
        debtorAddress: formState.memberAddress || '',
        debtorCity: formState.memberCity || '',
        debtorPostcode: formState.memberPostCode || '',
        debtorCountry: formState.memberCountry || '',
        debtorIban: cleanIban(formState.iban),
        debtorBic: formState.bic || '',
        signedDate: toIsoDate(formState.signatureDate),
        isAuthorized: !!formState.authorization,
        paymentTypeRecurrent: formState.paymentType === 'recurrent',
        uniqueMandateReference,
      },
      gdpr: {
        consentCapturedAt: new Date().toISOString(),
      },
    };

    const patchPayload = {
      directDebitMandate: createPayload.directDebitMandate,
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
          getPaymentApiErrorMessage(
            saveRes,
            'Failed to save direct debit form. Please try again.',
          ),
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
        throw new Error(
          'Payment form was saved but no form id was returned. Please refresh and try again.',
        );
      }

      const signatures = [
        { slot: 0, imageBase64: formState.signature },
        { slot: 1, imageBase64: formState.secondSignature },
      ].filter(item => item.imageBase64);

      for (const sig of signatures) {
        const uploadRes = await uploadPortalPaymentSignature(formId, {
          imageBase64: sig.imageBase64,
          slot: sig.slot,
          signedDate: toIsoDate(formState.signatureDate),
        });
        if (!isPaymentApiSuccess(uploadRes)) {
          throw new Error(
            getPaymentApiErrorMessage(
              uploadRes,
              'Failed to upload signature. Please try again.',
            ),
          );
        }
      }

      const submitRes = await submitPortalPaymentForm(formId);
      if (!isPaymentApiSuccess(submitRes)) {
        throw new Error(
          getPaymentApiErrorMessage(
            submitRes,
            'Failed to submit direct debit form. Please try again.',
          ),
        );
      }

      Alert.alert('Success', 'Direct Debit mandate submitted successfully!');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unable to submit direct debit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = categoryData?.currentPricing?.price
    ? categoryData.currentPricing.price / 100
    : 0;
  const currency = categoryData?.currentPricing?.currency || 'EUR';
  const currencySymbol = currency.toUpperCase() === 'EUR' ? '€' : currency;

  const renderRadioOption = (value, label) => (
    <TouchableOpacity
      key={value}
      style={styles.radioOption}
      onPress={() => setFormState(prev => ({ ...prev, paymentType: value }))}
      activeOpacity={0.7}>
      <Ionicons
        name={
          formState.paymentType === value
            ? 'radio-button-on'
            : 'radio-button-off'
        }
        size={22}
        color={
          formState.paymentType === value ? Colors.primary : Colors.textSecondary
        }
      />
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (portalFormLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading direct debit form...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}>
        {/* Header */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.mainTitle}>SEPA Direct Debit Mandate</Text>
            <Text style={styles.orgName}>{orgName}</Text>
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>Unique Mandate Reference</Text>
            <InputField value={uniqueMandateReference} editable={false} />
            <Text style={styles.helperText}>
              Unique Mandate Reference (UMR) – to be completed by {orgName}
            </Text>
          </View>
        </View>

        {/* Legal Authorization */}
        <View style={styles.section}>
          <View style={styles.checkboxContainer}>
            <CheckboxWithLabel
              label=""
              checked={formState.authorization}
              onPress={() =>
                setFormState(prev => ({
                  ...prev,
                  authorization: !prev.authorization,
                }))
              }
              required={true}
              showValidation={showValidation}
              style={styles.authorizationCheckbox}
            />
            <View style={styles.authorizationTextContainer}>
              <Text style={styles.authorizationText}>
                By signing this mandate form, you authorise (A){' '}
                <Text style={styles.boldText}>{orgName}</Text> to send
                instructions to your bank to debit your account and (B) your bank
                to debit your account in accordance with the instructions from{' '}
                <Text style={styles.boldText}>{orgName}</Text>.
              </Text>
              <Text style={[styles.authorizationText, styles.authorizationParagraph]}>
                As part of your rights, you are entitled to a refund from your
                bank under the terms and conditions of your agreement with your
                bank. A refund must be claimed within 8 weeks starting from the
                date on which your account was debited. Your rights are explained
                in a statement that you can obtain from your bank.
              </Text>
            </View>
          </View>
        </View>

        {/* Creditor's Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="business-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Creditor&apos;s Information</Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Creditor&apos;s Name</Text>
            <InputField value={organizationDetails.name} editable={false} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>Creditor&apos;s Identifier</Text>
            <InputField value={organizationDetails.identifier} editable={false} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>Creditor&apos;s Address</Text>
            <InputField value={organizationDetails.address} editable={false} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>City</Text>
            <InputField value={organizationDetails.city} editable={false} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>Post Code</Text>
            <InputField value={organizationDetails.postCode} editable={false} />
          </View>
          <View style={styles.formField}>
            <Text style={styles.label}>Country</Text>
            <InputField value={organizationDetails.country} editable={false} />
          </View>
        </View>

        {/* Type of Payment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.orange + '20' }]}>
              <Ionicons name="cash-outline" size={24} color={Colors.orange} />
            </View>
            <Text style={styles.sectionTitle}>Type of payment *</Text>
          </View>

          <View style={styles.radioGroup}>
            {renderRadioOption('recurrent', 'Recurrent payment')}
            {renderRadioOption('one-off', 'One-off payment')}
          </View>

          {totalAmount > 0 && (
            <Text style={styles.amountText}>
              Membership amount: {currencySymbol}
              {totalAmount.toFixed(2)}
              {formState.paymentType === 'recurrent' && (
                <Text style={styles.recurringTag}> (recurring)</Text>
              )}
            </Text>
          )}
        </View>

        {/* Debtor's Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.fruitSalad + '20' }]}>
              <Ionicons name="person-outline" size={24} color={Colors.fruitSalad} />
            </View>
            <Text style={styles.sectionTitle}>Debtor&apos;s Information</Text>
          </View>

          <Text style={styles.sectionSubtitle}>
            Please complete all the fields marked *
          </Text>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Debtor&apos;s Name{' '}
              {showValidation && !formState.memberName && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.memberName}
              onChange={handleInputChange}
              field="memberName"
              placeholder="Full name"
              editable={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Debtor&apos;s Address
              {requiresMemberAddress && showValidation && !formState.memberAddress && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              value={formState.memberAddress}
              onChange={handleInputChange}
              field="memberAddress"
              placeholder="Street address"
              editable={requiresMemberAddress}
            />
            <Text style={styles.helperText}>
              † Mandatory when collecting from a non EEA SEPA country or territory
            </Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>City</Text>
            <InputField
              value={formState.memberCity}
              onChange={handleInputChange}
              field="memberCity"
              placeholder="City"
              editable={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Post Code</Text>
            <InputField
              value={formState.memberPostCode}
              onChange={handleInputChange}
              field="memberPostCode"
              placeholder="Post code"
              editable={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Country</Text>
            <InputField
              value={formState.memberCountry}
              onChange={handleInputChange}
              field="memberCountry"
              placeholder="Country"
              editable={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Debtor&apos;s account number – IBAN{' '}
              {showValidation && !formState.iban && (
                <Text style={styles.requiredText}> * (Required)</Text>
              )}
            </Text>
            <InputField
              TextInputRef={ibanInputRef}
              value={formState.iban}
              onChange={handleInputChange}
              field="iban"
              placeholder="IE00 BOFI 9000 0000 0000 00"
              maxLength={42}
              autoCapitalize="characters"
            />
            {ibanError ? (
              <Text style={styles.errorText}>{ibanError}</Text>
            ) : formState.iban ? (
              <Text style={styles.successText}>Valid IBAN format</Text>
            ) : null}
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>
              Debtor&apos;s bank identifier code – BIC
            </Text>
            <InputField
              value={formState.bic}
              onChange={handleInputChange}
              field="bic"
              placeholder="e.g. BOFIIE2D"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Signature & Date */}
        <View style={[styles.section, styles.signatureSection]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.orange + '20' }]}>
              <Ionicons name="create-outline" size={24} color={Colors.orange} />
            </View>
            <Text style={styles.sectionTitle}>Signature &amp; Date *</Text>
          </View>

          <Text style={styles.signatureNote}>
            Where the account being debited is a joint account and more than 1
            person is needed to withdraw funds, then all parties must sign this
            form.
          </Text>

          <View style={styles.signatureField}>
            <Text style={styles.signatureLabel}>Signature</Text>
            <SignaturePad
              label=""
              onSignatureChange={sig => handleSignatureChange('signature', sig)}
              value={formState.signature}
              required={true}
              showValidation={showValidation}
              onDrawingActiveChange={handleSignatureDrawingActive}
            />
          </View>

          <View style={styles.signatureField}>
            <Text style={styles.signatureLabel}>Second Signature (If Joint)</Text>
            <SignaturePad
              label=""
              onSignatureChange={sig =>
                handleSignatureChange('secondSignature', sig)
              }
              value={formState.secondSignature}
              onDrawingActiveChange={handleSignatureDrawingActive}
            />
          </View>

          <View style={styles.formField}>
            <DatePicker
              label="Date"
              name="signatureDate"
              required={true}
              value={formState.signatureDate}
              onChange={handleDateChange}
              showValidation={showValidation}
              disableAgeValidation={true}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.section}>
          <Text style={styles.footerTitle}>
            Please return this mandate to the Organization
          </Text>
          <Text style={styles.footerAddress}>
            {organizationDetails.name} · {organizationDetails.address},{' '}
            {organizationDetails.city} {organizationDetails.postCode},{' '}
            {organizationDetails.country}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.buttonContainer}>
          <Button
            title={isSubmitting ? 'Submitting...' : 'Confirm and Authorize'}
            onPress={handleConfirm}
            primary
            disabled={!isFormValid || isSubmitting}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.6),
    color: Colors.textSecondary,
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
  signatureSection: {
    backgroundColor: Colors.lightgrey,
    borderColor: Colors.divider,
  },
  headerRow: {
    marginBottom: hp(2),
  },
  mainTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: hp(0.5),
  },
  orgName: {
    fontSize: hp(1.4),
    fontWeight: '600',
    color: Colors.textSecondary,
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
  sectionSubtitle: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: hp(1.5),
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
  helperText: {
    fontSize: hp(1.3),
    color: Colors.textSecondary,
    marginTop: hp(0.5),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: wp(3),
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  authorizationCheckbox: {
    alignSelf: 'flex-start',
    marginTop: hp(0.2),
  },
  authorizationTextContainer: {
    flex: 1,
    marginLeft: wp(2),
    paddingTop: hp(0.2),
  },
  authorizationText: {
    fontSize: hp(1.4),
    color: Colors.textSecondary,
    lineHeight: hp(2.2),
  },
  authorizationParagraph: {
    marginTop: hp(1.5),
  },
  boldText: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  radioGroup: {
    gap: hp(1.5),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  radioLabel: {
    fontSize: hp(1.5),
    color: Colors.textPrimary,
  },
  amountText: {
    marginTop: hp(1.5),
    fontSize: hp(1.5),
    color: Colors.textSecondary,
  },
  recurringTag: {
    fontSize: hp(1.3),
    color: Colors.fruitSalad,
    fontWeight: '600',
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
  signatureNote: {
    fontSize: hp(1.3),
    color: Colors.textSecondary,
    marginBottom: hp(2),
    lineHeight: hp(2),
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
  footerTitle: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  footerAddress: {
    fontSize: hp(1.3),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: hp(1),
    lineHeight: hp(2),
  },
  buttonContainer: {
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  confirmButton: {
    marginBottom: hp(1),
  },
});

export default DirectDebit;
