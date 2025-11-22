import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import CustomSwitch from '../../common/switch';
import { Colors, form, wp } from '../../utils/Styles';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { DatePicker } from '../../common/DatePicker';
import { useLookup } from '../../contexts/lookupContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PhoneInput from 'react-native-phone-number-input';

const preferredAddresses = ['Home', 'Work', 'Other'];
const preferredEmails = ['Personal', 'Work'];

const GOOGLE_PLACES_API_KEY = 'AIzaSyCJYpj8WV5Rzof7O3jGhW9XabD0J4Yqe1o';

// Normalize API values to match picker options (handle case differences)
const normalizePreferredAddress = (value) => {
  if (!value) return null;
  const lowerValue = value.toLowerCase();
  if (lowerValue === 'home') return 'Home';
  if (lowerValue === 'work') return 'Work';
  if (lowerValue === 'other') return 'Other';
  if (lowerValue === 'personal') return 'Home'; // Map personal to Home
  // If exact match exists, return it
  if (preferredAddresses.includes(value)) return value;
  return null;
};

const normalizePreferredEmail = (value) => {
  if (!value) return null;
  const lowerValue = value.toLowerCase();
  if (lowerValue === 'personal') return 'Personal';
  if (lowerValue === 'work') return 'Work';
  // If exact match exists, return it
  if (preferredEmails.includes(value)) return value;
  return null;
};

const PersonalInformation = ({
  formData,
  onFormDataChange,
  showValidation,
}) => {
  const ref = useRef();
  const phoneInput = useRef(null);
  const lookupContext = useLookup();
  const {
    genderLookups = [],
    titleLookups = [],
    countryLookups = [],
    fetchCountryLookups,
  } = lookupContext || {};
  
  const [phoneValue, setPhoneValue] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('IE');
  const [phoneKey, setPhoneKey] = useState(0);

  // Function to extract country code from phone number
  const getCountryCodeFromPhone = (phoneNumber) => {
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      return 'IE'; // Default to Ireland
    }
    
    // Common country codes mapping
    const countryCodesMap = {
      '+1': 'US',
      '+44': 'GB',
      '+353': 'IE',
      '+91': 'IN',
      '+92': 'PK',
      '+93': 'AF',
      '+94': 'LK',
      '+95': 'MM',
      '+98': 'IR',
      '+61': 'AU',
      '+86': 'CN',
      '+81': 'JP',
      '+82': 'KR',
      '+49': 'DE',
      '+33': 'FR',
      '+39': 'IT',
      '+34': 'ES',
      '+7': 'RU',
    };
    
    // Try to match country code (1-4 digits after +)
    for (let i = 4; i >= 1; i--) {
      const code = phoneNumber.substring(0, i + 1);
      if (countryCodesMap[code]) {
        return countryCodesMap[code];
      }
    }
    
    return 'IE'; // Default to Ireland if no match
  };

  // Initialize phone value and country code from formData
  useEffect(() => {
    if (formData?.mobileNo && formData.mobileNo !== phoneValue) {
      console.log('📱 Setting phone from API:', formData.mobileNo);
      setPhoneValue(formData.mobileNo);
      const detectedCode = getCountryCodeFromPhone(formData.mobileNo);
      console.log('📱 Detected country code:', detectedCode);
      setPhoneCountryCode(detectedCode);
      // Force re-render by changing key
      setPhoneKey(prev => prev + 1);
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
      const normalized = normalizePreferredEmail(formData.preferredEmail);
      if (normalized && normalized !== formData.preferredEmail) {
        onFormDataChange({
          ...formData,
          preferredEmail: normalized,
        });
      }
    }
  }, [formData?.preferredEmail]);

  useEffect(() => {
    console.log('🌍 PersonalInfo - countryLookups:', countryLookups?.length);
    if (!countryLookups || countryLookups.length === 0) {
      console.log('🌍 Fetching countries from PersonalInfo...');
      fetchCountryLookups?.();
    }
  }, [countryLookups, fetchCountryLookups]);

  // Set default value to Ireland for Country of Primary Qualification
  useEffect(() => {
    if (
      !formData?.primaryCountry &&
      countryLookups &&
      countryLookups.length > 0
    ) {
      const irelandCountry = countryLookups.find(
        c =>
          c?.code === 'Ireland' ||
          c?.name === 'Ireland' ||
          c?.displayname === 'Ireland',
      );
      if (irelandCountry) {
        onFormDataChange({
          ...formData,
          primaryCountry: irelandCountry.code,
        });
      }
    }
  }, [countryLookups]);

  // Set default value to Ireland for Correspondence Country
  useEffect(() => {
    if (
      !formData?.country &&
      countryLookups &&
      countryLookups.length > 0
    ) {
      const irelandCountry = countryLookups.find(
        c =>
          c?.code === 'Ireland' ||
          c?.name === 'Ireland' ||
          c?.displayname === 'Ireland',
      );
      if (irelandCountry) {
        onFormDataChange({
          ...formData,
          country: irelandCountry.code,
        });
      }
    }
  }, [countryLookups]);

  const titleOptions = Array.isArray(titleLookups)
    ? titleLookups.map(i => i?.lookupname).filter(Boolean)
    : [];
  const genderOptions = Array.isArray(genderLookups)
    ? genderLookups.map(i => i?.lookupname).filter(Boolean)
    : [];
  const countryOptions = Array.isArray(countryLookups)
    ? countryLookups
        .map(c => ({
          value: c?.code,
          label: c?.displayname || c?.name || c?.code,
        }))
        .filter(c => c.value && c.label)
    : [];

  return (
    <View style={{ backgroundColor: Colors.background, paddingBottom: 20 }}>
      {/* Section Header */}
      <Text style={styles.sectionHeader}>Personal Information</Text>
      <Text style={styles.sectionSubtitle}>Let's start with the basics.</Text>

      {/* Basic Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Information</Text>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.title}
            onValueChange={val => {
              onFormDataChange({ ...formData, title: val });
            }}
          >
            {(titleOptions.length
              ? titleOptions
              : ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']
            ).map(t => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
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
              !formData.primaryCountry && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 12,
              },
          ]}
        >
          <Picker
            selectedValue={
              formData.primaryCountry || countryOptions[0]?.value || 'Ireland'
            }
            onValueChange={val =>
              onFormDataChange({ ...formData, primaryCountry: val })
            }
          >
            {countryOptions.length
              ? countryOptions.map(c => (
                  <Picker.Item key={c.value} label={c.label} value={c.value} />
                ))
              : [
                  { value: 'Ireland', label: 'Ireland' },
                  { value: 'United Kingdom', label: 'United Kingdom' },
                  { value: 'United States', label: 'United States' },
                  { value: 'Other', label: 'Other' },
                ].map(c => (
                  <Picker.Item key={c.value} label={c.label} value={c.value} />
                ))}
          </Picker>
        </View>
      </View>

      {/* Consent Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Consent</Text>
        <View style={styles.termsRow}>
          <Text style={styles.termsLabel}>
            I agree to receive correspondence from INMO
          </Text>
          <CustomSwitch
            value={formData.consent}
            onValueChange={val =>
              onFormDataChange({ ...formData, consent: val })
            }
          />
        </View>
      </View>

      {/* Address Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Address Information</Text>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Preferred address *</Text>
          <View style={styles.pickerField}>
            <Picker
              selectedValue={
                normalizePreferredAddress(formData.preferredAddress) ||
                preferredAddresses[0]
              }
              onValueChange={val =>
                onFormDataChange({ ...formData, preferredAddress: val })
              }
            >
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

                const streetNumber = getComponent('street_number');
                const route = getComponent('route');
                const neighborhood = getComponent('neighborhood') || '';
                const sublocality = getComponent('sublocality') || '';
                const town =
                  getComponent('locality') || getComponent('postal_town') || '';
                const county =
                  getComponent('administrative_area_level_1') || '';
                const postalCode = getComponent('postal_code');
                const countryLongName = getComponent('country');
                const countryShortName = getComponentShortName('country');

                const addressLine1 = `${streetNumber} ${route}`.trim();
                const addressLine2 = neighborhood || sublocality; // Use neighborhood first, fallback to sublocality
                const addressLine3 = town;
                const addressLine4 = `${county}`.trim();
                const eircode = `${postalCode}`.trim();

                // Find the country code from countryLookups based on the country name or code
                let countryCode = formData?.country || 'IE'; // Default to Ireland if not found
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
                    countryCode = matchedCountry.code;
                    console.log('Matched country:', matchedCountry);
                  } else {
                    console.log(
                      'No matching country found in lookup, defaulting to IE',
                    );
                    countryCode = 'IE';
                  }
                }

                console.log('Parsed address:', {
                  addressLine1,
                  addressLine2,
                  addressLine3,
                  addressLine4,
                  eircode,
                  country: countryCode,
                });

                onFormDataChange({
                  ...formData,
                  addressLine1,
                  addressLine2,
                  addressLine3,
                  addressLine4,
                  eircode,
                  country: countryCode,
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
                height: 52,
                borderWidth: 1.5,
                borderColor: '#E5E5E5',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingRight: 48,
                fontSize: 15,
                color: Colors.textPrimary,
                backgroundColor: Colors.white,
                fontWeight: '400',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              },
              listView: {
                zIndex: 9999,
                position: 'absolute',
                top: 52,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                borderRadius: 12,
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                maxHeight: 200,
                marginTop: 4,
              },
              row: {
                padding: 15,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
                backgroundColor: 'white',
              },
              description: {
                fontSize: 15,
                color: Colors.textPrimary,
              },
              separator: {
                height: 1,
                backgroundColor: '#f0f0f0',
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
          <Picker
            selectedValue={
              formData.country ||
              countryOptions[0]?.value ||
              'Ireland'
            }
            onValueChange={val =>
              onFormDataChange({ ...formData, country: val })
            }
          >
            {countryOptions.length
              ? countryOptions.map(c => (
                  <Picker.Item key={c.value} label={c.label} value={c.value} />
                ))
              : [
                  { value: 'Ireland', label: 'Ireland' },
                  { value: 'United Kingdom', label: 'United Kingdom' },
                  { value: 'United States', label: 'United States' },
                  { value: 'Other', label: 'Other' },
                ].map(c => (
                  <Picker.Item key={c.value} label={c.label} value={c.value} />
                ))}
          </Picker>
        </View>
      </View>

      {/* Contact Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Mobile No *</Text>
          <PhoneInput
            key={phoneKey}
            ref={phoneInput}
            defaultValue={phoneValue}
            defaultCode={phoneCountryCode}
            layout="first"
            withDarkTheme={false}
            // withShadow={false}
            // autoFocus={false}
            // renderDropdownImage={<Ionicons name="chevron-down" size={16} color={Colors.textPrimary} />}
            // countryPickerProps={{
            //   withAlphaFilter: true,
            //   withCallingCode: true,
            //   withEmoji: true,
            //   // withFlag: true,
            //   withFlagButton: true,
            // }}
            onChangeCountry={(country) => {
              console.log('📱 Country changed to:', country);
              setPhoneCountryCode(country.cca2);
            }}
            onChangeText={(text) => {
              // This gives just the phone number without country code
              console.log('📱 Phone number only:', text);
            }}
            onChangeFormattedText={text => {
              // This gives the full formatted number with country code
              console.log('📱 Phone changed to:', text);
              setPhoneValue(text);
              onFormDataChange({ ...formData, mobileNo: text });
            }}
            containerStyle={[
              styles.phoneInputContainer,
              showValidation && !formData.mobileNo && styles.phoneInputError,
            ]}
            textContainerStyle={styles.phoneInputTextContainer}
            textInputStyle={styles.phoneInputText}
            codeTextStyle={styles.phoneInputCodeText}
            // flagButtonStyle={styles.phoneInputFlagButton}
            // countryPickerButtonStyle={styles.phoneInputCountryPicker}
            placeholder="345 123 4567"
            textInputProps={{
              maxLength: 20,
              returnKeyType: 'done',
              keyboardType: 'phone-pad',
            }}
            // disableArrowIcon={false}
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Home / Work Tel Number</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.workTel}
              onChange={text =>
                onFormDataChange({ ...formData, workTel: text })
              }
              placeholder="Enter your work number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Preferred Email</Text>
          <View style={styles.pickerField}>
            <Picker
              selectedValue={
                normalizePreferredEmail(formData.preferredEmail) ||
                preferredEmails[0]
              }
              onValueChange={val =>
                onFormDataChange({ ...formData, preferredEmail: val })
              }
            >
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
                formData.preferredEmail === 'Personal' &&
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
                formData.preferredEmail === 'Work' &&
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
  sectionHeader: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 8,
    letterSpacing: 0.3,
    // paddingHorizontal: 20,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
    // paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    // marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  label: {
    color: Colors.textPrimary,
    fontWeight: '500',
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.2,
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
    marginBottom: 4,
  },
  pickerField: {
    marginBottom: 4,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  termsLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    marginRight: 12,
    fontWeight: '400',
    lineHeight: 20,
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 9999,
    marginBottom: 4,
    elevation: 10,
  },
  addressIconContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  phoneInputContainer: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginTop: 4,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInputError: {
    borderColor: Colors.red,
    backgroundColor: '#FFF5F5',
  },
  phoneInputTextContainer: {
    backgroundColor: Colors.white,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 0,
    height: 52,
    flex: 1,
  },
  phoneInputText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '400',
    height: 52,
    paddingTop: 0,
    paddingBottom: 0,
  },
  phoneInputCodeText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 4,
  },
  phoneInputFlagButton: {
    minWidth: 50,
    height: 52,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 24,
  },
  phoneInputCountryPicker: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    height: 52,
    minWidth: 100,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export default PersonalInformation;
