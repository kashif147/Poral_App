import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  fetchPersonalDetail,
  fetchProfessionalDetail,
  fetchSubscriptionDetail,
} from '../api/application.api';
import { fetchCategoryByCategoryId } from '../api/category.api';

const ApplicationContext = createContext();

export const ApplicationProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [personalDetail, setPersonalDetail] = useState(null);
  const [professionalDetail, setProfessionalDetail] = useState(null);
  const [subscriptionDetail, setSubscriptionDetail] = useState(null);
  const [currentStep, setCurrentStepState] = useState(1);
  const [categoryData, setCategoryData] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Simple setter without localStorage persistence
  const setCurrentStep = stepUpdater => {
    setCurrentStepState(prev => (typeof stepUpdater === 'function' ? stepUpdater(prev) : stepUpdater));
  };

  const getPersonalDetail = () => {
    setLoading(true);
    fetchPersonalDetail()
      .then(res => {
        console.log('res==========>', res);
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
    if (!personalDetail?.applicationId) return;
    setLoading(true);
    fetchProfessionalDetail(personalDetail?.applicationId)
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
    if (!personalDetail?.applicationId) return;
    setLoading(true);
    fetchSubscriptionDetail(personalDetail?.applicationId)
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

  const getCategoryData = useCallback((categoryNameOrId, categoryLookups = []) => {
    if (!categoryNameOrId) {
      setCategoryData(null);
      return;
    }

    setCategoryLoading(true);

    // Helper function to check if input looks like an ID (MongoDB ObjectId format)
    const isObjectId = (str) => {
      return /^[0-9a-fA-F]{24}$/.test(str);
    };

    // Determine if we need to find category by name from lookup
    let categoryId = categoryNameOrId;
    
    // If it doesn't look like an ID and we have categoryLookups, find by name
    if (!isObjectId(categoryNameOrId) && categoryLookups.length > 0) {
      const foundCategory = categoryLookups.find(item => {
        const itemName =
          item?.name ||
          item?.DisplayName ||
          item?.label ||
          item?.productType?.name ||
          item?.code;
        return String(itemName || '') === String(categoryNameOrId);
      });
      
      if (foundCategory) {
        categoryId = foundCategory?._id || foundCategory?.id;
      } else {
        // Category name not found in lookup
        console.warn(`Category with name "${categoryNameOrId}" not found in lookup`);
        setCategoryData(null);
        setCategoryLoading(false);
        return;
      }
    }

    if (!categoryId) {
      setCategoryData(null);
      setCategoryLoading(false);
      return;
    }

    fetchCategoryByCategoryId(categoryId)
      .then(res => {
        const payload = res?.data?.data || res?.data;
        setCategoryData(payload || null);
        setCategoryLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch category data:', error);
        setCategoryData(null);
        setCategoryLoading(false);
      });
  }, []);

  // Cascade fetch when we have an applicationId
  useEffect(() => {
    if (personalDetail?.applicationId) {
      getProfessionalDetail();
      getSubscriptionDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalDetail?.applicationId]);

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
    categoryData,
    categoryLoading,
    getPersonalDetail,
    getProfessionalDetail,
    getSubscriptionDetail,
    getCategoryData,
  }), [
    loading,
    personalDetail,
    professionalDetail,
    subscriptionDetail,
    currentStep,
    categoryData,
    categoryLoading,
    getCategoryData,
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


