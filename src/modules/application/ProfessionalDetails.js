import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import SearchablePicker from '../../common/SearchablePicker';
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

// Map API nurseType values to component display values
const mapNurseTypeFromAPI = apiValue => {
  if (!apiValue) return '';

  const mapping = {
    generalNursing: 'General Nurse',
    publicHealthNurse: 'Public Health Nurse',
    mentalHealthNurse: 'Mental health nurse',
    midwifery: 'Midwife',
    sickChildrenNurse: "Sick Children's Nurse",
    intellectualDisability: 'Registered Nurse for Intellectual Disability',
  };

  // If exact match found, return mapped value
  if (mapping[apiValue]) {
    return mapping[apiValue];
  }

  // If already in display format, return as is
  if (nurseTypes.includes(apiValue)) {
    return apiValue;
  }

  // Try case-insensitive match
  const lowerApiValue = apiValue.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toLowerCase() === lowerApiValue) {
      return value;
    }
  }

  return apiValue; // Return original if no match found
};

// Map component display values back to API format
const mapNurseTypeToAPI = displayValue => {
  if (!displayValue) return '';

  const reverseMapping = {
    'General Nurse': 'generalNursing',
    'Public Health Nurse': 'publicHealthNursing',
    'Mental health nurse': 'mentalHealthNursing',
    Midwife: 'midwifery',
    "Sick Children's Nurse": 'sickChildrenNursing',
    'Registered Nurse for Intellectual Disability':
      'intellectualDisabilityNursing',
  };

  // If exact match found, return API value
  if (reverseMapping[displayValue]) {
    return reverseMapping[displayValue];
  }

  // If already in API format, return as is
  const apiValues = Object.values(reverseMapping);
  if (apiValues.includes(displayValue)) {
    return displayValue;
  }

  return displayValue; // Return original if no match found
};

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
  const safeGradeLookups = Array.isArray(gradeLookups) ? gradeLookups : [];
  const safeStudyLocationLookups = Array.isArray(studyLocationLookups)
    ? studyLocationLookups
    : [];
  // Map study location lookups to picker options (matching web version)
  const studyLocationOptions = useMemo(() => {
    console.log('Study location lookups:', safeStudyLocationLookups?.length);
    const mapped = (safeStudyLocationLookups || [])
      .map(item => {
        const name =
          item?.DisplayName ||
          item?.lookupname ||
          item?.name ||
          item?.label ||
          '';
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
    // Use name as the value to store (matching web version)
    const mapped = safeCategoryLookups.map(item => {
      const label =
        item?.name ||
        item?.DisplayName ||
        item?.label ||
        item?.productType?.name ||
        item?.code;
      return {
        value: String(label || ''),
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
        const name =
          item?.DisplayName ||
          item?.lookupname ||
          item?.name ||
          item?.label ||
          '';
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

  // Only consider "yes" as selected, everything else (including undefined/null/'no') is not selected
  const adaptationYes = formData?.nursingAdaptationProgramme === 'yes';
  const adaptationNo = formData?.nursingAdaptationProgramme === 'no';

  // Helper function to check category type based on name (matching web version)
  const isCategoryType = categoryType => {
    if (!formData?.membershipCategory) return false;

    // Find the selected category by name
    const selectedCategory = safeCategoryLookups.find(item => {
      const itemName =
        item?.name ||
        item?.DisplayName ||
        item?.label ||
        item?.productType?.name ||
        item?.code;
      return String(itemName || '') === String(formData.membershipCategory);
    });

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

  // Normalize API data when it loads (handle field name differences and type conversions)
  useEffect(() => {
    if (!formData) return;

    const updates = {};
    let hasUpdates = false;

    // Map nmbiNumber from API to nmbiNo in component (handle both field names)
    if (
      formData.nmbiNumber !== undefined &&
      formData.nmbiNumber !== formData.nmbiNo
    ) {
      updates.nmbiNo = formData.nmbiNumber || '';
      hasUpdates = true;
    }

    // Convert boolean nursingAdaptationProgramme to "yes"/"no" string
    // Only normalize if there's an actual value (don't set default to 'no')
    // Also handle nursingAdaptation boolean field for backward compatibility
    const currentAdaptationValue =
      formData.nursingAdaptationProgramme !== undefined
        ? formData.nursingAdaptationProgramme
        : formData.nursingAdaptation !== undefined
        ? formData.nursingAdaptation
        : undefined;

    if (
      currentAdaptationValue !== undefined &&
      currentAdaptationValue !== null &&
      currentAdaptationValue !== ''
    ) {
      let normalizedValue;

      if (typeof currentAdaptationValue === 'boolean') {
        normalizedValue = currentAdaptationValue ? 'yes' : 'no';
      } else if (typeof currentAdaptationValue === 'string') {
        const lowerValue = currentAdaptationValue.toLowerCase();
        if (lowerValue === 'yes' || lowerValue === 'true') {
          normalizedValue = 'yes';
        } else if (lowerValue === 'no' || lowerValue === 'false') {
          normalizedValue = 'no';
        } else {
          // If it's already a valid string value, keep it
          normalizedValue = currentAdaptationValue;
        }
      } else {
        // Don't set default, leave undefined
        normalizedValue = undefined;
      }

      // Only update if we have a valid normalized value and it's different
      if (
        normalizedValue !== undefined &&
        normalizedValue !== formData.nursingAdaptationProgramme
      ) {
        updates.nursingAdaptationProgramme = normalizedValue;
        hasUpdates = true;
      }
    }

    // Map nurseType from API format to component format
    if (formData.nurseType !== undefined && formData.nurseType) {
      const mappedNurseType = mapNurseTypeFromAPI(formData.nurseType);
      if (mappedNurseType !== formData.nurseType && mappedNurseType) {
        updates.nurseType = mappedNurseType;
        hasUpdates = true;
      }
    }

    // Apply updates if any
    if (hasUpdates) {
      onFormDataChange({
        ...formData,
        ...updates,
      });
    }
  }, [
    formData?.nmbiNumber,
    formData?.nursingAdaptationProgramme,
    formData?.nursingAdaptation,
    formData?.nurseType,
  ]);

  // Clear nmbiNo and nurseType when nursingAdaptationProgramme is set to 'no' (matching web version)
  useEffect(() => {
    if (formData?.nursingAdaptationProgramme === 'no') {
      const updates = {};
      let hasUpdates = false;

      // Clear nmbiNo if it has a value
      if (formData.nmbiNo) {
        updates.nmbiNo = '';
        hasUpdates = true;
      }

      // Clear nmbiNumber if it has a value (for consistency)
      if (formData.nmbiNumber) {
        updates.nmbiNumber = '';
        hasUpdates = true;
      }

      // Clear nurseType if it has a value
      if (formData.nurseType) {
        updates.nurseType = '';
        hasUpdates = true;
      }

      // Apply updates if any
      if (hasUpdates) {
        onFormDataChange({
          ...formData,
          ...updates,
        });
      }
    }
  }, [formData?.nursingAdaptationProgramme]);

  return (
    <View
      style={{
        backgroundColor: Colors.background,
        paddingBottom: 16,
        paddingTop: 4,
      }}
    >
      {/* Membership Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Membership Information</Text>

        {/* Membership Category */}
        <Text style={styles.label}>Membership Category *</Text>
        <View
          style={[
            styles.pickerField,
            showValidation &&
              !formData.membershipCategory && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 12,
              },
          ]}
        >
          <Picker
            selectedValue={formData.membershipCategory || ''}
            
            onValueChange={val => {
              onFormDataChange({ ...formData, membershipCategory: val });
            }}
          >
            <Picker.Item label="Select membership category" value="" />
            {membershipCategoryOptions.length === 0 ? (
              <Picker.Item label="Loading categories..." value="" disabled />
            ) : (
              membershipCategoryOptions.map(item => (
                <Picker.Item
                  key={item.value}
                  label={item.label}
                  value={item.value}
                />
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
              <SearchablePicker
                items={studyLocationOptions}
                selectedValue={formData.studyLocation || ''}
                onValueChange={val => {
                  if (val) {
                    onFormDataChange({ ...formData, studyLocation: val });
                  }
                }}
                placeholder={
                  studyLocationOptions.length === 0
                    ? 'Loading locations...'
                    : 'Select study location'
                }
                enabled={studyLocationOptions.length > 0}
              />
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
        <View
          style={[
            styles.pickerField,
            showValidation &&
              !isUndergraduateStudent &&
              !formData.workLocation && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 12,
              },
          ]}
        >
          <SearchablePicker
            items={workLocationNames.map(w => ({ label: w, value: w }))}
            selectedValue={formData.workLocation || ''}
            onValueChange={handleWorkLocationChange}
            placeholder="Select Location..."
          />
        </View>

        {/* Other Work Location - only show when Work Location is "other" */}
        {formData.workLocation === 'other' && (
          <>
            <Text style={styles.label}>Other Work Location</Text>
            <View style={styles.inputField}>
              <InputField
                value={formData.otherWorkLocation}
                editable={true}
                holderTextColor={'#94A3B8'}
                onChange={text =>
                  onFormDataChange({ ...formData, otherWorkLocation: text })
                }
                placeholder="Specify work location"
              />
            </View>
          </>
        )}

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
            <Picker.Item
              label={formData.branch || 'Auto-filled'}
              value={formData.branch || ''}
            />
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
            <Picker.Item
              label={formData.region || 'Auto-filled'}
              value={formData.region || ''}
            />
          </Picker>
        </View>

        {/* Grade */}
        <Text style={styles.label}>Grade</Text>
        <View
          style={[
            styles.pickerField,
            showValidation &&
              !formData.grade && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 12,
              },
          ]}
        >
          <SearchablePicker
            items={gradeOptions}
            selectedValue={formData.grade || ''}
            onValueChange={val => {
              if (val) {
                onFormDataChange({ ...formData, grade: val });
              }
            }}
            placeholder="Select Grade..."
          />
        </View>

        {/* Other Grade - only show when Grade is "other" */}
        {formData.grade === 'other' && (
          <>
            <Text style={styles.label}>Other Grade</Text>
            <View style={styles.inputField}>
              <InputField
                value={formData.otherGrade}
                editable={true}
                holderTextColor={'#94A3B8'}
                onChange={text =>
                  onFormDataChange({ ...formData, otherGrade: text })
                }
                placeholder="Specify grade"
              />
            </View>
          </>
        )}
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
            style={styles.radioOption}
            onPress={() => {
              const updatedData = {
                ...formData,
                nursingAdaptationProgramme: 'yes',
              };
              onFormDataChange(updatedData);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radioCircle,
                adaptationYes && styles.radioCircleSelected,
              ]}
            >
              {adaptationYes && <View style={styles.radioInnerCircle} />}
            </View>
            <Text style={styles.radioOptionLabel}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => {
              const updatedData = {
                ...formData,
                nursingAdaptationProgramme: 'no',
              };
              // Clear nmbiNo and nurseType when "no" is selected (matching web version)
              if (updatedData.nursingAdaptationProgramme === 'no') {
                updatedData.nmbiNo = '';
                updatedData.nmbiNumber = ''; // Also clear nmbiNumber for consistency
                updatedData.nurseType = '';
              }
              onFormDataChange(updatedData);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radioCircle,
                adaptationNo && styles.radioCircleSelected,
              ]}
            >
              {adaptationNo && <View style={styles.radioInnerCircle} />}
            </View>
            <Text style={styles.radioOptionLabel}>No</Text>
          </TouchableOpacity>
        </View>

        {/* NMBI No */}
        <Text style={styles.label}>NMBI No / An Board Altranais Number</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.nmbiNo || ''}
            editable={adaptationYes}
            checkValue={showValidation && adaptationYes && !formData.nmbiNo}
            holderTextColor={'#94A3B8'}
            onChange={text => {
              // Update both nmbiNo and nmbiNumber for consistency
              onFormDataChange({
                ...formData,
                nmbiNo: text,
                nmbiNumber: text, // Keep nmbiNumber in sync for API
              });
            }}
            placeholder="12344"
          />
        </View>

        {/* Nurse Type radio group */}
        <Text style={styles.label}>Please tick one of the following</Text>
        <View
          style={[
            showValidation &&
              adaptationYes &&
              !formData.nurseType && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
              },
          ]}
        >
          <View style={styles.radioGroup}>
          {nurseTypes.map(type => {
            const isSelected = formData.nurseType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.radioOption,
                  !adaptationYes && styles.radioOptionDisabled,
                ]}
                disabled={!adaptationYes}
                onPress={() =>
                  adaptationYes &&
                  onFormDataChange({ ...formData, nurseType: type })
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                    !adaptationYes && styles.radioCircleDisabled,
                  ]}
                >
                  {isSelected && <View style={styles.radioInnerCircle} />}
                </View>
                <Text
                  style={[
                    styles.radioOptionLabel,
                    !adaptationYes && styles.radioOptionLabelDisabled,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
          </View>
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
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 16,
    letterSpacing: 0.2,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeader: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 26,
    marginBottom: 4,
    letterSpacing: 0.2,
    lineHeight: 32,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
    fontWeight: '400',
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 12,
    color: Colors.textPrimary,
    letterSpacing: 0.15,
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 6,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    marginRight: 16,
    fontWeight: '400',
    lineHeight: 22,
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
  inputField: {
    marginBottom: 8,
  },
  pickerField: {
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 24,
    marginTop: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
    marginTop: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginRight: 12,
    paddingVertical: 4,
  },
  radioOptionDisabled: {
    opacity: 0.5,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  radioCircleDisabled: {
    borderColor: '#D0D0D0',
    opacity: 0.6,
  },
  radioInnerCircle: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: Colors.primary,
  },
  radioOptionLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '400',
    flexShrink: 1,
    lineHeight: 20,
  },
  radioOptionLabelDisabled: {
    color: Colors.textSecondary,
    opacity: 0.6,
  },
});

export default ProfessionalDetails;
