import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  fetchPersonalDetail,
  fetchProfessionalDetail,
  fetchSubscriptionDetail,
} from '../api/application.api';

const ApplicationContext = createContext();

export const ApplicationProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [personalDetail, setPersonalDetail] = useState(null);
  const [professionalDetail, setProfessionalDetail] = useState(null);
  const [subscriptionDetail, setSubscriptionDetail] = useState(null);
  const [currentStep, setCurrentStepState] = useState(1);

  // Simple setter without localStorage persistence
  const setCurrentStep = stepUpdater => {
    setCurrentStepState(prev => (typeof stepUpdater === 'function' ? stepUpdater(prev) : stepUpdater));
  };

  const getPersonalDetail = () => {
    setLoading(true);
    fetchPersonalDetail()
      .then(res => {
        if (res.status === 200) {
          setPersonalDetail(res?.data?.data);
          setLoading(false);
        } else {
          setLoading(false);
          Alert.alert('Error', res.data.message ?? 'Unable to get personal detail');
        }
      })
      .catch(() => {
        setLoading(false);
        Alert.alert('Error', 'Something went wrong');
      });
  };

  const getProfessionalDetail = () => {
    if (!personalDetail?.ApplicationId) return;
    setLoading(true);
    fetchProfessionalDetail(personalDetail?.ApplicationId)
      .then(res => {
        if (res.status === 200) {
          setProfessionalDetail(res?.data?.data);
          setLoading(false);
        } else {
          setLoading(false);
          Alert.alert('Error', res.data.message ?? 'Unable to get professional detail');
        }
      })
      .catch(() => {
        setLoading(false);
        Alert.alert('Error', 'Something went wrong');
      });
  };

  const getSubscriptionDetail = () => {
    if (!personalDetail?.ApplicationId) return;
    setLoading(true);
    fetchSubscriptionDetail(personalDetail?.ApplicationId)
      .then(res => {
        if (res.status === 200) {
          setSubscriptionDetail(res?.data?.data);
          setLoading(false);
        } else {
          setLoading(false);
          Alert.alert('Error', res.data.message ?? 'Unable to get subscription detail');
        }
      })
      .catch(() => {
        setLoading(false);
        Alert.alert('Error', 'Something went wrong');
      });
  };

  // Cascade fetch when we have an ApplicationId
  useEffect(() => {
    if (personalDetail?.ApplicationId) {
      getProfessionalDetail();
      getSubscriptionDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalDetail?.ApplicationId]);

  // Initialize: load personal detail
  useEffect(() => {
    // Kick off initial personal detail fetch
    getPersonalDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance step based on which details exist
  useEffect(() => {
    if (!personalDetail) {
      setCurrentStepState(1);
    } else if (personalDetail && !professionalDetail) {
      setCurrentStepState(2);
    } else if (personalDetail && professionalDetail && !subscriptionDetail) {
      setCurrentStepState(3);
    } else if (personalDetail && professionalDetail && subscriptionDetail) {
      setCurrentStepState(3);
    }
  }, [personalDetail, professionalDetail, subscriptionDetail]);

  const value = useMemo(() => ({
    loading,
    personalDetail,
    professionalDetail,
    subscriptionDetail,
    currentStep,
    setCurrentStep,
    getPersonalDetail,
    getProfessionalDetail,
    getSubscriptionDetail,
  }), [
    loading,
    personalDetail,
    professionalDetail,
    subscriptionDetail,
    currentStep,
  ]);

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return context;
};


