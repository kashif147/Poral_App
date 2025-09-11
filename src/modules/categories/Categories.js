import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Wrapper } from '../../common/wrapper';
import { commonStyles, Colors, wp, hp } from '../../utils/Styles';
import Picker from '../../common/picker';
import { InputField } from '../../common/inputField';
import { Button } from '../../common/button';
import { useApplication } from '../../contexts/applicationContext';
import { updateProfessionalDetailRequest } from '../../api/application.api';

// Work location options and mapping (subset based on the web list)
const workLocations = [
  '24 Hour Care Services',
  '24 Hour Care Services (Mid-West)',
  '24 Hour Care Services (North West)',
  'ATU (LIMERICK)',
  'BLANCHARDSTOWN INSTITUTE OF TECHNOLOGY',
  'CAREDOC (CORK)',
  'DUBLIN INSTITUTE OF TECHNOLOGY',
  'GLENDALE NURSING HOME (TULLOW)',
  'HOME INSTEAD (WESTERN REGION)',
  'LETTERKENNY INSTITUTE OF TECHNOLOGY',
  'LIMERICK INSTITUTE OF TECHNOLOGY',
  'SLIGO INSTITUTE OF TECHNOLOGY',
  'ST JOSEPHS HOSPITAL- MOUNT DESERT',
  'TALLAGHT INSTITUTE OF TECHNOLOGY',
  'Atu (Letterkenny)',
  'Regional Centre Of Nursing & Midwifery Education',
  'Newtown School',
  'Tipperary Education & Training Board',
  'National University Ireland Galway',
  'South East Technological University (Setu)',
  'Tud (Tallaght)',
  'College Of Anaesthetists',
  'Tud (Blanchardstown)',
  'Gmit (Galway)',
  'Cork University College',
  'Mtu (Cork)',
  'Student',
  'St Columbas College (Dublin)',
  'Setu (Waterford)',
  'Nui Galway',
  'Roscrea College',
  'Dun Laoghaire Institute Of Art & Design',
  'Mtu (Kerry)',
  'Tus (Limerick)',
  'Dundalk Institute Of Technology (Dkit)',
  'Atu (Sligo)',
  'Tud (Bolton Street)',
  'Dublin City University',
  'National University Ireland Maynooth',
  'University College Dublin',
  'Limerick University',
  'Trinity College',
  'St Angelas College (Sligo)',
  'Royal College Of Surgeons',
  'Tus (Technological University Of The Shannon)',
  "Galway Mayo Institute Of Tech(C'Bar)",
  'other',
];

const workLocationDetails = {
  '24 Hour Care Services': { branch: 'Meath', region: 'Dublin North East' },
  '24 Hour Care Services (Mid-West)': { branch: 'Clare', region: 'Mid-West, West and North West' },
  '24 Hour Care Services (North West)': { branch: 'Sligo', region: 'Mid-West, West and North West' },
  'BLANCHARDSTOWN INSTITUTE OF TECHNOLOGY': { branch: 'Dublin Northern Branch', region: 'Dublin Mid Leinster' },
  'CAREDOC (CORK)': { branch: 'Cork Vol/Private Branch', region: 'South - South East' },
  'DUBLIN INSTITUTE OF TECHNOLOGY': { branch: 'Dublin South West Branch', region: 'Dublin Mid Leinster' },
  'GLENDALE NURSING HOME (TULLOW)': { branch: 'Carlow', region: 'South - South East' },
  'HOME INSTEAD (WESTERN REGION)': { branch: 'Roscommon', region: 'West' },
  'LETTERKENNY INSTITUTE OF TECHNOLOGY': { branch: 'Letterkenny', region: 'Letterkenny' },
  'LIMERICK INSTITUTE OF TECHNOLOGY': { branch: 'Limerick', region: 'Limerick' },
  'SLIGO INSTITUTE OF TECHNOLOGY': { branch: 'Sligo', region: 'Sligo' },
  'ST JOSEPHS HOSPITAL- MOUNT DESERT': { branch: 'Cork Vol/Private Branch', region: 'South - South East' },
  'TALLAGHT INSTITUTE OF TECHNOLOGY': { branch: 'Dublin South West Branch', region: 'Dublin Mid Leinster' },
  'Atu (Letterkenny)': { branch: 'Letterkenny', region: 'Letterkenny' },
  'Regional Centre Of Nursing & Midwifery Education': { branch: 'Offaly', region: 'Mid Leinster' },
  'Newtown School': { branch: 'Waterford', region: 'South - South East' },
  'Tipperary Education & Training Board': { branch: 'Tipperary-North-Mwhb', region: 'Mid-West, West and North West' },
  'National University Ireland Galway': { branch: 'Galway', region: 'Mid-West, West and North West' },
  'South East Technological University (Setu)': { branch: 'Carlow', region: 'South - South East' },
  'Tud (Tallaght)': { branch: 'Dublin South West Branch', region: 'Dublin Mid Leinster' },
  'College Of Anaesthetists': { branch: 'Dublin South West Branch', region: 'Dublin Mid Leinster' },
  'Tud (Blanchardstown)': { branch: 'Dublin Northern Branch', region: 'Dublin North East' },
  'Gmit (Galway)': { branch: 'Galway', region: 'Mid-West, West and North West' },
  'Cork University College': { branch: 'Cork Vol/Private Branch', region: 'South - South East' },
  'Mtu (Cork)': { branch: 'Cork Vol/Private Branch', region: 'South - South East' },
  Student: { branch: 'Student', region: 'Student' },
  'St Columbas College (Dublin)': { branch: 'Dublin East Coast Branch', region: 'Dublin Mid Leinster' },
  'Setu (Waterford)': { branch: 'Waterford', region: 'South - South East' },
  'Nui Galway': { branch: 'Galway City', region: 'Mid-West, West and North West' },
  'Roscrea College': { branch: 'Tipperary-North-Mwhb', region: 'Mid-West, West and North West' },
  'Dun Laoghaire Institute Of Art & Design': { branch: 'Dunlaoghaire', region: 'Dublin Mid Leinster' },
  'Mtu (Kerry)': { branch: 'Kerry', region: 'South - South East' },
  'Tus (Limerick)': { branch: 'Limerick', region: 'Mid-West, West and North West' },
  'Dundalk Institute Of Technology (Dkit)': { branch: 'Dundalk', region: 'Dublin North East' },
  'Atu (Sligo)': { branch: 'Sligo', region: 'Mid-West, West and North West' },
  'Tud (Bolton Street)': { branch: 'Dublin South West Branch', region: 'Dublin Mid Leinster' },
  'Dublin City University': { branch: 'Dublin Northern Branch', region: 'Dublin North East' },
  'National University Ireland Maynooth': { branch: 'Kildare/Naas', region: 'Dublin Mid Leinster' },
  'University College Dublin': { branch: 'Dublin East Coast Branch', region: 'Dublin Mid Leinster' },
  'Limerick University': { branch: 'Limerick', region: 'Limerick' },
  'Trinity College': { branch: 'Dublin East Coast Branch', region: 'Dublin Mid Leinster' },
  'St Angelas College (Sligo)': { branch: 'Sligo', region: 'Sligo' },
  'Royal College Of Surgeons': { branch: 'Dublin East Coast Branch', region: 'Dublin North East' },
  'Tus (Technological University Of The Shannon)': { branch: 'Athlone', region: 'Dublin North East' },
  "Galway Mayo Institute Of Tech(C'Bar)": { branch: 'Castlebar', region: 'Mid-West, West and North West' },
};

const Categories = () => {
  const { personalDetail, professionalDetail } = useApplication();
  const existing = professionalDetail?.professionalDetails || {};
  const applicationId = personalDetail?.ApplicationId;

  const [form, setForm] = useState({ workLocation: '', otherWorkLocation: '', branch: '', region: '' });

  useEffect(() => {
    setForm({
      workLocation: existing.workLocation || '',
      otherWorkLocation: existing.otherWorkLocation || '',
      branch: existing.branch || '',
      region: existing.region || '',
    });
  }, [existing.workLocation, existing.otherWorkLocation, existing.branch, existing.region]);

  const allBranches = useMemo(() => Array.from(new Set(Object.values(workLocationDetails).map(d => d.branch))), []);
  const allRegions = useMemo(() => Array.from(new Set(Object.values(workLocationDetails).map(d => d.region))), []);

  const onChangeWorkLocation = (val) => {
    const patch = { workLocation: val };
    if (val === 'other') {
      patch.branch = '';
      patch.region = '';
    } else if (workLocationDetails[val]) {
      patch.branch = workLocationDetails[val].branch;
      patch.region = workLocationDetails[val].region;
      patch.otherWorkLocation = '';
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
      if (res?.status === 200) Alert.alert('Success', 'Work location updated');
      else Alert.alert('Error', res?.data?.message || 'Update failed');
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <Wrapper style={commonStyles.screenContainer} title={'Work Location'} showBack={false}>
      <View style={styles.container}>
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
              {workLocations.map(loc => (<Picker.Item key={loc} label={loc} value={loc} />))}
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
                  <Picker.Item label={form.workLocation === 'other' ? 'Select branch' : (form.branch || 'Auto-filled')} value={form.branch} />
                  {form.workLocation === 'other' && allBranches.map(b => (<Picker.Item key={b} label={b} value={b} />))}
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
                  <Picker.Item label={form.workLocation === 'other' ? 'Select region' : (form.region || 'Auto-filled')} value={form.region} />
                  {form.workLocation === 'other' && allRegions.map(r => (<Picker.Item key={r} label={r} value={r} />))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <Button title="Update" onPress={handleSubmit} primary />
          </View>
        </View>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 16, gap: 16 },
  card: {
    backgroundColor: '#1A1F23',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2A2F33',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cardTitle: { color: Colors.white, fontWeight: '700', marginBottom: 10, fontSize: hp(2.2) },
  rowLabel: { color: '#93A1A1', fontSize: 12 },
  rowValue: { color: Colors.white, fontWeight: '600', marginTop: 6 },
  label: { color: Colors.white, fontWeight: '600', marginTop: 10 },
  inputField: { marginTop: 6 },
  pickerField: { marginTop: 6, marginBottom: 6 },
});

export default Categories;