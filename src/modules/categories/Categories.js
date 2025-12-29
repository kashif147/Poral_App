import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Colors, hp } from '../../utils/Styles';
import Picker from '../../common/picker';
import { InputField } from '../../common/inputField';
import { Button } from '../../common/button';
import { useApplication } from '../../contexts/applicationContext';
import { useLookup } from '../../contexts/lookupContext';
import { useProfile } from '../../contexts/profileContext';
import { updateProfessionalDetailRequest } from '../../api/application.api';
import { profileRequest, fetchTransferRequest } from '../../api/profile.api';
import ScreenHeader from '../../common/screenHeader';

const Categories = () => {
  const { personalDetail, professionalDetail, getProfessionalDetail } = useApplication();
  const { profileByIdDetail, getProfileDetail } = useProfile();
  // Get lookups from context (matching web version - context handles all fetching centrally)
  const {
    workLocationLookups,
    fetchWorkLocationLookups,
    loading: lookupLoading,
  } = useLookup() || {};

  const safeWorkLocationLookups = Array.isArray(workLocationLookups)
    ? workLocationLookups
    : [];

  // Ensure work locations are fetched if not available
  useEffect(() => {
    if (!lookupLoading && safeWorkLocationLookups.length === 0 && fetchWorkLocationLookups) {
      fetchWorkLocationLookups();
    }
  }, [lookupLoading, safeWorkLocationLookups.length, fetchWorkLocationLookups]);
  // Prioritize profile data over application data (matching web version)
  const existing = profileByIdDetail?.professionalDetails || professionalDetail?.professionalDetails || {};
  const applicationId = personalDetail?.applicationId;

  const [form, setForm] = useState({ workLocation: '', otherWorkLocation: '', branch: '', region: '', reasonToChange: '' });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [transferRequest, setTransferRequest] = useState(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Fetch profile detail on mount (matching web version)
  useEffect(() => {
    getProfileDetail?.();
  }, []);

  // Fetch transfer requests on mount (matching web version)
  useEffect(() => {
    setInitialLoading(true);
    fetchTransferRequest()
      .then(res => {
        if (res?.status === 200 && res?.data?.success && res?.data?.data?.length > 0) {
          const requests = res.data.data;
          // Find the most recent PENDING request, or the latest request if no PENDING exists
          const pendingRequest = requests.find(req => req.status === 'PENDING');
          const latestRequest = requests.sort((a, b) => 
            new Date(b.requestDate || b.createdAt) - new Date(a.requestDate || a.createdAt)
          )[0];
          
          const activeRequest = pendingRequest || latestRequest;
          
          if (activeRequest) {
            setTransferRequest(activeRequest);
            setHasPendingRequest(activeRequest.status === 'PENDING');
            
            // Only populate form if there's a PENDING request
            if (activeRequest.status === 'PENDING') {
              setForm(prev => ({
                ...prev,
                workLocation: activeRequest.requestedWorkLocationName || '',
                branch: activeRequest.requestedBranchName || '',
                region: activeRequest.requestedRegionName || '',
                reasonToChange: activeRequest.reason || '',
              }));
            } else {
              // Clear form if no pending request
              setForm({
                workLocation: '',
                otherWorkLocation: '',
                branch: '',
                region: '',
                reasonToChange: '',
              });
            }
          } else {
            // No requests found, clear form
            setTransferRequest(null);
            setHasPendingRequest(false);
            setForm({
              workLocation: '',
              otherWorkLocation: '',
              branch: '',
              region: '',
              reasonToChange: '',
            });
          }
        } else {
          // No requests found, clear form
          setTransferRequest(null);
          setHasPendingRequest(false);
          setForm({
            workLocation: '',
            otherWorkLocation: '',
            branch: '',
            region: '',
            reasonToChange: '',
          });
        }
        setInitialLoading(false);
      })
      .catch(error => {
        console.error('Error fetching transfer requests:', error);
        // On error, clear form
        setTransferRequest(null);
        setHasPendingRequest(false);
        setForm({
          workLocation: '',
          otherWorkLocation: '',
          branch: '',
          region: '',
          reasonToChange: '',
        });
        setInitialLoading(false);
      });
  }, []);

  // Context handles fetching work location lookups centrally - no need to fetch here

  // Fetch professional detail if not loaded
  useEffect(() => {
    if (personalDetail?.applicationId && !professionalDetail) {
      getProfessionalDetail?.();
    }
  }, [personalDetail?.applicationId, professionalDetail, getProfessionalDetail]);

  // Only set form from existing data if there's no transfer request data and no pending request (matching web version)
  useEffect(() => {
    if (!transferRequest && !hasPendingRequest) {
      // Keep form empty - don't populate with existing data
      // User should fill the form manually
      setForm({
        workLocation: '',
        otherWorkLocation: '',
        branch: '',
        region: '',
        reasonToChange: '',
      });
    }
  }, [professionalDetail, profileByIdDetail, transferRequest, hasPendingRequest]);

  // Map work location lookups to options (matching web version)
  const workLocationOptions = useMemo(() => {
    if (safeWorkLocationLookups.length === 0) {
      return [];
    }

    // Try multiple possible data structures (matching ProfessionalDetails.js)
    const mapped = safeWorkLocationLookups
      .map((item) => {
        // Try different possible structures (check lookup object first, then top level)
        const name =
          item?.lookup?.DisplayName ||
          item?.lookup?.lookupname ||
          item?.lookup?.name ||
          item?.DisplayName ||
          item?.lookupname ||
          item?.name ||
          item?.label ||
          '';
        
        return { value: name, label: name };
      })
      .filter(option => option.value); // Filter out empty values

    return mapped;
  }, [safeWorkLocationLookups]);

  // Create picker children array (ensure flat array without Fragments)
  const pickerChildren = useMemo(() => {
    if (lookupLoading) {
      return [<Picker.Item key="loading" label="Loading locations..." value="" disabled />];
    }
    if (workLocationOptions.length === 0) {
      return [<Picker.Item key="no-locations" label="No locations available" value="" disabled />];
    }
    const validOptions = workLocationOptions
      .filter(option => {
        const isValid = option.value && option.label && (typeof option.value !== 'string' || option.value.trim() !== '');
        return isValid;
      })
      .map((option) => {
        const value = String(option.value).trim();
        const label = String(option.label).trim();
        return (
          <Picker.Item 
            key={`wl-${value}`} 
            label={label} 
            value={value} 
          />
        );
      });
    return [
      <Picker.Item key="select" label="Select work location" value="" />,
      ...validOptions,
      <Picker.Item key="other" label="Other" value="other" />
    ];
  }, [workLocationOptions, lookupLoading]);

  // Extract branch options from lookups (matching web version)
  const branchOptions = useMemo(() => {
    if (safeWorkLocationLookups.length === 0) {
      return [];
    }
    return Array.from(
      new Set(
        safeWorkLocationLookups.map(
          i => i?.branch?.DisplayName || i?.branch?.lookupname || i?.branch?.name || i?.branch?.label,
        ),
      ),
    )
      .filter(Boolean)
      .map(name => ({ value: name, label: name }));
  }, [safeWorkLocationLookups]);

  // Extract region options from lookups (matching web version)
  const regionOptions = useMemo(() => {
    if (safeWorkLocationLookups.length === 0) {
      return [];
    }
    return Array.from(
      new Set(
        safeWorkLocationLookups.map(
          i => i?.region?.DisplayName || i?.region?.lookupname || i?.region?.name || i?.region?.label,
        ),
      ),
    )
      .filter(Boolean)
      .map(name => ({ value: name, label: name }));
  }, [safeWorkLocationLookups]);

  const onChangeWorkLocation = (val) => {
    const patch = { workLocation: val };
    if (val === 'other') {
      patch.branch = '';
      patch.region = '';
    } else {
      // Find selected work location from lookups (matching web version)
      if (safeWorkLocationLookups.length > 0) {
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
        if (selected) {
          patch.branch = selected?.branch?.DisplayName || selected?.branch?.lookupname || selected?.branch?.name || '';
          patch.region = selected?.region?.DisplayName || selected?.region?.lookupname || selected?.region?.name || '';
          patch.otherWorkLocation = '';
        }
      }
    }
    setForm(prev => ({ ...prev, ...patch }));
  };

  const handleSubmit = async () => {
    // Get current work location ID (matching web version)
    let currentWorkLocationItem = null;
    let currentWorkLocationId = null;
    if (safeWorkLocationLookups.length > 0) {
      currentWorkLocationItem = safeWorkLocationLookups.find(item => {
        const itemName =
          item?.lookup?.DisplayName ||
          item?.lookup?.lookupname ||
          item?.DisplayName ||
          item?.lookupname ||
          item?.name ||
          item?.label;
        return itemName === existing.workLocation;
      });
      currentWorkLocationId = currentWorkLocationItem?.lookup?._id || currentWorkLocationItem?.lookup?.id;
    }

    let requestedWorkLocationId = null;
    if (form.workLocation && form.workLocation !== 'other' && safeWorkLocationLookups.length > 0) {
      const requestedWorkLocationItem = safeWorkLocationLookups.find(item => {
        const itemName =
          item?.lookup?.DisplayName ||
          item?.lookup?.lookupname ||
          item?.DisplayName ||
          item?.lookupname ||
          item?.name ||
          item?.label;
        return itemName === form.workLocation;
      });
      requestedWorkLocationId = requestedWorkLocationItem?.lookup?._id || requestedWorkLocationItem?.lookup?.id;
    }

    if (!form.workLocation) {
      Alert.alert('Error', 'Please select a work location');
      return;
    }

    if (form.workLocation === 'other') {
      Alert.alert('Error', 'Please select a work location from the list. Transfer requests require a valid work location ID.');
      return;
    }

    if (!currentWorkLocationId) {
      Alert.alert('Error', 'Current work location not found. Please contact support.');
      return;
    }

    if (!requestedWorkLocationId) {
      Alert.alert('Error', 'Requested work location not found. Please select a valid work location.');
      return;
    }

    if (!form.reasonToChange || form.reasonToChange.trim() === '') {
      Alert.alert('Error', 'Please provide a reason for changing your work location');
      return;
    }

    setLoading(true);
    const transferPayload = {
      currentWorkLocationId,
      requestedWorkLocationId,
      reason: form.reasonToChange,
    };

    try {
      const res = await profileRequest(transferPayload);
      if (res?.status === 200 || res?.status === 201) {
        Alert.alert('Success', 'Work location transfer request submitted successfully');
        // Refresh both profile and application data
        getProfileDetail?.();
        getProfessionalDetail?.();
        // Refresh transfer requests to get the new PENDING status
        fetchTransferRequest()
          .then(transferRes => {
            if (transferRes?.status === 200 && transferRes?.data?.success && transferRes?.data?.data?.length > 0) {
              const requests = transferRes.data.data;
              const pendingRequest = requests.find(req => req.status === 'PENDING');
              const latestRequest = requests.sort((a, b) => 
                new Date(b.requestDate || b.createdAt) - new Date(a.requestDate || a.createdAt)
              )[0];
              
              const activeRequest = pendingRequest || latestRequest;
              
              if (activeRequest) {
                setTransferRequest(activeRequest);
                setHasPendingRequest(activeRequest.status === 'PENDING');
                
                // Only populate form if there's a PENDING request
                if (activeRequest.status === 'PENDING') {
                  setForm(prev => ({
                    ...prev,
                    workLocation: activeRequest.requestedWorkLocationName || '',
                    branch: activeRequest.requestedBranchName || '',
                    region: activeRequest.requestedRegionName || '',
                    reasonToChange: activeRequest.reason || '',
                  }));
                } else {
                  // Clear form if no pending request
                  setForm({
                    workLocation: '',
                    otherWorkLocation: '',
                    branch: '',
                    region: '',
                    reasonToChange: '',
                  });
                }
              }
            }
            setLoading(false);
          })
          .catch(error => {
            console.error('Error refreshing transfer requests:', error);
            setLoading(false);
          });
      } else {
        Alert.alert('Error', res?.data?.message || 'Transfer request failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('Transfer request error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong');
      setLoading(false);
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
          {workLocationOptions.length > 0 && (
            <Text style={{ fontSize: 10, color: Colors.textSecondary, marginBottom: 4 }}>
              {workLocationOptions.length} locations available
            </Text>
          )}
          <View style={styles.pickerField}>
            <Picker 
              key={`workLocation-${workLocationOptions.length}-${lookupLoading}`}
              selectedValue={form.workLocation} 
              onValueChange={onChangeWorkLocation}
              enabled={!hasPendingRequest && !initialLoading && !lookupLoading}
            >
              {pickerChildren}
            </Picker>
          </View>

          <Text style={styles.label}>Other Work Location</Text>
          <View style={styles.inputField}>
            <InputField
              value={form.otherWorkLocation}
              onChange={(txt) => setForm(prev => ({ ...prev, otherWorkLocation: txt }))}
              placeholder="Enter your other work location"
              holderTextColor={'#94A3B8'}
              editable={form.workLocation === 'other' && !hasPendingRequest && !initialLoading}
            />
          </View>

          <Text style={styles.label}>Reason to Change</Text>
          <View style={styles.inputField}>
            <InputField
              value={form.reasonToChange}
              onChange={(txt) => setForm(prev => ({ ...prev, reasonToChange: txt }))}
              placeholder="Please provide a reason for changing your work location"
              holderTextColor={'#94A3B8'}
              multiline
              numberOfLines={4}
              editable={!hasPendingRequest && !initialLoading}
            />
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.label}>Branch</Text>
              <View style={styles.pickerField}>
                <Picker
                  selectedValue={form.branch}
                  onValueChange={(val) => setForm(prev => ({ ...prev, branch: val }))}
                  enabled={form.workLocation === 'other' && !hasPendingRequest && !initialLoading}
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
                  enabled={form.workLocation === 'other' && !hasPendingRequest && !initialLoading}
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
            <Button 
              title={loading || initialLoading ? "Loading..." : "Update Work Location"} 
              onPress={handleSubmit} 
              primary 
              disabled={hasPendingRequest || loading || initialLoading}
            />
          </View>
          
          {hasPendingRequest && (
            <View style={styles.pendingNotice}>
              <Text style={styles.pendingNoticeText}>
                You have a pending transfer request. Please wait for approval before submitting a new request.
              </Text>
            </View>
          )}
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
  pendingNotice: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pendingNoticeText: {
    color: '#92400E',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default Categories;