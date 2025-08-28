import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, Alert, useWindowDimensions, Platform } from 'react-native';
import PersonalInformation from './PersonalInformation';
import ProfessionalDetails from './ProfessionalDetails';
import SubscriptionDetails from './SubscriptionDetails';
import { Wrapper } from '../../common/wrapper';
import { commonStyles, hp } from '../../utils/Styles';
import { Button } from '../../common/button';
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

const steps = [
  { number: 1, title: 'Personal Information' },
  { number: 2, title: 'Professional Details' },
  { number: 3, title: 'Subscription Details' },
];

const initialFormData = {
  personalInfo: {
    forename: '',
    surname: '',
    personalEmail: '',
    mobileNo: '',
    country: 'Ireland',
    consent: true,
  },
  professionalDetails: {},
  subscriptionDetails: {},
};

const Application = () => {
  const { width, height } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [showValidation, setShowValidation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [personalDetail, setPersonalDetail] = useState(null);
  const [professionalDetail, setProfessionalDetail] = useState(null);
  const [subscriptionDetail, setSubscriptionDetail] = useState(null);

  // Removed local storage persistence; we will hydrate only from API

  const handleNext = () => {
    setShowValidation(true);
    if (validateCurrentStep()) {
      if (currentStep === 1) {
        if (!personalDetail) {
          createPersonalDetail(formData.personalInfo);
        } else {
          updatePersonalDetail(formData.personalInfo);
        }
      } else if (currentStep === 2) {
        if (!professionalDetail) {
          createProfessionalDetail(formData.professionalDetails);
        } else {
          updateProfessionalDetail(formData.professionalDetails);
        }
      } else if (currentStep === 3) {
        // For native, submit directly then show thank-you modal
        if (!subscriptionDetail) {
          createSubscriptionDetail(formData.subscriptionDetails);
        } else {
          updateSubscriptionDetail(formData.subscriptionDetails);
        }
      }
      setShowValidation(false);
    }
  };
  const handlePrevious = () => {
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);
  };

  const handleFormDataChange = (stepName, data) => {
    const newData = { ...formData, [stepName]: data };
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
          address1,
          address4,
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
          !address1 ||
          !address4 ||
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
          nurseType,
          nmbiNo,
        } = formData.professionalDetails || {};
        if (!grade || !workLocation || !membershipCategory) {
          return false;
        }
        if (nursingAdaptation === true) {
          if (!nurseType || !nmbiNo) return false;
        }
        break;
      }
      case 3: {
        const {
          paymentType,
          payrollNo,
          irishTradeUnion,
          membershipStatus,
        } = formData.subscriptionDetails || {};
        if (!paymentType) return false;
        if (paymentType === 'Payroll Deduction' && !payrollNo) return false;
        if (!membershipStatus) return false;
        if (irishTradeUnion === undefined) return false;
        // Add more validations as needed for your business logic
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
      Alert.alert('Form submitted!', JSON.stringify(formData, null, 2));
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
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
      } catch {}
      setLoading(false);
    };
    loadFromApi();
  }, []);

  // When we have ApplicationId, fetch other details
  useEffect(() => {
    const loadMore = async () => {
      if (!personalDetail?.ApplicationId) return;
      setLoading(true);
      try {
        const [profRes, subRes] = await Promise.all([
          fetchProfessionalDetail(personalDetail.ApplicationId),
          fetchSubscriptionDetail(personalDetail.ApplicationId),
        ]);
        if (profRes?.status === 200) setProfessionalDetail(profRes?.data?.data);
        if (subRes?.status === 200) setSubscriptionDetail(subRes?.data?.data);
      } catch {}
      setLoading(false);
    };
    loadMore();
  }, [personalDetail?.ApplicationId]);

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
          address1: personalDetail?.contactInfo?.buildingOrHouse || '',
          address2: personalDetail?.contactInfo?.streetOrRoad || '',
          address3: personalDetail?.contactInfo?.areaOrTown || '',
          address4: personalDetail?.contactInfo?.countyCityOrPostCode || '',
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
      setFormData(prev => ({
        ...prev,
        professionalDetails: {
          ...prev.professionalDetails,
          membershipCategory: professionalDetail?.professionalDetails?.membershipCategory,
          workLocation: professionalDetail?.professionalDetails?.workLocation,
          otherWorkLocation: professionalDetail?.professionalDetails?.otherWorkLocation ?? '',
          grade: professionalDetail?.professionalDetails?.grade,
          otherGrade: professionalDetail?.professionalDetails?.otherGrade ?? '',
          nmbiNo: professionalDetail?.professionalDetails?.nmbiNumber ?? '',
          nurseType: professionalDetail?.professionalDetails?.nurseType ?? '',
          nursingAdaptation: professionalDetail?.professionalDetails?.nursingAdaptationProgramme ? true : false,
          region: professionalDetail?.professionalDetails?.region ?? '',
          branch: professionalDetail?.professionalDetails?.branch ?? '',
          pensionNo: professionalDetail?.professionalDetails?.pensionNo ?? '',
          isRetired: professionalDetail?.professionalDetails?.isRetired ?? false,
          retiredDate: professionalDetail?.professionalDetails?.retiredDate ?? '',
          studyLocation: professionalDetail?.professionalDetails?.studyLocation ?? '',
          graduationDate: professionalDetail?.professionalDetails?.graduationDate ?? '',
        },
      }));
    }
  }, [professionalDetail]);

  useEffect(() => {
    if (subscriptionDetail) {
      setIsSubmitted(true);
      setFormData(prev => ({
        ...prev,
        subscriptionDetails: {
          ...prev.subscriptionDetails,
          paymentType: subscriptionDetail?.subscriptionDetails?.paymentType,
          payrollNo: subscriptionDetail?.subscriptionDetails?.payrollNo ?? '',
          membershipStatus: subscriptionDetail?.subscriptionDetails?.membershipStatus ?? '',
          irishTradeUnion: subscriptionDetail?.subscriptionDetails?.otherIrishTradeUnion ?? false,
          otherScheme: subscriptionDetail?.subscriptionDetails?.otherScheme ?? false,
          recuritedBy: subscriptionDetail?.subscriptionDetails?.recuritedBy ?? '',
          recuritedByMembershipNo: subscriptionDetail?.subscriptionDetails?.recuritedByMembershipNo ?? '',
          primarySection: subscriptionDetail?.subscriptionDetails?.primarySection,
          otherPrimarySection: subscriptionDetail?.subscriptionDetails?.otherPrimarySection ?? '',
          secondarySection: subscriptionDetail?.subscriptionDetails?.secondarySection,
          otherSecondarySection: subscriptionDetail?.subscriptionDetails?.otherSecondarySection ?? '',
          incomeProtectionScheme: subscriptionDetail?.subscriptionDetails?.incomeProtectionScheme ?? false,
          inmoRewards: subscriptionDetail?.subscriptionDetails?.inmoRewards ?? false,
          valueAddedServices: subscriptionDetail?.subscriptionDetails?.valueAddedServices ?? false,
          termsAndConditions: subscriptionDetail?.subscriptionDetails?.termsAndConditions ?? false,
          membershipCategory: subscriptionDetail?.subscriptionDetails?.membershipCategory,
          dateJoined: subscriptionDetail?.subscriptionDetails?.dateJoined,
          paymentFrequency: subscriptionDetail?.subscriptionDetails?.paymentFrequency,
        },
      }));
    }
  }, [subscriptionDetail]);

  // API create/update helpers
  const createPersonalDetail = data => {
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
      preferredAddress: data.preferredAddress,
      eircode: data.eircode,
      buildingOrHouse: data.address1,
      streetOrRoad: data.address2,
      areaOrTown: data.address3,
      countyCityOrPostCode: data.address4,
      country: data.country,
      mobileNumber: data.mobileNo,
      telephoneNumber: data.homeWorkTelNo,
      preferredEmail: data.preferredEmail,
      personalEmail: data.personalEmail,
      workEmail: data.workEmail,
      consent: data.consent,
    };
    personalInfo.contactInfo = {};
    Object.entries(contactFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') personalInfo.contactInfo[k] = v; });
    createPersonalDetailRequest(personalInfo).then(res => {
      if (res?.status === 200) {
        setPersonalDetail(res?.data?.data);
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to add personal detail');
      }
    }).catch(() => Alert.alert('Error', 'Something went wrong'));
  };

  const updatePersonalDetail = data => {
    if (!personalDetail?.ApplicationId) return;
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
      preferredAddress: data.preferredAddress,
      eircode: data.eircode,
      buildingOrHouse: data.address1,
      streetOrRoad: data.address2,
      areaOrTown: data.address3,
      countyCityOrPostCode: data.address4,
      country: data.country,
      mobileNumber: data.mobileNo,
      telephoneNumber: data.homeWorkTelNo,
      preferredEmail: data.preferredEmail,
      personalEmail: data.personalEmail,
      workEmail: data.workEmail,
      consent: data.consent,
    };
    personalInfo.contactInfo = {};
    Object.entries(contactFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') personalInfo.contactInfo[k] = v; });
    updatePersonalDetailRequest(personalDetail.ApplicationId, personalInfo).then(res => {
      if (res?.status === 200) {
        setPersonalDetail(res?.data?.data);
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to update personal detail');
      }
    }).catch(() => Alert.alert('Error', 'Something went wrong'));
  };

  const createProfessionalDetail = data => {
    if (!personalDetail?.ApplicationId) return;
    const professionalFields = {
      membershipCategory: data.membershipCategory,
      workLocation: data.workLocation,
      otherWorkLocation: data.otherWorkLocation,
      grade: data.grade,
      otherGrade: data.otherGrade,
      nmbiNumber: data.nmbiNo,
      nurseType: data.nurseType,
      nursingAdaptationProgramme: data?.nursingAdaptation === true,
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
    createProfessionalDetailRequest(personalDetail.ApplicationId, professionalInfo).then(res => {
      if (res?.status === 200) {
        setProfessionalDetail(res?.data?.data);
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to add professional detail');
      }
    }).catch(() => Alert.alert('Error', 'Something went wrong'));
  };

  const updateProfessionalDetail = data => {
    if (!personalDetail?.ApplicationId) return;
    const professionalFields = {
      membershipCategory: data.membershipCategory,
      workLocation: data.workLocation,
      otherWorkLocation: data.otherWorkLocation,
      grade: data.grade,
      otherGrade: data.otherGrade,
      nmbiNumber: data.nmbiNo,
      nurseType: data.nurseType,
      nursingAdaptationProgramme: data?.nursingAdaptation === true,
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
    updateProfessionalDetailRequest(personalDetail.ApplicationId, professionalInfo).then(res => {
      if (res?.status === 200) {
        setProfessionalDetail(res?.data?.data);
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to update professional detail');
      }
    }).catch(() => Alert.alert('Error', 'Something went wrong'));
  };

  const createSubscriptionDetail = data => {
    if (!personalDetail?.ApplicationId) return;
    const defaultFields = {
      membershipCategory: professionalDetail?.professionalDetails?.membershipCategory,
    };
    const subscriptionFields = {
      paymentType: data?.paymentType,
      payrollNo: data?.payrollNo,
      membershipStatus: data?.membershipStatus,
      otherIrishTradeUnion: data?.irishTradeUnion === true,
      otherScheme: data?.otherScheme === true,
      recuritedBy: data?.recuritedBy,
      recuritedByMembershipNo: data?.recuritedByMembershipNo,
      primarySection: data?.primarySection,
      otherPrimarySection: data?.otherPrimarySection,
      secondarySection: data?.secondarySection,
      otherSecondarySection: data?.otherSecondarySection,
      incomeProtectionScheme: data?.incomeProtectionScheme === true,
      inmoRewards: data?.inmoRewards === true,
      valueAddedServices: data?.valueAddedServices === true,
      termsAndConditions: data?.termsAndConditions === true,
      ...defaultFields,
    };
    const subscriptionDetails = {};
    Object.entries(subscriptionFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') subscriptionDetails[k] = v; });
    const subscriptionInfo = { subscriptionDetails };
    createSubscriptionDetailRequest(personalDetail.ApplicationId, subscriptionInfo).then(res => {
      if (res?.status === 200) {
        setSubscriptionDetail(res?.data?.data);
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
        setIsModalVisible(true);
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to add subscription detail');
      }
    }).catch(() => Alert.alert('Error', 'Something went wrong'));
  };

  const updateSubscriptionDetail = data => {
    if (!personalDetail?.ApplicationId) return;
    const defaultFields = {
      membershipCategory: professionalDetail?.professionalDetails?.membershipCategory,
    };
    const subscriptionFields = {
      paymentType: data?.paymentType,
      payrollNo: data?.payrollNo,
      membershipStatus: data?.membershipStatus,
      otherIrishTradeUnion: data?.irishTradeUnion === true,
      otherScheme: data?.otherScheme === true,
      recuritedBy: data?.recuritedBy,
      recuritedByMembershipNo: data?.recuritedByMembershipNo,
      primarySection: data?.primarySection,
      otherPrimarySection: data?.otherPrimarySection,
      secondarySection: data?.secondarySection,
      otherSecondarySection: data?.otherSecondarySection,
      incomeProtectionScheme: data?.incomeProtectionScheme === true,
      inmoRewards: data?.inmoRewards === true,
      valueAddedServices: data?.valueAddedServices === true,
      termsAndConditions: data?.termsAndConditions === true,
      ...defaultFields,
    };
    const subscriptionDetails = {};
    Object.entries(subscriptionFields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') subscriptionDetails[k] = v; });
    const subscriptionInfo = { subscriptionDetails };
    updateSubscriptionDetailRequest(personalDetail.ApplicationId, subscriptionInfo).then(res => {
      if (res?.status === 200) {
        setSubscriptionDetail(res?.data?.data);
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
        setIsModalVisible(true);
      } else {
        Alert.alert('Error', res?.data?.message || 'Unable to update subscription detail');
      }
    }).catch(() => Alert.alert('Error', 'Something went wrong'));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInformation
            formData={formData.personalInfo}
            onFormDataChange={data => handleFormDataChange('personalInfo', data)}
            showValidation={showValidation}
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <Wrapper style={commonStyles.screenContainer}>
      <Text style={[styles.title, { fontSize: Math.max(20, width * 0.06) }]}>Application</Text>
      {/* Stepper */}
      <View style={[styles.stepperRow, { width: '100%', marginBottom: width * 0.06 }]}>
        {steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            <View style={styles.stepperItemContainer}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    width: Math.max(36, width * 0.09), height: Math.max(36, width * 0.09), borderRadius: Math.max(18, width * 0.045),
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 4,
                    borderWidth: currentStep === step.number ? 3 : 1,
                    borderColor: currentStep === step.number ? '#007bff' : '#e0e0e0',
                    backgroundColor: currentStep === step.number
                      ? '#fff'
                      : currentStep > step.number
                        ? '#28a745'
                        : '#e0e0e0',
                  },
                ]}
              >
                <Text style={{
                  color: currentStep === step.number ? '#007bff' : '#fff',
                  fontWeight: 'bold',
                  fontSize: Math.max(14, width * 0.038),
                }}>
                  {isSubmitted && step.number === 3
                    ? '✓'
                    : currentStep > step.number
                      ? '✓'
                      : step.number}
                </Text>
              </View>
              <Text style={{
                fontSize: Math.max(10, width * 0.025),
                color: currentStep === step.number ? '#007bff' : '#888',
                fontWeight: currentStep === step.number ? 'bold' : 'normal',
                marginTop: 8,
                textAlign: 'center',
                width: Math.max(60, width * 0.18),
              }}>{step.title}</Text>
            </View>
            {idx < steps.length - 1 && (
              <View style={[
                styles.stepConnector,
                { backgroundColor: currentStep > step.number ? '#28a745' : '#e0e0e0', width: Math.max(30, width * 0.13) }
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <ScrollView contentContainerStyle={[styles.container]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Content */}
        <View style={[styles.card, { borderRadius: width * 0.02 }]}> {renderStepContent()} </View>
        {/* Navigation Buttons */}
        {/* Modal */}
        <Modal visible={isModalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { padding: width * 0.06, borderRadius: width * 0.03, width: width * 0.8 }]}>
              <Text style={{ fontSize: Math.max(16, width * 0.045), marginBottom: 16 }}>Thank you for your submission!</Text>
              <Button title="Close" onPress={handleModalClose} style={{ minWidth: 100, marginTop: 12 }} />
            </View>
          </View>
        </Modal>
      </ScrollView>
      <View style={[styles.buttonRow, { marginTop: width * 0.04 }]}>
        <Button title="Previous" onPress={handlePrevious} disabled={currentStep === 1} style={{ flex: 1, marginRight: 8, height: hp(5) }} />
        <Button
          title={currentStep === steps.length ? 'Submit' : 'Next'}
          onPress={currentStep === steps.length ? handleSubmit : handleNext}
          style={{ flex: 1, marginLeft: 8, height: hp(5) }}
        />
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', flexGrow: 1 },
  title: { fontWeight: 'bold', marginBottom: 16 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
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
    backgroundColor: '#e0e0e0',
  },
  stepConnector: {
    height: 3,
    alignSelf: 'center',
    borderRadius: 2,
    marginHorizontal: 2,
  },
  card: { marginBottom: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', alignItems: 'center' },
});

export default Application;