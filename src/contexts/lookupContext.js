import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getHeaders } from '../helpers/auth.helper';
import { fetchAllCountry, fetchAllLookupRequest, fetchLookupHierarchyByType } from '../api/lookup.api';
import { fetchAllCategoryRequest } from '../api/category.api';

const STORAGE_KEYS = {
  gender: 'genderLookups',
  city: 'cityLookups',
  title: 'titleLookups',
  primarySection: 'primarySection',
  secondarySection: 'secondarySection',
  workLocation: 'workLocationLookups',
  countries: 'countries',
  categories: 'categories',
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
  console.log('Lookup API response:', response);
  // Handle both response.data.data and response.data patterns
  return response?.data?.data || response?.data || [];
};

const getAllCountries = async () => {
  const { token } = await getHeaders();
  if (!token) throw new Error('No token found');
  const response = await fetchAllCountry();
  console.log('🌍 Countries API raw response status:', response?.status);
  console.log('🌍 Countries API raw response.data:', JSON.stringify(response?.data, null, 2).substring(0, 1000));
  
  // Handle multiple possible response structures
  let countries = response?.data?.data || response?.data || [];
  
  // If it's still wrapped in another structure, try to extract it
  if (countries && typeof countries === 'object' && !Array.isArray(countries)) {
    console.log('🌍 Countries data is object, attempting to extract array...');
    countries = countries.countries || countries.results || countries.items || [];
  }
  
  console.log('🌍 Final countries array length:', countries?.length);
  return countries;
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
  const [categoryLookups, setCategoryLookups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const WORKLOCATION_LOOKUPTYPE_ID = '68d036e2662428d1c504b3ad';

  const fetchLookups = async () => {
    try {
      console.log('🔄 Starting to fetch lookups...');
      setLoading(true);
      const result = await getAllLookups();
      console.log('📦 Raw lookup result:', JSON.stringify(result, null, 2).substring(0, 500));
      
      // Ensure result is an array before filtering
      const lookupArray = Array.isArray(result) ? result : [];
      console.log('📊 Total lookups received:', lookupArray.length);
      
      if (lookupArray.length > 0) {
        const genderData = lookupArray.filter(item => item.lookuptypeId?.lookuptype === 'Gender');
        const cityData = lookupArray.filter(item => item.lookuptypeId?.lookuptype === 'City');
        const titleData = lookupArray.filter(item => item.lookuptypeId?.lookuptype === 'Title');
        const secondarySectionData = lookupArray.filter(item => item.lookuptypeId?.lookuptype === 'Secondary Section');
        const sectionData = lookupArray.filter(item => item.lookuptypeId?.lookuptype === 'Section');

        console.log('✅ Lookups filtered:', {
          gender: genderData.length,
          city: cityData.length,
          title: titleData.length,
          secondarySection: secondarySectionData.length,
          primarySection: sectionData.length
        });

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
        setLookups(lookupArray);
      } else {
        console.warn('⚠️ No lookups data received from API');
      }
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch lookups');
      console.error('❌ Lookup fetch error:', err?.message);
      console.error('❌ Full error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkLocationLookups = async () => {
    try {
      console.log('🔄 Starting to fetch work locations...');
      setLoading(true);
      const { token } = await getHeaders();
      if (!token) throw new Error('No token found');
      const response = await fetchLookupHierarchyByType(WORKLOCATION_LOOKUPTYPE_ID);
      // Handle multiple possible response structures
      const results = response?.data?.results || response?.data?.data || response?.data || [];
      console.log('📍 Work location API response:', JSON.stringify(results, null, 2).substring(0, 500));
      console.log('📊 Work location count:', results.length);
      await saveLocal(STORAGE_KEYS.workLocation, results);
      setWorkLocationLookups(results);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch work locations');
      console.error('❌ Work location fetch error:', err?.message);
      console.error('❌ Full error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCountryLookups = async () => {
    try {
      console.log('🔄 Starting to fetch countries...');
      setLoading(true);
      const { token } = await getHeaders();
      if (!token) {
        console.error('❌ No token found for countries fetch');
        throw new Error('No token found');
      }
      console.log('✅ Token found, fetching countries...');
      const results = await getAllCountries();
      console.log('🌍 Country API response (first 500 chars):', JSON.stringify(results, null, 2).substring(0, 500));
      const countryArray = Array.isArray(results) ? results : [];
      console.log('📊 Country count:', countryArray.length);
      
      if (countryArray.length > 0) {
        console.log('🌍 First country sample:', JSON.stringify(countryArray[0], null, 2));
        await saveLocal(STORAGE_KEYS.countries, countryArray);
        setCountryLookups(countryArray);
      } else {
        console.warn('⚠️ No countries data received from API');
      }
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch countries');
      console.error('❌ Country fetch error:', err?.message);
      console.error('❌ Full error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryLookups = async () => {
    try {
      console.log('🔄 Starting to fetch categories...');
      setLoading(true);
      const { token } = await getHeaders();
      if (!token) throw new Error('No token found');
      const response = await fetchAllCategoryRequest();
      // Handle both response.data.data and response.data patterns
      const results = response?.data?.data || response?.data || [];
      console.log('📂 Category API response:', JSON.stringify(results, null, 2).substring(0, 500));
      console.log('📊 Category count:', results.length);
      await saveLocal(STORAGE_KEYS.categories, results);
      setCategoryLookups(results);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch categories');
      console.error('❌ Category fetch error:', err?.message);
      console.error('❌ Full error:', err);
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
      const cachedCategories = await fetchLocal(STORAGE_KEYS.categories);
      if (cachedGender) setGenderLookups(cachedGender);
      if (cachedCity) setCityLookups(cachedCity);
      if (cachedTitle) setTitleLookups(cachedTitle);
      if (cachedPrimary) setPrimarySectionLookups(cachedPrimary);
      if (cachedSecondary) setSecondarySectionLookups(cachedSecondary);
      if (cachedWorkLocation) setWorkLocationLookups(cachedWorkLocation);
      if (cachedCountries) setCountryLookups(cachedCountries);
      if (cachedCategories) setCategoryLookups(cachedCategories);
    };
    loadCached();
  }, []);

  useEffect(() => {
    const ensureLookups = async () => {
      // Check if main lookups need fetching
      const cachedGender = await fetchLocal(STORAGE_KEYS.gender);
      if (!cachedGender || cachedGender.length === 0) {
        console.log('No cached lookups found, fetching from API...');
        await fetchLookups();
      }
    };
    
    const ensureWorkLocations = async () => {
      const cached = await fetchLocal(STORAGE_KEYS.workLocation);
      if (!cached || cached.length === 0) {
        console.log('No cached work locations found, fetching from API...');
        await fetchWorkLocationLookups();
      }
    };
    
    const ensureCountries = async () => {
      const cached = await fetchLocal(STORAGE_KEYS.countries);
      if (!cached || cached.length === 0) {
        console.log('No cached countries found, fetching from API...');
        await fetchCountryLookups();
      }
    };
    
    const ensureCategories = async () => {
      const cached = await fetchLocal(STORAGE_KEYS.categories);
      if (!cached || cached.length === 0) {
        console.log('No cached categories found, fetching from API...');
        await fetchCategoryLookups();
      }
    };
    
    ensureLookups();
    ensureWorkLocations();
    ensureCountries();
    ensureCategories();
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
    categoryLookups,
    loading,
    error,
    fetchLookups,
    fetchWorkLocationLookups,
    fetchCountryLookups,
    fetchCategoryLookups,
  }), [
    lookups,
    genderLookups,
    cityLookups,
    titleLookups,
    primarySectionLookups,
    secondarySectionLookups,
    workLocationLookups,
    countryLookups,
    categoryLookups,
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


