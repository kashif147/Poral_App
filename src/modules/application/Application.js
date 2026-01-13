import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, FlatList, Alert, useWindowDimensions, Platform, KeyboardAvoidingView, Keyboard, ActivityIndicator, TouchableOpacity } from 'react-native';
import PersonalInformation from './PersonalInformation';
import ProfessionalDetails from './ProfessionalDetails';
import SubscriptionDetails from './SubscriptionDetails';
import { Wrapper } from '../../common/wrapper';
import { Colors, commonStyles, hp } from '../../utils/Styles';
import { Button } from '../../common/button';
import SubscriptionPaymentModal from './components/SubscriptionPaymentModal';
import { useApplication } from '../../contexts/applicationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../../common/screenHeader';
import {
  fetchPersonalDetail,
  fetchProfessionalDetail,
  fetchSubscriptionDetail,
  createPersonalDetailRequest,
  updatePersonalDetailRequest,
  createProfessionalDetailRequest,
  updateProfessionalDetailRequest,
  createSubscriptionDetailRequest,
  updateSubscriptionDetailRequest,
} from '../../api/application.api';
import { fetchCategoryByCategoryId } from '../../api/category.api';

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
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [showValidation, setShowValidation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [personalDetail, setPersonalDetail] = useState(null);
  const [professionalDetail, setProfessionalDetail] = useState(null);
  const [subscriptionDetail, setSubscriptionDetail] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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
        if (!personalDetail) {
          createPersonalDetail(formData.personalInfo);
        } else {
          updatePersonalDetail(formData.personalInfo);
        }
      } else if (currentStep === 2) {
        console.log('💼 Processing step 2...');
        if (!professionalDetail) {
          createProfessionalDetail(formData.professionalDetails);
        } else {
          updateProfessionalDetail(formData.professionalDetails);
        }
      } else if (currentStep === 3) {
        console.log('📋 Processing step 3...');
        console.log('subscriptionDetail exists?', !!subscriptionDetail);
        // Always create/update subscription detail first
        if (!subscriptionDetail) {
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
      console.log('❌ Validation failed for step', currentStep);
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
          mobileNo,
          addressLine1,
          addressLine4,
          preferredAddress,
        } = formData.personalInfo || {};
        if (
          !title ||
          !forename ||
          !surname ||
          !gender ||
          !dob ||
          !personalEmail ||
          !mobileNo ||
          !addressLine1 ||
          !addressLine4 ||
          !preferredAddress
        ) {
          return false;
        }
        break;
      }
      case 2: {
        const {
          workLocation,
          grade,
          membershipCategory,
          nursingAdaptation,
          nursingAdaptationProgramme,
          nurseType,
          nmbiNo,
        } = formData.professionalDetails || {};
        
        // Check required fields
        if (!grade || !membershipCategory) {
          return false;
        }
        
        // Work location is only required for non-undergraduate students
        const isUndergraduateStudent = membershipCategory === 'undergraduate_student';
        if (!isUndergraduateStudent && !workLocation) {
          return false;
        }
        
        // Check nursingAdaptationProgramme (can be "yes"/"no" string or boolean)
        const isNursingAdaptation = nursingAdaptation === true || 
          nursingAdaptationProgramme === 'yes';
        if (isNursingAdaptation) {
          if (!nurseType || !nmbiNo) return false;
        }
        break;
      }
      case 3: {
        const {
          paymentType,
          payrollNo,
          otherIrishTradeUnion,
          otherScheme,
          memberStatus,
          termsAndConditions,
          primarySection,
          otherPrimarySection,
          secondarySection,
          otherSecondarySection,
          incomeProtectionScheme,
          inmoRewards,
        } = formData.subscriptionDetails || {};
        
        console.log('📋 Step 3 Validation Data:', {
          paymentType,
          payrollNo,
          otherIrishTradeUnion,
          otherScheme,
          memberStatus,
          termsAndConditions,
          incomeProtectionScheme,
          inmoRewards,
        });
        
        // Required fields
        if (!paymentType) {
          console.log('❌ Validation failed: paymentType missing');
          return false;
        }
        // Check if payment type requires payroll number (matching web version)
        const requiresPayrollNo = ['Direct Debit', 'Salary Deduction', 'Deduction at Source'].includes(paymentType);
        if (requiresPayrollNo && !payrollNo) {
          console.log('❌ Validation failed: payrollNo missing for', paymentType);
          return false;
        }
        if (!memberStatus) {
          console.log('❌ Validation failed: memberStatus missing');
          return false;
        }
        if (!otherIrishTradeUnion) {
          console.log('❌ Validation failed: otherIrishTradeUnion missing');
          return false;
        }
        if (!otherScheme) {
          console.log('❌ Validation failed: otherScheme missing');
          return false;
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
        
        // Required for new/graduate members
        // if (memberStatus === 'new' || memberStatus === 'graduate') {
        //   if (!incomeProtectionScheme) {
        //     console.log('❌ Validation failed: incomeProtectionScheme missing for new/graduate');
        //     return false;
        //   }
        //   // if (!inmoRewards) {
        //   //   console.log('❌ Validation failed: inmoRewards missing for new/graduate');
        //   //   return false;
        //   // }
        // }
        
        console.log('✅ Step 3 validation passed!');
        break;
      }
    }
    return true;
  };

  const handleSubmit = () => {
    setShowValidation(true);
    if (validateCurrentStep()) {
      setIsSubmitted(true);
      setIsModalVisible(true);
      // Submit formData to backend here
      // Alert.alert('Form submitted!', JSON.stringify(formData, null, 2));
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('✅ Payment Success Data:', paymentData);
    
    // Close the payment modal
    setIsModalVisible(false);
    
    // Show success alert and mark as submitted
    Alert.alert('Success', 'Payment completed successfully!', [
      {
        text: 'OK',
        onPress: () => {
          // Reset form state
          setIsSubmitted(true);
        }
      }
    ]);
  };

  const handlePaymentFailure = (message) => {
    console.log('❌ Payment Failed:', message);
    setIsModalVisible(false);
    Alert.alert('Payment Failed', message || 'Please try again.');
  };

  // Load from API on mount
  useEffect(() => {
    const loadFromApi = async () => {
      setLoading(true);
      try {
        const res = await fetchPersonalDetail();
        if (res?.status === 200) {
          setPersonalDetail(res?.data?.data);
        }
      } catch { }
      setLoading(false);
    };
    loadFromApi();
  }, []);

  // When we have applicationId, fetch other details
  useEffect(() => {
    const loadMore = async () => {
      if (!personalDetail?.applicationId) return;
      setLoading(true);
      try {
        const [profRes, subRes] = await Promise.all([
          fetchProfessionalDetail(personalDetail.applicationId),
          fetchSubscriptionDetail(personalDetail.applicationId),
        ]);
        if (profRes?.status === 200) setProfessionalDetail(profRes?.data?.data);
        if (subRes?.status === 200) setSubscriptionDetail(subRes?.data?.data);
      } catch { }
      setLoading(false);
    };
    loadMore();
  }, [personalDetail?.applicationId]);

  // Hydrate form from fetched details
  useEffect(() => {
    if (personalDetail) {
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
    }
  }, [personalDetail]);

  useEffect(() => {
    if (professionalDetail) {
      const apiData = professionalDetail?.professionalDetails || {};
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
          retiredDate: apiData.retiredDate ?? '',
          studyLocation: apiData.studyLocation ?? '',
          startDate: apiData.startDate ?? '',
          graduationDate: apiData.graduationDate ?? '',
          discipline: apiData.discipline ?? '',
        },
      }));

      // Fetch category data when membershipCategory is available (matching web version)
      if (membershipCategory) {
        fetchCategoryByCategoryId(membershipCategory)
          .then(res => {
            const payload = res?.data?.data || res?.data;
            setCategoryData(payload || null);
          })
          .catch(error => {
            console.error('Failed to fetch category data:', error);
            setCategoryData(null);
          });
      }
    }
  }, [professionalDetail, professionalDetail?.professionalDetails?.membershipCategory]);

  useEffect(() => {
    if (subscriptionDetail) {
      setIsSubmitted(true);
      const subData = subscriptionDetail?.subscriptionDetails || {};
      
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
        },
      }));
    }
  }, [subscriptionDetail]);

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
        setPersonalDetail(res?.data?.data);
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
    if (!personalDetail?.applicationId) return;
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
    updatePersonalDetailRequest(personalDetail.applicationId, personalInfo).then(res => {
      setStepLoading(false);
      console.log('🔄 Updating personal detail with:', res);
      if (res?.status === 200) {
        setPersonalDetail(res?.data?.data);
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
    if (!personalDetail?.applicationId) return;
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
      retiredDate: data.retiredDate,
      studyLocation: data.studyLocation,
      graduationDate: data.graduationDate,
    };
    const professionalInfo = { professionalDetails: {} };
    Object.entries(professionalFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') professionalInfo.professionalDetails[k] = v; });
    createProfessionalDetailRequest(personalDetail.applicationId, professionalInfo).then(res => {
      setStepLoading(false);
      if (res?.status === 200) {
        setProfessionalDetail(res?.data?.data);
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
    if (!personalDetail?.applicationId) return;
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
      retiredDate: data.retiredDate,
      studyLocation: data.studyLocation,
      graduationDate: data.graduationDate,
    };
    const professionalInfo = { professionalDetails: {} };
    Object.entries(professionalFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') professionalInfo.professionalDetails[k] = v; });
    updateProfessionalDetailRequest(personalDetail.applicationId, professionalInfo).then(res => {
      setStepLoading(false);
      if (res?.status === 200) {
        setProfessionalDetail(res?.data?.data);
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
    if (!personalDetail?.applicationId) return;
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
      paymentFrequency: data?.paymentType === 'Credit Card' ? 'Annually' : 'Monthly', // Add payment frequency (matching web version)
      ...defaultFields,
    };
    const subscriptionDetails = {};
    Object.entries(subscriptionFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') subscriptionDetails[k] = v; });
    const subscriptionInfo = { subscriptionDetails };
    setStepLoading(true);
    createSubscriptionDetailRequest(personalDetail.applicationId, subscriptionInfo).then(res => {
      setStepLoading(false);
      if (res?.status === 200) {
        console.log('✅ Subscription detail created successfully');
        setSubscriptionDetail(res?.data?.data);
        
        // Check if undergraduate student - they don't need payment (matching web version)
        if (categoryData?.name === 'Undergraduate Student' ||
            professionalDetail?.professionalDetails?.membershipCategory === 'Undergraduate Student' ||
            professionalDetail?.professionalDetails?.membershipCategory === 'undergraduate_student') {
          console.log('🎓 Undergraduate student - skipping payment');
          setIsSubmitted(true);
          Alert.alert('Success', 'Application submitted successfully!');
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
    if (!personalDetail?.applicationId) return;
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
      paymentFrequency: data?.paymentType === 'Credit Card' ? 'Annually' : 'Monthly', // Add payment frequency (matching web version)
      ...defaultFields,
    };
    const subscriptionDetails = {};
    Object.entries(subscriptionFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') subscriptionDetails[k] = v; });
    const subscriptionInfo = { subscriptionDetails };
    setStepLoading(true);
    updateSubscriptionDetailRequest(personalDetail.applicationId, subscriptionInfo).then(res => {
      console.log('🔄 Updating subscription detail with:', res);
      setStepLoading(false);
      if (res?.status === 200) {
        console.log('✅ Subscription detail updated successfully');
        setSubscriptionDetail(res?.data?.data);
        
        // Check if undergraduate student - they don't need payment (matching web version)
        if (categoryData?.name === 'Undergraduate Student' ||
            professionalDetail?.professionalDetails?.membershipCategory === 'Undergraduate Student' ||
            professionalDetail?.professionalDetails?.membershipCategory === 'undergraduate_student') {
          console.log('🎓 Undergraduate student - skipping payment');
          setIsSubmitted(true);
          Alert.alert('Success', 'Application updated successfully!');
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

  // Debug log for modal state (matching web version)
  console.log('💳 Payment modal visible:', isModalVisible);

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