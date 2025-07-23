import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { InputField } from '../../common/inputField';

const PersonalInformation = ({ formData, onFormDataChange, showValidation }) => {
  return (
    <View>
      <Text style={styles.label}>Forename</Text>
      <InputField
        value={formData.forename}
        onChange={text => onFormDataChange({ ...formData, forename: text })}
        placeholder="Enter your forename"
      />
      <Text style={styles.label}>Surname</Text>
      <InputField
        value={formData.surname}
        onChange={text => onFormDataChange({ ...formData, surname: text })}
        placeholder="Enter your surname"
      />
      <Text style={styles.label}>Personal Email</Text>
      <InputField
        value={formData.personalEmail}
        onChange={text => onFormDataChange({ ...formData, personalEmail: text })}
        placeholder="Enter your personal email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Mobile No</Text>
      <InputField
        value={formData.mobileNo}
        onChange={text => onFormDataChange({ ...formData, mobileNo: text })}
        placeholder="Enter your mobile number"
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>Country</Text>
      <InputField
        value={formData.country}
        onChange={text => onFormDataChange({ ...formData, country: text })}
        placeholder="Enter your country"
      />
      <View style={styles.switchRow}>
        <Text style={styles.label}>SMS Consent</Text>
        <Switch
          value={formData.smsConsent}
          onValueChange={val => onFormDataChange({ ...formData, smsConsent: val })}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.label}>Email Consent</Text>
        <Switch
          value={formData.emailConsent}
          onValueChange={val => onFormDataChange({ ...formData, emailConsent: val })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
});

export default PersonalInformation; 