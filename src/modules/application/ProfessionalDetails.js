import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import CustomSwitch from '../../common/switch';
import { Colors, wp } from '../../utils/Styles';
import { useLookup } from '../../contexts/lookupContext';

const membershipCategories = [
  'General (all grades)',
  'Postgraduate Student',
  'Short-term/ Relief (under 15 hrs/wk average)',
  'Private nursing home',
  'Affiliate members (non-practicing)',
  'Lecturing (employed in universities and IT institutes)',
  'Associate (not currently employed as a nurse/midwife)',
  'Retired Associate',
  'Undergraduate Student',
];

const grades = [
  'Junior',
  'Senior',
  'Manager',
  'Other',
];
const nurseTypes = [
  'General Nurse',
  'Public Health Nurse',
  'Mental health nurse',
  'Midwife',
  "Sick Children's Nurse",
  'Registered Nurse for Intellectual Disability',
];

const ProfessionalDetails = ({ formData, onFormDataChange, showValidation }) => {
  const { workLocationLookups, fetchWorkLocationLookups } = useLookup();

  useEffect(() => {
    if (!workLocationLookups || workLocationLookups.length === 0) {
      fetchWorkLocationLookups?.();
    }
  }, [workLocationLookups, fetchWorkLocationLookups]);

  const workLocationNames = useMemo(() => {
    const names = (workLocationLookups || [])
      .map(i => i?.lookup?.DisplayName || i?.lookup?.lookupname)
      .filter(Boolean);
    return [...names, 'Other'];
  }, [workLocationLookups]);

  const handleWorkLocationChange = (val) => {
    const selected = (workLocationLookups || []).find(
      i => (i?.lookup?.DisplayName || i?.lookup?.lookupname) === val,
    );
    onFormDataChange({
      ...formData,
      workLocation: val,
      branch: selected ? (selected?.branch?.DisplayName || selected?.branch?.lookupname || '') : '',
      region: selected ? (selected?.region?.DisplayName || selected?.region?.lookupname || '') : '',
      ...(val !== 'Other' ? { otherWorkLocation: '' } : {}),
    });
  };

  const adaptationYes = formData?.nursingAdaptationProgramme === 'yes';
  const isRetired = !!formData?.isRetired || formData?.membershipCategory === 'Retired Associate';

  return (
    <View style={{ backgroundColor: Colors.surface }}>
      <Text style={styles.sectionTitle}>Professional Details</Text>
      {/* Membership Category */}
      <Text style={styles.label}>Membership Category *</Text>
      <View style={styles.pickerField}>
        <Picker
          selectedValue={formData.membershipCategory || membershipCategories[0]}
          onValueChange={val => onFormDataChange({ ...formData, membershipCategory: val })}
        >
          {membershipCategories.map(c => <Picker.Item key={c} label={c} value={c} />)}
        </Picker>
      </View>
      {/* Work Location & Other Work Location */}
      {/* <View style={styles.row}> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Work Location *</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.workLocation || (workLocationNames[0] || 'Other')}
            onValueChange={handleWorkLocationChange}
          >
            {workLocationNames.map(w => <Picker.Item key={w} label={w} value={w} />)}
          </Picker>
        </View>
        {/* </View> */}
        <View style={styles.halfInput}>
          <Text style={styles.label}>Other Work Location</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.otherWorkLocation}
              editable={formData.workLocation !== 'Other'}
              holderTextColor={'#94A3B8'}
              onChange={text => onFormDataChange({ ...formData, otherWorkLocation: text })}
              placeholder="Enter your work other location"
            />
          </View>
        </View>
      </View>
      {/* Branch & Region */}
      {/* <View style={styles.row}> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Branch</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.branch}
            editable={true}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, branch: text })}
            placeholder="Branch (auto-filled)"
          />
        </View>
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Region</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.region}
            editable={true}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, region: text })}
            placeholder="Region (auto-filled)"
          />
        </View>
      </View>
      {/* </View> */}
      {/* Nursing adaptation programme */}
      <Text style={styles.label}>Are you currently undertaking a nursing adaptation programme?</Text>
      <View style={styles.radioRow}>
        <TouchableOpacity
          style={[styles.radioButton, adaptationYes && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, nursingAdaptationProgramme: 'yes' })}
        >
          <Text style={styles.radioLabel}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.radioButton, !adaptationYes && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, nursingAdaptationProgramme: 'no' })}
        >
          <Text style={styles.radioLabel}>No</Text>
        </TouchableOpacity>
      </View>
      {/* NMBI No */}
      <Text style={styles.label}>NMBI No / An Board Altranais Number</Text>
      <View style={styles.inputField}>
        <InputField
          value={formData.nmbiNo}
          editable={!adaptationYes}
          holderTextColor={'#94A3B8'}
          onChange={text => onFormDataChange({ ...formData, nmbiNo: text })}
          placeholder="12344"
        />
      </View>
      {/* Nurse Type radio group */}
      <Text style={styles.label}>Please tick one of the following</Text>
      <View style={styles.radioGroup}>
        {nurseTypes.map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.radioButton, formData.nurseType === type && styles.radioSelected, !adaptationYes && { opacity: 0.5 }]}
            onPress={() => adaptationYes && onFormDataChange({ ...formData, nurseType: type })}
          >
            <Text style={styles.radioLabel}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Grade & Other Grade */}
      {/* <View style={styles.row}> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Grade *</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.grade || grades[0]}
            onValueChange={val => onFormDataChange({ ...formData, grade: val })}
          >
            {grades.map(g => <Picker.Item key={g} label={g} value={g} />)}
          </Picker>
        </View>
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Other Grade</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.otherGrade}
            editable={formData.grade !== 'Other'}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, otherGrade: text })}
            placeholder="Enter your other grade"
          />
        </View>
      </View>
      {/* </View> */}
      {/* Retired Date, Retired, Pension No */}
      {/* <View style={styles.row}> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Retired Date</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.retiredDate}
            editable={!(isRetired || formData.membershipCategory === 'Retired Associate')}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, retiredDate: text })}
            placeholder="DD/MM/YYYY"
            keyboardType="numeric"
          />
        </View>
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.label}>Retired</Text>
        <CustomSwitch
          value={!!formData.isRetired}
          onValueChange={val => onFormDataChange({ ...formData, isRetired: val })}
        />
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Pension No</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.pensionNo}
            editable={!(isRetired || formData.membershipCategory === 'Retired Associate')}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, pensionNo: text })}
            placeholder="Enter your pension number"
          />
        </View>
      </View>
    </View>
    // </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginTop: 8, 
    marginBottom: 8,
    color: '#E5F9F4' 
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
  radioRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 6 
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
});

export default ProfessionalDetails; 