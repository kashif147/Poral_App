import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  fetchProfileByIdRequest,
  fetchProfileRequest,
} from '../api/profile.api';
import { getHeaders } from '../helpers/auth.helper';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [profileDetail, setProfileDetail] = useState(null);
  const [profileByIdDetail, setProfileByIdDetail] = useState(null);

  const getProfileDetail = useCallback(() => {
    setLoading(true);
    fetchProfileRequest()
      .then(res => {
        if (res?.status === 200) {
          setProfileDetail(res?.data?.data);
          setLoading(false);
        } else {
          setLoading(false);
          // Alert.alert('Error', res?.data?.message ?? 'Unable to get profile detail');
        }
      })
      .catch(error => {
        setLoading(false);
        Alert.alert('Error', 'Something went wrong');
      });
  }, []);

  const getProfileByIdDetail = useCallback(id => {
    if (!id) return;
    setLoading(true);
    fetchProfileByIdRequest(id)
      .then(res => {
        if (res?.status === 200) {
          setProfileByIdDetail(res?.data?.data);
          setLoading(false);
        } else {
          setLoading(false);
          // Alert.alert('Error', res?.data?.message ?? 'Unable to get profile detail');
        }
      })
      .catch(error => {
        setLoading(false);
        Alert.alert('Error', 'Something went wrong');
      });
  }, []);

  useEffect(() => {
    const initializeProfile = async () => {
      const { token } = await getHeaders();
      if (token) {
        getProfileDetail();
      }
    };
    initializeProfile();
  }, [getProfileDetail]);

  useEffect(() => {
    const fetchProfileById = async () => {
      const { token } = await getHeaders();
      if (token) {
        if (profileDetail?.profileId) {
          getProfileByIdDetail(profileDetail?.profileId);
        }
      }
    };
    fetchProfileById();
  }, [profileDetail?.profileId, getProfileByIdDetail]);

  const value = useMemo(
    () => ({
      loading,
      profileDetail,
      getProfileDetail,
      getProfileByIdDetail,
      profileByIdDetail,
    }),
    [loading, profileDetail, getProfileDetail, getProfileByIdDetail, profileByIdDetail]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

