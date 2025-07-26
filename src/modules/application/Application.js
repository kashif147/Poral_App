import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, Alert, useWindowDimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PersonalInformation from './PersonalInformation';
import ProfessionalDetails from './ProfessionalDetails';
import SubscriptionDetails from './SubscriptionDetails';
import { Wrapper } from '../../common/wrapper';
import { commonStyles, hp } from '../../utils/Styles';
import { Button } from '../../common/button';

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
    smsConsent: true,
    emailConsent: true,
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

  // Save progress to AsyncStorage
  const saveProgress = async (data, step) => {
    await AsyncStorage.setItem('applicationFormData', JSON.stringify(data));
    await AsyncStorage.setItem('applicationCurrentStep', step.toString());
  };

  const handleNext = () => {
    setShowValidation(true);
    if (validateCurrentStep()) {
      const nextStep = Math.min(currentStep + 1, steps.length);
      setCurrentStep(nextStep);
      saveProgress(formData, nextStep);
      setShowValidation(false);
    }
  };
  const handlePrevious = () => {
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);
    saveProgress(formData, prevStep);
  };

  const handleFormDataChange = (stepName, data) => {
    const newData = { ...formData, [stepName]: data };
    setFormData(newData);
    saveProgress(newData, currentStep);
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

  // Load progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      const savedData = await AsyncStorage.getItem('applicationFormData');
      const savedStep = await AsyncStorage.getItem('applicationCurrentStep');
      if (savedData) {
        setFormData(JSON.parse(savedData));
        setCurrentStep(savedStep ? Number(savedStep) : 1);
      }
    };
    loadProgress();
  }, []);

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