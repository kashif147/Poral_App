import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import { Colors, wp } from '../../utils/Styles';

const paymentTypes = ['Deduction at Source', 'Credit Card'];
const membershipStatuses = [
  { value: 'new', label: 'You are a new member' },
  { value: 'graduate', label: 'You are newly graduated' },
  { value: 'rejoin', label: 'You were previously a member of the INMO, and are rejoining' },
  { value: 'careerBreak', label: 'You are returning from a career break' },
  { value: 'nursingAbroad', label: 'You are returning from nursing abroad' },
];
const sections = ['Section 1', 'Section 2', 'Section 3', 'Section 4', 'Section 5', 'Other'];

const SubscriptionDetails = ({ formData, onFormDataChange, showValidation }) => {

  return (
    <View style={{ backgroundColor: Colors.surface }}>
      <Text style={styles.sectionTitle}>Subscription Details</Text>
      {/* Payment Type & Payroll No */}
      {/* <View style={styles.row}> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Payment Type *</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.paymentType || paymentTypes[0]}
            onValueChange={val => {
              const shouldClear = formData?.paymentType === 'Deduction at Source' && val === 'Credit Card';
              onFormDataChange({ ...formData, paymentType: val, ...(shouldClear ? { payrollNo: '' } : {}) });
            }}
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
            editable={formData.paymentType !== 'Deduction at Source'}
            holderTextColor={'#94A3B8'}
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
            key={status.value}
            style={[styles.radioButton, formData.memberStatus === status.value && styles.radioSelected]}
            onPress={() => onFormDataChange({ ...formData, memberStatus: status.value })}
          >
            <Text style={styles.radioLabel}>{status.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Member of another Trade Union */}
      <Text style={styles.label}>If you are a member of another Trade Union. If yes, which Union?</Text>
      <View style={styles.radioRow}>
        <TouchableOpacity
          style={[styles.radioButton, formData.otherIrishTradeUnion === 'yes' && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, otherIrishTradeUnion: 'yes' })}
        >
          <Text style={styles.radioLabel}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.radioButton, formData.otherIrishTradeUnion === 'no' && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, otherIrishTradeUnion: 'no', otherTradeUnionName: '' })}
        >
          <Text style={styles.radioLabel}>No</Text>
        </TouchableOpacity>
        {formData.otherIrishTradeUnion === 'yes' && (
          <View style={[styles.inputField, { flex: 1 }]}>
            <InputField
              value={formData.otherTradeUnionName}
              holderTextColor={'#94A3B8'}
              onChange={text => onFormDataChange({ ...formData, otherTradeUnionName: text })}
              placeholder="Enter union name"
            />
          </View>
        )}
      </View>
      {/* Member of another Irish Trade Union */}
      <Text style={styles.label}>Are you or were you a member of another Irish trade Union salary or Income Protection Scheme? *</Text>
      <View style={styles.radioRow}>
        <TouchableOpacity
          style={[styles.radioButton, formData.otherScheme === 'yes' && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, otherScheme: 'yes' })}
        >
          <Text style={styles.radioLabel}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.radioButton, formData.otherScheme === 'no' && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, otherScheme: 'no' })}
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
            value={formData.recuritedBy}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, recuritedBy: text, recruitedBy: text })}
            placeholder="Enter the name of the person who recruited you"
          />
        </View>
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Recruited By (Membership No)</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.recuritedByMembershipNo}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, recuritedByMembershipNo: text, recruitedByMembershipNo: text })}
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
            onValueChange={val => onFormDataChange({ ...formData, primarySection: val, ...(val !== 'Other' ? { otherPrimarySection: '' } : {}) })}
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
            editable={formData.primarySection !== 'Other'}
            holderTextColor={'#94A3B8'}
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
            onValueChange={val => onFormDataChange({ ...formData, secondarySection: val, ...(val !== 'Other' ? { otherSecondarySection: '' } : {}) })}
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
            editable={formData.secondarySection !== 'Other'}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, otherSecondarySection: text })}
            placeholder="Enter your other secondary section"
          />
        </View>
      </View>
      {/* </View> */}
      {/* Checkboxes */}
      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkboxItem}
          onPress={() => onFormDataChange({ ...formData, incomeProtectionScheme: !formData?.incomeProtectionScheme })}
        >
          <View style={[styles.checkboxBox, formData?.incomeProtectionScheme && styles.checkboxBoxChecked]}>
            {formData?.incomeProtectionScheme ? <Text style={styles.checkboxTick}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>Tick here to join INMO Income Protection Scheme</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxItem}
          onPress={() => onFormDataChange({ ...formData, inmoRewards: !formData?.inmoRewards })}
        >
          <View style={[styles.checkboxBox, formData?.inmoRewards && styles.checkboxBoxChecked]}>
            {formData?.inmoRewards ? <Text style={styles.checkboxTick}>✓</Text> : null}
          </View>
            <Text style={styles.checkboxLabel}>Tick here to join Rewards for INMO members</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxItem}
          onPress={() => onFormDataChange({ ...formData, valueAddedServices: !formData?.valueAddedServices })}
        >
          <View style={[styles.checkboxBox, formData?.valueAddedServices && styles.checkboxBoxChecked]}>
            {formData?.valueAddedServices ? <Text style={styles.checkboxTick}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>Tick here to allow our partners to contact you about Value added Services by Email and SMS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.checkboxItem, { alignItems: 'flex-start' }]}
          onPress={() => onFormDataChange({ ...formData, termsAndConditions: !formData?.termsAndConditions })}
        >
          <View style={[styles.checkboxBox, formData?.termsAndConditions && styles.checkboxBoxChecked]}>
            {formData?.termsAndConditions ? <Text style={styles.checkboxTick}>✓</Text> : null}
          </View>
          <Text style={[styles.checkboxLabel, { flex: 1 }]}>I have read and agree to the INMO <Text style={styles.link} onPress={() => Linking.openURL('https://www.inmo.ie/DataProtection')}>Data Protection Statement</Text>, the INMO <Text style={styles.link} onPress={() => Linking.openURL('https://www.inmo.ie/PrivacyStatement')}>Privacy Statement</Text> and the INMO <Text style={styles.link} onPress={() => Linking.openURL('https://www.inmo.ie/ConditionsOfMembership')}>Conditions of Membership</Text> {showValidation && !formData?.termsAndConditions ? <Text style={{ color: 'red' }}>(Required)</Text> : null}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { 
    color:Colors.white,
    fontWeight: 'bold', 
    fontSize: 16, 
    marginTop: 8, 
    marginBottom: 8 
  },
  label: { 
    fontWeight: 'bold', 
    marginTop: 8, 
    marginBottom: 4,
    color: '#E5F9F4'
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
    borderColor: '#2A2F33', 
    backgroundColor: '#1A1E21',
    borderRadius: 16, 
    marginRight: 8, 
    marginBottom: 6 
  },
  radioSelected: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary 
  },
  radioLabel: { 
    color: '#E5F9F4' 
  },
  checkboxRow: { 
    flexDirection: 'column', 
    marginTop: 8 
  },
  checkboxCol: { 
    flex: 1 
  },
  checkboxItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    paddingVertical: 6,
    marginBottom: 8 
  },
  checkboxLabel: { 
    marginLeft: 8, 
    flex: 1,
    textAlign: 'left',
    lineHeight: 18,
    color: '#E5F9F4'
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 12,
  },
  link: { 
    color: '#007bff', 
    textDecorationLine: 'underline' 
  },
});

export default SubscriptionDetails; 