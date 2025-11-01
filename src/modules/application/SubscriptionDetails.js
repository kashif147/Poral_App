import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import { Colors, wp } from '../../utils/Styles';
import { useEffect, useMemo } from 'react';
import { useLookup } from '../../contexts/lookupContext';

const paymentTypes = ['Deduction at Source', 'Credit Card'];
const membershipStatuses = [
  { value: 'new', label: 'You are a new member' },
  { value: 'graduate', label: 'You are newly graduated' },
  { value: 'rejoin', label: 'You were previously a member of the INMO, and are rejoining' },
  { value: 'careerBreak', label: 'You are returning from a career break' },
  { value: 'nursingAbroad', label: 'You are returning from nursing abroad' },
];
// Sections will be populated dynamically from lookup context

const SubscriptionDetails = ({ formData, onFormDataChange, showValidation }) => {
  const { primarySectionLookups, secondarySectionLookups, fetchLookups } = useLookup();

  useEffect(() => {
    const needPrimary = !primarySectionLookups || primarySectionLookups.length === 0;
    const needSecondary = !secondarySectionLookups || secondarySectionLookups.length === 0;
    if (needPrimary || needSecondary) {
      fetchLookups?.();
    }
  }, [primarySectionLookups, secondarySectionLookups, fetchLookups]);

  const primaryNames = useMemo(() => (
    (primarySectionLookups || [])
      .map(s => s?.DisplayName || s?.lookupname)
      .filter(Boolean)
  ), [primarySectionLookups]);
  const secondaryNames = useMemo(() => (
    (secondarySectionLookups || [])
      .map(s => s?.DisplayName || s?.lookupname)
      .filter(Boolean)
  ), [secondarySectionLookups]);

  return (
    <View style={{ backgroundColor: Colors.background, paddingBottom: 20 }}>
      {/* Payment Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Information</Text>
        
        {/* Payment Type */}
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

        {/* Payroll No */}
        <Text style={styles.label}>Payroll No {formData.paymentType === 'Deduction at Source' && '*'}</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.payrollNo}
            editable={formData.paymentType === 'Deduction at Source'}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, payrollNo: text })}
            placeholder="Enter your payroll number"
          />
        </View>
      </View>

      {/* Membership Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Membership Status</Text>
        
        {/* Membership status radio group */}
        <Text style={styles.label}>
          Please select the most appropriate option below *
          {showValidation && !formData.memberStatus && <Text style={{ color: 'red' }}> (Required)</Text>}
        </Text>
        <View style={styles.radioGroup}>
          {membershipStatuses.map(status => (
            <TouchableOpacity
              key={status.value}
              style={[styles.radioButton, formData.memberStatus === status.value && styles.radioSelected]}
              onPress={() => onFormDataChange({ ...formData, memberStatus: status.value })}
            >
              <Text style={[styles.radioLabel, formData.memberStatus === status.value && styles.radioLabelSelected]}>
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Trade Union Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trade Union Information</Text>
        
        {/* Member of another Trade Union */}
        <Text style={styles.label}>
          If you are a member of another Trade Union. If yes, which Union? *
          {showValidation && !formData.otherIrishTradeUnion && <Text style={{ color: 'red' }}> (Required)</Text>}
        </Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={[styles.radioButton, formData.otherIrishTradeUnion === 'yes' && styles.radioSelected]}
            onPress={() => onFormDataChange({ ...formData, otherIrishTradeUnion: 'yes' })}
          >
            <Text style={[styles.radioLabel, formData.otherIrishTradeUnion === 'yes' && styles.radioLabelSelected]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, formData.otherIrishTradeUnion === 'no' && styles.radioSelected]}
            onPress={() => onFormDataChange({ ...formData, otherIrishTradeUnion: 'no', otherTradeUnionName: '' })}
          >
            <Text style={[styles.radioLabel, formData.otherIrishTradeUnion === 'no' && styles.radioLabelSelected]}>No</Text>
          </TouchableOpacity>
        </View>
        
        {formData.otherIrishTradeUnion === 'yes' && (
          <View style={[styles.inputField, { marginTop: 8 }]}>
            <InputField
              value={formData.otherTradeUnionName}
              holderTextColor={'#94A3B8'}
              onChange={text => onFormDataChange({ ...formData, otherTradeUnionName: text })}
              placeholder="Enter union name"
            />
          </View>
        )}

        {/* Member of another Irish Trade Union Protection Scheme */}
        <Text style={styles.label}>
          Are you or were you a member of another Irish trade Union salary or Income Protection Scheme? *
          {showValidation && !formData.otherScheme && <Text style={{ color: 'red' }}> (Required)</Text>}
        </Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={[styles.radioButton, formData.otherScheme === 'yes' && styles.radioSelected]}
            onPress={() => onFormDataChange({ ...formData, otherScheme: 'yes' })}
          >
            <Text style={[styles.radioLabel, formData.otherScheme === 'yes' && styles.radioLabelSelected]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, formData.otherScheme === 'no' && styles.radioSelected]}
            onPress={() => onFormDataChange({ ...formData, otherScheme: 'no' })}
          >
            <Text style={[styles.radioLabel, formData.otherScheme === 'no' && styles.radioLabelSelected]}>No</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recruitment & Section Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recruitment & Section Details</Text>
        
        {/* Recruited By */}
        <Text style={styles.label}>Recruited By</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.recuritedBy}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, recuritedBy: text, recruitedBy: text })}
            placeholder="Enter the name of the person who recruited you"
          />
        </View>

        {/* Recruited By Membership No */}
        <Text style={styles.label}>Recruited By (Membership No)</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.recuritedByMembershipNo}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, recuritedByMembershipNo: text, recruitedByMembershipNo: text })}
            placeholder="Enter the membership number of the recruiter"
          />
        </View>

        {/* Primary Section */}
        <Text style={styles.label}>Primary Section</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.primarySection || ((primaryNames[0] || 'Other'))}
            onValueChange={val => onFormDataChange({ ...formData, primarySection: val, ...(val !== 'Other' ? { otherPrimarySection: '' } : {}) })}
          >
            {[...primaryNames, 'Other'].map(s => <Picker.Item key={s} label={s} value={s} />)}
          </Picker>
        </View>

        {/* Other Primary Section */}
        <Text style={styles.label}>Other Primary Section {formData.primarySection === 'Other' && '*'}</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.otherPrimarySection}
            editable={formData.primarySection === 'Other'}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, otherPrimarySection: text })}
            placeholder="Enter your other primary section"
          />
        </View>

        {/* Secondary Section */}
        <Text style={styles.label}>Secondary Section</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.secondarySection || ((secondaryNames[0] || 'Other'))}
            onValueChange={val => onFormDataChange({ ...formData, secondarySection: val, ...(val !== 'Other' ? { otherSecondarySection: '' } : {}) })}
          >
            {[...secondaryNames, 'Other'].map(s => <Picker.Item key={s} label={s} value={s} />)}
          </Picker>
        </View>

        {/* Other Secondary Section */}
        <Text style={styles.label}>Other Secondary Section {formData.secondarySection === 'Other' && '*'}</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.otherSecondarySection}
            editable={formData.secondarySection === 'Other'}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, otherSecondarySection: text })}
            placeholder="Enter your other secondary section"
          />
        </View>
      </View>

      {/* Agreements & Consents Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Agreements & Consents</Text>
        
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[
              styles.checkboxItem,
              (formData?.memberStatus !== 'new' && formData?.memberStatus !== 'graduate') && { opacity: 0.5 }
            ]}
            onPress={() => {
              // Only allow toggle if memberStatus is 'new' or 'graduate'
              if (formData?.memberStatus === 'new' || formData?.memberStatus === 'graduate') {
                onFormDataChange({ ...formData, incomeProtectionScheme: !formData?.incomeProtectionScheme });
              }
            }}
            disabled={formData?.memberStatus !== 'new' && formData?.memberStatus !== 'graduate'}
          >
            <View style={[styles.checkboxBox, formData?.incomeProtectionScheme && styles.checkboxBoxChecked]}>
              {formData?.incomeProtectionScheme ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>
              Tick here to join INMO Income Protection Scheme
              {(formData?.memberStatus === 'new' || formData?.memberStatus === 'graduate') && 
                showValidation && !formData?.incomeProtectionScheme && 
                <Text style={{ color: 'red' }}> (Required)</Text>
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.checkboxItem,
              (formData?.memberStatus !== 'new' && formData?.memberStatus !== 'graduate') && { opacity: 0.5 }
            ]}
            onPress={() => {
              // Only allow toggle if memberStatus is 'new' or 'graduate'
              if (formData?.memberStatus === 'new' || formData?.memberStatus === 'graduate') {
                onFormDataChange({ ...formData, inmoRewards: !formData?.inmoRewards });
              }
            }}
            disabled={formData?.memberStatus !== 'new' && formData?.memberStatus !== 'graduate'}
          >
            <View style={[styles.checkboxBox, formData?.inmoRewards && styles.checkboxBoxChecked]}>
              {formData?.inmoRewards ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>
              Tick here to join Rewards for INMO members
              {(formData?.memberStatus === 'new' || formData?.memberStatus === 'graduate') && 
                showValidation && !formData?.inmoRewards && 
                <Text style={{ color: 'red' }}> (Required)</Text>
              }
            </Text>
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
            <Text style={[styles.checkboxLabel, { flex: 1 }]}>
              I have read and agree to the INMO <Text style={styles.link} onPress={() => Linking.openURL('https://www.inmo.ie/DataProtection')}>Data Protection Statement</Text>, the INMO <Text style={styles.link} onPress={() => Linking.openURL('https://www.inmo.ie/PrivacyStatement')}>Privacy Statement</Text> and the INMO <Text style={styles.link} onPress={() => Linking.openURL('https://www.inmo.ie/ConditionsOfMembership')}>Conditions of Membership</Text>
              {showValidation && !formData?.termsAndConditions && <Text style={{ color: 'red' }}> (Required)</Text>}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    // marginHorizontal: 20,
    marginTop: 16,
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
  sectionHeader: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
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
    fontWeight: '500', 
    fontSize: 14,
    marginTop: 16, 
    marginBottom: 8,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  halfInput: { 
    width: '100%',
    marginBottom: 4
  },
  inputField: { marginBottom: 4 },
  pickerField: { marginBottom: 4 },
  radioRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8,
    gap: 12,
  },
  radioGroup: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 8,
    gap: 12,
  },
  radioButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderWidth: 1.5, 
    borderColor: '#E5E5E5', 
    backgroundColor: Colors.white,
    borderRadius: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  radioSelected: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary 
  },
  radioLabel: { 
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  radioLabelSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  checkboxRow: { 
    flexDirection: 'column', 
    marginTop: 16
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
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '400',
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 12,
  },
  link: { 
    color: Colors.primary, 
    textDecorationLine: 'underline' 
  },
});

export default SubscriptionDetails; 