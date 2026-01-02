import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../utils/Styles';

const parseDdMmYyyy = (value) => {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(p => parseInt(p, 10));
  if (!dd || !mm || !yyyy) return null;
  const date = new Date(yyyy, mm - 1, dd);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDdMmYyyy = (date) => {
  if (!date) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

const parseISODate = (isoString) => {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
};

const formatToISO = (date) => {
  if (!date) return '';
  return date.toISOString();
};

const getAge = (date) => {
  if (!date) return 0;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
};

export const DatePicker = ({
  label,
  name,
  required = false,
  value,
  onChange,
  disableAgeValidation = false,
  showValidation = false,
  disabled = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const isEmpty = required && !value && showValidation;

  useEffect(() => {
    if (value) {
      let date = null;

      // Handle ISO date strings (e.g., "1998-08-12T19:00:00.000Z")
      if (typeof value === 'string' && value.includes('T')) {
        date = parseISODate(value);
      }
      // Handle "DD/MM/YYYY" format
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        date = parseDdMmYyyy(value);
      }
      // Handle "YYYY-MM-DD" format
      else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(x => parseInt(x, 10));
        date = new Date(y, m - 1, d);
      }

      setDisplayValue(date ? formatDdMmYyyy(date) : '');
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const validateAndPropagate = (dateObj) => {
    if (!dateObj) {
      setError('');
      onChange && onChange({ target: { name, value: '' } });
      return;
    }

    // Save in ISO format for API compatibility
    const isoValue = formatToISO(dateObj);
    const ddmmyyyy = formatDdMmYyyy(dateObj);

    if (!disableAgeValidation && getAge(dateObj) < 16) {
      setError('You must be 16 years or older to proceed');
    } else {
      setError('');
    }

    setDisplayValue(ddmmyyyy);
    onChange && onChange({ target: { name, value: isoValue, displayValue: ddmmyyyy } });
  };

  const handleChangeText = (text) => {
    // keep only digits
    const digits = (text || '').replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    for (let i = 0; i < digits.length; i += 1) {
      if (i === 2 || i === 4) formatted += '/';
      formatted += digits[i];
    }
    setDisplayValue(formatted);
    if (formatted.length === 10) {
      const date = parseDdMmYyyy(formatted);
      if (date) {
        validateAndPropagate(date);
      } else {
        setError('Invalid Date');
      }
    } else {
      setError('');
      // Only clear the value if we have no digits or if we're clearing the field
      if (digits.length === 0) {
        onChange && onChange({ target: { name, value: '' } });
      }
    }
  };

  const currentDate = useMemo(() => parseDdMmYyyy(displayValue) || new Date(), [displayValue]);

  return (
    <View style={{ marginBottom: 8 }}>
      {label ? (
        <Text style={{ fontWeight: '600', fontSize: 14, marginTop: 12, marginBottom: 8, color: isEmpty ? Colors.red : Colors.textPrimary }}>
          {label} {required ? '*' : ''} {isEmpty ? '(Required)' : ''}
        </Text>
      ) : null}
      <View style={{ position: 'relative' }}>
        <TextInput
          value={displayValue}
          onChangeText={disabled ? undefined : handleChangeText}
          placeholder="DD/MM/YYYY"
          maxLength={10}
          editable={!disabled}
          keyboardType="numeric"
          style={{
            borderWidth: isEmpty || error ? 2 : 1.5,
            borderColor: isEmpty || error ? Colors.red : '#E5E5E5',
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            paddingRight: 48,
            color: Colors.textPrimary,
            backgroundColor: Colors.white,
            height: 52,
            fontSize: 15,
            fontWeight: '400',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
          placeholderTextColor={Colors.textSecondary}
        />
        <Pressable
          onPress={() => !disabled && setOpen(true)}
          style={{ position: 'absolute', right: 12, top: 12, padding: 4 }}
          disabled={disabled}
        >
          <Text style={{ fontSize: 20, opacity: disabled ? 0.5 : 1 }}>📅</Text>
        </Pressable>
      </View>
      {!!error && <Text style={{ color: Colors.red, marginTop: 6, fontSize: 13 }}>{error}</Text>}
      {open && (
        Platform.OS === 'android' ? (
          <RNDateTimePicker
            value={currentDate}
            onChange={(e) => {
              if (e.type === 'dismissed') { setOpen(false); return; }
              const date = new Date(e.nativeEvent.timestamp);
              setOpen(false);
              validateAndPropagate(date);
            }}
            mode="date"
            display="spinner"
          />
        ) : (
          <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 12 }}>
                <RNDateTimePicker
                  value={currentDate}
                  onChange={(e) => {
                    if (e.type === 'dismissed') { return; }
                    const date = new Date(e.nativeEvent.timestamp);
                    validateAndPropagate(date);
                  }}
                  mode="date"
                  display="spinner"
                />
                <Pressable onPress={() => setOpen(false)} style={{ alignSelf: 'flex-end', padding: 8 }}>
                  <Text style={{ color: '#007bff' }}>Done</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )
      )}
    </View>
  );
};

export default DatePicker;


