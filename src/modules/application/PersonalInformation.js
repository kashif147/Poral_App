import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import SearchablePicker from '../../common/SearchablePicker';
import CustomSwitch from '../../common/switch';
import { Colors, form, wp } from '../../utils/Styles';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { DatePicker } from '../../common/DatePicker';
import { useLookup } from '../../contexts/lookupContext';
import { useProfile } from '../../contexts/profileContext';
import { getPaymentFormPrefill } from '../../api/paymentForms.api';
import {
  extractPaymentFormPrefill,
  getOrganizationNameFromPrefill,
  isPaymentApiSuccess,
} from '../../helpers/paymentForm.helper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CountryPicker from 'react-native-country-picker-modal';

const preferredAddresses = ['Home', 'Work'];
const preferredEmails = ['Personal', 'Work'];

const GOOGLE_PLACES_API_KEY = 'AIzaSyCJYpj8WV5Rzof7O3jGhW9XabD0J4Yqe1o';

// Country calling code mapping (calling code -> country code cca2)
const countryCallingCode = {
  1: 'US', // US/Canada (defaults to US)
  44: 'GB', // United Kingdom
  353: 'IE', // Ireland
  91: 'IN', // India
  92: 'PK', // Pakistan
  93: 'AF', // Afghanistan
  94: 'LK', // Sri Lanka
  95: 'MM', // Myanmar
  98: 'IR', // Iran
  61: 'AU', // Australia
  86: 'CN', // China
  81: 'JP', // Japan
  82: 'KR', // South Korea
  49: 'DE', // Germany
  33: 'FR', // France
  39: 'IT', // Italy
  34: 'ES', // Spain
  7: 'RU', // Russia/Kazakhstan
  20: 'EG', // Egypt
  27: 'ZA', // South Africa
  30: 'GR', // Greece
  31: 'NL', // Netherlands
  32: 'BE', // Belgium
  36: 'HU', // Hungary
  40: 'RO', // Romania
  41: 'CH', // Switzerland
  43: 'AT', // Austria
  45: 'DK', // Denmark
  46: 'SE', // Sweden
  47: 'NO', // Norway
  48: 'PL', // Poland
  51: 'PE', // Peru
  52: 'MX', // Mexico
  53: 'CU', // Cuba
  54: 'AR', // Argentina
  55: 'BR', // Brazil
  56: 'CL', // Chile
  57: 'CO', // Colombia
  58: 'VE', // Venezuela
  60: 'MY', // Malaysia
  62: 'ID', // Indonesia
  63: 'PH', // Philippines
  64: 'NZ', // New Zealand
  65: 'SG', // Singapore
  66: 'TH', // Thailand
  84: 'VN', // Vietnam
  90: 'TR', // Turkey
  212: 'MA', // Morocco
  213: 'DZ', // Algeria
  216: 'TN', // Tunisia
  218: 'LY', // Libya
  220: 'GM', // Gambia
  221: 'SN', // Senegal
  222: 'MR', // Mauritania
  223: 'ML', // Mali
  224: 'GN', // Guinea
  225: 'CI', // Côte d'Ivoire
  226: 'BF', // Burkina Faso
  227: 'NE', // Niger
  228: 'TG', // Togo
  229: 'BJ', // Benin
  230: 'MU', // Mauritius
  231: 'LR', // Liberia
  232: 'SL', // Sierra Leone
  233: 'GH', // Ghana
  234: 'NG', // Nigeria
  235: 'TD', // Chad
  236: 'CF', // Central African Republic
  237: 'CM', // Cameroon
  238: 'CV', // Cape Verde
  239: 'ST', // São Tomé and Príncipe
  240: 'GQ', // Equatorial Guinea
  241: 'GA', // Gabon
  242: 'CG', // Republic of the Congo
  243: 'CD', // Democratic Republic of the Congo
  244: 'AO', // Angola
  245: 'GW', // Guinea-Bissau
  246: 'IO', // British Indian Ocean Territory
  248: 'SC', // Seychelles
  249: 'SD', // Sudan
  250: 'RW', // Rwanda
  251: 'ET', // Ethiopia
  252: 'SO', // Somalia
  253: 'DJ', // Djibouti
  254: 'KE', // Kenya
  255: 'TZ', // Tanzania
  256: 'UG', // Uganda
  257: 'BI', // Burundi
  258: 'MZ', // Mozambique
  260: 'ZM', // Zambia
  261: 'MG', // Madagascar
  262: 'RE', // Réunion / Mayotte
  263: 'ZW', // Zimbabwe
  264: 'NA', // Namibia
  265: 'MW', // Malawi
  266: 'LS', // Lesotho
  267: 'BW', // Botswana
  268: 'SZ', // Eswatini
  269: 'KM', // Comoros
  290: 'SH', // Saint Helena
  291: 'ER', // Eritrea
  297: 'AW', // Aruba
  298: 'FO', // Faroe Islands
  299: 'GL', // Greenland
  350: 'GI', // Gibraltar
  351: 'PT', // Portugal
  352: 'LU', // Luxembourg
  353: 'IE', // Ireland (duplicate for clarity)
  354: 'IS', // Iceland
  356: 'MT', // Malta
  357: 'CY', // Cyprus
  358: 'FI', // Finland
  359: 'BG', // Bulgaria
  370: 'LT', // Lithuania
  371: 'LV', // Latvia
  372: 'EE', // Estonia
  373: 'MD', // Moldova
  374: 'AM', // Armenia
  375: 'BY', // Belarus
  376: 'AD', // Andorra
  377: 'MC', // Monaco
  378: 'SM', // San Marino
  380: 'UA', // Ukraine
  381: 'RS', // Serbia
  382: 'ME', // Montenegro
  383: 'XK', // Kosovo
  385: 'HR', // Croatia
  386: 'SI', // Slovenia
  387: 'BA', // Bosnia and Herzegovina
  389: 'MK', // North Macedonia
  420: 'CZ', // Czech Republic
  421: 'SK', // Slovakia
  423: 'LI', // Liechtenstein
};

// Allowed country codes (default to include Ireland and common countries)
const allowedCountryCodes = [
  'IE',
  'US',
  'GB',
  'CA',
  'AU',
  'NZ',
  'IN',
  'PK',
  'CN',
  'JP',
  'KR',
  'DE',
  'FR',
  'IT',
  'ES',
  'NL',
  'BE',
  'CH',
  'AT',
  'SE',
  'NO',
  'DK',
  'FI',
  'PL',
  'PT',
  'GR',
  'IE',
  'CZ',
  'HU',
  'RO',
  'BG',
  'HR',
  'SI',
  'MX',
  'BR',
  'AR',
  'CL',
  'CO',
  'PE',
  'VE',
  'MY',
  'SG',
  'TH',
  'PH',
  'ID',
  'VN',
  'TR',
  'EG',
  'ZA',
  'MA',
  'NG',
  'KE',
  'GH',
  'TZ',
  'UG',
];

// Default country (Ireland)
const DEFAULT_COUNTRY = {
  cca2: 'IE',
  callingCode: '353',
};

// Normalize API values to match picker options (handle case differences)
const normalizePreferredAddress = value => {
  if (!value) return null;
  const lowerValue = value.toLowerCase();
  if (lowerValue === 'home') return 'Home';
  if (lowerValue === 'work') return 'Work';
  if (preferredAddresses.includes(value)) return value;
  return null;
};

const normalizePreferredEmail = value => {
  if (!value) return null;
  const lowerValue = value.toLowerCase();
  if (lowerValue === 'personal') return 'Personal';
  if (lowerValue === 'work') return 'Work';
  if (preferredEmails.includes(value)) return value;
  return null;
};

const toStoredPreferredAddress = value => {
  const normalized = normalizePreferredAddress(value);
  if (!normalized) return '';
  return normalized.toLowerCase();
};

const toStoredPreferredEmail = value => {
  const normalized = normalizePreferredEmail(value);
  if (!normalized) return '';
  return normalized.toLowerCase();
};

const PersonalInformation = ({
  formData,
  onFormDataChange,
  showValidation,
  personalDetail,
}) => {
  const ref = useRef();
  const textInputRef = useRef(null);
  // Get lookups from context (matching web version - context handles all fetching centrally)
  const {
    genderLookups = [],
    titleLookups = [],
    countryLookups = [],
  } = useLookup() || {};
  const { profileDetail } = useProfile();
  const [organizationName, setOrganizationName] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadOrganizationName = async () => {
      const profileId = profileDetail?.profileId;
      if (!profileId) return;

      try {
        const response = await getPaymentFormPrefill(profileId);
        if (cancelled || !isPaymentApiSuccess(response)) return;

        const prefill = extractPaymentFormPrefill(response);
        const name = getOrganizationNameFromPrefill(prefill);
        if (name) setOrganizationName(name);
      } catch (error) {
        console.error('Failed to load organization name from prefill:', error);
      }
    };

    loadOrganizationName();

    return () => {
      cancelled = true;
    };
  }, [profileDetail?.profileId]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);

  // Detect country code from phone number (matching input.js logic)
  const detectCountryCodeFromPhone = text => {
    if (!text) return { callingCode: null, phoneNumber: null, cca2: null };

    const cleaned = text.trim();

    if (!cleaned.startsWith('+')) {
      return { callingCode: null, phoneNumber: null, cca2: null };
    }

    const digitsOnly = cleaned.replace(/\D/g, '');

    const sortedCallingCodes = Object.keys(countryCallingCode).sort(
      (a, b) => b.length - a.length,
    );

    for (const callingCode of sortedCallingCodes) {
      if (digitsOnly.startsWith(callingCode)) {
        const cca2 = countryCallingCode[callingCode];

        if (allowedCountryCodes.includes(cca2)) {
          const phoneNumber = digitsOnly.substring(callingCode.length);
          if (callingCode === '1' && phoneNumber.length === 10) {
            return { callingCode, phoneNumber, cca2 };
          } else if (
            callingCode !== '1' &&
            phoneNumber.length >= 6 &&
            phoneNumber.length <= 15
          ) {
            return { callingCode, phoneNumber, cca2 };
          }
        }
      }
    }

    return { callingCode: null, phoneNumber: null, cca2: null };
  };

  // Handle country selection
  const handleCountrySelect = country => {
    setSelectedCountry({
      cca2: country.cca2,
      callingCode: country.callingCode[0] || country.callingCode,
    });
  };

  // Handle phone number input change
  const handlePhoneNumberChange = text => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleanedText);

    // Update formData with full formatted number
    if (cleanedText) {
      const fullNumber = `+${selectedCountry.callingCode}${cleanedText}`;
      onFormDataChange({ ...formData, mobileNo: fullNumber });
    } else {
      onFormDataChange({ ...formData, mobileNo: '' });
    }
  };

  // Update formData when country changes (only if phone number exists)
  useEffect(() => {
    if (phoneNumber && selectedCountry.callingCode) {
      const fullNumber = `+${selectedCountry.callingCode}${phoneNumber}`;
      // Only update if it's different to avoid infinite loops
      if (formData?.mobileNo !== fullNumber) {
        onFormDataChange({ ...formData, mobileNo: fullNumber });
      }
    } else if (!phoneNumber) {
      // Clear mobileNo when phone number is empty
      if (formData?.mobileNo) {
        onFormDataChange({ ...formData, mobileNo: '' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry.callingCode, phoneNumber]);

  // Initialize phone value and country code from formData
  useEffect(() => {
    if (formData?.mobileNo) {
      console.log('📱 Setting phone from API:', formData.mobileNo);

      // Detect country from phone number
      const detected = detectCountryCodeFromPhone(formData.mobileNo);

      if (detected.phoneNumber && detected.cca2 && detected.callingCode) {
        console.log(
          '📱 Detected country:',
          detected.cca2,
          'calling code:',
          detected.callingCode,
        );
        console.log('📱 Extracted national number:', detected.phoneNumber);

        setSelectedCountry({
          cca2: detected.cca2,
          callingCode: detected.callingCode,
        });
        setPhoneNumber(detected.phoneNumber);
      } else {
        // If detection fails, default to Ireland
        console.log('📱 Detection failed, defaulting to Ireland');
        setSelectedCountry(DEFAULT_COUNTRY);
        // Try to extract number without country code
        const cleaned = formData.mobileNo.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('353')) {
          setPhoneNumber(cleaned.substring(3));
        } else {
          setPhoneNumber(cleaned);
        }
      }
    } else {
      // Clear phone values when mobileNo is empty
      setPhoneNumber('');
      setSelectedCountry(DEFAULT_COUNTRY);
    }
  }, [formData?.mobileNo]);

  // Normalize preferred address and email values when loaded from API
  useEffect(() => {
    if (formData?.preferredAddress) {
      const normalized = normalizePreferredAddress(formData.preferredAddress);
      if (normalized && normalized !== formData.preferredAddress) {
        onFormDataChange({
          ...formData,
          preferredAddress: normalized,
        });
      }
    }
  }, [formData?.preferredAddress]);

  useEffect(() => {
    if (formData?.preferredEmail) {
      const stored = toStoredPreferredEmail(formData.preferredEmail);
      if (stored && stored !== formData.preferredEmail) {
        onFormDataChange({
          ...formData,
          preferredEmail: stored,
        });
      }
    }
  }, [formData?.preferredEmail]);

  // Clear preferred address if personal detail doesn't exist (keep preferredEmail so selection sticks for new users)
  useEffect(() => {
    if (!personalDetail) {
      if (formData?.preferredAddress) {
        onFormDataChange({
          ...formData,
          preferredAddress: '',
        });
      }
    }
  }, [personalDetail]);

  // Context handles fetching countries centrally - no need to fetch here

  // Set default value to Ireland if countryPrimaryQualification is empty (matching web version)
  useEffect(() => {
    if (
      !formData?.countryPrimaryQualification &&
      countryLookups &&
      countryLookups.length > 0
    ) {
      const irelandCountry = countryLookups.find(
        c =>
          c?.code === 'IE' ||
          c?.name === 'Ireland' ||
          c?.displayname === 'Ireland',
      );
      if (irelandCountry) {
        onFormDataChange({
          ...formData,
          countryPrimaryQualification:
            irelandCountry.displayname || irelandCountry.name || 'Ireland',
        });
      }
    }
  }, [countryLookups, formData?.countryPrimaryQualification]);

  // Set default value to Ireland for address country field if empty (matching web version)
  useEffect(() => {
    if (!formData?.country && countryLookups && countryLookups.length > 0) {
      const irelandCountry = countryLookups.find(
        c =>
          c?.code === 'IE' ||
          c?.name === 'Ireland' ||
          c?.displayname === 'Ireland',
      );
      if (irelandCountry) {
        onFormDataChange({
          ...formData,
          country: irelandCountry.displayname || irelandCountry.name || 'Ireland',
        });
      }
    }
  }, [countryLookups, formData?.country]);

  const titleOptions = Array.isArray(titleLookups)
    ? titleLookups.map(i => i?.lookupname).filter(Boolean)
    : [];
  const genderOptions = Array.isArray(genderLookups)
    ? genderLookups.map(i => i?.lookupname).filter(Boolean)
    : [];

  // Country options using displayname (matching web version)
  const countryOptions = Array.isArray(countryLookups)
    ? countryLookups
        .map(c => ({
          value: c?.displayname,
          label: c?.displayname || c?.name || c?.code,
        }))
        .filter(c => c.value && c.label)
    : [];

  // Helper function to get country display name (matching web version)
  const getCountryDisplayName = codeOrName => {
    if (!codeOrName || !countryLookups) return codeOrName;

    const byDisplayName = countryLookups.find(
      c => c?.displayname === codeOrName,
    );
    if (byDisplayName) return codeOrName;

    const byCode = countryLookups.find(c => c?.code === codeOrName);
    if (byCode) return byCode.displayname;

    const byName = countryLookups.find(c => c?.name === codeOrName);
    if (byName) return byName.displayname;

    return codeOrName;
  };

  return (
    <View
      style={{
        backgroundColor: Colors.background,
        paddingBottom: 16,
        paddingTop: 4,
      }}
    >
      {/* Basic Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <View style={[
              styles.pickerField,
              showValidation &&
                !formData.title && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 12,
                },
            ]}>
          <Picker
            selectedValue={formData.title || ''}
            onValueChange={val => {
              if (val !== undefined) {
                onFormDataChange({ ...formData, title: val });
              }
            }}
          >
            <Picker.Item label="Select title" value="" />
            {(titleOptions.length
              ? titleOptions
              : ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']
            ).map(t => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>
        <View style={[styles.halfCol, { marginRight: 0 }]}>
          <Text style={styles.label}>Forename *</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.forename}
              checkValue={showValidation && !formData.forename}
              onChange={text =>
                onFormDataChange({ ...formData, forename: text })
              }
              placeholder="Enter your forename"
            />
          </View>
        </View>
        <View style={styles.halfCol}>
          <Text style={styles.label}>Surname *</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.surname}
              checkValue={showValidation && !formData.surname}
              onChange={text =>
                onFormDataChange({ ...formData, surname: text })
              }
              placeholder="Enter your surname"
            />
          </View>
        </View>
        {/* </View> */}

        {/* Gender - Dropdown */}
        <Text style={styles.label}>Gender *</Text>
        <View
          style={[
            styles.pickerField,
            showValidation &&
              !formData.gender && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 12,
              },
          ]}
        >
          <Picker
            selectedValue={formData.gender || ''}
            onValueChange={val =>
              onFormDataChange({ ...formData, gender: val })
            }
          >
            <Picker.Item label="Select gender..." value="" />
            {(genderOptions.length
              ? genderOptions
              : ['Woman', 'Man', 'Non-binary', 'Prefer not to say']
            ).map(gender => (
              <Picker.Item key={gender} label={gender} value={gender} />
            ))}
          </Picker>
        </View>

        {/* Date of Birth */}
        <DatePicker
          label="Date of Birth"
          name="dob"
          required
          value={formData.dob}
          showValidation={showValidation}
          onChange={({ target }) =>
            onFormDataChange({ ...formData, dob: target.value })
          }
        />

        {/* Country of Primary Qualification */}
        <Text style={styles.label}>Country of Primary Qualification *</Text>
        <View
          style={[
            styles.pickerField,
            showValidation &&
              !formData.countryPrimaryQualification && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 12,
              },
          ]}
        >
          <SearchablePicker
            items={
              countryOptions.length
                ? countryOptions
                : [
                    { value: 'Ireland', label: 'Ireland' },
                    { value: 'United Kingdom', label: 'United Kingdom' },
                    { value: 'United States', label: 'United States' },
                    { value: 'Other', label: 'Other' },
                  ]
            }
            selectedValue={
              getCountryDisplayName(formData?.countryPrimaryQualification) || ''
            }
            onValueChange={val =>
              onFormDataChange({
                ...formData,
                countryPrimaryQualification: val,
              })
            }
            placeholder="Select country..."
          />
        </View>
      </View>

      {/* Consent Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Consent</Text>
        <View style={styles.termsRow}>
          <View style={styles.termsLabelContainer}>
            <Text style={styles.termsLabel}>
            Consent to receive Correspondence
            {organizationName ? ` from ${organizationName}` : ''}
            </Text>
            <Text style={styles.termsLabelSubtext}>
              Please un-tick this box if you would<Text style={{ fontWeight: 'bold' }}> NOT like </Text> to receive correspondence via email or phone.
            </Text>
          </View>
          <View style={styles.switchContainer}>
            <CustomSwitch
              value={formData.consent}
              onValueChange={val =>
                onFormDataChange({ ...formData, consent: val })
              }
            />
          </View>
        </View>
      </View>

      {/* Address Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Correspondence Details</Text>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Preferred address *</Text>
          <View
            style={[
              styles.pickerField,
              showValidation &&
                !formData.preferredAddress && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 12,
                },
            ]}
          >
            <Picker
              selectedValue={
                normalizePreferredAddress(formData?.preferredAddress) || ''
              }
              onValueChange={val =>
                onFormDataChange({
                  ...formData,
                  preferredAddress: toStoredPreferredAddress(val),
                })
              }
            >
              <Picker.Item label="Select preferred address..." value="" />
              {preferredAddresses.map(a => (
                <Picker.Item key={a} label={a} value={a} />
              ))}
            </Picker>
          </View>
        </View>

        <Text style={styles.label}>Search by address or Eircode</Text>
        <View
          style={[
            styles.autocompleteContainer,
            { zIndex: 9999, elevation: 10 },
          ]}
        >
          <GooglePlacesAutocomplete
            placeholder="Search for your address"
            fetchDetails
            predefinedPlaces={[
              {
                description: 'Dublin, Ireland',
                geometry: { location: { lat: 53.3498, lng: -6.2603 } },
                place_id: 'test_dublin',
              },
              {
                description: 'Cork, Ireland',
                geometry: { location: { lat: 51.8969, lng: -8.4863 } },
                place_id: 'test_cork',
              },
            ]}
            textInputProps={{
              autoFocus: false,
              clearButtonMode: 'while-editing',
            }}
            onFail={error => {
              console.log('GooglePlacesAutocomplete error:', error);
            }}
            onNotFound={() => {
              console.log('No results found');
            }}
            onTextInput={text => {
              console.log('Text input:', text);
            }}
            onTimeout={() => {
              console.log('Request timeout');
            }}
            onPress={(data, details = null) => {
              console.log('Selected place:', data);
              console.log('Place details:', details);
              try {
                const components = details?.address_components || [];
                console.log('components=========>', components);

                const getComponent = type =>
                  components.find(c => c.types?.includes(type))?.long_name ||
                  '';

                const getComponentShortName = type =>
                  components.find(c => c.types?.includes(type))?.short_name ||
                  '';

                // Match web: premise, route, sublocality_level_1, sublocality, locality, postal_town, administrative_area_level_1, postal_code
                const premise = getComponent('premise');
                const streetNumber = getComponent('street_number');
                const route = getComponent('route');
                const sublocalityLevel1 = getComponent('sublocality_level_1');
                const sublocality = getComponent('sublocality');
                const locality = getComponent('locality');
                const postalTown = getComponent('postal_town');
                const administrativeAreaLevel1 = getComponent('administrative_area_level_1');
                const postalCode = getComponent('postal_code');
                const countryLongName = getComponent('country');
                const countryShortName = getComponentShortName('country');

                // Address Line 1: premise if exists, else route (match web)
                const addressLine1 = (
                  (streetNumber ? streetNumber + ' ' : '') + (premise || route || '')
                ).trim();
                // Address Line 2: route only when premise exists, otherwise empty (match web)
                const addressLine2 = premise ? (route || '') : '';
                // Address Line 3: sublocality_level_1, sublocality, or locality (Area/Town) (match web)
                const addressLine3 = sublocalityLevel1 || sublocality || locality || '';
                // Address Line 4: postal_town or administrative_area_level_1 (County, City or Postcode) (match web)
                const addressLine4 = (postalTown || administrativeAreaLevel1 || '').trim();
                const eircode = (postalCode || '').trim();

                // Find the country displayname from countryLookups based on the country name or code (matching web version)
                let countryDisplayName = formData?.country || 'Ireland'; // Default to Ireland if not found
                if (countryLongName || countryShortName) {
                  console.log(
                    'Country from API - Long Name:',
                    countryLongName,
                    'Short Name:',
                    countryShortName,
                  );
                  const matchedCountry = countryLookups?.find(
                    c =>
                      c?.code === countryLongName ||
                      c?.code === countryShortName ||
                      c?.name === countryLongName ||
                      c?.displayname === countryLongName,
                  );
                  if (matchedCountry) {
                    countryDisplayName = matchedCountry.displayname;
                    console.log('Matched country:', matchedCountry);
                  } else {
                    console.log('No matching country found in lookup');
                  }
                }

                console.log('Parsed address:', {
                  addressLine1,
                  addressLine2,
                  addressLine3,
                  addressLine4,
                  eircode,
                  country: countryDisplayName,
                });

                onFormDataChange({
                  ...formData,
                  addressLine1,
                  addressLine2,
                  addressLine3,
                  addressLine4,
                  eircode,
                  country: countryDisplayName,
                });
              } catch (error) {
                console.log('Error parsing address:', error);
              }
            }}
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: 'en',
              types: ['geocode'],
              components: 'country:ie',
            }}
            styles={{
              textInputContainer: {
                backgroundColor: 'transparent',
              },
              textInput: {
                height: 56,
                borderWidth: 1.5,
                borderColor: '#E8E8E8',
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingRight: 52,
                fontSize: 15,
                color: Colors.textPrimary,
                backgroundColor: Colors.white,
                fontWeight: '400',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              },
              listView: {
                zIndex: 9999,
                position: 'absolute',
                top: 58,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                borderRadius: 14,
                elevation: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                maxHeight: 220,
                marginTop: 6,
                borderWidth: 1,
                borderColor: '#F0F0F0',
              },
              row: {
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F5F5F5',
                backgroundColor: 'white',
              },
              description: {
                fontSize: 15,
                color: Colors.textPrimary,
                fontWeight: '400',
              },
              separator: {
                height: 1,
                backgroundColor: '#F5F5F5',
              },
            }}
            renderRightButton={() => (
              <View style={styles.addressIconContainer}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={Colors.textSecondary}
                />
              </View>
            )}
            minLength={2}
            listViewDisplayed="auto"
            returnKeyType="search"
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            enableHighAccuracyLocation={false}
            timeout={15000}
            nearbyPlacesAPI="GooglePlacesSearch"
            filterReverseGeocodingByTypes={[
              'locality',
              'administrative_area_level_3',
            ]}
            debounce={200}
            listUnderlayColor="#f0f0f0"
            keyboardShouldPersistTaps="always"
          />
        </View>

        <Text style={styles.label}>Address line 1 (Building or House) *</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.addressLine1}
            checkValue={showValidation && !formData.addressLine1}
            onChange={text =>
              onFormDataChange({ ...formData, addressLine1: text })
            }
            placeholder="Building or House"
          />
        </View>

        <Text style={styles.label}>Address line 2 (Street or Road)</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.addressLine2}
            onChange={text =>
              onFormDataChange({ ...formData, addressLine2: text })
            }
            placeholder="Street or Road"
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Address line 3 (Area or Town)</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.addressLine3}
              onChange={text =>
                onFormDataChange({ ...formData, addressLine3: text })
              }
              placeholder="Area or Town"
            />
          </View>
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>
            Address line 4 (County, City or Postcode) *
          </Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.addressLine4}
              checkValue={showValidation && !formData.addressLine4}
              onChange={text =>
                onFormDataChange({ ...formData, addressLine4: text })
              }
              placeholder="County, City or Postcode"
            />
          </View>
        </View>

        <Text style={styles.label}>Eircode</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.eircode}
            onChange={text => onFormDataChange({ ...formData, eircode: text })}
            placeholder="Eircode"
          />
        </View>

        <Text style={styles.label}>Country</Text>
        <View style={styles.pickerField}>
          <SearchablePicker
            items={
              countryOptions.length
                ? countryOptions
                : [
                    { value: 'Ireland', label: 'Ireland' },
                    { value: 'United Kingdom', label: 'United Kingdom' },
                    { value: 'United States', label: 'United States' },
                    { value: 'Other', label: 'Other' },
                  ]
            }
            selectedValue={
              getCountryDisplayName(formData?.country) ||
              countryOptions[0]?.value ||
              'Ireland'
            }
            onValueChange={val =>
              onFormDataChange({ ...formData, country: val })
            }
            placeholder="Select country..."
          />
        </View>
      </View>

      {/* Contact Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Details</Text>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Mobile No *</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
            }}
          >
            <CountryPicker
              withFilter
              withFlagButton={false}
              withCallingCodeButton
              countryCode={selectedCountry?.cca2}
              countryCodes={allowedCountryCodes}
              onSelect={handleCountrySelect}
              renderFlagButton={props => (
                <TouchableOpacity
                  style={[
                    styles.countryButtonStyle,
                    showValidation &&
                      !formData.mobileNo &&
                      styles.phoneInputError,
                  ]}
                  onPress={props.onOpen}
                >
                  <Text
                    allowFontScaling={false}
                    style={styles.countryBtnTextStyle}
                  >
                    +{selectedCountry?.callingCode}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={Colors.textPrimary}
                  />
                </TouchableOpacity>
              )}
              theme={{
                flagSizeButton: 20,
                fontSize: 15,
                backgroundColor: Colors.white,
                onBackgroundTextColor: Colors.textPrimary,
                flagBorderRadius: 10,
              }}
            />
            <ScrollView keyboardShouldPersistTaps="never" style={{ flex: 1 }}>
              <InputField
                TextInputRef={textInputRef}
                bgStyle={[
                  styles.PhoneNoStyle,
                  showValidation &&
                    !formData.mobileNo &&
                    styles.phoneInputError,
                ]}
                textStyle={{
                  textAlign: 'left',
                  fontSize: 15,
                }}
                keyboardType="phone-pad"
                maxLength={20}
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                returnKeyType="done"
                textContentType="telephoneNumber"
                autoComplete="tel"
                placeholder="345 123 4567"
                placeholderColor={Colors.textSecondary}
              />
            </ScrollView>
          </View>
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Home / Work Tel Number</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.homeWorkTelNo || formData.workTel || ''}
              onChange={text =>
                onFormDataChange({ ...formData, homeWorkTelNo: text, workTel: text })
              }
              placeholder="Enter your work number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Preferred Email *</Text>
          <View
            style={[
              styles.pickerField,
              showValidation &&
                !formData.preferredEmail && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 12,
                },
            ]}
          >
            <Picker
              selectedValue={
                normalizePreferredEmail(formData?.preferredEmail) || ''
              }
              onValueChange={val =>
                onFormDataChange({
                  ...formData,
                  preferredEmail: toStoredPreferredEmail(val),
                })
              }
            >
              <Picker.Item label="Select preferred email..." value="" />
              {preferredEmails.map(e => (
                <Picker.Item key={e} label={e} value={e} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Personal Email *</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.personalEmail}
              checkValue={
                showValidation &&
                (formData.preferredEmail === 'personal' ||
                  formData.preferredEmail === 'Personal') &&
                !formData.personalEmail
              }
              onChange={text =>
                onFormDataChange({ ...formData, personalEmail: text })
              }
              placeholder="Enter your personal email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Work Email</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.workEmail}
              checkValue={
                showValidation &&
                (formData.preferredEmail === 'work' ||
                  formData.preferredEmail === 'Work') &&
                !formData.workEmail
              }
              onChange={text =>
                onFormDataChange({ ...formData, workEmail: text })
              }
              placeholder="Enter your work email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 16,
    letterSpacing: 0.2,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.15,
  },
  label: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCol: {
    width: '100%',
    marginRight: 8,
    marginBottom: 4,
  },
  halfInput: {
    width: '100%',
    marginBottom: 4,
  },
  inputField: {
    marginBottom: 8,
  },
  pickerField: {
    marginBottom: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 12,
  },
  genderButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  genderButtonTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  gradientContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    marginBottom: 16,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 16,
  },
  termsLabelContainer: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 8,
  },
  termsLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '400',
    lineHeight: 22,
    flexWrap: 'wrap',
  },
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    flexShrink: 0,
  },
  termsLabelBold: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  termsLabelSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '400',
    lineHeight: 16,
    marginTop: 4,
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 9999,
    marginBottom: 8,
    elevation: 10,
  },
  addressIconContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1,
  },
  countryButtonStyle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderColor: '#E8E8E8',
    borderWidth: 1.5,
    borderRadius: 14,
    minWidth: 90,
    height: 56,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  PhoneNoStyle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderColor: '#E8E8E8',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 56,
    paddingVertical: 4,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  countryBtnTextStyle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 6,
  },
  phoneInputError: {
    borderColor: Colors.red,
    borderWidth: 2,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default PersonalInformation;
