import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../utils/Styles';
import { formatTime, parseTime } from '../../utils/time.utils';
import {
  CASE_CATEGORY_OPTIONS,
  AVAILABLE_STAFF,
} from '../../constants/queriesCases';
import ScreenHeader from '../../common/screenHeader';
import { Label } from '../../common/text/label';
import { InputField } from '../../common/inputField';
import { DatePicker } from '../../common/DatePicker';
import Picker from '../../common/picker';
import { Button } from '../../common/button';
import { TimePickerModal, StaffSelectionModal } from '../../common/modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { STACKS } from '../../enums/ScreenEnums';

const CreateCase = () => {
  const navigation = useNavigation();
  const [caseTitle, setCaseTitle] = useState('');
  const [category, setCategory] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timeDate, setTimeDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [leadCounsel, setLeadCounsel] = useState('');
  const [supportingStaff, setSupportingStaff] = useState([]);
  const [staffModalVisible, setStaffModalVisible] = useState(false);

  const handleIncidentDateChange = e => {
    const val = e?.target?.value;
    setIncidentDate(val || '');
  };

  const handleTimeChange = (event, date) => {
    if (Platform.OS === 'android') setTimePickerOpen(false);
    if (event?.type === 'dismissed') {
      setTimePickerOpen(false);
      return;
    }
    if (date) {
      setTimeDate(date);
      setTimeValue(formatTime(date));
    }
  };

  const addStaff = staff => {
    if (!supportingStaff.find(s => s.id === staff.id)) {
      setSupportingStaff([...supportingStaff, staff]);
    }
    setStaffModalVisible(false);
  };

  const removeStaff = id => {
    setSupportingStaff(supportingStaff.filter(s => s.id !== id));
  };

  const handleSaveDraft = () => {
    navigation.navigate(STACKS.QUERIES_CASES_STACK);
  };

  const handleSubmitCase = () => {
    navigation.navigate(STACKS.QUERIES_CASES_STACK);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Create New Case" showBack={true} />

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
          {/* Core Case Info */}
          <Label style={styles.sectionTitle}>Core Case Info</Label>
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Case Title</Label>
            <InputField
              placeholder="Enter a descriptive title"
              value={caseTitle}
              onChange={txt => setCaseTitle(txt)}
              formData={!!caseTitle}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Category</Label>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              containerStyle={styles.pickerContainer}
            >
              <Picker.Item label="Select case category" value="" />
              {CASE_CATEGORY_OPTIONS.map(opt => (
                <Picker.Item
                  key={opt.value}
                  label={opt.label}
                  value={opt.value}
                />
              ))}
            </Picker>
          </View>

          {/* Incident Details */}
          <Label style={[styles.sectionTitle, styles.sectionSpacing]}>
            Incident Details
          </Label>
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Incident Date</Label>
            <DatePicker
              name="incidentDate"
              value={incidentDate}
              onChange={handleIncidentDateChange}
              disableAgeValidation
            />
          </View>
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Time</Label>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTimePickerOpen(true)}
            >
              <InputField
                placeholder="--:-- --"
                value={timeValue}
                editable={false}
                formData={!!timeValue}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Location</Label>
            <InputField
              placeholder="City, State, or Facility"
              value={location}
              onChange={txt => setLocation(txt)}
              formData={!!location}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Description</Label>
            <InputField
              placeholder="Provide a brief summary of the incident..."
              value={description}
              onChange={txt => setDescription(txt)}
              multiline
              numberOfLines={4}
              formData={!!description}
              bgStyle={styles.descriptionInput}
            />
          </View>

          {/* Legal Team Assignment */}
          <Label
            style={[
              styles.sectionTitle,
              styles.sectionSpacing,
              { marginTop: 50 },
            ]}
          >
            Legal Team Assignment
          </Label>
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Lead Counsel</Label>
            <InputField
              placeholder="Search for Lead Counsel"
              value={leadCounsel}
              onChange={txt => setLeadCounsel(txt)}
              formData={!!leadCounsel}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Label style={styles.fieldLabel}>Supporting Staff</Label>
            <View style={styles.staffContainer}>
              {supportingStaff.map(staff => (
                <View key={staff.id} style={styles.staffChip}>
                  <Label style={styles.staffChipText}>{staff.name}</Label>
                  <TouchableOpacity
                    onPress={() => removeStaff(staff.id)}
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
                <Label style={styles.addStaffText}>Add Staff</Label>
              </TouchableOpacity>
            </View>
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

      {/* Time Picker - Android uses native picker, iOS uses modal */}
      {timePickerOpen && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={parseTime(timeValue) || timeDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
      <TimePickerModal
        visible={timePickerOpen && Platform.OS === 'ios'}
        value={parseTime(timeValue) || timeDate}
        onSelect={date => {
          setTimeDate(date);
          setTimeValue(formatTime(date));
        }}
        onClose={() => setTimePickerOpen(false)}
      />

      <StaffSelectionModal
        visible={staffModalVisible}
        title="Select Staff"
        staffList={AVAILABLE_STAFF}
        selectedStaffIds={supportingStaff.map(s => s.id)}
        onSelect={addStaff}
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
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
