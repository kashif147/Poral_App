import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import CustomSwitch from '../../common/switch';
import { Colors, wp } from '../../utils/Styles';

const membershipCategories = [
  'Private nursing home',
  'Public hospital',
  'Community care',
  'Other',
];
const workLocations = [
  '24 Hour Care Services (North West)',
  'Hospital',
  'Clinic',
  'Other',
];
const regions = [
  'Sligo',
  'Dublin',
  'Mid West, West and North West',
  'Other',
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

  return (
    <View>
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
            selectedValue={formData.workLocation || workLocations[0]}
            onValueChange={val => onFormDataChange({ ...formData, workLocation: val })}
          >
            {workLocations.map(w => <Picker.Item key={w} label={w} value={w} />)}
          </Picker>
        </View>
        {/* </View> */}
        <View style={styles.halfInput}>
          <Text style={styles.label}>Other Work Location</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.otherWorkLocation}
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
            onChange={text => onFormDataChange({ ...formData, branch: text })}
            placeholder="Branch"
          />
        </View>
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Region</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.region || regions[0]}
            onValueChange={val => onFormDataChange({ ...formData, region: val })}
          >
            {regions.map(r => <Picker.Item key={r} label={r} value={r} />)}
          </Picker>
        </View>
      </View>
      {/* </View> */}
      {/* Nursing adaptation programme */}
      <Text style={styles.label}>Are you currently undertaking a nursing adaptation programme?</Text>
      <View style={styles.radioRow}>
        <TouchableOpacity
          style={[styles.radioButton, formData.nursingAdaptation === true && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, nursingAdaptation: true })}
        >
          <Text style={styles.radioLabel}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.radioButton, formData.nursingAdaptation === false && styles.radioSelected]}
          onPress={() => onFormDataChange({ ...formData, nursingAdaptation: false })}
        >
          <Text style={styles.radioLabel}>No</Text>
        </TouchableOpacity>
      </View>
      {/* NMBI No */}
      <Text style={styles.label}>NMBI No / An Board Altranais Number</Text>
      <View style={styles.inputField}>
        <InputField
          value={formData.nmbiNo}
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
            style={[styles.radioButton, formData.nurseType === type && styles.radioSelected]}
            onPress={() => onFormDataChange({ ...formData, nurseType: type })}
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
            onChange={text => onFormDataChange({ ...formData, retiredDate: text })}
            placeholder="DD/MM/YYYY"
            keyboardType="numeric"
          />
        </View>
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.label}>Retired</Text>
        <CustomSwitch
          value={formData.retired}
          onValueChange={val => onFormDataChange({ ...formData, retired: val })}
        />
      </View>
      <View style={styles.halfInput}>
        <Text style={styles.label}>Pension No</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.pensionNo}
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
});

export default ProfessionalDetails; 