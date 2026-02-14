import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  fetchPersonalDetail,
  fetchProfessionalDetail,
  fetchSubscriptionDetail,
} from '../api/application.api';
import { fetchCategoryByCategoryId } from '../api/category.api';
import { getAggregatedUserDetailsFromCrmCreateRequest } from '../api/profile.api';

const ApplicationContext = createContext();

export const ApplicationProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [personalDetail, setPersonalDetail] = useState(null);
  const [professionalDetail, setProfessionalDetail] = useState(null);
  const [subscriptionDetail, setSubscriptionDetail] = useState(null);
  const [currentStep, setCurrentStepState] = useState(1);
  const [categoryData, setCategoryData] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [isCrmUser, setIsCrmUser] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  const applyAggregatedResponse = data => {
    if (data?.personalDetails) setPersonalDetail(data.personalDetails);
    if (data?.professionalDetails) setProfessionalDetail(data.professionalDetails);
    if (data?.subscriptionDetails) setSubscriptionDetail(data.subscriptionDetails);
    setApplicationStatus(data?.personalDetails?.applicationStatus ?? null);
    setIsCrmUser(true);
    setLoading(false);
  };

  // Simple setter without localStorage persistence
  const setCurrentStep = stepUpdater => {
    setCurrentStepState(prev => (typeof stepUpdater === 'function' ? stepUpdater(prev) : stepUpdater));
  };

  const getPersonalDetail = () => {
    setLoading(true);

    getAggregatedUserDetailsFromCrmCreateRequest()
      .then(res => {
        if (res?.status === 200 && res?.data?.data) {
          const data = res.data.data;
          if (data?.personalDetails) {
            applyAggregatedResponse(data);
            return Promise.resolve();
          }
        }
        return fetchPersonalDetail();
      })
      .then(res => {
        if (res && res?.status === 200) {
          setPersonalDetail(res?.data?.data);
          setIsCrmUser(false);
          setApplicationStatus(null);
          setLoading(false);
        } else if (res) {
          setLoading(false);
        }
      })
      .catch(() => {
        fetchPersonalDetail()
          .then(res => {
            if (res?.status === 200) {
              setPersonalDetail(res?.data?.data);
              setIsCrmUser(false);
              setApplicationStatus(null);
            }
            setLoading(false);
          })
          .catch(() => {
            setLoading(false);
          });
      });
  };

  const getProfessionalDetail = applicationId => {
    if (isCrmUser) {
      setLoading(true);
      getAggregatedUserDetailsFromCrmCreateRequest()
        .then(res => {
          if (res?.status === 200 && res?.data?.data) {
            applyAggregatedResponse(res.data.data);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
      return;
    }

    setLoading(true);
    const appId = applicationId || personalDetail?.applicationId;
    if (!appId) {
      setLoading(false);
      return;
    }
    fetchProfessionalDetail(appId)
      .then(res => {
        if (res?.status === 200) {
          setProfessionalDetail(res?.data?.data);
          setIsCrmUser(false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const getSubscriptionDetail = applicationId => {
    if (isCrmUser) {
      setLoading(true);
      getAggregatedUserDetailsFromCrmCreateRequest()
        .then(res => {
          if (res?.status === 200 && res?.data?.data) {
            applyAggregatedResponse(res.data.data);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
      return;
    }

    setLoading(true);
    const appId = applicationId || personalDetail?.applicationId;
    if (!appId) {
      setLoading(false);
      return;
    }
    fetchSubscriptionDetail(appId)
      .then(res => {
        if (res?.status === 200) {
          setSubscriptionDetail(res?.data?.data);
          setIsCrmUser(false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  // Cascade fetch based on user type
  useEffect(() => {
    // For CRM users, professional and subscription details don't require applicationId
    // For portal users, we need applicationId from personalDetail
    if (isCrmUser) {
      // CRM user: fetch professional and subscription details without applicationId
      if (!professionalDetail) {
        getProfessionalDetail();
      }
      if (!subscriptionDetail) {
        getSubscriptionDetail();
      }
    } else if (personalDetail?.applicationId) {
      // Portal user: fetch with applicationId
      if (!professionalDetail) {
        getProfessionalDetail(personalDetail.applicationId);
      }
      if (!subscriptionDetail) {
        getSubscriptionDetail(personalDetail.applicationId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalDetail?.applicationId, isCrmUser]);

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

  // Helper function to check if user has CRM data
  const isCrmUserCheck = () => {
    return (
      isCrmUser ||
      Boolean(
        (personalDetail && !personalDetail?.applicationId) ||
          (professionalDetail && !professionalDetail?.applicationId) ||
          (subscriptionDetail && !subscriptionDetail?.applicationId),
      )
    );
  };

  const value = useMemo(() => ({
    loading,
    personalDetail,
    professionalDetail,
    subscriptionDetail,
    applicationStatus,
    currentStep,
    setCurrentStep,
    categoryData,
    categoryLoading,
    getPersonalDetail,
    getProfessionalDetail,
    getSubscriptionDetail,
    getCategoryData,
    isCrmUser: isCrmUserCheck(),
  }), [
    loading,
    personalDetail,
    professionalDetail,
    subscriptionDetail,
    applicationStatus,
    currentStep,
    categoryData,
    categoryLoading,
    getCategoryData,
    isCrmUser,
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


