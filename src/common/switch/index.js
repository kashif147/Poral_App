import React from 'react';
import { Switch } from 'react-native';
import { Colors } from '../../utils/Styles';

const CustomSwitch = ({ value, onValueChange, ...props }) => {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.lightgray, true: Colors.primary }}
      thumbColor={value ? Colors.white : Colors.gray}
      ios_backgroundColor={Colors.lightgray}
      {...props}
    />
  );
};

export default CustomSwitch;
