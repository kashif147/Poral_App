import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getHeaders } from '../helpers/auth.helper';
import { fetchAllCountry, fetchAllLookupRequest, fetchLookupHierarchyByType } from '../api/lookup.api';

const STORAGE_KEYS = {
  gender: 'genderLookups',
  city: 'cityLookups',
  title: 'titleLookups',
  primarySection: 'primarySection',
  secondarySection: 'secondarySection',
  workLocation: 'workLocationLookups',
  countries: 'countries',
};

const LookupContext = createContext();

const fetchLocal = async key => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveLocal = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const getAllLookups = async () => {
  const { token } = await getHeaders();
  if (!token) throw new Error('No token found');
  const response = await fetchAllLookupRequest();
  return response?.data;
};

const getAllCountries = async () => {
  const response = await fetchAllCountry();
  return response?.data;
};

export const LookupProvider = ({ children }) => {
  const [lookups, setLookups] = useState([]);
  const [genderLookups, setGenderLookups] = useState([]);
  const [cityLookups, setCityLookups] = useState([]);
  const [titleLookups, setTitleLookups] = useState([]);
  const [primarySectionLookups, setPrimarySectionLookups] = useState([]);
  const [secondarySectionLookups, setSecondarySectionLookups] = useState([]);
  const [workLocationLookups, setWorkLocationLookups] = useState([]);
  const [countryLookups, setCountryLookups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const WORKLOCATION_LOOKUPTYPE_ID = '68d036e2662428d1c504b3ad';

  const fetchLookups = async () => {
    try {
      setLoading(true);
      const result = await getAllLookups();
      if (result) {
        const genderData = result.filter(item => item.lookuptypeId?.lookuptype === 'Gender');
        const cityData = result.filter(item => item.lookuptypeId?.lookuptype === 'City');
        const titleData = result.filter(item => item.lookuptypeId?.lookuptype === 'Title');
        const secondarySectionData = result.filter(item => item.lookuptypeId?.lookuptype === 'Secondary Section');
        const sectionData = result.filter(item => item.lookuptypeId?.lookuptype === 'Section');

        await saveLocal(STORAGE_KEYS.gender, genderData);
        await saveLocal(STORAGE_KEYS.city, cityData);
        await saveLocal(STORAGE_KEYS.title, titleData);
        await saveLocal(STORAGE_KEYS.secondarySection, secondarySectionData);
        await saveLocal(STORAGE_KEYS.primarySection, sectionData);

        setGenderLookups(genderData);
        setCityLookups(cityData);
        setTitleLookups(titleData);
        setPrimarySectionLookups(sectionData);
        setSecondarySectionLookups(secondarySectionData);
        setLookups(result);
      }
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch lookups');
      Alert.alert('Error', err?.message || 'Failed to fetch lookups');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkLocationLookups = async () => {
    try {
      setLoading(true);
      const { token } = await getHeaders();
      if (!token) throw new Error('No token found');
      const response = await fetchLookupHierarchyByType(WORKLOCATION_LOOKUPTYPE_ID);
      const results = response?.data?.results || [];
      await saveLocal(STORAGE_KEYS.workLocation, results);
      setWorkLocationLookups(results);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch work locations');
      Alert.alert('Error', err?.message || 'Failed to fetch work locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountryLookups = async () => {
    try {
      setLoading(true);
      const results = await getAllCountries();
      await saveLocal(STORAGE_KEYS.countries, results || []);
      setCountryLookups(results || []);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch countries');
      Alert.alert('Error', err?.message || 'Failed to fetch countries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCached = async () => {
      const cachedGender = await fetchLocal(STORAGE_KEYS.gender);
      const cachedCity = await fetchLocal(STORAGE_KEYS.city);
      const cachedTitle = await fetchLocal(STORAGE_KEYS.title);
      const cachedPrimary = await fetchLocal(STORAGE_KEYS.primarySection);
      const cachedSecondary = await fetchLocal(STORAGE_KEYS.secondarySection);
      const cachedWorkLocation = await fetchLocal(STORAGE_KEYS.workLocation);
      const cachedCountries = await fetchLocal(STORAGE_KEYS.countries);
      if (cachedGender) setGenderLookups(cachedGender);
      if (cachedCity) setCityLookups(cachedCity);
      if (cachedTitle) setTitleLookups(cachedTitle);
      if (cachedPrimary) setPrimarySectionLookups(cachedPrimary);
      if (cachedSecondary) setSecondarySectionLookups(cachedSecondary);
      if (cachedWorkLocation) setWorkLocationLookups(cachedWorkLocation);
      if (cachedCountries) setCountryLookups(cachedCountries);
    };
    loadCached();
  }, []);

  useEffect(() => {
    const ensureWorkLocations = async () => {
      const cached = await fetchLocal(STORAGE_KEYS.workLocation);
      if (!cached || cached.length === 0) {
        await fetchWorkLocationLookups();
      }
    };
    const ensureCountries = async () => {
      const cached = await fetchLocal(STORAGE_KEYS.countries);
      if (!cached || cached.length === 0) {
        await fetchCountryLookups();
      }
    };
    ensureWorkLocations();
    ensureCountries();
  }, []);

  const value = useMemo(() => ({
    lookups,
    genderLookups,
    cityLookups,
    titleLookups,
    primarySectionLookups,
    secondarySectionLookups,
    workLocationLookups,
    countryLookups,
    loading,
    error,
    fetchLookups,
    fetchWorkLocationLookups,
    fetchCountryLookups,
  }), [
    lookups,
    genderLookups,
    cityLookups,
    titleLookups,
    primarySectionLookups,
    secondarySectionLookups,
    workLocationLookups,
    countryLookups,
    loading,
    error,
  ]);

  return (
    <LookupContext.Provider value={value}>{children}</LookupContext.Provider>
  );
};

export const useLookup = () => {
  const ctx = useContext(LookupContext);
  if (!ctx) throw new Error('useLookup must be used within a LookupProvider');
  return ctx;
};


