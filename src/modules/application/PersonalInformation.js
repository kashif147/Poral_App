import React, { useRef } from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import { Colors, form, wp } from '../../utils/Styles';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const titles = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
const genders = ['Male', 'Female', 'Other'];
const countries = ['Ireland', 'United Kingdom', 'United States', 'Other'];
const preferredAddresses = ['Home', 'Work', 'Other'];
const preferredEmails = ['Personal', 'Work'];

const PersonalInformation = ({ formData, onFormDataChange, showValidation }) => {
  const ref = useRef();
  // Helper for dropdowns
  const pickerStyle = Platform.OS === 'ios' ? { height: 44 } : {
    ...form.inputBG,
    width: '100%',
    color: 'black'
  };
  return (
    <View>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      {/* Title */}
      <Text style={styles.label}>Title *</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={formData.title}
          style={pickerStyle}
          onValueChange={val => {
            onFormDataChange({ ...formData, title: val });
          }}
        >
          {titles.map(t => <Picker.Item key={t} label={t} value={t} />)}
        </Picker>
      </View>
      {/* Surname & Forename */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Surname *</Text>
        <InputField
          value={formData.surname}
          checkValue={showValidation && !formData.surname}
          onChange={text => onFormDataChange({ ...formData, surname: text })}
          placeholder="Enter your surname"
        />
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Forename *</Text>
        <InputField
          value={formData.forename}
          checkValue={showValidation && !formData.forename}
          onChange={text => onFormDataChange({ ...formData, forename: text })}
          placeholder="Enter your forename"
        />
      </View>
      {/* Gender & Date of Birth */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={formData.gender || genders[0]}
            style={pickerStyle}
            onValueChange={val => onFormDataChange({ ...formData, gender: val })}
          >
            {genders.map(g => <Picker.Item key={g} label={g} value={g} />)}
          </Picker>
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Date of Birth *</Text>
          <InputField
            value={formData.dob}
            checkValue={showValidation && !formData.dob}
            onChange={text => onFormDataChange({ ...formData, dob: text })}
            placeholder="DD/MM/YYYY"
            keyboardType="numeric"
          />
        </View>
      </View>
      {/* Country of Primary Qualification */}
      <Text style={styles.label}>Country of Primary Qualification</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={formData.primaryCountry || countries[0]}
          style={pickerStyle}
          onValueChange={val => onFormDataChange({ ...formData, primaryCountry: val })}
        >
          {countries.map(c => <Picker.Item key={c} label={c} value={c} />)}
        </Picker>
      </View>
      {/* Correspondence Details Section */}
      <Text style={styles.sectionTitle}>Correspondence Details</Text>
      <View style={styles.switchRow}>
        <Text style={styles.label}>Consent to receive Correspondence from INMO</Text>
        <Switch
          value={formData.consent}
          onValueChange={val => onFormDataChange({ ...formData, consent: val })}
        />
      </View>
      <Text style={styles.label}>Search by address or Eircode</Text>
      <InputField
        value={formData.searchEircode}
        checkValue={showValidation && !formData.searchEircode}
        onChange={text => onFormDataChange({ ...formData, searchEircode: text })}
        placeholder="Enter Eircode (e.g., D01X4X0)"
      />
      <View style={styles.halfInput}>
        <Text style={styles.label}>Preferred address *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={formData.preferredAddress || preferredAddresses[0]}
            style={pickerStyle}
            onValueChange={val => onFormDataChange({ ...formData, preferredAddress: val })}
          >
            {preferredAddresses.map(a => <Picker.Item key={a} label={a} value={a} />)}
          </Picker>
        </View>
        <View style={styles.halfInput} />
      </View>
      <Text style={styles.label}>Address line 1 (Building or House) *</Text>
      <InputField
        value={formData.address1}
        checkValue={showValidation && !formData.address1}
        onChange={text => onFormDataChange({ ...formData, address1: text })}
        placeholder="Building or House"
      />
      <Text style={styles.label}>Address line 2 (Street or Road)</Text>
      <InputField
        value={formData.address2}
        checkValue={formData.address2}
        onChange={text => onFormDataChange({ ...formData, address2: text })}
        placeholder="Street or Road"
      />
      <View style={styles.halfInput}>
        <Text style={styles.label}>Address line 3 (Area or Town)</Text>
        <InputField
          value={formData.address3}
          checkValue={formData.address3}
          onChange={text => onFormDataChange({ ...formData, address3: text })}
          placeholder="Area or Town"
        />
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Address line 4 (County, City or Postcode) *</Text>
        <InputField
          value={formData.address4}
          checkValue={showValidation && !formData.address4}
          onChange={text => onFormDataChange({ ...formData, address4: text })}
          placeholder="County, City or Postcode"
        />
      </View>
      <Text style={styles.label}>Eircode</Text>
      <InputField
        value={formData.eircode}
        checkValue={formData.eircode}
        onChange={text => onFormDataChange({ ...formData, eircode: text })}
        placeholder="Eircode"
      />
      <Text style={styles.label}>Country</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={formData.correspondenceCountry || countries[0]}
          style={pickerStyle}
          onValueChange={val => onFormDataChange({ ...formData, correspondenceCountry: val })}
        >
          {countries.map(c => <Picker.Item key={c} label={c} value={c} />)}
        </Picker>
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Mobile No *</Text>
        <InputField
          value={formData.mobileNo}
          checkValue={showValidation && !formData.mobileNo}
          onChange={text => onFormDataChange({ ...formData, mobileNo: text })}
          placeholder="Enter your mobile number"
          keyboardType="phone-pad"
        />
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
        <InputField
          value={formData.workTel}
          checkValue={formData.workTel}
          onChange={text => onFormDataChange({ ...formData, workTel: text })}
          placeholder="Enter your work number"
        />
      </View>
      <View style={styles.halfInput} />
      <View style={styles.halfInput}>
        <Text style={styles.label}>Preferred Email</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={formData.preferredEmail || preferredEmails[0]}
            style={pickerStyle}
            onValueChange={val => onFormDataChange({ ...formData, preferredEmail: val })}
          >
            {preferredEmails.map(e => <Picker.Item key={e} label={e} value={e} />)}
          </Picker>
        </View>
        {/* <View style={styles.switchRow}>
          <Text style={styles.label}>Consent to receive Email Alerts</Text>
          <Switch
            value={formData.emailConsent}
            onValueChange={val => onFormDataChange({ ...formData, emailConsent: val })}
          />
        </View> */}
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Personal Email</Text>
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
      <View style={styles.halfInput}>
        <Text style={styles.label}>Work Email</Text>
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
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginTop: 16, marginBottom: 8 },
  label: { fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 1, marginRight: 8 },
  pickerWrapper: {
    borderRadius: wp(50),
    borderWidth: wp(0.3),
    borderColor: Colors.lightgray,
    marginBottom: 8, overflow: 'hidden'
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flex: 1 },
});

export default PersonalInformation; 