import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  pick as pickDocument,
  errorCodes as documentPickerErrorCodes,
  isErrorWithCode as isDocumentPickerErrorWithCode,
} from '@react-native-documents/picker';
import { Colors } from '../../utils/Styles';
import { COMPLAINT_TYPE_OPTIONS } from '../../constants/queriesCases';
import ScreenHeader from '../../common/screenHeader';
import { Label } from '../../common/text/label';
import { InputField } from '../../common/inputField';
import { DatePicker } from '../../common/DatePicker';
import Picker from '../../common/picker';
import { Button } from '../../common/button';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { STACKS } from '../../enums/ScreenEnums';
import { useLookup } from '../../contexts/lookupContext';
import { useProfile } from '../../contexts/profileContext';
import {
  createPortalIssue,
  uploadIssueAttachments,
} from '../../api/issue.api';
import {
  buildPortalComplaintPayload,
  filterComplaintTypeLookups,
  getIssueApiErrorMessage,
  isIssueApiSuccess,
  isMemberOnMemberComplaintType,
  isMemberOnServiceProviderComplaintType,
  mapComplaintTypeLookupOptions,
  parseIssueIdFromResponse,
} from '../../helpers/issues.helper';

const CreateCase = () => {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth?.user);
  const { lookups } = useLookup();
  const { profileDetail, profileByIdDetail } = useProfile();

  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [relatedMember, setRelatedMember] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const complaintTypeLookups = useMemo(
    () => filterComplaintTypeLookups(lookups),
    [lookups],
  );

  const complaintTypeOptions = useMemo(() => {
    const lookupOptions = mapComplaintTypeLookupOptions(lookups);
    return lookupOptions.length > 0 ? lookupOptions : COMPLAINT_TYPE_OPTIONS;
  }, [lookups]);

  const isMemberOnMember = useMemo(
    () => isMemberOnMemberComplaintType(complaintType, complaintTypeLookups),
    [complaintType, complaintTypeLookups],
  );

  const isMemberOnServiceProvider = useMemo(
    () =>
      isMemberOnServiceProviderComplaintType(
        complaintType,
        complaintTypeLookups,
      ),
    [complaintType, complaintTypeLookups],
  );

  const complainantProfileId = profileDetail?.profileId;

  const complainantLabel = useMemo(() => {
    const personal =
      profileByIdDetail?.personalInfo ||
      profileDetail?.personalInfo ||
      profileDetail?.contactInfo ||
      {};
    const name =
      [personal?.forename, personal?.surname].filter(Boolean).join(' ') ||
      [user?.userFirstName, user?.userLastName].filter(Boolean).join(' ') ||
      user?.fullName ||
      user?.userName ||
      'Current member';
    const membershipNumber =
      profileDetail?.membershipNumber ||
      profileByIdDetail?.membershipNumber ||
      '';

    return membershipNumber ? `${name} (${membershipNumber})` : name;
  }, [profileDetail, profileByIdDetail, user]);

  useEffect(() => {
    if (!isMemberOnServiceProvider) {
      setServiceProvider('');
    }
  }, [isMemberOnServiceProvider]);

  useEffect(() => {
    if (!isMemberOnMember) {
      setRelatedMember('');
    }
  }, [isMemberOnMember]);

  const handleIncidentDateChange = e => {
    const val = e?.target?.value;
    setIncidentDate(val || '');
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

  const validateForm = () => {
    if (!incidentDescription.trim()) {
      Alert.alert('Validation', 'Please enter a description.');
      return false;
    }
    if (!incidentDate) {
      Alert.alert('Validation', 'Please select issue date.');
      return false;
    }
    if (!complaintType) {
      Alert.alert('Validation', 'Please select complaint type.');
      return false;
    }
    if (isMemberOnServiceProvider && !serviceProvider.trim()) {
      Alert.alert('Validation', 'Please enter a service provider.');
      return false;
    }
    if (isMemberOnMember && !relatedMember.trim()) {
      Alert.alert('Validation', 'Please enter the related member.');
      return false;
    }
    if (isMemberOnMember && !complainantProfileId) {
      Alert.alert(
        'Validation',
        'Unable to identify complainant profile. Please try again.',
      );
      return false;
    }
    return true;
  };

  const handleSaveDraft = () => {
    navigation.navigate(STACKS.QUERIES_CASES_STACK);
  };

  const handleSubmitCase = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = buildPortalComplaintPayload({
        description: incidentDescription,
        dateReceived: incidentDate,
        complaintType,
        relatedMember,
        serviceProvider,
        complainantId: complainantProfileId,
        complaintTypeLookups,
      });

      const response = await createPortalIssue(payload);
      if (isIssueApiSuccess(response)) {
        const issueId = parseIssueIdFromResponse(response);

        if (uploadedFiles.length && issueId) {
          const uploadResponse = await uploadIssueAttachments(
            issueId,
            uploadedFiles,
          );
          if (!isIssueApiSuccess(uploadResponse)) {
            Alert.alert(
              'Partial success',
              getIssueApiErrorMessage(
                uploadResponse,
                'Complaint created but attachments failed to upload.',
              ),
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate(STACKS.QUERIES_CASES_STACK),
                },
              ],
            );
            return;
          }
        }

        Alert.alert('Success', 'Complaint submitted successfully', [
          {
            text: 'OK',
            onPress: () => navigation.navigate(STACKS.QUERIES_CASES_STACK),
          },
        ]);
        return;
      }

      Alert.alert(
        'Error',
        getIssueApiErrorMessage(response, 'Failed to submit complaint'),
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="New Complaint" showBack={true} />

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
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Description</Label>
            <InputField
              placeholder="Detailed description of the complaint..."
              value={incidentDescription}
              onChange={txt => setIncidentDescription(txt)}
              multiline
              numberOfLines={4}
              formData={!!incidentDescription}
              bgStyle={styles.descriptionInput}
            />
          </View>

          <View style={{ ...styles.fieldGroup, marginTop: 48 }}>
            <Label style={styles.fieldLabel}>Issue Date</Label>
            <DatePicker
              name="incidentDate"
              value={incidentDate}
              onChange={handleIncidentDateChange}
              disableAgeValidation
            />
          </View>

          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Complaint Type</Label>
            <Picker
              selectedValue={complaintType}
              onValueChange={setComplaintType}
              containerStyle={styles.pickerContainer}
            >
              <Picker.Item label="Select complaint type" value="" />
              {complaintTypeOptions.map(opt => (
                <Picker.Item
                  key={opt.value}
                  label={opt.label}
                  value={opt.value}
                />
              ))}
            </Picker>
          </View>

          {isMemberOnServiceProvider ? (
            <View style={styles.fieldGroup}>
              <Label style={styles.fieldLabel}>Service Provider</Label>
              <InputField
                placeholder="Enter service provider name"
                value={serviceProvider}
                onChange={txt => setServiceProvider(txt)}
                formData={!!serviceProvider}
              />
            </View>
          ) : null}

          {isMemberOnMember ? (
            <>
              <View style={styles.fieldGroup}>
                <Label style={styles.fieldLabel}>Complainant</Label>
                <Label style={styles.fieldHint}>
                  You are recorded as the complainant for this case.
                </Label>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{complainantLabel}</Text>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Label style={styles.fieldLabel}>Related Member</Label>
                <Label style={styles.fieldHint}>
                  Enter member name or membership number.
                </Label>
                <InputField
                  placeholder="Enter member name or number"
                  value={relatedMember}
                  onChange={txt => setRelatedMember(txt)}
                  formData={!!relatedMember}
                />
              </View>
            </>
          ) : null}

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
                Tap to select PDFs, PNGs, or DOCX.
              </Label>
            </Pressable>
            {uploadedFiles.length > 0 ? (
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
            ) : null}
          </View>

          <View style={styles.buttonRow}>
            <Button
              title="Save Draft"
              onPress={handleSaveDraft}
              outlined
              style={styles.saveDraftButton}
              disabled={submitting}
            />
            <Button
              title={submitting ? 'Submitting...' : 'Submit Complaint'}
              onPress={handleSubmitCase}
              primary
              style={styles.submitButton}
              disabled={submitting}
            />
          </View>
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
    fontWeight: '500',
  },
  fieldHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  descriptionInput: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  pickerContainer: {
    minHeight: 52,
  },
  readOnlyField: {
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  readOnlyText: {
    fontSize: 15,
    color: Colors.textSecondary,
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
  chipRemove: {
    padding: 2,
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
