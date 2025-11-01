import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import CustomSwitch from '../../common/switch';
import { Colors, form, wp } from '../../utils/Styles';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { DatePicker } from '../../common/DatePicker';
import { useLookup } from '../../contexts/lookupContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const preferredAddresses = ['Home', 'Work', 'Other'];
const preferredEmails = ['Personal', 'Work'];

const GOOGLE_PLACES_API_KEY = 'AIzaSyCJYpj8WV5Rzof7O3jGhW9XabD0J4Yqe1o';

const PersonalInformation = ({ formData, onFormDataChange, showValidation }) => {
  const ref = useRef();
  const lookupContext = useLookup();
  const { genderLookups = [], titleLookups = [], countryLookups = [], fetchCountryLookups } = lookupContext || {};

  useEffect(() => {
    console.log('🌍 PersonalInfo - countryLookups:', countryLookups?.length);
    if (!countryLookups || countryLookups.length === 0) {
      console.log('🌍 Fetching countries from PersonalInfo...');
      fetchCountryLookups?.();
    }
  }, [countryLookups, fetchCountryLookups]);

  const titleOptions = Array.isArray(titleLookups)
    ? titleLookups.map(i => i?.lookupname).filter(Boolean)
    : [];
  const genderOptions = Array.isArray(genderLookups)
    ? genderLookups.map(i => i?.lookupname).filter(Boolean)
    : [];
  const countryOptions = Array.isArray(countryLookups)
    ? countryLookups.map(c => {
        // Try multiple possible field names
        const name = c?.displayname || c?.DisplayName || c?.name || c?.countryName || c?.code || c?.countryCode;
        console.log('🌍 Country item:', JSON.stringify(c).substring(0, 200));
        return name;
      }).filter(Boolean)
    : [];

    console.log('🌍 countryOptions=========>', countryOptions);
    console.log('👤 genderOptions=========>', genderOptions);
    console.log('👔 titleOptions=========>', titleOptions);

  return (
    <View style={{ backgroundColor: Colors.background, paddingBottom: 20 }}>
      {/* Section Header */}
      <Text style={styles.sectionHeader}>Personal Information</Text>
      <Text style={styles.sectionSubtitle}>Let's start with the basics.</Text>
      
      {/* Basic Information Card */}
      <View style={{}}>
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
            {(titleOptions.length ? titleOptions : ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']).map(t => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>

        {/* Surname & Forename - two columns */}
        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Surname *</Text>
            <View style={styles.inputField}>
              <InputField
                value={formData.surname}
                checkValue={showValidation && !formData.surname}
                onChange={text => onFormDataChange({ ...formData, surname: text })}
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
                onChange={text => onFormDataChange({ ...formData, forename: text })}
                placeholder="Enter your forename"
              />
            </View>
          </View>
        </View>

        {/* Gender - Button Style */}
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.genderContainer}>
          {(genderOptions.length ? genderOptions : ['Woman', 'Man', 'Non-binary', 'Prefer not to say']).map(gender => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.genderButton,
                formData.gender === gender && styles.genderButtonActive
              ]}
              onPress={() => onFormDataChange({ ...formData, gender })}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.genderButtonText,
                formData.gender === gender && styles.genderButtonTextActive
              ]}>
                {gender}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date of Birth */}
        <DatePicker
          label="Date of Birth"
          name="dob"
          required
          value={formData.dob}
          showValidation={showValidation}
          onChange={({ target }) => onFormDataChange({ ...formData, dob: target.value })}
        />

        {/* Country of Primary Qualification */}
        <Text style={styles.label}>Country of Primary Qualification</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.primaryCountry || (countryOptions[0] || 'Ireland')}
            onValueChange={val => onFormDataChange({ ...formData, primaryCountry: val })}
          >
            {(countryOptions.length ? countryOptions : ['Ireland', 'United Kingdom', 'United States', 'Other']).map(c => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Consent Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Consent</Text>
        <View style={styles.termsRow}>
          <Text style={styles.termsLabel}>I agree to receive correspondence from INMO</Text>
          <CustomSwitch
            value={formData.consent}
            onValueChange={val => onFormDataChange({ ...formData, consent: val })}
          />
        </View>
      </View>

      {/* Address Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Address Information</Text>

        <Text style={styles.label}>Search by address or Eircode</Text>
        <View style={[styles.autocompleteContainer, { zIndex: 9999, elevation: 10 }]}>
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
                  components.find(c => c.types?.includes(type))?.long_name || '';

                const streetNumber = getComponent('street_number');
                const route = getComponent('route');
                const sublocality = getComponent('sublocality') || '';
                const town =
                  getComponent('locality') || getComponent('postal_town') || '';
                const county = getComponent('administrative_area_level_1') || '';
                const postalCode = getComponent('postal_code');

                const addressLine1 = `${streetNumber} ${route}`.trim();
                const addressLine2 = sublocality;
                const addressLine3 = town;
                const addressLine4 = `${county}`.trim();
                const eircode = `${postalCode}`.trim();

                console.log('Parsed address:', { addressLine1, addressLine2, addressLine3, addressLine4, eircode });

                onFormDataChange({
                  ...formData,
                  addressLine1,
                  addressLine2,
                  addressLine3,
                  addressLine4,
                  eircode,
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
                <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
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
            filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
            debounce={200}
            listUnderlayColor="#f0f0f0"
            keyboardShouldPersistTaps="always"
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Preferred address *</Text>
          <View style={styles.pickerField}>
            <Picker
              selectedValue={formData.preferredAddress || preferredAddresses[0]}
              onValueChange={val => onFormDataChange({ ...formData, preferredAddress: val })}
            >
              {preferredAddresses.map(a => <Picker.Item key={a} label={a} value={a} />)}
            </Picker>
          </View>
        </View>

        <Text style={styles.label}>Address line 1 (Building or House) *</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.addressLine1}
            checkValue={showValidation && !formData.addressLine1}
            onChange={text => onFormDataChange({ ...formData, addressLine1: text })}
            placeholder="Building or House"
          />
        </View>

        <Text style={styles.label}>Address line 2 (Street or Road)</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.addressLine2}
            onChange={text => onFormDataChange({ ...formData, addressLine2: text })}
            placeholder="Street or Road"
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Address line 3 (Area or Town)</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.addressLine3}
              onChange={text => onFormDataChange({ ...formData, addressLine3: text })}
              placeholder="Area or Town"
            />
          </View>
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Address line 4 (County, City or Postcode) *</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.addressLine4}
              checkValue={showValidation && !formData.addressLine4}
              onChange={text => onFormDataChange({ ...formData, addressLine4: text })}
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
            selectedValue={formData.correspondenceCountry || (countryOptions[0] || 'Ireland')}
            onValueChange={val => onFormDataChange({ ...formData, correspondenceCountry: val })}
          >
            {(countryOptions.length ? countryOptions : ['Ireland', 'United Kingdom', 'United States', 'Other']).map(c => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Contact Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Mobile No *</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.mobileNo}
              checkValue={showValidation && !formData.mobileNo}
              onChange={text => onFormDataChange({ ...formData, mobileNo: text })}
              placeholder="Enter your mobile number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Home / Work Tel Number</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.workTel}
              onChange={text => onFormDataChange({ ...formData, workTel: text })}
              placeholder="Enter your work number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Preferred Email</Text>
          <View style={styles.pickerField}>
            <Picker
              selectedValue={formData.preferredEmail || preferredEmails[0]}
              onValueChange={val => onFormDataChange({ ...formData, preferredEmail: val })}
            >
              {preferredEmails.map(e => <Picker.Item key={e} label={e} value={e} />)}
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
              onChange={text => onFormDataChange({ ...formData, personalEmail: text })}
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
              onChange={text => onFormDataChange({ ...formData, workEmail: text })}
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
    justifyContent: 'space-between'
  },
  halfCol: {
    width: '48%',
    marginRight: 8,
    marginBottom: 4
  },
  halfInput: {
    width: '100%',
    marginBottom: 4
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
});

export default PersonalInformation; 