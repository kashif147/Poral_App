import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  fetchPersonalDetail,
  fetchProfessionalDetail,
  fetchSubscriptionDetail,
  applicationConfirmationRequest,
} from '../api/application.api';
import { fetchCategoryByCategoryId } from '../api/category.api';
import { getAggregatedUserDetailsFromCrmCreateRequest } from '../api/profile.api';
import {
  isActiveApplicationPersonalDetail,
  isResumablePortalApplication,
  normalizePortalPersonalDetail,
  detailBelongsToApplication,
} from '../helpers/applicationPayload.helper';

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
  const personalDetailRef = useRef(personalDetail);
  const applicationStatusRef = useRef(applicationStatus);
  const refreshInFlightRef = useRef(false);
  const personalDetailInFlightRef = useRef(false);

  useEffect(() => {
    personalDetailRef.current = personalDetail;
  }, [personalDetail]);

  useEffect(() => {
    applicationStatusRef.current = applicationStatus;
  }, [applicationStatus]);

  const applyAggregatedResponse = data => {
    if (data?.personalDetails) setPersonalDetail(data.personalDetails);
    if (data?.professionalDetails) setProfessionalDetail(data.professionalDetails);
    if (data?.subscriptionDetails) setSubscriptionDetail(data.subscriptionDetails);
    setApplicationStatus(data?.personalDetails?.applicationStatus ?? null);
    setIsCrmUser(true);
    setLoading(false);
  };

  const applyCancelledAggregateResponse = data => {
    if (data?.personalDetails) {
      setPersonalDetail(
        normalizePortalPersonalDetail(
          data.personalDetails,
          data.personalDetails?.applicationStatus,
        ),
      );
      setApplicationStatus(data.personalDetails?.applicationStatus ?? null);
    }
    setProfessionalDetail(null);
    setSubscriptionDetail(null);
    setIsCrmUser(false);
  };

  const applyPortalPersonalDetail = portalPersonal => {
    const status = portalPersonal?.applicationStatus ?? null;
    setPersonalDetail(normalizePortalPersonalDetail(portalPersonal, status));
    setApplicationStatus(status);
    setIsCrmUser(false);
  };

  const enrichPortalPersonalDetail = portalPersonal =>
    applicationConfirmationRequest(portalPersonal.applicationId)
      .then(response => {
        if (
          response?.status !== 200 &&
          response?.data?.status !== 'success'
        ) {
          return portalPersonal;
        }

        const statusPayload = response?.data?.data || response?.data || {};
        const nextStatus =
          statusPayload.applicationStatus ??
          portalPersonal?.applicationStatus ??
          null;
        const metaIsActive =
          statusPayload?.meta?.isActive ?? statusPayload?.isActive;

        return {
          ...portalPersonal,
          applicationStatus: nextStatus,
          ...(metaIsActive !== undefined
            ? {
                meta: {
                  ...portalPersonal?.meta,
                  isActive: metaIsActive,
                },
              }
            : {}),
        };
      })
      .catch(() => portalPersonal);

  const loadPortalPersonalDetail = portalPersonal => {
    if (!portalPersonal?.applicationId) {
      applyPortalPersonalDetail(portalPersonal);
      return Promise.resolve(portalPersonal);
    }

    return enrichPortalPersonalDetail(portalPersonal).then(enriched => {
      applyPortalPersonalDetail(enriched);
      return enriched;
    });
  };

  const loadResumableApplicationDetails = useCallback(portalPersonal => {
      const status =
        portalPersonal?.applicationStatus ??
        applicationStatusRef.current ??
        null;
      if (
        !portalPersonal?.applicationId ||
        !isResumablePortalApplication(portalPersonal, status)
      ) {
        return Promise.resolve();
      }

      const appId = portalPersonal.applicationId;
      return Promise.allSettled([
        fetchProfessionalDetail(appId).then(res => {
          if (res?.status === 200) {
            setProfessionalDetail(res?.data?.data);
          }
        }),
        fetchSubscriptionDetail(appId).then(res => {
          if (res?.status === 200) {
            setSubscriptionDetail(res?.data?.data);
          }
        }),
      ]);
    }, []);

  // Simple setter without localStorage persistence
  const setCurrentStep = stepUpdater => {
    setCurrentStepState(prev => (typeof stepUpdater === 'function' ? stepUpdater(prev) : stepUpdater));
  };

  const applyPersonalDetailResponse = data => {
    if (!data) return;
    loadPortalPersonalDetail(data);
  };

  const getPersonalDetail = useCallback(() => {
    if (personalDetailInFlightRef.current) {
      return Promise.resolve();
    }

    personalDetailInFlightRef.current = true;
    setLoading(true);

    return getAggregatedUserDetailsFromCrmCreateRequest()
      .then(res => {
        if (res?.status === 200 && res?.data?.data?.personalDetails) {
          const data = res.data.data;
          if (isActiveApplicationPersonalDetail(data.personalDetails)) {
            applyAggregatedResponse(data);
            return null;
          }

          applyCancelledAggregateResponse(data);
        }
        return fetchPersonalDetail();
      })
      .then(res => {
        if (!res) {
          return null;
        }

        if (res?.status === 200 && res?.data?.data) {
          return loadPortalPersonalDetail(res.data.data).then(loadedPersonal =>
            loadResumableApplicationDetails(loadedPersonal),
          );
        }

        return null;
      })
      .catch(() =>
        fetchPersonalDetail()
          .then(res => {
            if (res?.status === 200 && res?.data?.data) {
              return loadPortalPersonalDetail(res.data.data).then(loadedPersonal =>
                loadResumableApplicationDetails(loadedPersonal),
              );
            }
            return null;
          })
          .catch(() => null),
      )
      .finally(() => {
        personalDetailInFlightRef.current = false;
        setLoading(false);
      });
  }, [loadResumableApplicationDetails]);

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

  const refreshApplicationState = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return null;
    }

    refreshInFlightRef.current = true;

    try {
      const finalizePortalPersonal = async portalPersonal => {
        const enriched = portalPersonal?.applicationId
          ? await enrichPortalPersonalDetail(portalPersonal)
          : portalPersonal;

        const status = enriched?.applicationStatus ?? null;
        const resumable = isResumablePortalApplication(enriched, status);

        if (!resumable) {
          setPersonalDetail(normalizePortalPersonalDetail(enriched, status));
          setProfessionalDetail(null);
          setSubscriptionDetail(null);
          setApplicationStatus(status);
          setIsCrmUser(false);
          return {
            status,
            isActive: isActiveApplicationPersonalDetail(enriched),
          };
        }

        applyPortalPersonalDetail(enriched);
        await loadResumableApplicationDetails(enriched);

        return {
          status,
          isActive: isActiveApplicationPersonalDetail(enriched),
        };
      };

      try {
        const aggregatedRes = await getAggregatedUserDetailsFromCrmCreateRequest();
        if (aggregatedRes?.status === 200 && aggregatedRes?.data?.data?.personalDetails) {
          const data = aggregatedRes.data.data;
          if (isActiveApplicationPersonalDetail(data.personalDetails)) {
            applyAggregatedResponse(data);
            const status = data.personalDetails?.applicationStatus ?? null;
            return {
              status,
              isActive: isActiveApplicationPersonalDetail(data.personalDetails),
            };
          }

          applyCancelledAggregateResponse(data);
          return {
            status: data.personalDetails?.applicationStatus ?? null,
            isActive: false,
          };
        }
      } catch {
        // Fall through to portal detail refresh
      }

      try {
        const personalRes = await fetchPersonalDetail();
        if (personalRes?.status === 200 && personalRes?.data?.data) {
          return finalizePortalPersonal(personalRes.data.data);
        }
      } catch {
        // Keep existing personal detail
      }

      const currentPersonalDetail = personalDetailRef.current;
      if (!currentPersonalDetail?.applicationId) {
        return {
          status: applicationStatusRef.current,
          isActive: true,
        };
      }

      return finalizePortalPersonal(currentPersonalDetail);
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [loadResumableApplicationDetails]);

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

  // Cascade fetch based on user type — only for resumable applications
  useEffect(() => {
    if (isCrmUser) {
      if (!professionalDetail) {
        getProfessionalDetail();
      }
      if (!subscriptionDetail) {
        getSubscriptionDetail();
      }
      return;
    }

    if (
      personalDetail?.applicationId &&
      isResumablePortalApplication(personalDetail, applicationStatus)
    ) {
      if (!professionalDetail) {
        getProfessionalDetail(personalDetail.applicationId);
      }
      if (!subscriptionDetail) {
        getSubscriptionDetail(personalDetail.applicationId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalDetail?.applicationId, applicationStatus, isCrmUser]);

  // Initialize: load personal detail
  useEffect(() => {
    getPersonalDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance step based on resumable application progress
  useEffect(() => {
    const activeApplicationId = isResumablePortalApplication(
      personalDetail,
      applicationStatus,
    )
      ? personalDetail?.applicationId
      : null;

    if (!activeApplicationId) {
      setCurrentStepState(1);
      return;
    }

    if (
      detailBelongsToApplication(subscriptionDetail, activeApplicationId) ||
      detailBelongsToApplication(professionalDetail, activeApplicationId)
    ) {
      setCurrentStepState(3);
      return;
    }

    setCurrentStepState(2);
  }, [personalDetail, professionalDetail, subscriptionDetail, applicationStatus]);

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
    refreshApplicationState,
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
    getPersonalDetail,
    refreshApplicationState,
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


