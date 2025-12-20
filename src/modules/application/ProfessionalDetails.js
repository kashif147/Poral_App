import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import CustomSwitch from '../../common/switch';
import { Colors, wp } from '../../utils/Styles';
import { useLookup } from '../../contexts/lookupContext';
import { DatePicker } from '../../common/DatePicker';

const nurseTypes = [
  'General Nurse',
  'Public Health Nurse',
  'Mental health nurse',
  'Midwife',
  "Sick Children's Nurse",
  'Registered Nurse for Intellectual Disability',
];

// studyLocations will be populated from lookup context

const ProfessionalDetails = ({
  formData,
  onFormDataChange,
  showValidation,
}) => {
  // Get lookups from context (matching web version - context handles all fetching centrally)
  const {
    workLocationLookups,
    categoryLookups,
    gradeLookups,
    studyLocationLookups,
  } = useLookup() || {};

  const safeWorkLocationLookups = Array.isArray(workLocationLookups)
    ? workLocationLookups
    : [];
  const safeCategoryLookups = Array.isArray(categoryLookups)
    ? categoryLookups
    : [];
  const safeGradeLookups = Array.isArray(gradeLookups)
    ? gradeLookups
    : [];
  const safeStudyLocationLookups = Array.isArray(studyLocationLookups)
    ? studyLocationLookups
    : [];
  // Map study location lookups to picker options (matching web version)
  const studyLocationOptions = useMemo(() => {
    console.log('Study location lookups:', safeStudyLocationLookups?.length);
    const mapped = (safeStudyLocationLookups || [])
      .map(item => {
        const name = item?.DisplayName || item?.lookupname || item?.name || item?.label || '';
        return { value: name, label: name };
      })
      .filter(option => option.value); // Filter out empty values
    return mapped;
  }, [safeStudyLocationLookups]);

  // Map category lookups to picker options (matching web version)
  const membershipCategoryOptions = useMemo(() => {
    if (safeCategoryLookups.length === 0) {
      // Return empty array - let it load from API
      console.log('No category lookups available yet, waiting for API...');
      return [];
    }
    console.log('Category lookups available:', safeCategoryLookups.length);
    // Use _id as the value to store (matching web version)
    const mapped = safeCategoryLookups.map(item => {
      const id = item?._id || item?.id;
      const label =
        item?.name ||
        item?.DisplayName ||
        item?.label ||
        item?.productType?.name ||
        item?.code;
      return {
        value: String(id || ''),
        label: String(label || ''),
        rawItem: item, // Keep reference to original item
      };
    });
    console.log('Mapped categories:', mapped);
    return mapped;
  }, [safeCategoryLookups]);

  const workLocationNames = useMemo(() => {
    console.log('Work location lookups:', safeWorkLocationLookups?.length);
    if (safeWorkLocationLookups.length === 0) {
      console.log('No work locations available, returning default');
      return ['other'];
    }

    // Try multiple possible data structures
    const names = safeWorkLocationLookups
      .map(i => {
        // Try different possible structures
        return (
          i?.lookup?.DisplayName ||
          i?.lookup?.lookupname ||
          i?.DisplayName ||
          i?.lookupname ||
          i?.name ||
          i?.label
        );
      })
      .filter(Boolean);

    console.log('Extracted work location names:', names);
    return [...names, 'other'];
  }, [safeWorkLocationLookups]);

  // Map grade lookups to picker options (matching web version)
  const gradeOptions = useMemo(() => {
    console.log('Grade lookups:', safeGradeLookups?.length);
    const mapped = (safeGradeLookups || [])
      .map(item => {
        const name = item?.DisplayName || item?.lookupname || item?.name || item?.label || '';
        return { value: name, label: name };
      })
      .filter(option => option.value); // Filter out empty values

    // Add "Other" option at the end (matching web version)
    return [...mapped, { value: 'other', label: 'Other' }];
  }, [safeGradeLookups]);

  const handleWorkLocationChange = val => {
    console.log('Work location changed to:', val);
    const selected = safeWorkLocationLookups.find(i => {
      const itemName =
        i?.lookup?.DisplayName ||
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
      branch: selected
        ? selected?.branch?.DisplayName ||
          selected?.branch?.lookupname ||
          selected?.branch?.name ||
          ''
        : '',
      region: selected
        ? selected?.region?.DisplayName ||
          selected?.region?.lookupname ||
          selected?.region?.name ||
          ''
        : '',
      ...(val !== 'other' ? { otherWorkLocation: '' } : {}),
    });
  };

  const adaptationYes = formData?.nursingAdaptationProgramme === 'yes';

  // Helper function to check category type based on _id (matching web version)
  const isCategoryType = categoryType => {
    if (!formData?.membershipCategory) return false;

    // Find the selected category by _id
    const selectedCategory = safeCategoryLookups.find(
      item =>
        String(item?._id || item?.id) === String(formData.membershipCategory),
    );

    if (!selectedCategory) return false;

    const selectedCode = String(selectedCategory?.code || '').toUpperCase();

    // Map category types to their actual codes
    const categoryCodeMap = {
      undergraduate_student: 'MEM-UG',
      retired_associate: 'MEM-RET',
      postgraduate_student: 'MEM-PG',
      general: 'MEM-GEN',
      private_nursing_home: 'MEM-PNH',
      short_term_relief: 'MEM-STR',
      associate: 'MEM-ASS',
      affiliate: 'MEM-AFF',
      lecturing: 'MEM-LEC',
    };

    const targetCode = categoryCodeMap[categoryType];
    return targetCode ? selectedCode === targetCode : false;
  };

  // Use isCategoryType helper for category detection
  const isRetired = isCategoryType('retired_associate');
  const isUndergraduateStudent = isCategoryType('undergraduate_student');

  return (
    <View style={{ backgroundColor: Colors.background, paddingBottom: 20 }}>
      {/* Membership Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Membership Information</Text>

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
            {membershipCategoryOptions.length === 0 ? (
              <Picker.Item label="Loading categories..." value="" disabled />
            ) : (
              membershipCategoryOptions.map(c => (
                <Picker.Item key={c.value} label={c.label} value={c.value} />
              ))
            )}
          </Picker>
        </View>

        {/* Conditional fields for Undergraduate Students */}
        {isUndergraduateStudent && (
          <>
            <Text style={styles.label}>Discipline</Text>
            <View style={styles.pickerField}>
              <Picker
                selectedValue={formData.discipline || ''}
                onValueChange={val => {
                  if (val) {
                    onFormDataChange({ ...formData, discipline: val });
                  }
                }}
              >
                <Picker.Item label="Select your discipline" value="" />
                <Picker.Item label="Nursing" value="nursing" />
                <Picker.Item label="Midwifery" value="midwifery" />
                <Picker.Item label="Public Health" value="publicHealth" />
                <Picker.Item label="Mental Health" value="mentalHealth" />
                <Picker.Item label="Pediatric Nursing" value="pediatric" />
                <Picker.Item label="Adult Nursing" value="adult" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>

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
                {studyLocationOptions.length > 0 ? (
                  studyLocationOptions.map(option => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))
                ) : (
                  <Picker.Item label="Loading locations..." value="" disabled />
                )}
              </Picker>
            </View>

            <Text style={styles.label}>Start Date</Text>
            <DatePicker
              value={formData.startDate}
              onChange={date =>
                onFormDataChange({ ...formData, startDate: date })
              }
            />

            <Text style={styles.label}>Graduation Date</Text>
            <DatePicker
              value={formData.graduationDate}
              onChange={date =>
                onFormDataChange({ ...formData, graduationDate: date })
              }
            />
          </>
        )}

        {/* Conditional fields for Retired Associate */}
        {isRetired && (
          <>
            <Text style={styles.label}>Retired Date</Text>
            <View style={styles.inputField}>
              <InputField
                value={formData.retiredDate}
                editable={true}
                holderTextColor={'#94A3B8'}
                onChange={text =>
                  onFormDataChange({ ...formData, retiredDate: text })
                }
                placeholder="DD/MM/YYYY"
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.label}>Pension No</Text>
            <View style={styles.inputField}>
              <InputField
                value={formData.pensionNo}
                editable={true}
                holderTextColor={'#94A3B8'}
                onChange={text =>
                  onFormDataChange({ ...formData, pensionNo: text })
                }
                placeholder="Enter your pension number"
              />
            </View>
          </>
        )}
      </View>

      {/* Employment Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Employment Details</Text>

        {/* Work Location */}
        <Text style={styles.label}>Work Location</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.workLocation || ''}
            onValueChange={handleWorkLocationChange}
          >
            <Picker.Item label="Select Location..." value="" />
            {workLocationNames.map(w => (
              <Picker.Item key={w} label={w} value={w} />
            ))}
          </Picker>
        </View>

        {/* Other Work Location */}
        <Text style={styles.label}>Other Work Location</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.otherWorkLocation}
            editable={formData.workLocation === 'other'}
            holderTextColor={'#94A3B8'}
            onChange={text =>
              onFormDataChange({ ...formData, otherWorkLocation: text })
            }
            placeholder="Enabled if 'Other' is selected"
          />
        </View>

        {/* Branch */}
        <Text style={styles.label}>Branch</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.branch || ''}
            onValueChange={val => {
              if (val) {
                onFormDataChange({ ...formData, branch: val });
              }
            }}
          >
            <Picker.Item label="Select Branch..." value="" />
            <Picker.Item label={formData.branch || 'Auto-filled'} value={formData.branch || ''} />
          </Picker>
        </View>

        {/* Region */}
        <Text style={styles.label}>Region</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.region || ''}
            onValueChange={val => {
              if (val) {
                onFormDataChange({ ...formData, region: val });
              }
            }}
          >
            <Picker.Item label="Select Region..." value="" />
            <Picker.Item label={formData.region || 'Auto-filled'} value={formData.region || ''} />
          </Picker>
        </View>

        {/* Grade */}
        <Text style={styles.label}>Grade</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.grade || ''}
            onValueChange={val => {
              if (val) {
                onFormDataChange({ ...formData, grade: val });
              }
            }}
          >
            <Picker.Item label="Select Grade..." value="" />
            {gradeOptions.map(option => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>

        {/* Other Grade */}
        <Text style={styles.label}>Other Grade</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.otherGrade}
            editable={formData.grade === 'other'}
            holderTextColor={'#94A3B8'}
            onChange={text =>
              onFormDataChange({ ...formData, otherGrade: text })
            }
            placeholder="Enabled if 'Other' is selected"
          />
        </View>
      </View>

      {/* Professional Credentials Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Professional Credentials</Text>

        {/* Nursing adaptation programme */}
        <Text style={styles.label}>
          Are you currently undertaking a nursing adaptation programme?
        </Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={[styles.radioButton, adaptationYes && styles.radioSelected]}
            onPress={() =>
              onFormDataChange({
                ...formData,
                nursingAdaptationProgramme: 'yes',
              })
            }
          >
            <Text
              style={[
                styles.radioLabel,
                adaptationYes && styles.radioLabelSelected,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, !adaptationYes && styles.radioSelected]}
            onPress={() =>
              onFormDataChange({
                ...formData,
                nursingAdaptationProgramme: 'no',
                nmbiNo: '', // Clear nmbiNo when "no" is selected (matching web version)
                nurseType: '', // Clear nurseType when "no" is selected (matching web version)
              })
            }
          >
            <Text
              style={[
                styles.radioLabel,
                !adaptationYes && styles.radioLabelSelected,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>

        {/* NMBI No */}
        <Text style={styles.label}>NMBI No / An Board Altranais Number</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.nmbiNo}
            editable={adaptationYes}
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
              style={[
                styles.radioButton,
                formData.nurseType === type && styles.radioSelected,
                !adaptationYes && { opacity: 0.5 },
              ]}
              onPress={() =>
                adaptationYes &&
                onFormDataChange({ ...formData, nurseType: type })
              }
            >
              <Text
                style={[
                  styles.radioLabel,
                  formData.nurseType === type && styles.radioLabelSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Retirement Status Card */}
      {/* <View style={styles.card}>
        <Text style={styles.cardTitle}>Retirement Status</Text> */}

        {/* Retired Switch */}
        {/* <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Retired</Text>
          <CustomSwitch
            value={!!formData.isRetired}
            onValueChange={val =>
              onFormDataChange({ ...formData, isRetired: val })
            }
          />
        </View> */}
      {/* </View> */}
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
    fontWeight: '600',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 12,
    color: Colors.textPrimary,
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
  switchLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    marginRight: 12,
    fontWeight: '400',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  halfInput: {
    width: '100%',
    marginBottom: 4,
  },
  inputField: { marginBottom: 4 },
  pickerField: { marginBottom: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
    borderColor: Colors.primary,
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
});

export default ProfessionalDetails;
