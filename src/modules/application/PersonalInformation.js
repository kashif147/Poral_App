import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import CustomSwitch from '../../common/switch';
import { Colors, form, wp } from '../../utils/Styles';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { DatePicker } from '../../common/DatePicker';
import { useLookup } from '../../contexts/lookupContext';

const preferredAddresses = ['Home', 'Work', 'Other'];
const preferredEmails = ['Personal', 'Work'];

const GOOGLE_PLACES_API_KEY = 'AIzaSyCJYpj8WV5Rzof7O3jGhW9XabD0J4Yqe1o';

const PersonalInformation = ({ formData, onFormDataChange, showValidation }) => {
  const ref = useRef();
  const { genderLookups, titleLookups, countryLookups, fetchCountryLookups } = useLookup();

  useEffect(() => {
    if (!countryLookups || countryLookups.length === 0) {
      fetchCountryLookups?.();
    }
  }, [countryLookups, fetchCountryLookups]);

  const titleOptions = (titleLookups || [])
    .map(i => i?.lookupname)
    .filter(Boolean);
  const genderOptions = (genderLookups || [])
    .map(i => i?.lookupname)
    .filter(Boolean);
  const countryOptions = (countryLookups || [])
    .map(c => c?.displayname || c?.name || c?.code)
    .filter(Boolean);

  return (
    <View style={{ backgroundColor: Colors.surface }}>
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
      {/* Gender & Date of Birth */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.gender || (genderOptions[0] || 'Male')}
            onValueChange={val => onFormDataChange({ ...formData, gender: val })}
          >
            {(genderOptions.length ? genderOptions : ['Male', 'Female', 'Other']).map(g => (
              <Picker.Item key={g} label={g} value={g} />
            ))}
          </Picker>
        </View>
      </View>
      <View style={styles.halfInput}>
        <DatePicker
          label="Date of Birth"
          name="dob"
          required
          value={formData.dob}
          showValidation={showValidation}
          onChange={({ target }) => onFormDataChange({ ...formData, dob: target.value })}
        />
      </View>
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
      {/* Correspondence Details Section */}
      <Text style={styles.sectionTitle}>Correspondence Details</Text>
      <View style={styles.switchRow}>
        <Text style={styles.label}>Consent to receive Correspondence from INMO</Text>
        <CustomSwitch
          value={formData.consent}
          onValueChange={val => onFormDataChange({ ...formData, consent: val })}
        />
      </View>
      <Text style={styles.label}>Search by address or Eircode</Text>
      <View style={[styles.autocompleteContainer, { zIndex: 9999, elevation: 10 }]}>
        <GooglePlacesAutocomplete
          placeholder="Enter Eircode or address"
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
              // React Native equivalent of React JS handlePlacesChanged function
              // This extracts address components from Google Places API response
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
            textInput: {
              ...form.inputBG,
              color: 'black',
              height: 48,
              fontSize: 16,
            },
            listView: {
              zIndex: 9999,
              position: 'absolute',
              top: 48,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderRadius: 8,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              maxHeight: 200,
            },
            row: {
              padding: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
              backgroundColor: 'white',
            },
            description: {
              fontSize: 15,
              color: '#333',
            },
            separator: {
              height: 1,
              backgroundColor: '#f0f0f0',
            },
          }}
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
      <View style={styles.halfInput} />
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
      {/* <View style={styles.switchRow}>
        <Text style={styles.label}>Consent to receive SMS Alerts</Text>
        <Switch
          value={formData.smsConsent}
          onValueChange={val => onFormDataChange({ ...formData, smsConsent: val })}
        />
      </View> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Home / Work Tel Number</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.workTel}
            checkValue={formData.workTel}
            onChange={text => onFormDataChange({ ...formData, workTel: text })}
            placeholder="Enter your work number"
          />
        </View>
      </View>
      <View style={styles.halfInput} />
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
      {/* <View style={styles.switchRow}>
        <Text style={styles.label}>Consent to receive Email Alerts</Text>
        <Switch
          value={formData.emailConsent}
          onValueChange={val => onFormDataChange({ ...formData, emailConsent: val })}
        />
      </View> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Personal Email</Text>
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
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 8
  },
  label: {
    color: Colors.white,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  halfCol: {
    width: '48%',
    marginRight: 8,
    marginBottom: 8
  },
  halfInput: {
    width: '100%',
    marginBottom: 8
  },
  inputField: {
    marginBottom: 8
  },
  pickerField: {
    marginBottom: 8
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
    flex: 1
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 9999,
    marginBottom: 8,
    elevation: 10,
  },
});

export default PersonalInformation; 