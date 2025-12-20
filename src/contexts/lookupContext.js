import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getHeaders } from '../helpers/auth.helper';
import { fetchAllCountry, fetchAllLookupRequest, fetchLookupHierarchyByType } from '../api/lookup.api';
import { fetchAllCategoryRequest, fetchCategoryByTypeId } from '../api/category.api';

const STORAGE_KEYS = {
  gender: 'genderLookups',
  city: 'cityLookups',
  title: 'titleLookups',
  primarySection: 'primarySection',
  secondarySection: 'secondarySection',
  workLocation: 'workLocationLookups',
  countries: 'countries',
  categories: 'categories',
  grade: 'gradeLookups',
  paymentType: 'paymentTypeLookups',
  studyLocation: 'studyLocationLookups',
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
  const [gradeLookups, setGradeLookups] = useState([]);
  const [paymentTypeLookups, setPaymentTypeLookups] = useState([]);
  const [studyLocationLookups, setStudyLocationLookups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasInitializedRef = useRef(false);

  const WORKLOCATION_LOOKUPTYPE_ID = '68d036e2662428d1c504b3ad';

  const fetchLookups = useCallback(async () => {
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
        const gradeData = lookupArray.filter(item => item.lookuptypeId?.lookuptype === 'Grade');
        const paymentTypeData = lookupArray.filter(item => item.lookuptypeId?.lookuptype === 'Payment Type');
        const studyLocationData = lookupArray.filter(item => item.lookuptypeId?.lookuptype === 'Study Location');
        console.log('✅ Lookups filtered:', {
          gender: genderData.length,
          city: cityData.length,
          title: titleData.length,
          secondarySection: secondarySectionData.length,
          primarySection: sectionData.length,
          grade: gradeData.length,
          paymentType: paymentTypeData.length,
          studyLocation: studyLocationData.length
        });
        await saveLocal(STORAGE_KEYS.paymentType, paymentTypeData);
        await saveLocal(STORAGE_KEYS.grade, gradeData);
        await saveLocal(STORAGE_KEYS.gender, genderData);
        await saveLocal(STORAGE_KEYS.city, cityData);
        await saveLocal(STORAGE_KEYS.title, titleData);
        await saveLocal(STORAGE_KEYS.secondarySection, secondarySectionData);
        await saveLocal(STORAGE_KEYS.primarySection, sectionData);
        await saveLocal(STORAGE_KEYS.studyLocation, studyLocationData);

        setPaymentTypeLookups(paymentTypeData);
        setGradeLookups(gradeData);
        setGenderLookups(genderData);
        setCityLookups(cityData);
        setTitleLookups(titleData);
        setPrimarySectionLookups(sectionData);
        setSecondarySectionLookups(secondarySectionData);
        setStudyLocationLookups(studyLocationData);
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
  }, []);

  const fetchWorkLocationLookups = useCallback(async () => {
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
  }, []);

  const fetchCountryLookups = useCallback(async () => {
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
  }, []);

  const fetchCategoryLookups = useCallback(async () => {
    try {
      console.log('🔄 Starting to fetch categories...');
      setLoading(true);
      const { token } = await getHeaders();
      if (!token) throw new Error('No token found');
      const response = await fetchCategoryByTypeId('68dae613c5b15073d66b891f');
      // Handle both response.data.data and response.data patterns
      const results = response?.data?.data?.products  || response?.data || [];
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
  }, []);

  // Unified function to fetch all lookups in parallel (matching web version)
  const fetchAllLookups = useCallback(async () => {
    try {
      console.log('🔄 Dashboard: Fetching all lookups...');
      const { token } = await getHeaders();
      if (!token) {
        console.warn('⚠️ No token found, skipping lookup fetch');
        return;
      }

      // Fetch all lookups in parallel without setting loading state
      // (individual functions handle their own loading states)
      await Promise.allSettled([
        fetchLookups(),
        fetchWorkLocationLookups(),
        fetchCountryLookups(),
        fetchCategoryLookups(),
      ]);

      console.log('✅ Dashboard: All lookups fetch completed');
    } catch (error) {
      console.error('❌ Dashboard: Error fetching all lookups:', error);
      setError(error?.message || 'Failed to fetch all lookups');
    }
  }, [fetchLookups, fetchWorkLocationLookups, fetchCountryLookups, fetchCategoryLookups]);

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
      const cachedGrade = await fetchLocal(STORAGE_KEYS.grade);
      const cachedPaymentType = await fetchLocal(STORAGE_KEYS.paymentType);
      const cachedStudyLocation = await fetchLocal(STORAGE_KEYS.studyLocation);

      if (cachedGender) setGenderLookups(cachedGender);
      if (cachedCity) setCityLookups(cachedCity);
      if (cachedTitle) setTitleLookups(cachedTitle);
      if (cachedPrimary) setPrimarySectionLookups(cachedPrimary);
      if (cachedSecondary) setSecondarySectionLookups(cachedSecondary);
      if (cachedWorkLocation) setWorkLocationLookups(cachedWorkLocation);
      if (cachedCountries) setCountryLookups(cachedCountries);
      if (cachedCategories) setCategoryLookups(cachedCategories);
      if (cachedGrade) setGradeLookups(cachedGrade);
      if (cachedPaymentType) setPaymentTypeLookups(cachedPaymentType);
      if (cachedStudyLocation) setStudyLocationLookups(cachedStudyLocation);
    };
    loadCached();
  }, []);

  // Initialize lookups once on mount (prevent multiple calls)
  useEffect(() => {
    // Only initialize once
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const ensureLookups = async () => {
      try {
        // Check if main lookups need fetching
        const cachedGender = await fetchLocal(STORAGE_KEYS.gender);
        const cachedPaymentType = await fetchLocal(STORAGE_KEYS.paymentType);
        const cachedStudyLocation = await fetchLocal(STORAGE_KEYS.studyLocation);
        
        if (!cachedGender || cachedGender.length === 0 || 
            !cachedPaymentType || cachedPaymentType.length === 0 ||
            !cachedStudyLocation || cachedStudyLocation.length === 0) {
          console.log('🔄 No cached lookups found or incomplete, fetching from API...');
          await fetchLookups();
        } else {
          console.log('✅ All main lookups are cached');
        }
      } catch (error) {
        console.error('❌ Error ensuring lookups:', error);
      }
    };
    
    const ensureWorkLocations = async () => {
      try {
        const cached = await fetchLocal(STORAGE_KEYS.workLocation);
        if (!cached || cached.length === 0) {
          console.log('🔄 No cached work locations found, fetching from API...');
          await fetchWorkLocationLookups();
        }
      } catch (error) {
        console.error('❌ Error ensuring work locations:', error);
      }
    };
    
    const ensureCountries = async () => {
      try {
        const cached = await fetchLocal(STORAGE_KEYS.countries);
        if (!cached || cached.length === 0) {
          console.log('🔄 No cached countries found, fetching from API...');
          await fetchCountryLookups();
        }
      } catch (error) {
        console.error('❌ Error ensuring countries:', error);
      }
    };
    
    const ensureCategories = async () => {
      try {
        const cached = await fetchLocal(STORAGE_KEYS.categories);
        if (!cached || cached.length === 0) {
          console.log('🔄 No cached categories found, fetching from API...');
          await fetchCategoryLookups();
        }
      } catch (error) {
        console.error('❌ Error ensuring categories:', error);
      }
    };
    
    // Run all ensures in parallel but handle errors independently
    Promise.all([
      ensureLookups(),
      ensureWorkLocations(),
      ensureCountries(),
      ensureCategories(),
    ]).catch(error => {
      console.error('❌ Error in lookup initialization:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - ref guard ensures this only runs once

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
    gradeLookups,
    paymentTypeLookups,
    studyLocationLookups,
    loading,
    error,
    fetchLookups,
    fetchWorkLocationLookups,
    fetchCountryLookups,
    fetchCategoryLookups,
    fetchAllLookups, // Export unified fetch function
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
    gradeLookups,
    paymentTypeLookups,
    studyLocationLookups,
    loading,
    error,
    fetchLookups,
    fetchWorkLocationLookups,
    fetchCountryLookups,
    fetchCategoryLookups,
    fetchAllLookups,
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


