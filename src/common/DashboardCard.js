import React from 'react';
import { View } from 'react-native';
import { Label } from './text/label';
import { Button } from './button';
import { LocalSvg } from 'react-native-svg/css';

export const DashboardCard = ({
  icon,
  title,
  description,
  button,
  onPress,
  style,
}) => (
  <View
    style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      alignItems: 'center',
      ...style,
    }}
  >
    <View style={{ marginBottom: 16 }}>
      <LocalSvg asset={icon} width={40} height={40} />
    </View>
    <Label style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' }}>
      {title}
    </Label>
    <Label style={{ color: '#666', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
      {description}
    </Label>
    <Button
      title={button}
      onPress={onPress}
      style={{ backgroundColor: '#559EF8', borderRadius: 8, minWidth: 140 }}
      textStyle={{ color: '#fff', fontWeight: 'bold' }}
    />
  </View>
); 