import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  pick as pickDocument,
  errorCodes as documentPickerErrorCodes,
  isErrorWithCode as isDocumentPickerErrorWithCode,
} from '@react-native-documents/picker';
import { Colors } from '../../utils/Styles';
import {
  CASE_CATEGORY_OPTIONS,
  CASE_TYPE_OPTIONS,
  AVAILABLE_STAFF,
} from '../../constants/queriesCases';
import ScreenHeader from '../../common/screenHeader';
import { Label } from '../../common/text/label';
import { InputField } from '../../common/inputField';
import { DatePicker } from '../../common/DatePicker';
import Picker from '../../common/picker';
import { Button } from '../../common/button';
import { StaffSelectionModal } from '../../common/modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { STACKS } from '../../enums/ScreenEnums';

const CreateCase = () => {
  const navigation = useNavigation();
  const [caseTitle, setCaseTitle] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [caseType, setCaseType] = useState('');
  const [assignedLead, setAssignedLead] = useState('');
  const [internalStakeholders, setInternalStakeholders] = useState([]);
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleIncidentDateChange = e => {
    const val = e?.target?.value;
    setIncidentDate(val || '');
  };

  const addStakeholder = staff => {
    if (!internalStakeholders.find(s => s.id === staff.id)) {
      setInternalStakeholders([...internalStakeholders, staff]);
    }
    setStaffModalVisible(false);
  };

  const removeStakeholder = id => {
    setInternalStakeholders(internalStakeholders.filter(s => s.id !== id));
  };

  const handlePickDocument = async () => {
    try {
      const results = await pickDocument({
        type: [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        allowMultiSelection: true,
      });
      setUploadedFiles(prev => [...prev, ...results]);
    } catch (err) {
      if (
        isDocumentPickerErrorWithCode(err) &&
        err.code === documentPickerErrorCodes.OPERATION_CANCELED
      ) {
        return;
      }
      console.warn('Document picker error', err);
    }
  };

  const removeFile = index => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    navigation.navigate(STACKS.QUERIES_CASES_STACK);
  };

  const handleSubmitCase = () => {
    navigation.navigate(STACKS.QUERIES_CASES_STACK);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Query" showBack={true} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Case Title */}
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Title</Label>
            <View style={styles.titleRow}>
              <InputField
                placeholder="Enter descriptive title."
                value={caseTitle}
                onChange={txt => setCaseTitle(txt)}
                formData={!!caseTitle}
                bgStyle={styles.titleInputBg}
              />
              <TouchableOpacity
                style={styles.starIcon}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="star-outline"
                  size={22}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Incident Description */}
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Description</Label>
            <InputField
              placeholder="Detailed description of the incident..."
              value={incidentDescription}
              onChange={txt => setIncidentDescription(txt)}
              multiline
              numberOfLines={4}
              formData={!!incidentDescription}
              bgStyle={styles.descriptionInput}
            />
          </View>

          {/* Incident Details */}
          {/* <Label style={[styles.sectionTitle, styles.sectionSpacing,{marginTop: 50}]}>
            Incident Details
          </Label> */}
          <View style={{...styles.fieldGroup,marginTop:50}}>
            <Label style={styles.fieldLabel}>Incident Date</Label>
            <DatePicker
              name="incidentDate"
              value={incidentDate}
              onChange={handleIncidentDateChange}
              disableAgeValidation
            />
          </View>
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Location</Label>
            <InputField
              placeholder="City, Region or Branch"
              value={location}
              onChange={txt => setLocation(txt)}
              formData={!!location}
            />
          </View>

          {/* Classification */}
          {/* <Label style={[styles.sectionTitle, styles.sectionSpacing]}>
            Classification
          </Label> */}
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Category</Label>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              containerStyle={styles.pickerContainer}
            >
              <Picker.Item label="Select Category" value="" />
              {CASE_CATEGORY_OPTIONS.map(opt => (
                <Picker.Item
                  key={opt.value}
                  label={opt.label}
                  value={opt.value}
                />
              ))}
            </Picker>
          </View>
          {/* <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Case Type</Label>
            <Picker
              selectedValue={caseType}
              onValueChange={setCaseType}
              containerStyle={styles.pickerContainer}
            >
              <Picker.Item label="Select Type" value="" />
              {CASE_TYPE_OPTIONS.map(opt => (
                <Picker.Item
                  key={opt.value}
                  label={opt.label}
                  value={opt.value}
                />
              ))}
            </Picker>
          </View> */}

          {/* Ownership */}
          {/* <Label style={[styles.sectionTitle, styles.sectionSpacing]}>
            Department
          </Label> */}
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Assigned To</Label>
            <Picker
              selectedValue={assignedLead}
              onValueChange={setAssignedLead}
              containerStyle={styles.pickerContainer}
            >
              <Picker.Item label="Select Lead Counsel" value="" />
              {AVAILABLE_STAFF.map(staff => (
                <Picker.Item
                  key={staff.id}
                  label={staff.name}
                  value={staff.id}
                />
              ))}
            </Picker>
          </View>
          {/* <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Internal Stakeholders</Label>
            <View style={styles.staffContainer}>
              {internalStakeholders.map(staff => (
                <View key={staff.id} style={styles.staffChip}>
                  <Label style={styles.staffChipText}>{staff.name}</Label>
                  <TouchableOpacity
                    onPress={() => removeStakeholder(staff.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={Colors.white}
                      style={styles.chipRemove}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addStaffButton}
                onPress={() => setStaffModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={Colors.textSecondary}
                  style={styles.addStaffIcon}
                />
                <Label style={styles.addStaffText}>Search...</Label>
              </TouchableOpacity>
            </View>
          </View> */}

          {/* Documentation */}
          {/* <Label style={[styles.sectionTitle, styles.sectionSpacing]}>
            Attachment
          </Label> */}
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Attachment</Label>
            <Pressable
              style={styles.uploadZone}
              onPress={handlePickDocument}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
            >
              <Ionicons
                name="document-attach-outline"
                size={40}
                color={Colors.textSecondary}
                style={styles.uploadIcon}
              />
              <Label style={styles.uploadTitle}>Upload files</Label>
              <Label style={styles.uploadHint}>
                Drag & drop or tap to select PDFs, PNGs, or DOCX.
              </Label>
            </Pressable>
            {uploadedFiles.length > 0 && (
              <View style={styles.fileList}>
                {uploadedFiles.map((file, index) => (
                  <View key={index} style={styles.fileChip}>
                    <Text
                      style={styles.fileChipText}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {file.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeFile(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="close"
                        size={16}
                        color={Colors.white}
                        style={styles.chipRemove}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Button
              title="Save Draft"
              onPress={handleSaveDraft}
              outlined
              style={styles.saveDraftButton}
            />
            <Button
              title="Submit Case"
              onPress={handleSubmitCase}
              primary
              style={styles.submitButton}
            />
          </View>
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      <StaffSelectionModal
        visible={staffModalVisible}
        title="Select Staff"
        staffList={AVAILABLE_STAFF}
        selectedStaffIds={internalStakeholders.map(s => s.id)}
        onSelect={addStakeholder}
        onClose={() => setStaffModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sectionSpacing: {
    marginTop: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingRight: 12,
  },
  titleInputBg: {
    flex: 1,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  starIcon: {
    padding: 4,
  },
  descriptionInput: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  pickerContainer: {
    minHeight: 52,
  },
  staffContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    minHeight: 52,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  staffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 20,
  },
  staffChipText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  chipRemove: {
    padding: 2,
  },
  addStaffButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addStaffIcon: {
    marginRight: 6,
  },
  addStaffText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  uploadIcon: {
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  fileList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 20,
    maxWidth: '100%',
  },
  fileChipText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
    maxWidth: 180,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  saveDraftButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  bottomPadding: {
    height: 24,
  },
});

export default CreateCase;
