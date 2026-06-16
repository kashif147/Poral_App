import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, useWindowDimensions, Platform, KeyboardAvoidingView, Keyboard, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { STACKS } from '../../enums/ScreenEnums';
import PersonalInformation from './PersonalInformation';
import ProfessionalDetails from './ProfessionalDetails';
import SubscriptionDetails from './SubscriptionDetails';
import { Colors, hp } from '../../utils/Styles';
import { Button } from '../../common/button';
import SubscriptionPaymentModal from './components/SubscriptionPaymentModal';
import { useApplication } from '../../contexts/applicationContext';
import { useLookup } from '../../contexts/lookupContext';
import ScreenHeader from '../../common/screenHeader';
import {
  createPersonalDetailRequest,
  updatePersonalDetailRequest,
  createProfessionalDetailRequest,
  updateProfessionalDetailRequest,
  createSubscriptionDetailRequest,
  updateSubscriptionDetailRequest,
} from '../../api/application.api';
import { toast } from '../../utils/toast.utils';
import {
  buildDefaultPersonalInfoFromAuth,
  detailBelongsToApplication,
  isResumablePortalApplication,
  normalizeApplicationStatus,
  resolveApplicationFormStep,
} from '../../helpers/applicationPayload.helper';
import { calculateAgeFromDateOfBirth } from '../../helpers/date.helper';
import {
  getPaymentFrequencyCategory,
  isSalaryDeductionPaymentType,
} from '../../helpers/subscriptionPricing.helper';

const steps = [
  { number: 1, title: 'Personal' },
  { number: 2, title: 'Professional' },
  { number: 3, title: 'Subscription' },
];

const initialFormData = {
  personalInfo: {
    title: '',
    forename: '',
    surname: '',
    gender: '',
    dob: '',
    personalEmail: '',
    mobileNo: '',
    country: 'Ireland',
    consent: true,
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    eircode: '',
    workTel: '',
    preferredEmail: '',
    workEmail: '',
  },
  professionalDetails: {
    retired: false,
    retiredDate: '',
    pensionNo: '',
  },
  subscriptionDetails: {},
};

const Application = () => {
  const { width } = useWindowDimensions();
  const {
    categoryData,
    getCategoryData,
    personalDetail,
    professionalDetail,
    subscriptionDetail,
    getPersonalDetail,
    getProfessionalDetail,
    getSubscriptionDetail,
    refreshApplicationState,
    applicationStatus,
  } = useApplication();
  const { categoryLookups } = useLookup();
  const navigation = useNavigation();
  const { user, userDetail } = useSelector(state => state.auth);
  const defaultPersonalInfo = useMemo(
    () => buildDefaultPersonalInfoFromAuth({ user, userDetail }),
    [user, userDetail],
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [showValidation, setShowValidation] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);

  const hasActiveApplication = useMemo(
    () => isResumablePortalApplication(personalDetail, applicationStatus),
    [personalDetail, applicationStatus],
  );

  const activeApplicationId = hasActiveApplication
    ? personalDetail?.applicationId
    : null;

  const activeProfessionalDetail = useMemo(
    () =>
      detailBelongsToApplication(professionalDetail, activeApplicationId)
        ? professionalDetail
        : null,
    [professionalDetail, activeApplicationId],
  );

  const activeSubscriptionDetail = useMemo(
    () =>
      detailBelongsToApplication(subscriptionDetail, activeApplicationId)
        ? subscriptionDetail
        : null,
    [subscriptionDetail, activeApplicationId],
  );

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Scroll to top when step changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [currentStep]);

  // Show modal after subscription detail is created/updated (matching web version)
  useEffect(() => {
    if (shouldShowModal) {
      console.log('🎫 Triggering payment modal...');
      setIsModalVisible(true);
      setShouldShowModal(false);
    }
  }, [shouldShowModal]);

  const handleNext = () => {
    console.log('🔄 handleNext called, currentStep:', currentStep);
    setShowValidation(true);
    
    const isValid = validateCurrentStep();
    console.log('✓ Validation result:', isValid);
    
    if (isValid) {
      if (currentStep === 1) {
        console.log('📝 Processing step 1...');
        if (!hasActiveApplication) {
          createPersonalDetail(formData.personalInfo);
        } else {
          updatePersonalDetail(formData.personalInfo);
        }
      } else if (currentStep === 2) {
        console.log('💼 Processing step 2...');
        if (!activeProfessionalDetail) {
          createProfessionalDetail(formData.professionalDetails);
        } else {
          updateProfessionalDetail(formData.professionalDetails);
        }
      } else if (currentStep === 3) {
        console.log('📋 Processing step 3...');
        if (!activeSubscriptionDetail) {
          console.log('Creating new subscription detail...');
          createSubscriptionDetail(formData.subscriptionDetails);
        } else {
          console.log('Updating existing subscription detail...');
          updateSubscriptionDetail(formData.subscriptionDetails);
        }
        // Modal will be shown by useEffect after subscription is saved (via shouldShowModal)
      }
      // Remove automatic step increment - it will be handled by API success callbacks
      setShowValidation(false);
    } else {
      const missing = getMissingRequiredFields();
      const message =
        missing.length > 0
          ? `Please fill in the required fields: ${missing.join(', ')}`
          : 'Please complete all required fields.';
      toast.warning('Validation', message);
    }
  };
  const handlePrevious = () => {
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);
  };

  const handleStepClick = (stepNumber) => {
    // Allow navigation to:
    // 1. Already completed steps (can go back)
    // 2. Current step (no change)
    // 3. Next step if current step is validated
    if (stepNumber === currentStep) {
      return; // Already on this step
    }
    
    if (stepNumber < currentStep) {
      // Going back to a previous step - always allowed
      setCurrentStep(stepNumber);
      return;
    }
    
    if (stepNumber === currentStep + 1) {
      // Going to next step - validate current step first
      handleNext();
      return;
    }
    
    // Cannot skip steps ahead
    if (stepNumber > currentStep + 1) {
      Alert.alert('Warning', 'Please complete the current step before proceeding');
      return;
    }
  };

  const handleFormDataChange = (stepName, data) => {
    // Ensure data is properly structured
    const sanitizedData = data || {};
    const newData = { 
      ...formData, 
      [stepName]: { ...initialFormData[stepName], ...sanitizedData }
    };
    setFormData(newData);
  };

  const getMissingRequiredFields = () => {
    const missing = [];
    switch (currentStep) {
      case 1: {
        const {
          title,
          forename,
          surname,
          gender,
          dob,
          personalEmail,
          workEmail,
          mobileNo,
          addressLine1,
          addressLine4,
          preferredAddress,
          preferredEmail,
        } = formData.personalInfo || {};
        if (!preferredEmail) missing.push('Preferred email');
        if (!title) missing.push('Title');
        if (!forename) missing.push('Forename');
        if (!surname) missing.push('Surname');
        if (!gender) missing.push('Gender');
        if (!dob) missing.push('Date of Birth');
        if (preferredEmail === 'Personal' && !personalEmail) missing.push('Personal email');
        if (preferredEmail === 'Work' && !workEmail) missing.push('Work email');
        if (!mobileNo) missing.push('Mobile number');
        if (!addressLine1) missing.push('Address Line 1');
        if (!addressLine4) missing.push('Address Line 4');
        if (!preferredAddress) missing.push('Preferred address');
        break;
      }
      case 2: {
        const {
          workLocation,
          grade,
          membershipCategory,
          nursingAdaptationProgramme,
          nurseType,
          nmbiNo,
          discipline,
          studyLocation,
          graduationDate,
          pensionNo,
        } = formData.professionalDetails || {};
        if (!membershipCategory) missing.push('Membership category');
        const isUndergraduateStudent = membershipCategory === 'undergraduate_student' ||
          membershipCategory === 'Undergraduate Student';
        if (!isUndergraduateStudent && !workLocation) missing.push('Work location');
        if (!grade) missing.push('Grade');
        if (isUndergraduateStudent) {
          if (!discipline) missing.push('Discipline');
          if (!studyLocation) missing.push('Study location');
          if (!graduationDate) missing.push('Graduation date');
        }
        const isRetiredAssociate =
          membershipCategory === 'retired_associate' ||
          membershipCategory === 'Retired Associate';
        if (isRetiredAssociate && !String(pensionNo || '').trim()) {
          missing.push('Pension number');
        }
        const isNursingAdaptationYes = nursingAdaptationProgramme === 'yes';
        const isNursingAdaptationNo = nursingAdaptationProgramme === 'no';
        if (isNursingAdaptationYes && !nurseType) missing.push('Nurse type');
        if (isNursingAdaptationNo && !String(nmbiNo || '').trim()) {
          missing.push('NMBI number');
        }
        break;
      }
      case 3: {
        const {
          paymentType,
          payrollNo,
          paymentFrequency,
          otherIrishTradeUnion,
          otherIrishTradeUnionName,
          otherScheme,
          memberStatus,
          termsAndConditions,
          primarySection,
          otherPrimarySection,
          secondarySection,
          otherSecondarySection,
          joinYouthForum,
          youthForum,
        } = formData.subscriptionDetails || {};
        if (!paymentType) missing.push('Payment type');
        if (
          isSalaryDeductionPaymentType(paymentType) &&
          !payrollNo
        ) {
          missing.push('Payroll number');
        }
        if (getPaymentFrequencyCategory(paymentType) && !paymentFrequency) {
          missing.push('Payment frequency');
        }
        if (!memberStatus) missing.push('Member status');
        if (memberStatus === 'new' || memberStatus === 'graduate') {
          if (!otherIrishTradeUnion) missing.push('Other Irish trade union');
          if (!otherScheme) missing.push('Other scheme');
          if (
            otherIrishTradeUnion === 'yes' &&
            !String(otherIrishTradeUnionName || '').trim()
          ) {
            missing.push('Other Irish trade union name');
          }
        }
        const memberAge = calculateAgeFromDateOfBirth(
          formData.personalInfo?.dob,
        );
        if (memberAge !== null && memberAge < 35) {
          if (!joinYouthForum) missing.push('Youth Forum preference');
          if (joinYouthForum === 'yes' && !youthForum) {
            missing.push('Youth Forum');
          }
        }
        if (!termsAndConditions) missing.push('Terms and conditions');
        if ((primarySection === 'other' || primarySection === 'Other') && !otherPrimarySection) {
          missing.push('Other primary section');
        }
        if ((secondarySection === 'other' || secondarySection === 'Other') && !otherSecondarySection) {
          missing.push('Other secondary section');
        }
        break;
      }
      default:
        break;
    }
    return missing;
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: {
        const {
          title,
          forename,
          surname,
          gender,
          dob,
          personalEmail,
          workEmail,
          mobileNo,
          addressLine1,
          addressLine4,
          preferredAddress,
          preferredEmail,
        } = formData.personalInfo || {};
        if (
          !title ||
          !forename ||
          !surname ||
          !gender ||
          !dob ||
          !mobileNo ||
          !addressLine1 ||
          !addressLine4 ||
          !preferredAddress ||
          !preferredEmail
        ) {
          return false;
        }
        if (preferredEmail === 'Personal' && !personalEmail) return false;
        if (preferredEmail === 'Work' && !workEmail) return false;
        break;
      }
      case 2: {
        const {
          workLocation,
          grade,
          membershipCategory,
          nursingAdaptationProgramme,
          nurseType,
          nmbiNo,
          discipline,
          studyLocation,
          graduationDate,
          pensionNo,
        } = formData.professionalDetails || {};
        
        // Check required fields
        if (!grade || !membershipCategory) {
          return false;
        }
        
        // Work location is only required for non-undergraduate students
        const isUndergraduateStudent =
          membershipCategory === 'undergraduate_student' ||
          membershipCategory === 'Undergraduate Student';
        if (!isUndergraduateStudent && !workLocation) {
          return false;
        }
        if (isUndergraduateStudent) {
          if (!discipline || !studyLocation || !graduationDate) return false;
        }
        const isRetiredAssociate =
          membershipCategory === 'retired_associate' ||
          membershipCategory === 'Retired Associate';
        if (isRetiredAssociate && !String(pensionNo || '').trim()) {
          return false;
        }
        
        // Check nursingAdaptationProgramme (matching web version)
        if (nursingAdaptationProgramme === 'yes' && !nurseType) return false;
        if (
          nursingAdaptationProgramme === 'no' &&
          !String(nmbiNo || '').trim()
        ) {
          return false;
        }
        break;
      }
      case 3: {
        const {
          paymentType,
          payrollNo,
          paymentFrequency,
          otherIrishTradeUnion,
          otherIrishTradeUnionName,
          otherScheme,
          memberStatus,
          termsAndConditions,
          primarySection,
          otherPrimarySection,
          secondarySection,
          otherSecondarySection,
        } = formData.subscriptionDetails || {};
        
        console.log('📋 Step 3 Validation Data:', {
          paymentType,
          payrollNo,
          paymentFrequency,
          otherIrishTradeUnion,
          otherScheme,
          memberStatus,
          termsAndConditions,
        });
        
        // Required fields
        if (!paymentType) {
          console.log('❌ Validation failed: paymentType missing');
          return false;
        }
        if (
          isSalaryDeductionPaymentType(paymentType) &&
          !payrollNo
        ) {
          console.log('❌ Validation failed: payrollNo missing for', paymentType);
          return false;
        }
        if (
          getPaymentFrequencyCategory(paymentType) &&
          !paymentFrequency
        ) {
          console.log('❌ Validation failed: paymentFrequency missing');
          return false;
        }
        if (!memberStatus) {
          console.log('❌ Validation failed: memberStatus missing');
          return false;
        }
        if (memberStatus === 'new' || memberStatus === 'graduate') {
          if (!otherIrishTradeUnion) {
            console.log('❌ Validation failed: otherIrishTradeUnion missing');
            return false;
          }
          if (!otherScheme) {
            console.log('❌ Validation failed: otherScheme missing');
            return false;
          }
          if (
            otherIrishTradeUnion === 'yes' &&
            !String(otherIrishTradeUnionName || '').trim()
          ) {
            console.log('❌ Validation failed: otherIrishTradeUnionName missing');
            return false;
          }
        }
        const memberAge = calculateAgeFromDateOfBirth(
          formData.personalInfo?.dob,
        );
        if (memberAge !== null && memberAge < 35) {
          if (!formData.subscriptionDetails?.joinYouthForum) {
            console.log('❌ Validation failed: joinYouthForum missing');
            return false;
          }
          if (
            formData.subscriptionDetails?.joinYouthForum === 'yes' &&
            !formData.subscriptionDetails?.youthForum
          ) {
            console.log('❌ Validation failed: youthForum missing');
            return false;
          }
        }
        if (!termsAndConditions) {
          console.log('❌ Validation failed: termsAndConditions missing');
          return false;
        }
        
        // Conditional required fields (matching web version - check for 'other' lowercase)
        if ((primarySection === 'other' || primarySection === 'Other') && !otherPrimarySection) {
          console.log('❌ Validation failed: otherPrimarySection missing');
          return false;
        }
        if ((secondarySection === 'other' || secondarySection === 'Other') && !otherSecondarySection) {
          console.log('❌ Validation failed: otherSecondarySection missing');
          return false;
        }
        
        break;
      }
    }
    return true;
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const navigateToDashboardAfterSubmit = async () => {
    const maxAttempts = 4;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const result = await refreshApplicationState?.();
        const normalized = normalizeApplicationStatus(result?.status);
        if (
          normalized === 'submitted' ||
          normalized === 'approved' ||
          normalized === 'in review'
        ) {
          break;
        }
      } catch {
        // Retry on transient failures
      }

      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 750));
      }
    }

    navigation.navigate(STACKS.DASHBOARD_STACK);
  };

  const handlePaymentSuccess = paymentData => {
    console.log('✅ Payment Success Data:', paymentData);

    setIsModalVisible(false);

    Alert.alert('Success', 'Payment completed successfully!', [
      {
        text: 'OK',
        onPress: async () => {
          setIsSubmitted(true);
          await navigateToDashboardAfterSubmit();
        },
      },
    ]);
  };

  const handlePaymentFailure = (message) => {
    console.log('❌ Payment Failed:', message);
    setIsModalVisible(false);
    Alert.alert('Payment Failed', message || 'Please try again.');
  };

  // Initialize: load personal detail from context (matching web version)
  useEffect(() => {
    getPersonalDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset stale data and prefill basic personal info from auth when starting fresh
  useEffect(() => {
    if (!hasActiveApplication) {
      setCurrentStep(1);
      setIsSubmitted(false);
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...initialFormData.personalInfo,
          ...defaultPersonalInfo,
        },
        professionalDetails: {},
        subscriptionDetails: {},
      }));
      return;
    }

    setCurrentStep(
      resolveApplicationFormStep({
        activeSubscriptionDetail,
        activeProfessionalDetail,
        activeApplicationId,
      }),
    );
  }, [
    hasActiveApplication,
    activeApplicationId,
    activeProfessionalDetail,
    activeSubscriptionDetail,
    defaultPersonalInfo,
  ]);

  // Hydrate form from fetched details
  useEffect(() => {
    if (!activeApplicationId || !personalDetail) return;

    setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
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
        },
      }));
  }, [activeApplicationId, personalDetail]);

  useEffect(() => {
    if (!activeProfessionalDetail) return;

    const apiData = activeProfessionalDetail?.professionalDetails || {};
      const membershipCategory = apiData.membershipCategory;
      
      // Convert boolean nursingAdaptationProgramme to "yes"/"no" string
      // Only convert if value exists, otherwise leave undefined (no default selection)
      let nursingAdaptationProgramme = undefined;
      if (apiData.nursingAdaptationProgramme !== undefined && apiData.nursingAdaptationProgramme !== null) {
        if (typeof apiData.nursingAdaptationProgramme === 'boolean') {
          nursingAdaptationProgramme = apiData.nursingAdaptationProgramme ? 'yes' : 'no';
        } else if (typeof apiData.nursingAdaptationProgramme === 'string') {
          const lowerValue = apiData.nursingAdaptationProgramme.toLowerCase();
          if (lowerValue === 'yes' || lowerValue === 'true') {
            nursingAdaptationProgramme = 'yes';
          } else if (lowerValue === 'no' || lowerValue === 'false') {
            nursingAdaptationProgramme = 'no';
          } else {
            nursingAdaptationProgramme = apiData.nursingAdaptationProgramme;
          }
        }
      }

      // Map nurseType from API format to display format
      const mappedNurseType = apiData.nurseType ? mapNurseTypeFromAPI(apiData.nurseType) : '';

      setFormData(prev => ({
        ...prev,
        professionalDetails: {
          ...prev.professionalDetails,
          membershipCategory: membershipCategory || '',
          workLocation: apiData.workLocation || '',
          otherWorkLocation: apiData.otherWorkLocation ?? '',
          grade: apiData.grade || '',
          otherGrade: apiData.otherGrade ?? '',
          nmbiNo: apiData.nmbiNumber ?? '',
          nmbiNumber: apiData.nmbiNumber ?? '', // Keep both for compatibility
          nurseType: mappedNurseType, // Use mapped value (API format -> display format)
          nursingAdaptationProgramme: nursingAdaptationProgramme !== undefined ? nursingAdaptationProgramme : undefined,
          nursingAdaptation: apiData.nursingAdaptationProgramme ? true : false, // Keep for backward compatibility
          region: apiData.region ?? '',
          branch: apiData.branch ?? '',
          pensionNo: apiData.pensionNo ?? '',
          isRetired: apiData.isRetired ?? false,
          retiredDate: apiData.retiredDate ?? apiData.retirementDate ?? '',
          retirementDate: apiData.retirementDate ?? apiData.retiredDate ?? '',
          studyLocation: apiData.studyLocation ?? '',
          startDate: apiData.startDate ?? '',
          graduationDate: apiData.graduationDate ?? '',
          discipline: apiData.discipline ?? '',
        },
      }));

      // Fetch category data when membershipCategory is available (matching web version)
      if (membershipCategory) {
        getCategoryData(membershipCategory, categoryLookups || []);
      }
  }, [activeProfessionalDetail, categoryLookups, getCategoryData]);

  useEffect(() => {
    if (!activeSubscriptionDetail) return;

    const subData = activeSubscriptionDetail?.subscriptionDetails || {};
    const normalizedStatus = normalizeApplicationStatus(applicationStatus);
    if (
      normalizedStatus === 'submitted' ||
      normalizedStatus === 'approved' ||
      normalizedStatus === 'in review'
    ) {
      setIsSubmitted(true);
    }
      
      // Convert otherIrishTradeUnion from boolean to 'yes'/'no' string (matching web version)
      let otherIrishTradeUnion = '';
      if (subData.otherIrishTradeUnion !== undefined && subData.otherIrishTradeUnion !== null) {
        if (typeof subData.otherIrishTradeUnion === 'boolean') {
          otherIrishTradeUnion = subData.otherIrishTradeUnion ? 'yes' : 'no';
        } else if (typeof subData.otherIrishTradeUnion === 'string') {
          otherIrishTradeUnion = subData.otherIrishTradeUnion;
        }
      }
      
      // Convert otherScheme from boolean to 'yes'/'no' string (matching web version)
      let otherScheme = '';
      if (subData.otherScheme !== undefined && subData.otherScheme !== null) {
        if (typeof subData.otherScheme === 'boolean') {
          otherScheme = subData.otherScheme ? 'yes' : 'no';
        } else if (typeof subData.otherScheme === 'string') {
          otherScheme = subData.otherScheme;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        subscriptionDetails: {
          ...prev.subscriptionDetails,
          paymentType: subData.paymentType || '',
          payrollNo: subData.payrollNo ?? '',
          memberStatus: subData.membershipStatus || subData.memberStatus || '', // API uses membershipStatus, form uses memberStatus
          otherIrishTradeUnion: otherIrishTradeUnion,
          otherIrishTradeUnionName: subData.otherIrishTradeUnionName ?? '', // Match web version field name
          otherScheme: otherScheme,
          recuritedBy: subData.recuritedBy ?? '',
          recuritedByMembershipNo: subData.recuritedByMembershipNo ?? '',
          primarySection: subData.primarySection || '',
          otherPrimarySection: subData.otherPrimarySection ?? '',
          secondarySection: subData.secondarySection || '',
          otherSecondarySection: subData.otherSecondarySection ?? '',
          incomeProtectionScheme: subData.incomeProtectionScheme ?? false,
          inmoRewards: subData.inmoRewards ?? false,
          exclusiveDiscountsAndOffers: subData.exclusiveDiscountsAndOffers ?? false, // Add missing field
          valueAddedServices: subData.valueAddedServices ?? false,
          termsAndConditions: subData.termsAndConditions ?? false,
          membershipCategory: subData.membershipCategory || '',
          dateJoined: subData.dateJoined || '',
          paymentFrequency: subData.paymentFrequency || '',
          previousMembershipNumber: subData.previousMembershipNumber ?? '',
          joinYouthForum:
            subData.joinYouthForum === true
              ? 'yes'
              : subData.joinYouthForum === false
              ? 'no'
              : subData.joinYouthForum || '',
          youthForum: subData.youthForum ?? '',
        },
      }));
  }, [activeSubscriptionDetail, applicationStatus]);

  const resolveApplicationId = () =>
    activeApplicationId ?? personalDetail?.applicationId;

  // API create/update helpers
  const createPersonalDetail = data => {
    setStepLoading(true);
    const personalInfo = {};
    const personalFields = {
      title: data.title,
      surname: data.surname,
      forename: data.forename,
      gender: data.gender,
      dateOfBirth: data.dob,
      countryPrimaryQualification: data.countryPrimaryQualification,
    };
    personalInfo.personalInfo = {};
    Object.entries(personalFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') personalInfo.personalInfo[k] = v; });
    const contactFields = {
      preferredAddress: data.preferredAddress ? data.preferredAddress.toLowerCase() : data.preferredAddress,
      eircode: data.eircode,
      buildingOrHouse: data.addressLine1,
      streetOrRoad: data.addressLine2,
      areaOrTown: data.addressLine3,
      countyCityOrPostCode: data.addressLine4,
      country: data.country,
      mobileNumber: data.mobileNo,
      telephoneNumber: data.homeWorkTelNo,
      preferredEmail: data.preferredEmail ? data.preferredEmail.toLowerCase() : data.preferredEmail,
      personalEmail: data.personalEmail,
      workEmail: data.workEmail,
      consent: data.consent,
    };
    personalInfo.contactInfo = {};
    Object.entries(contactFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') personalInfo.contactInfo[k] = v; });
    createPersonalDetailRequest(personalInfo).then(res => {
      setStepLoading(false);
      if (res?.status === 200) {
        getPersonalDetail();
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to add personal detail');
      }
    }).catch(() => {
      setStepLoading(false);
      Alert.alert('Error', 'Something went wrong');
    });
  };

  const updatePersonalDetail = data => {
    const applicationId = resolveApplicationId();
    if (!applicationId) return;
    setStepLoading(true);
    const personalInfo = {};
    const personalFields = {
      title: data.title,
      surname: data.surname,
      forename: data.forename,
      gender: data.gender,
      dateOfBirth: data.dob,
      countryPrimaryQualification: data.countryPrimaryQualification,
    };
    personalInfo.personalInfo = {};
    Object.entries(personalFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') personalInfo.personalInfo[k] = v; });
    const contactFields = {
      preferredAddress: data.preferredAddress ? data.preferredAddress.toLowerCase() : data.preferredAddress,
      eircode: data.eircode,
      buildingOrHouse: data.addressLine1,
      streetOrRoad: data.addressLine2,
      areaOrTown: data.addressLine3,
      countyCityOrPostCode: data.addressLine4,
      country: data.country,
      mobileNumber: data.mobileNo,
      telephoneNumber: data.homeWorkTelNo,
      preferredEmail: data.preferredEmail ? data.preferredEmail.toLowerCase() : data.preferredEmail,
      personalEmail: data.personalEmail,
      workEmail: data.workEmail,
      consent: data.consent,
    };
    personalInfo.contactInfo = {};
    Object.entries(contactFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') personalInfo.contactInfo[k] = v; });
    updatePersonalDetailRequest(applicationId, personalInfo).then(res => {
      setStepLoading(false);
      console.log('🔄 Updating personal detail with:', res);
      if (res?.status === 200) {
        getPersonalDetail();
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to update personal detail');
      }
    }).catch(() => {
      setStepLoading(false);
      Alert.alert('Error', 'Something went wrong');
    });
  };

  // Helper function to convert nurseType from API format to display format (matching ProfessionalDetails.js)
  const mapNurseTypeFromAPI = (apiValue) => {
    if (!apiValue) return '';
    
    const mapping = {
      'generalNursing': 'General Nurse',
      'publicHealthNurse': 'Public Health Nurse',
      'publicHealthNursing': 'Public Health Nurse', // Handle both variations
      'mentalHealthNurse': 'Mental health nurse',
      'mentalHealthNursing': 'Mental health nurse', // Handle both variations
      'midwifery': 'Midwife',
      'midwife': 'Midwife', // Handle both variations
      'sickChildrenNurse': "Sick Children's Nurse",
      'sickChildrenNursing': "Sick Children's Nurse", // Handle both variations
      'intellectualDisability': 'Registered Nurse for Intellectual Disability',
      'intellectualDisabilityNursing': 'Registered Nurse for Intellectual Disability',
    };
    
    // If exact match found, return mapped value
    if (mapping[apiValue]) {
      return mapping[apiValue];
    }
    
    // If already in display format, return as is
    const displayValues = Object.values(mapping);
    if (displayValues.includes(apiValue)) {
      return apiValue;
    }
    
    // Try case-insensitive match
    const lowerApiValue = apiValue.toLowerCase();
    for (const [key, value] of Object.entries(mapping)) {
      if (key.toLowerCase() === lowerApiValue) {
        return value;
      }
    }
    
    return apiValue; // Return original if no match found
  };

  // Helper function to convert nurseType from display format to API format
  const mapNurseTypeToAPI = (displayValue) => {
    if (!displayValue) return '';
    
    const reverseMapping = {
      'General Nurse': 'generalNursing',
      'Public Health Nurse': 'publicHealthNursing',
      'Mental health nurse': 'mentalHealthNursing',
      'Midwife': 'midwifery',
      "Sick Children's Nurse": 'sickChildrenNursing',
      'Registered Nurse for Intellectual Disability': 'intellectualDisabilityNursing',
    };
    
    // If exact match found, return API value
    if (reverseMapping[displayValue]) {
      return reverseMapping[displayValue];
    }
    
    // If already in API format, return as is
    const apiValues = Object.values(reverseMapping);
    if (apiValues.includes(displayValue)) {
      return displayValue;
    }
    
    return displayValue; // Return original if no match found
  };

  const createProfessionalDetail = data => {
    const applicationId = resolveApplicationId();
    if (!applicationId) return;
    setStepLoading(true);
    
    // Convert nursingAdaptationProgramme from "yes"/"no" string to boolean
    const nursingAdaptationProgramme = data?.nursingAdaptationProgramme === 'yes' || data?.nursingAdaptation === true;
    
    // Convert nurseType from display format to API format
    const nurseTypeAPI = data.nurseType ? mapNurseTypeToAPI(data.nurseType) : '';
    
    const professionalFields = {
      membershipCategory: data.membershipCategory,
      workLocation: data.workLocation,
      otherWorkLocation: data.otherWorkLocation,
      grade: data.grade,
      otherGrade: data.otherGrade,
      nmbiNumber: data.nmbiNo || data.nmbiNumber || '', // Use nmbiNo first, fallback to nmbiNumber
      nurseType: nurseTypeAPI,
      nursingAdaptationProgramme: nursingAdaptationProgramme,
      region: data.region,
      branch: data.branch,
      pensionNo: data.pensionNo,
      isRetired: data?.membershipCategory === 'retired_associate',
      retiredDate: data.retirementDate || data.retiredDate,
      retirementDate: data.retirementDate || data.retiredDate,
      studyLocation: data.studyLocation,
      graduationDate: data.graduationDate,
      discipline: data.discipline,
    };
    const professionalInfo = { professionalDetails: {} };
    Object.entries(professionalFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') professionalInfo.professionalDetails[k] = v; });
    createProfessionalDetailRequest(applicationId, professionalInfo).then(res => {
      setStepLoading(false);
      if (res?.status === 200) {
        getProfessionalDetail();
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to add professional detail');
      }
    }).catch(() => {
      setStepLoading(false);
      Alert.alert('Error', 'Something went wrong');
    });
  };

  const updateProfessionalDetail = data => {
    const applicationId = resolveApplicationId();
    if (!applicationId) return;
    setStepLoading(true);
    
    // Convert nursingAdaptationProgramme from "yes"/"no" string to boolean
    const nursingAdaptationProgramme = data?.nursingAdaptationProgramme === 'yes' || data?.nursingAdaptation === true;
    
    // Convert nurseType from display format to API format
    const nurseTypeAPI = data.nurseType ? mapNurseTypeToAPI(data.nurseType) : '';
    
    const professionalFields = {
      membershipCategory: data.membershipCategory,
      workLocation: data.workLocation,
      otherWorkLocation: data.otherWorkLocation,
      grade: data.grade,
      otherGrade: data.otherGrade,
      nmbiNumber: data.nmbiNo || data.nmbiNumber || '', // Use nmbiNo first, fallback to nmbiNumber
      nurseType: nurseTypeAPI,
      nursingAdaptationProgramme: nursingAdaptationProgramme,
      region: data.region,
      branch: data.branch,
      pensionNo: data.pensionNo,
      isRetired: data?.membershipCategory === 'retired_associate',
      retiredDate: data.retirementDate || data.retiredDate,
      retirementDate: data.retirementDate || data.retiredDate,
      studyLocation: data.studyLocation,
      graduationDate: data.graduationDate,
      discipline: data.discipline,
    };
    const professionalInfo = { professionalDetails: {} };
    Object.entries(professionalFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') professionalInfo.professionalDetails[k] = v; });
    updateProfessionalDetailRequest(applicationId, professionalInfo).then(res => {
      setStepLoading(false);
      if (res?.status === 200) {
        getProfessionalDetail();
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to update professional detail');
      }
    }).catch(() => {
      setStepLoading(false);
      Alert.alert('Error', 'Something went wrong');
    });
  };

  const createSubscriptionDetail = data => {
    const applicationId = resolveApplicationId();
    if (!applicationId) return;
    const defaultFields = {
      membershipCategory: professionalDetail?.professionalDetails?.membershipCategory,
    };
    const subscriptionFields = {
      paymentType: data?.paymentType,
      payrollNo: data?.payrollNo,
      membershipStatus: data?.memberStatus, // API uses membershipStatus (matching web version)
      otherIrishTradeUnion: data?.otherIrishTradeUnion === 'yes', // Convert string to boolean (matching web version)
      otherIrishTradeUnionName: data?.otherIrishTradeUnionName, // Match web version field name
      otherScheme: data?.otherScheme === 'yes' || data?.otherScheme === true, // Convert string to boolean (matching web version)
      previousMembershipNumber: data?.previousMembershipNumber,
      joinYouthForum: data?.joinYouthForum === 'yes',
      youthForum: data?.youthForum,
      recuritedBy: data?.recuritedBy,
      recuritedByMembershipNo: data?.recuritedByMembershipNo,
      primarySection: data?.primarySection,
      otherPrimarySection: data?.otherPrimarySection,
      secondarySection: data?.secondarySection,
      otherSecondarySection: data?.otherSecondarySection,
      incomeProtectionScheme: data?.incomeProtectionScheme === true,
      inmoRewards: data?.inmoRewards === true,
      exclusiveDiscountsAndOffers: data?.exclusiveDiscountsAndOffers === true, // Add missing field (matching web version)
      valueAddedServices: data?.valueAddedServices === true,
      termsAndConditions: data?.termsAndConditions === true,
      paymentFrequency: data?.paymentFrequency,
      ...defaultFields,
    };
    const subscriptionDetails = {};
    Object.entries(subscriptionFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') subscriptionDetails[k] = v; });
    const subscriptionInfo = { subscriptionDetails };
    setStepLoading(true);
    createSubscriptionDetailRequest(applicationId, subscriptionInfo).then(res => {
      setStepLoading(false);
      if (res?.status === 200) {
        console.log('✅ Subscription detail created successfully');
        getSubscriptionDetail();
        
        // Check if undergraduate student - they don't need payment (matching web version)
        if (categoryData?.name === 'Undergraduate Student' ||
            professionalDetail?.professionalDetails?.membershipCategory === 'Undergraduate Student' ||
            professionalDetail?.professionalDetails?.membershipCategory === 'undergraduate_student') {
          console.log('🎓 Undergraduate student - skipping payment');
          setIsSubmitted(true);
          Alert.alert('Success', 'Application submitted successfully!', [
            {
              text: 'OK',
              onPress: () => navigateToDashboardAfterSubmit(),
            },
          ]);
        } else {
          // Trigger payment modal for other categories (matching web version)
          console.log('💳 Triggering payment modal...');
          setShouldShowModal(true);
        }
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to add subscription detail');
      }
    }).catch(err => {
      setStepLoading(false);
      console.error('❌ Subscription creation failed:', err);
      Alert.alert('Error', 'Something went wrong');
    });
  };

  const updateSubscriptionDetail = data => {
    const applicationId = resolveApplicationId();
    if (!applicationId) return;
    const defaultFields = {
      membershipCategory: professionalDetail?.professionalDetails?.membershipCategory,
    };
    const subscriptionFields = {
      paymentType: data?.paymentType,
      payrollNo: data?.payrollNo,
      membershipStatus: data?.memberStatus, // API uses membershipStatus (matching web version)
      otherIrishTradeUnion: data?.otherIrishTradeUnion === 'yes', // Convert string to boolean (matching web version)
      otherIrishTradeUnionName: data?.otherIrishTradeUnionName, // Match web version field name
      otherScheme: data?.otherScheme === 'yes' || data?.otherScheme === true, // Convert string to boolean (matching web version)
      previousMembershipNumber: data?.previousMembershipNumber,
      joinYouthForum: data?.joinYouthForum === 'yes',
      youthForum: data?.youthForum,
      recuritedBy: data?.recuritedBy,
      recuritedByMembershipNo: data?.recuritedByMembershipNo,
      primarySection: data?.primarySection,
      otherPrimarySection: data?.otherPrimarySection,
      secondarySection: data?.secondarySection,
      otherSecondarySection: data?.otherSecondarySection,
      incomeProtectionScheme: data?.incomeProtectionScheme === true,
      inmoRewards: data?.inmoRewards === true,
      exclusiveDiscountsAndOffers: data?.exclusiveDiscountsAndOffers === true, // Add missing field (matching web version)
      valueAddedServices: data?.valueAddedServices === true,
      termsAndConditions: data?.termsAndConditions === true,
      paymentFrequency: data?.paymentFrequency,
      ...defaultFields,
    };
    const subscriptionDetails = {};
    Object.entries(subscriptionFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') subscriptionDetails[k] = v; });
    const subscriptionInfo = { subscriptionDetails };
    setStepLoading(true);
    updateSubscriptionDetailRequest(applicationId, subscriptionInfo).then(res => {
      console.log('🔄 Updating subscription detail with:', res);
      setStepLoading(false);
      if (res?.status === 200) {
        console.log('✅ Subscription detail updated successfully');
        getSubscriptionDetail();
        
        // Check if undergraduate student - they don't need payment (matching web version)
        if (categoryData?.name === 'Undergraduate Student' ||
            professionalDetail?.professionalDetails?.membershipCategory === 'Undergraduate Student' ||
            professionalDetail?.professionalDetails?.membershipCategory === 'undergraduate_student') {
          console.log('🎓 Undergraduate student - skipping payment');
          setIsSubmitted(true);
          Alert.alert('Success', 'Application updated successfully!', [
            {
              text: 'OK',
              onPress: () => navigateToDashboardAfterSubmit(),
            },
          ]);
        } else {
          // Trigger payment modal for other categories (matching web version)
          console.log('💳 Triggering payment modal...');
          setShouldShowModal(true);
        }
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to update subscription detail');
      }
    }).catch(err => {
      setStepLoading(false);
      console.error('❌ Subscription update failed:', err);
      Alert.alert('Error', 'Something went wrong');
    });
  };

  const renderStepContent = () => {
    try {
      switch (currentStep) {
        case 1:
          return (
            <PersonalInformation
              formData={formData.personalInfo}
              onFormDataChange={data => handleFormDataChange('personalInfo', data)}
              showValidation={showValidation}
              personalDetail={personalDetail}
            />
          );
        case 2:
          return (
            <ProfessionalDetails
              formData={formData.professionalDetails}
              onFormDataChange={data => handleFormDataChange('professionalDetails', data)}
              showValidation={showValidation}
            />
          );
        case 3:
          return (
            <SubscriptionDetails
              formData={formData.subscriptionDetails}
              onFormDataChange={data => handleFormDataChange('subscriptionDetails', data)}
              showValidation={showValidation}
              categoryData={categoryData}
              dateOfBirth={formData.personalInfo?.dob}
              workLocation={formData.professionalDetails?.workLocation}
            />
          );
        default:
          return null;
      }
    } catch (error) {
      console.error('❌ Error rendering step content:', error);
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: 'red', fontSize: 16 }}>Error loading form step</Text>
        </View>
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <ScreenHeader title="Application" />

        {/* Stepper */}
        <View style={[styles.stepperRow, { paddingHorizontal: 20, marginRight: 10}]}>
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.number || (isSubmitted && step.number === 3);
            const isCurrent = currentStep === step.number;
            const isClickable = isCompleted || isCurrent || step.number === currentStep + 1;
            const isDisabled = !isClickable || stepLoading;
            
            return (
              <React.Fragment key={step.number}>
                <TouchableOpacity
                  style={styles.stepperItemContainer}
                  onPress={() => !isDisabled && handleStepClick(step.number)}
                  disabled={isDisabled}
                  activeOpacity={isDisabled ? 1 : 0.7}
                >
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        width: Math.max(40, width * 0.1), 
                        height: Math.max(40, width * 0.1), 
                        borderRadius: Math.max(20, width * 0.05),
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 3,
                        borderWidth: currentStep === step.number ? 2 : 0,
                        borderColor: currentStep === step.number ? Colors.primary : 'transparent',
                        backgroundColor: currentStep === step.number
                          ? Colors.primary
                          : currentStep > step.number
                            ? Colors.primary
                            : '#E5E5E5',
                        opacity: isDisabled ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Text style={{
                      color: (currentStep === step.number || currentStep > step.number) ? Colors.white : '#999999',
                      fontWeight: 'bold',
                      fontSize: Math.max(16, width * 0.04),
                    }}>
                      {(() => {
                        if (isSubmitted && step.number === 3) {
                          return '✓';
                        } else if (currentStep > step.number) {
                          return '✓';
                        } else {
                          return String(step.number);
                        }
                      })()}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: Math.max(10, width * 0.027),
                    color: currentStep === step.number ? Colors.textPrimary : Colors.textSecondary,
                    fontWeight: currentStep === step.number ? '600' : 'normal',
                    marginTop: 6,
                    textAlign: 'center',
                    width: Math.max(70, width * 0.22),
                    opacity: isDisabled ? 0.6 : 1,
                  }}>
                    {String(step.title)}
                  </Text>
                </TouchableOpacity>
                {idx < steps.length - 1 && (
                  <View style={[
                    styles.stepConnector,
                    { backgroundColor: currentStep > step.number ? Colors.primary : '#E5E5E5', width: Math.max(20, width * 0.08) }
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
        
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={[{ key: 'content' }]}
            renderItem={() => (
              <>
                {/* Step Content */}
                <View style={[ { borderRadius: 16, backgroundColor: Colors.background,paddingHorizontal: 10 }]}>
                  {renderStepContent()}
                </View>
                
                {/* Navigation Buttons - Hide when keyboard is visible */}
                {!isKeyboardVisible && (
                  <View style={{
                    backgroundColor: Colors.background,
                    paddingHorizontal: 20,
                    paddingTop: 20,
                    paddingBottom: 8,
                  }}>
                    <View style={styles.buttonRow}>
                      <Button
                        title={currentStep === 1 ? "Save Draft" : steps[currentStep - 2]?.title || "Previous"}
                        onPress={handlePrevious}
                        disabled={false}
                        outlined={true}
                        textStyle={{ 
                          fontSize: 16, 
                          color: Colors.textPrimary,
                          fontWeight: '600',
                        }}
                        style={{ 
                          flex: 1, 
                          marginRight: 8,
                          backgroundColor: '#E8EEF7',
                          borderColor: '#E8EEF7',
                          borderWidth: 0,
                          borderRadius: 25,
                          height: 56,
                        }}
                      />
                      <Button
                        title={currentStep === steps.length ? 'Submit Application' : steps[currentStep]?.title || 'Next Step'}
                        onPress={handleNext}
                        primary
                        isloading={stepLoading}
                        disabled={stepLoading}
                        textStyle={{ 
                          fontSize: 16, 
                          color: Colors.white, 
                          fontWeight: '600',
                        }}
                        style={{ 
                          flex: 1, 
                          marginLeft: 8,
                          backgroundColor: Colors.primary,
                          borderRadius: 25,
                          height: 56,
                        }}
                      />
                    </View>
                  </View>
                )}
                
                {/* Payment Modal (Stripe) */}
                <SubscriptionPaymentModal
                  visible={isModalVisible}
                  onClose={handleModalClose}
                  onSuccess={handlePaymentSuccess}
                  onFailure={handlePaymentFailure}
                  formData={formData}
                  membershipCategory={professionalDetail?.professionalDetails?.membershipCategory || formData?.professionalDetails?.membershipCategory}
                  applicationId={personalDetail?.applicationId}
                />
              </>
            )}
            keyExtractor={(item) => item.key}
            contentContainerStyle={[styles.container, { 
              paddingBottom: isKeyboardVisible ? hp(20) : hp(3),
              backgroundColor: Colors.background
            }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    backgroundColor: Colors.background, 
    flexGrow: 1,
    paddingTop: 16,
  },
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
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5A77B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { 
    fontWeight: 'bold', 
    marginBottom: 16,
    color: Colors.textPrimary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(2),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginLeft: 10,
    marginRight: 10,
    paddingVertical: hp(1),
    backgroundColor: Colors.cardBackground,
  },
  stepperItemContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  stepCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepConnector: {
    height: 2,
    alignSelf: 'center',
    borderRadius: 1,
    marginHorizontal: 2,
  },
  card: { 
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    alignItems: 'center' 
  },
});

export default Application;