import React from 'react';
import { View, Text, StyleSheet, Platform, Switch, TouchableOpacity, Linking } from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import { Colors, wp } from '../../utils/Styles';

const paymentTypes = ['Credit Card', 'Direct Debit', 'Payroll Deduction'];
const membershipStatuses = [
  'You are a new member',
  'You are newly graduated',
  'You were previously a member of the INMO, and are rejoining',
  'You are returning from a career break',
  'You are returning from nursing abroad',
];
const sections = ['Select..', 'Section 1', 'Section 2', 'Section 3'];

const SubscriptionDetails = ({ formData, onFormDataChange, showValidation }) => {

  return (
    <View>
      <Text style={styles.sectionTitle}>Subscription Details</Text>
      {/* Payment Type & Payroll No */}
      {/* <View style={styles.row}> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Payment Type *</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.paymentType || paymentTypes[0]}
            onValueChange={val => onFormDataChange({ ...formData, paymentType: val })}
          >
            {paymentTypes.map(t => <Picker.Item key={t} label={t} value={t} />)}
          </Picker>
        </View>
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Payroll No</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.payrollNo}
            onChange={text => onFormDataChange({ ...formData, payrollNo: text })}
            placeholder="Enter your payroll number"
          />
        </View>
      </View>
      {/* Membership status radio group */}
      <Text style={styles.label}>Please select the most appropriate option below</Text>
      <View style={styles.radioGroup}>
        {membershipStatuses.map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.radioButton, formData.membershipStatus === status && styles.radioSelected]}
            onPress={() => onFormDataChange({ ...formData, membershipStatus: status })}
          >
            <Text style={styles.radioLabel}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Member of another Trade Union */}
      <Text style={styles.label}>If you are a member of another Trade Union. If yes, which Union?</Text>
      <View style={styles.radioRow}>
        <TouchableOpacity
          style={[styles.radioButton, formData.otherTradeUnion === true && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, otherTradeUnion: true })}
        >
          <Text style={styles.radioLabel}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.radioButton, formData.otherTradeUnion === false && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, otherTradeUnion: false })}
        >
          <Text style={styles.radioLabel}>No</Text>
        </TouchableOpacity>
        {formData.otherTradeUnion === true && (
          <View style={styles.inputField}>
            <InputField
              value={formData.otherTradeUnionName}
              onChange={text => onFormDataChange({ ...formData, otherTradeUnionName: text })}
              placeholder="Enter union name"
              style={{ marginLeft: 8, flex: 1 }}
            />
          </View>
        )}
      </View>
      {/* Member of another Irish Trade Union */}
      <Text style={styles.label}>Are you or were you a member of another Irish trade Union salary or Income Protection Scheme? *</Text>
      <View style={styles.radioRow}>
        <TouchableOpacity
          style={[styles.radioButton, formData.irishTradeUnion === true && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, irishTradeUnion: true })}
        >
          <Text style={styles.radioLabel}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.radioButton, formData.irishTradeUnion === false && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, irishTradeUnion: false })}
        >
          <Text style={styles.radioLabel}>No</Text>
        </TouchableOpacity>
      </View>
      {/* Recruited By */}
      {/* <View style={styles.row}> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Recruited By</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.recruitedBy}
            onChange={text => onFormDataChange({ ...formData, recruitedBy: text })}
            placeholder="Enter the name of the person who recruited you"
          />
        </View>
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Recruited By (Membership No)</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.recruitedByMembershipNo}
            onChange={text => onFormDataChange({ ...formData, recruitedByMembershipNo: text })}
            placeholder="Enter the membership number of the recruiter"
          />
        </View>
      </View>
      {/* </View> */}
      {/* Primary/Other Primary Section */}
      {/* <View style={styles.row}> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Primary Section</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.primarySection || sections[0]}
            onValueChange={val => onFormDataChange({ ...formData, primarySection: val })}
          >
            {sections.map(s => <Picker.Item key={s} label={s} value={s} />)}
          </Picker>
        </View>
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Other Primary Section</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.otherPrimarySection}
            onChange={text => onFormDataChange({ ...formData, otherPrimarySection: text })}
            placeholder="Enter your other primary section"
          />
        </View>
      </View>
      {/* </View> */}
      {/* Secondary/Other Secondary Section */}
      {/* <View style={styles.row}> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Secondary Section</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.secondarySection || sections[0]}
            onValueChange={val => onFormDataChange({ ...formData, secondarySection: val })}
          >
            {sections.map(s => <Picker.Item key={s} label={s} value={s} />)}
          </Picker>
        </View>
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Other Secondary Section</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.otherSecondarySection}
            onChange={text => onFormDataChange({ ...formData, otherSecondarySection: text })}
            placeholder="Enter your other secondary section"
          />
        </View>
      </View>
      {/* </View> */}
      {/* Checkboxes */}
      <View style={styles.checkboxRow}>
        {/* <View style={styles.checkboxCol}>
          <View style={styles.checkboxItem}>
            <Switch
              value={formData.joinIncomeProtection}
              onValueChange={val => onFormDataChange({ ...formData, joinIncomeProtection: val })}
            />
            <Text style={styles.checkboxLabel}>Tick here to join INMO Income Protection Scheme</Text>
          </View>
          <View style={styles.checkboxItem}>
            <Switch
              value={formData.allowPartnersContact}
              onValueChange={val => onFormDataChange({ ...formData, allowPartnersContact: val })}
            />
            <Text style={styles.checkboxLabel}>Tick here to allow our partners to contact you about Value added Services by Email and SMS</Text>
          </View>
        </View> */}
        {/* <View style={styles.checkboxCol}>
          <View style={styles.checkboxItem}>
            <Switch
              value={formData.joinRewards}
              onValueChange={val => onFormDataChange({ ...formData, joinRewards: val })}
            />
            <Text style={styles.checkboxLabel}>Tick here to join Rewards for INMO members</Text>
          </View>
          <View style={styles.checkboxItem}>
            <Switch
              value={formData.agreeDataProtection}
              onValueChange={val => onFormDataChange({ ...formData, agreeDataProtection: val })}
            />
            <Text style={styles.checkboxLabel}>
              I have read and agree to the INMO{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://www.inmo.ie/DataProtection')}>Data Protection Statement</Text>, the INMO{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://www.inmo.ie/PrivacyStatement')}>Privacy Statement</Text> and the INMO{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://www.inmo.ie/ConditionsOfMembership')}>Conditions of Membership</Text>
            </Text>
          </View>
        </View> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginTop: 8, 
    marginBottom: 8 
  },
  label: { 
    fontWeight: 'bold', 
    marginTop: 8, 
    marginBottom: 4 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  halfInput: { 
    flex: 1, 
    marginRight: 8,
    marginBottom: 8
  },
  inputField: {
    marginBottom: 8
  },
  pickerField: {
    marginBottom: 8
  },
  radioRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  radioGroup: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 8 
  },
  radioButton: { 
    padding: 8, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 16, 
    marginRight: 8, 
    marginBottom: 6 
  },
  radioSelected: { 
    backgroundColor: '#007bff', 
    borderColor: '#007bff' 
  },
  radioLabel: { 
    color: '#333' 
  },
  checkboxRow: { 
    flexDirection: 'row', 
    marginTop: 8 
  },
  checkboxCol: { 
    flex: 1 
  },
  checkboxItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  checkboxLabel: { 
    marginLeft: 8, 
    flex: 1 
  },
  link: { 
    color: '#007bff', 
    textDecorationLine: 'underline' 
  },
});

export default SubscriptionDetails; 