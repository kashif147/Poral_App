import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import SearchablePicker from '../../common/SearchablePicker';
import CustomSwitch from '../../common/switch';
import { Colors, wp } from '../../utils/Styles';
import { useLookup } from '../../contexts/lookupContext';
import { DatePicker } from '../../common/DatePicker';
import { findWorkLocationLookupItem } from '../../helpers/subscriptionPricing.helper';
import { resolveBranchRegionFromStudyLocation } from '../../helpers/lookupHierarchy.helper';
import {
  CATEGORY_DISPLAY_NAME_BY_TYPE,
  isUndergraduateStudentCategory,
} from '../../helpers/applicationCategory.helper';

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

const REDUCED_RATE_CATEGORY_TYPES = [
  'affiliate',
  'associate',
  'short_term_relief',
];

const isReducedRateMembershipCategory = categoryLabel => {
  if (!categoryLabel) return false;

  const label = String(categoryLabel).toLowerCase();

  if (
    REDUCED_RATE_CATEGORY_TYPES.some(
      type => CATEGORY_DISPLAY_NAME_BY_TYPE[type] === categoryLabel,
    )
  ) {
    return true;
  }

  if (
    (label.includes('short-term') || label.includes('short term')) &&
    label.includes('relief')
  ) {
    return true;
  }

  if (label.includes('affiliate') && label.includes('non-practicing')) {
    return true;
  }

  if (
    label.includes('associate') &&
    label.includes('not currently employed')
  ) {
    return true;
  }

  return false;
};

const getCategoryLookupLabel = item =>
  String(
    item?.name ||
      item?.DisplayName ||
      item?.label ||
      item?.productType?.name ||
      item?.code ||
      '',
  );

const getBranchRegionFromLookupItem = item => ({
  branch:
    item?.branch?.DisplayName ||
    item?.branch?.lookupname ||
    item?.branch?.name ||
    '',
  region:
    item?.region?.DisplayName ||
    item?.region?.lookupname ||
    item?.region?.name ||
    '',
});

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
    disciplineLookups,
    lookups,
  } = useLookup() || {};

  const safeDisciplineLookups = Array.isArray(disciplineLookups)
    ? disciplineLookups
    : [];

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
  const rawLookups = useMemo(() => {
    if (lookups?.length) {
      return lookups;
    }
    return safeStudyLocationLookups;
  }, [lookups, safeStudyLocationLookups]);

  const studyLocationOptions = useMemo(() => {
    const mapped = (safeStudyLocationLookups || [])
      .map(item => {
        const name =
          item?.DisplayName ||
          item?.lookupname ||
          item?.name ||
          item?.label ||
          '';
        return {
          value: name,
          label: name,
          key: item?._id || item?.id,
        };
      })
      .filter(option => option.value);
    return mapped;
  }, [safeStudyLocationLookups]);

  const disciplineOptions = useMemo(
    () => [
      ...(safeDisciplineLookups || [])
        .map(item => {
          const name =
            item?.DisplayName || item?.lookupname || item?.name || '';
          return { value: name, label: name };
        })
        .filter(option => option.value),
      { value: 'other', label: 'Other' },
    ],
    [safeDisciplineLookups],
  );

  const getUndergraduateBranchRegion = draft => {
    if (draft.workLocation === 'other') {
      return { branch: '', region: '' };
    }

    if (draft.workLocation) {
      const selected = findWorkLocationLookupItem(
        draft.workLocation,
        safeWorkLocationLookups,
      );
      return getBranchRegionFromLookupItem(selected);
    }

    if (draft.studyLocation) {
      return resolveBranchRegionFromStudyLocation(
        draft.studyLocation,
        studyLocationOptions,
        rawLookups,
        safeWorkLocationLookups,
      );
    }

    return { branch: '', region: '' };
  };

  const applyUndergraduateBranchRegion = draft => {
    if (!isUndergraduateStudentCategory(draft.membershipCategory)) {
      return draft;
    }

    return {
      ...draft,
      ...getUndergraduateBranchRegion(draft),
    };
  };

  const applyMembershipCategory = categoryValue => {
    const nextFormData = applyUndergraduateBranchRegion({
      ...formData,
      membershipCategory: categoryValue,
    });
    onFormDataChange(nextFormData);
  };

  const handleMembershipCategoryChange = value => {
    if (!value) {
      applyMembershipCategory('');
      return;
    }

    if (isReducedRateMembershipCategory(value)) {
      Alert.alert(
        'Membership Category Confirmation',
        'You have selected a reduced-rate membership category. Please ensure you meet the eligibility criteria, as this category may provide different benefits and entitlements than a full membership.\n\nAre you sure you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, continue',
            onPress: () => applyMembershipCategory(value),
          },
        ],
      );
      return;
    }

    applyMembershipCategory(value);
  };

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
    let newFormData = {
      ...formData,
      workLocation: val,
    };

    if (val === 'other') {
      newFormData.branch = '';
      newFormData.region = '';
    } else if (val) {
      const selected = findWorkLocationLookupItem(val, safeWorkLocationLookups);
      Object.assign(newFormData, getBranchRegionFromLookupItem(selected));
      newFormData.otherWorkLocation = '';
    } else if (isUndergraduateStudentCategory(newFormData.membershipCategory)) {
      Object.assign(newFormData, getUndergraduateBranchRegion(newFormData));
    } else {
      newFormData.branch = '';
      newFormData.region = '';
    }

    onFormDataChange(newFormData);
  };

  const handleStudyLocationChange = val => {
    let newFormData = {
      ...formData,
      studyLocation: val,
    };

    const hasWorkLocation =
      newFormData.workLocation && newFormData.workLocation !== 'other';

    if (
      isUndergraduateStudentCategory(newFormData.membershipCategory) &&
      !hasWorkLocation
    ) {
      Object.assign(newFormData, getUndergraduateBranchRegion(newFormData));
    }

    onFormDataChange(newFormData);
  };

  // Only consider "yes" as selected, everything else (including undefined/null/'no') is not selected
  const adaptationYes = formData?.nursingAdaptationProgramme === 'yes';
  const adaptationNo = formData?.nursingAdaptationProgramme === 'no';

  const isCategoryType = categoryType => {
    if (!formData?.membershipCategory) return false;

    const selectedCategory = safeCategoryLookups.find(
      item =>
        getCategoryLookupLabel(item) === String(formData.membershipCategory),
    );

    const targetName = CATEGORY_DISPLAY_NAME_BY_TYPE[categoryType];
    if (!targetName) return false;

    if (!selectedCategory) {
      return String(formData.membershipCategory) === targetName;
    }

    return getCategoryLookupLabel(selectedCategory) === targetName;
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

  // Clear nurseType when nursingAdaptationProgramme is set to 'no' (matching web version)
  useEffect(() => {
    if (formData?.nursingAdaptationProgramme === 'no' && formData.nurseType) {
      onFormDataChange({
        ...formData,
        nurseType: '',
      });
    }
  }, [formData?.nursingAdaptationProgramme]);

  useEffect(() => {
    if (!isUndergraduateStudentCategory(formData?.membershipCategory)) {
      return;
    }

    const hasWorkLocation =
      formData?.workLocation && formData.workLocation !== 'other';
    if (hasWorkLocation || !formData?.studyLocation) {
      return;
    }

    const { branch, region } = getUndergraduateBranchRegion(formData);

    if (branch === formData.branch && region === formData.region) {
      return;
    }

    onFormDataChange({
      ...formData,
      branch,
      region,
    });
  }, [
    formData?.membershipCategory,
    formData?.studyLocation,
    formData?.workLocation,
    formData?.branch,
    formData?.region,
    rawLookups,
    studyLocationOptions,
    safeWorkLocationLookups,
  ]);

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
              if (val !== undefined) {
                handleMembershipCategoryChange(val);
              }
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
          <View style={styles.studentInfoCard}>
            <Text style={styles.studentInfoTitle}>Student Information</Text>

            <Text style={styles.label}>Discipline *</Text>
            <View
              style={[
                styles.pickerField,
                showValidation &&
                  !formData.discipline && {
                    borderColor: Colors.red,
                    borderWidth: 1,
                    borderRadius: 12,
                  },
              ]}
            >
              <Picker
                selectedValue={formData.discipline || ''}
                onValueChange={val => {
                  if (val) {
                    onFormDataChange({ ...formData, discipline: val });
                  }
                }}
              >
                <Picker.Item label="Select your discipline" value="" />
                {disciplineOptions.length === 0 ? (
                  <>
                    <Picker.Item label="Nursing" value="Nursing" />
                    <Picker.Item label="Midwifery" value="Midwifery" />
                    <Picker.Item label="Other" value="other" />
                  </>
                ) : (
                  disciplineOptions.map(option => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))
                )}
              </Picker>
            </View>

            <Text style={styles.label}>Study Location *</Text>
            <View
              style={[
                styles.pickerField,
                showValidation &&
                  !formData.studyLocation && {
                    borderColor: Colors.red,
                    borderWidth: 1,
                    borderRadius: 12,
                  },
              ]}
            >
              <SearchablePicker
                items={studyLocationOptions}
                selectedValue={formData.studyLocation || ''}
                onValueChange={val => {
                  if (val) {
                    handleStudyLocationChange(val);
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
              name="startDate"
              value={formData.startDate}
              onChange={({ target }) =>
                onFormDataChange({ ...formData, startDate: target.value })
              }
              disableAgeValidation
            />

            <Text style={styles.label}>Graduation Date *</Text>
            <View
              style={
                showValidation && !formData.graduationDate
                  ? styles.dateFieldError
                  : undefined
              }
            >
              <DatePicker
                name="graduationDate"
                required
                showValidation={showValidation}
                value={formData.graduationDate}
                onChange={({ target }) =>
                  onFormDataChange({
                    ...formData,
                    graduationDate: target.value,
                  })
                }
                disableAgeValidation
              />
            </View>
          </View>
        )}

        {/* Conditional fields for Retired Associate */}
        {isRetired && (
          <>
            <Text style={styles.label}>Retired Date</Text>
            <DatePicker
              name="retirementDate"
              value={formData.retirementDate || formData.retiredDate}
              onChange={({ target }) =>
                onFormDataChange({
                  ...formData,
                  retirementDate: target.value,
                  retiredDate: target.value,
                })
              }
              disableAgeValidation
            />

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
        <Text style={styles.cardTitle}>
          {isUndergraduateStudent
            ? 'Work Location / Placement Details'
            : 'Employment Details'}
        </Text>

        {/* Work Location */}
        <Text style={styles.label}>
          Work Location{isUndergraduateStudent ? '' : ' *'}
        </Text>
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
        <View style={[styles.pickerField, styles.readOnlyPickerField]}>
          <Picker selectedValue={formData.branch || ''} enabled={false}>
            <Picker.Item
              label={formData.branch || 'Auto-filled from location'}
              value={formData.branch || ''}
            />
          </Picker>
        </View>

        {/* Region */}
        <Text style={styles.label}>Region</Text>
        <View style={[styles.pickerField, styles.readOnlyPickerField]}>
          <Picker selectedValue={formData.region || ''} enabled={false}>
            <Picker.Item
              label={formData.region || 'Auto-filled from location'}
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
              if (updatedData.nursingAdaptationProgramme === 'no') {
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
            value={formData.nmbiNo || formData.nmbiNumber || ''}
            editable={adaptationYes || adaptationNo}
            checkValue={
              showValidation &&
              adaptationNo &&
              !isUndergraduateStudent &&
              !(formData.nmbiNo || formData.nmbiNumber)
            }
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
  readOnlyPickerField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentInfoCard: {
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  studentInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  dateFieldError: {
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: 12,
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
