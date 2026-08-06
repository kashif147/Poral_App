import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  buildRegistrationFormFromProfileSources,
  createInitialApplicationFormData,
  getMissingRequiredFields,
  getRegistrationProfessionalMissingFields,
  validateApplicationStep,
  validateRegistrationProfessionalFields,
} from '../helpers/applicationForm.helper';
import { buildEventsRegistrationProfile } from '../helpers/events.helper';
import { useProfile } from '../contexts/profileContext';
import { useMemberRole } from './useMemberRole';
import { STACKS } from '../enums/ScreenEnums';
import { toast } from '../utils/toast.utils';

export const useRegistrationPersonalInfoGate = () => {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);
  const { isMember } = useMemberRole();
  const {
    profileDetail,
    profileByIdDetail,
    getProfileDetail,
    getProfileByIdDetail,
  } = useProfile();

  const [registrationStep, setRegistrationStep] = useState('selection');
  const [personalInfo, setPersonalInfo] = useState(() =>
    buildRegistrationFormFromProfileSources({
      user,
      prev: createInitialApplicationFormData(user).personalInfo,
    }),
  );
  const [showValidation, setShowValidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingPaymentState, setPendingPaymentState] = useState(null);

  const needsPersonalInfoGate = useMemo(() => !isMember, [isMember]);

  useEffect(() => {
    getProfileDetail?.();
  }, [getProfileDetail]);

  useEffect(() => {
    if (profileDetail?.profileId) {
      getProfileByIdDetail?.(profileDetail.profileId);
    }
  }, [profileDetail?.profileId, getProfileByIdDetail]);

  useEffect(() => {
    setPersonalInfo(prev =>
      buildRegistrationFormFromProfileSources({
        profileDetail,
        profileByIdDetail,
        user,
        prev: createInitialApplicationFormData(user).personalInfo || prev,
      }),
    );
  }, [profileDetail, profileByIdDetail, user]);

  const navigateToPayment = useCallback(
    paymentState => {
      navigation.navigate(STACKS.EVENT_PAYMENT, paymentState);
    },
    [navigation],
  );

  const attachRegistrationProfile = useCallback(
    paymentState => {
      const registrationProfile = buildEventsRegistrationProfile({
        formData: personalInfo,
        profileId: profileDetail?.profileId || personalInfo.profileId,
        user,
      });

      return {
        ...paymentState,
        registrationProfile,
      };
    },
    [personalInfo, profileDetail?.profileId, user],
  );

  const handleRegisterClick = useCallback(
    paymentState => {
      if (needsPersonalInfoGate) {
        setPendingPaymentState(paymentState);
        setRegistrationStep('personal-info');
        return;
      }

      const memberForm = buildRegistrationFormFromProfileSources({
        profileDetail,
        profileByIdDetail,
        user,
      });
      const registrationProfile = buildEventsRegistrationProfile({
        formData: memberForm,
        profileId: profileDetail?.profileId,
        user,
      });
      navigateToPayment({
        ...paymentState,
        registrationProfile,
      });
    },
    [
      needsPersonalInfoGate,
      navigateToPayment,
      profileDetail,
      profileByIdDetail,
      user,
    ],
  );

  const handlePersonalInfoContinue = useCallback(async () => {
    setShowValidation(true);

    const validationArgs = { currentStep: 1, personalInfo };
    const professionalMissing =
      getRegistrationProfessionalMissingFields(personalInfo);

    if (
      !validateApplicationStep(validationArgs) ||
      !validateRegistrationProfessionalFields(personalInfo)
    ) {
      const missing = [
        ...getMissingRequiredFields(validationArgs),
        ...professionalMissing,
      ];
      toast.warning(
        'Validation',
        missing.length > 0
          ? `Please fill in the required fields: ${missing.join(', ')}`
          : 'Please complete all required fields.',
      );
      return;
    }

    setShowValidation(false);
    setIsSaving(true);

    try {
      if (pendingPaymentState) {
        navigateToPayment(attachRegistrationProfile(pendingPaymentState));
      }
    } catch (error) {
      console.error('Failed to continue registration:', error);
      toast.error('Error', 'Something went wrong while preparing payment.');
    } finally {
      setIsSaving(false);
    }
  }, [
    personalInfo,
    pendingPaymentState,
    navigateToPayment,
    attachRegistrationProfile,
  ]);

  const handlePersonalInfoBack = useCallback(() => {
    setRegistrationStep('selection');
    setShowValidation(false);
    setPendingPaymentState(null);
  }, []);

  return {
    registrationStep,
    needsPersonalInfoGate,
    personalInfo,
    setPersonalInfo,
    showValidation,
    isSaving,
    handleRegisterClick,
    handlePersonalInfoContinue,
    handlePersonalInfoBack,
  };
};
