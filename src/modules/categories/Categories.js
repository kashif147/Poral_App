import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Colors, hp } from '../../utils/Styles';
import Picker from '../../common/picker';
import { InputField } from '../../common/inputField';
import { Button } from '../../common/button';
import { useApplication } from '../../contexts/applicationContext';
import { useLookup } from '../../contexts/lookupContext';
import { updateProfessionalDetailRequest } from '../../api/application.api';
import ScreenHeader from '../../common/screenHeader';

const Categories = () => {
  const { personalDetail, professionalDetail, getProfessionalDetail } = useApplication();
  const { workLocationLookups, fetchWorkLocationLookups } = useLookup();
  const existing = professionalDetail?.professionalDetails || {};
  const applicationId = personalDetail?.applicationId;

  const [form, setForm] = useState({ workLocation: '', otherWorkLocation: '', branch: '', region: '' });

  // Fetch work location lookups on mount
  useEffect(() => {
    if (!workLocationLookups || workLocationLookups.length === 0) {
      fetchWorkLocationLookups?.();
    }
  }, [workLocationLookups, fetchWorkLocationLookups]);

  // Fetch professional detail if not loaded
  useEffect(() => {
    if (personalDetail?.applicationId && !professionalDetail) {
      getProfessionalDetail?.();
    }
  }, [personalDetail?.applicationId, professionalDetail, getProfessionalDetail]);

  // Update form when professional detail changes
  useEffect(() => {
    if (professionalDetail?.professionalDetails) {
      const details = professionalDetail.professionalDetails;
      setForm({
        workLocation: details.workLocation || '',
        otherWorkLocation: details.otherWorkLocation || '',
        branch: details.branch || '',
        region: details.region || '',
      });
    }
  }, [professionalDetail]);

  // Map work location lookups to options (matching web version)
  const workLocationOptions = useMemo(() => {
    return (workLocationLookups || []).map(item => {
      const name = item?.lookup?.DisplayName || item?.lookup?.lookupname || '';
      return { value: name, label: name };
    }).filter(option => option.value);
  }, [workLocationLookups]);

  // Extract branch options from lookups (matching web version)
  const branchOptions = useMemo(() => {
    return Array.from(
      new Set(
        (workLocationLookups || []).map(
          i => i?.branch?.DisplayName || i?.branch?.lookupname,
        ),
      ),
    )
      .filter(Boolean)
      .map(name => ({ value: name, label: name }));
  }, [workLocationLookups]);

  // Extract region options from lookups (matching web version)
  const regionOptions = useMemo(() => {
    return Array.from(
      new Set(
        (workLocationLookups || []).map(
          i => i?.region?.DisplayName || i?.region?.lookupname,
        ),
      ),
    )
      .filter(Boolean)
      .map(name => ({ value: name, label: name }));
  }, [workLocationLookups]);

  const onChangeWorkLocation = (val) => {
    const patch = { workLocation: val };
    if (val === 'other') {
      patch.branch = '';
      patch.region = '';
    } else {
      // Find selected work location from lookups (matching web version)
      const selected = (workLocationLookups || []).find(
        i => (i?.lookup?.DisplayName || i?.lookup?.lookupname) === val,
      );
      if (selected) {
        patch.branch = selected?.branch?.DisplayName || selected?.branch?.lookupname || '';
        patch.region = selected?.region?.DisplayName || selected?.region?.lookupname || '';
        patch.otherWorkLocation = '';
      }
    }
    setForm(prev => ({ ...prev, ...patch }));
  };

  const handleSubmit = async () => {
    if (!applicationId) { Alert.alert('Error', 'Missing application id.'); return; }
    const payload = { professionalDetails: {} };
    if (form.workLocation) payload.professionalDetails.workLocation = form.workLocation;
    if (form.otherWorkLocation) payload.professionalDetails.otherWorkLocation = form.otherWorkLocation;
    if (form.branch) payload.professionalDetails.branch = form.branch;
    if (form.region) payload.professionalDetails.region = form.region;

    try {
      const res = await updateProfessionalDetailRequest(applicationId, payload);
      if (res?.status === 200) {
        Alert.alert('Success', 'Work location updated');
        getProfessionalDetail?.();
      } else {
        Alert.alert('Error', res?.data?.message || 'Update failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Work Location" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Current details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Details</Text>
          <Text style={styles.rowLabel}>Work Location</Text>
          <Text style={styles.rowValue}>{existing.workLocation || 'N/A'}</Text>
          <Text style={[styles.rowLabel, { marginTop: 8 }]}>Other Work Location</Text>
          <Text style={styles.rowValue}>{existing.otherWorkLocation || 'N/A'}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Branch</Text>
              <Text style={styles.rowValue}>{existing.branch || 'N/A'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Region</Text>
              <Text style={styles.rowValue}>{existing.region || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Update form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Update Work Location</Text>
          <Text style={styles.label}>Work Location</Text>
          <View style={styles.pickerField}>
            <Picker selectedValue={form.workLocation} onValueChange={onChangeWorkLocation}>
              <Picker.Item label="Select work location" value="" />
              {workLocationOptions.length > 0 ? (
                <>
                  {workLocationOptions.map(option => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                  <Picker.Item label="Other" value="other" />
                </>
              ) : (
                <Picker.Item label="Loading locations..." value="" />
              )}
            </Picker>
          </View>

          <Text style={styles.label}>Other Work Location</Text>
          <View style={styles.inputField}>
            <InputField
              value={form.otherWorkLocation}
              onChange={(txt) => setForm(prev => ({ ...prev, otherWorkLocation: txt }))}
              placeholder="Enter your other work location"
              holderTextColor={'#94A3B8'}
              editable={form.workLocation !== 'other'}
            />
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.label}>Branch</Text>
              <View style={styles.pickerField}>
                <Picker
                  selectedValue={form.branch}
                  onValueChange={(val) => setForm(prev => ({ ...prev, branch: val }))}
                  enabled={form.workLocation === 'other'}
                >
                  <Picker.Item 
                    label={form.workLocation === 'other' ? 'Select branch' : (form.branch || 'Auto-filled')} 
                    value={form.branch || ''} 
                  />
                  {form.workLocation === 'other' && branchOptions.map(option => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.label}>Region</Text>
              <View style={styles.pickerField}>
                <Picker
                  selectedValue={form.region}
                  onValueChange={(val) => setForm(prev => ({ ...prev, region: val }))}
                  enabled={form.workLocation === 'other'}
                >
                  <Picker.Item 
                    label={form.workLocation === 'other' ? 'Select region' : (form.region || 'Auto-filled')} 
                    value={form.region || ''} 
                  />
                  {form.workLocation === 'other' && regionOptions.map(option => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 12, marginBottom: 20 }}>
            <Button title="Update" onPress={handleSubmit} primary />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.lightgrey,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 16,
    fontSize: hp(2.2),
    letterSpacing: 0.3,
  },
  rowLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 6,
    fontSize: 16,
  },
  label: {
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
  },
  inputField: { marginTop: 6 },
  pickerField: { marginTop: 6, marginBottom: 6 },
});

export default Categories;