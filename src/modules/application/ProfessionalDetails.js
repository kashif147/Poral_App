import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import CustomSwitch from '../../common/switch';
import { Colors, wp } from '../../utils/Styles';
import { useLookup } from '../../contexts/lookupContext';
import { DatePicker } from '../../common/DatePicker';

const grades = [
  'Junior',
  'Senior',
  'Lead',
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

const studyLocations = [
  'Location 1',
  'Location 2',
  'Location 3',
];

// Fallback categories in case API is slow or fails
const fallbackCategories = [
  { value: 'general', label: 'General (all grades)' },
  { value: 'postgraduate_student', label: 'Postgraduate Student' },
  { value: 'short_term_relief', label: 'Short-term/ Relief (under 15 hrs/wk average)' },
  { value: 'private_nursing_home', label: 'Private nursing home' },
  { value: 'affiliate_members', label: 'Affiliate members (non-practicing)' },
  { value: 'lecturing', label: 'Lecturing (employed in universities and IT institutes)' },
  { value: 'associate', label: 'Associate (not currently employed as a nurse/midwife)' },
  { value: 'retired_associate', label: 'Retired Associate' },
  { value: 'undergraduate_student', label: 'Undergraduate Student' },
];

const ProfessionalDetails = ({ formData, onFormDataChange, showValidation }) => {
  const lookupContext = useLookup();
  const { 
    workLocationLookups, 
    fetchWorkLocationLookups, 
    categoryLookups, 
    fetchCategoryLookups 
  } = lookupContext || {};

  // Ensure these are always arrays
  const safeWorkLocationLookups = Array.isArray(workLocationLookups) ? workLocationLookups : [];
  const safeCategoryLookups = Array.isArray(categoryLookups) ? categoryLookups : [];

  useEffect(() => {
    console.log('ProfessionalDetails mounted');
    console.log('Initial work locations:', safeWorkLocationLookups?.length);
    console.log('Initial categories:', safeCategoryLookups?.length);
    
    if (safeWorkLocationLookups.length === 0) {
      console.log('Fetching work locations...');
      fetchWorkLocationLookups?.();
    }
    if (safeCategoryLookups.length === 0) {
      console.log('Fetching categories...');
      fetchCategoryLookups?.();
    }
  }, []);

  // Log when data changes
  useEffect(() => {
    console.log('Work locations updated:', safeWorkLocationLookups?.length);
  }, [safeWorkLocationLookups]);

  useEffect(() => {
    console.log('Categories updated:', safeCategoryLookups?.length);
  }, [safeCategoryLookups]);

  // Map category lookups to picker options (matching web version)
  const membershipCategoryOptions = useMemo(() => {
    if (safeCategoryLookups.length === 0) {
      // Return fallback categories while loading or if API fails
      console.log('Using fallback categories');
      return fallbackCategories;
    }
    console.log('Category lookups available:', safeCategoryLookups.length);
    return safeCategoryLookups.map(item => {
      const value = item?.id || item?._id || item?.code || item?.value || item?.name || item?.productType?.name;
      const label = item?.name || item?.DisplayName || item?.label || item?.productType?.name || value;
      return { value: String(value || ''), label: String(label || '') };
    });
  }, [safeCategoryLookups]);

  const workLocationNames = useMemo(() => {
    console.log('Work location lookups:', safeWorkLocationLookups?.length);
    if (safeWorkLocationLookups.length === 0) {
      console.log('No work locations available, returning default');
      return ['Other'];
    }
    
    // Try multiple possible data structures
    const names = safeWorkLocationLookups
      .map(i => {
        // Try different possible structures
        return i?.lookup?.DisplayName || 
               i?.lookup?.lookupname || 
               i?.DisplayName || 
               i?.lookupname || 
               i?.name ||
               i?.label;
      })
      .filter(Boolean);
    
    console.log('Extracted work location names:', names);
    return [...names, 'Other'];
  }, [safeWorkLocationLookups]);

  const handleWorkLocationChange = (val) => {
    console.log('Work location changed to:', val);
    const selected = safeWorkLocationLookups.find(i => {
      const itemName = i?.lookup?.DisplayName || 
                      i?.lookup?.lookupname || 
                      i?.DisplayName || 
                      i?.lookupname || 
                      i?.name ||
                      i?.label;
      return itemName === val;
    });
    
    console.log('Selected work location item:', selected);
    
    onFormDataChange({
      ...formData,
      workLocation: val,
      branch: selected ? (selected?.branch?.DisplayName || selected?.branch?.lookupname || selected?.branch?.name || '') : '',
      region: selected ? (selected?.region?.DisplayName || selected?.region?.lookupname || selected?.region?.name || '') : '',
      ...(val !== 'Other' ? { otherWorkLocation: '' } : {}),
    });
  };

  const adaptationYes = formData?.nursingAdaptationProgramme === 'yes';
  const isRetired = !!formData?.isRetired || formData?.membershipCategory === 'Retired Associate';
  const isUndergraduateStudent = formData?.membershipCategory === 'undergraduate_student';

  return (
    <View style={{ backgroundColor: Colors.surface }}>
      <Text style={styles.sectionTitle}>Professional Details</Text>
      {/* Membership Category */}
      <Text style={styles.label}>Membership Category *</Text>
      <View style={styles.pickerField}>
        <Picker
          selectedValue={formData.membershipCategory || ''}
          onValueChange={val => {
            if (val) {
              onFormDataChange({ ...formData, membershipCategory: val });
            }
          }}
        >
          <Picker.Item label="Select membership category" value="" />
          {membershipCategoryOptions.map(c => (
            <Picker.Item key={c.value} label={c.label} value={c.value} />
          ))}
        </Picker>
      </View>

      {/* Conditional fields for Undergraduate Students */}
      {isUndergraduateStudent && (
        <>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Study Location</Text>
            <View style={styles.pickerField}>
              <Picker
                selectedValue={formData.studyLocation || ''}
                onValueChange={val => {
                  if (val) {
                    onFormDataChange({ ...formData, studyLocation: val });
                  }
                }}
              >
                <Picker.Item label="Select study location" value="" />
                {studyLocations.map(loc => <Picker.Item key={loc} label={loc} value={loc} />)}
              </Picker>
            </View>
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.label}>Graduation Date</Text>
            <DatePicker
              value={formData.graduationDate}
              onChange={date => onFormDataChange({ ...formData, graduationDate: date })}
            />
          </View>
        </>
      )}
      {/* Work Location & Other Work Location */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Work Location {!isUndergraduateStudent && '*'}</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.workLocation || ''}
            onValueChange={handleWorkLocationChange}
          >
            <Picker.Item label="Select work location" value="" />
            {workLocationNames.map(w => <Picker.Item key={w} label={w} value={w} />)}
          </Picker>
        </View>
      </View>

      <View style={styles.halfInput}>
        <Text style={styles.label}>Other Work Location</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.otherWorkLocation}
            editable={formData.workLocation === 'Other'}
            holderTextColor={'#94A3B8'}
            onChange={text => onFormDataChange({ ...formData, otherWorkLocation: text })}
            placeholder="Enter your work other location"
          />
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
            selectedValue={formData.grade || ''}
            onValueChange={val => {
              if (val) {
                onFormDataChange({ ...formData, grade: val });
              }
            }}
          >
            <Picker.Item label="Select grade" value="" />
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