import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import CustomSwitch from '../../common/switch';
import { Colors, wp } from '../../utils/Styles';

const membershipCategories = [
  'General (all grades)',
  'Postgraduate Student',
  'Short-term/ Relief (under 15 hrs/wk average)',
  'Private nursing home',
  'Affiliate members (non-practicing)',
  'Lecturing (employed in universities and IT institutes)',
  'Associate (not currently employed as a nurse/midwife)',
  'Retired Associate',
  'Undergraduate Student',
];
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
  'Other',
];
// Mapping subset based on provided web config
const workLocationDetails = {
  '24 Hour Care Services': { branch: 'Meath', region: 'Dublin North East', iro: 'John Murphy' },
  '24 Hour Care Services (Mid-West)': { branch: 'Clare', region: 'Mid-West, West and North West', iro: 'Sarah O’Brien' },
  '24 Hour Care Services (North West)': { branch: 'Sligo', region: 'Mid-West, West and North West', iro: 'Michael Gallagher' },
  'BLANCHARDSTOWN INSTITUTE OF TECHNOLOGY': { branch: 'Dublin Northern Branch', region: 'Dublin Mid Leinster', iro: 'Emma Byrne' },
  'CAREDOC (CORK)': { branch: 'Cork Vol/Private Branch', region: 'South - South East', iro: 'Patrick O’Sullivan' },
  'DUBLIN INSTITUTE OF TECHNOLOGY': { branch: 'Dublin South West Branch', region: 'Dublin Mid Leinster', iro: 'Aoife Kelly' },
  'GLENDALE NURSING HOME (TULLOW)': { branch: 'Carlow', region: 'South - South East', iro: 'Brian Doyle' },
  'HOME INSTEAD (WESTERN REGION)': { branch: 'Roscommon', region: 'West', iro: 'Fiona McDonagh' },
  'LETTERKENNY INSTITUTE OF TECHNOLOGY': { branch: 'Letterkenny', region: 'Letterkenny', iro: 'Seán Doherty' },
  'LIMERICK INSTITUTE OF TECHNOLOGY': { branch: 'Limerick', region: 'Limerick', iro: 'Niamh Ryan' },
  'SLIGO INSTITUTE OF TECHNOLOGY': { branch: 'Sligo', region: 'Sligo', iro: 'Conor Walsh' },
  'ST JOSEPHS HOSPITAL- MOUNT DESERT': { branch: 'Cork Vol/Private Branch', region: 'South - South East', iro: 'Mary O’Leary' },
  'TALLAGHT INSTITUTE OF TECHNOLOGY': { branch: 'Dublin South West Branch', region: 'Dublin Mid Leinster', iro: 'Kevin Nolan' },
  'Atu (Letterkenny)': { branch: 'Letterkenny', region: 'Letterkenny', iro: 'Claire McBride' },
  'Regional Centre Of Nursing & Midwifery Education': { branch: 'Offaly', region: 'Mid Leinster', iro: 'Tomás Flynn' },
  'Newtown School': { branch: 'Waterford', region: 'South - South East', iro: 'Ciara Hayes' },
  'Tipperary Education & Training Board': { branch: 'Tipperary-North-Mwhb', region: 'Mid-West, West and North West', iro: 'Shane Kennedy' },
  'National University Ireland Galway': { branch: 'Galway', region: 'Mid-West, West and North West', iro: 'Eimear Burke' },
  'South East Technological University (Setu)': { branch: 'Carlow', region: 'South - South East', iro: 'Paul Fitzgerald' },
  'Tud (Tallaght)': { branch: 'Dublin South West Branch', region: 'Dublin Mid Leinster', iro: 'Deirdre Roche' },
  'College Of Anaesthetists': { branch: 'Dublin South West Branch', region: 'Dublin Mid Leinster', iro: 'Liam Byrne' },
  'Tud (Blanchardstown)': { branch: 'Dublin Northern Branch', region: 'Dublin North East', iro: 'Siobhán Kavanagh' },
  'Gmit (Galway)': { branch: 'Galway', region: 'Mid-West, West and North West', iro: 'Cathal Moran' },
  'Cork University College': { branch: 'Cork Vol/Private Branch', region: 'South - South East', iro: 'Anna McCarthy' },
  'Mtu (Cork)': { branch: 'Cork Vol/Private Branch', region: 'South - South East', iro: 'Ronan Hayes' },
  Student: { branch: 'Student', region: 'Student', iro: 'Generic Student Rep' },
  'St Columbas College (Dublin)': { branch: 'Dublin East Coast Branch', region: 'Dublin Mid Leinster', iro: 'Eoin Brady' },
  'Setu (Waterford)': { branch: 'Waterford', region: 'South - South East', iro: 'Laura Keane' },
  'Nui Galway': { branch: 'Galway City', region: 'Mid-West, West and North West', iro: 'Mark Healy' },
  'Roscrea College': { branch: 'Tipperary-North-Mwhb', region: 'Mid-West, West and North West', iro: 'Orla Quinn' },
  'Dun Laoghaire Institute Of Art & Design': { branch: 'Dunlaoghaire', region: 'Dublin Mid Leinster', iro: 'James O’Connor' },
  'Mtu (Kerry)': { branch: 'Kerry', region: 'South - South East', iro: 'Aisling Daly' },
  'Tus (Limerick)': { branch: 'Limerick', region: 'Mid-West, West and North West', iro: 'Padraig O’Neill' },
  'Dundalk Institute Of Technology (Dkit)': { branch: 'Dundalk', region: 'Dublin North East', iro: 'Colm Reilly' },
  'Atu (Sligo)': { branch: 'Sligo', region: 'Mid-West, West and North West', iro: 'Gráinne McGowan' },
  'Tud (Bolton Street)': { branch: 'Dublin South West Branch', region: 'Dublin Mid Leinster', iro: 'Brendan Casey' },
  'Dublin City University': { branch: 'Dublin Northern Branch', region: 'Dublin North East', iro: 'Rachel Dwyer' },
  'National University Ireland Maynooth': { branch: 'Kildare/Naas', region: 'Dublin Mid Leinster', iro: 'Stephen Ward' },
  'University College Dublin': { branch: 'Dublin East Coast Branch', region: 'Dublin Mid Leinster', iro: 'Louise Byrne' },
  'Limerick University': { branch: 'Limerick', region: 'Limerick', iro: 'Declan O’Donnell' },
  'Trinity College': { branch: 'Dublin East Coast Branch', region: 'Dublin Mid Leinster', iro: 'Jennifer McMahon' },
  'St Angelas College (Sligo)': { branch: 'Sligo', region: 'Sligo', iro: 'Alan Sheridan' },
  'Royal College Of Surgeons': { branch: 'Dublin East Coast Branch', region: 'Dublin North East', iro: 'Caroline Byrne' },
  'Tus (Technological University Of The Shannon)': { branch: 'Athlone', region: 'Dublin North East', iro: 'Gerry Flanagan' },
  "Galway Mayo Institute Of Tech(C'Bar)": { branch: 'Castlebar', region: 'Mid-West, West and North West', iro: 'Donna Corcoran' },
};
const allBranches = Array.from(new Set(Object.values(workLocationDetails).map(d => d.branch)));
const allRegions = Array.from(new Set(Object.values(workLocationDetails).map(d => d.region)));
const grades = [
  'Junior',
  'Senior',
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

const ProfessionalDetails = ({ formData, onFormDataChange, showValidation }) => {

  const handleWorkLocationChange = (val) => {
    const details = workLocationDetails[val];
    onFormDataChange({
      ...formData,
      workLocation: val,
      branch: details?.branch || '',
      region: details?.region || '',
      ...(val !== 'Other' ? { otherWorkLocation: '' } : {}),
    });
  };

  const adaptationYes = formData?.nursingAdaptationProgramme === 'yes';
  const isRetired = !!formData?.isRetired || formData?.membershipCategory === 'Retired Associate';

  return (
    <View style={{ backgroundColor: Colors.surface }}>
      <Text style={styles.sectionTitle}>Professional Details</Text>
      {/* Membership Category */}
      <Text style={styles.label}>Membership Category *</Text>
      <View style={styles.pickerField}>
        <Picker
          selectedValue={formData.membershipCategory || membershipCategories[0]}
          onValueChange={val => onFormDataChange({ ...formData, membershipCategory: val })}
        >
          {membershipCategories.map(c => <Picker.Item key={c} label={c} value={c} />)}
        </Picker>
      </View>
      {/* Work Location & Other Work Location */}
      {/* <View style={styles.row}> */}
      <View style={styles.halfInput}>
        <Text style={styles.label}>Work Location *</Text>
        <View style={styles.pickerField}>
          <Picker
            selectedValue={formData.workLocation || workLocations[0]}
            onValueChange={handleWorkLocationChange}
          >
            {workLocations.map(w => <Picker.Item key={w} label={w} value={w} />)}
          </Picker>
        </View>
        {/* </View> */}
        <View style={styles.halfInput}>
          <Text style={styles.label}>Other Work Location</Text>
          <View style={styles.inputField}>
            <InputField
              value={formData.otherWorkLocation}
              editable={formData.workLocation !== 'Other'}
              holderTextColor={'#94A3B8'}
              onChange={text => onFormDataChange({ ...formData, otherWorkLocation: text })}
              placeholder="Enter your work other location"
            />
          </View>
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
            selectedValue={formData.grade || grades[0]}
            onValueChange={val => onFormDataChange({ ...formData, grade: val })}
          >
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