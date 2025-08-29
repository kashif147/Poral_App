import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';

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
      // accept "DD/MM/YYYY" or ISO "YYYY-MM-DD"
      let date = null;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        date = parseDdMmYyyy(value);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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
    const iso = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const ddmmyyyy = formatDdMmYyyy(dateObj);
    if (!disableAgeValidation && getAge(dateObj) < 16) {
      setError('You must be 16 years or older to proceed');
    } else {
      setError('');
    }
    setDisplayValue(ddmmyyyy);
    onChange && onChange({ target: { name, value: ddmmyyyy, iso } });
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
      onChange && onChange({ target: { name, value: '' } });
    }
  };

  const currentDate = useMemo(() => parseDdMmYyyy(displayValue) || new Date(), [displayValue]);

  return (
    <View style={{ marginBottom: 8 }}>
      {label ? (
        <Text style={{ fontWeight: 'bold', marginBottom: 4, color: isEmpty ? 'red' : '#111' }}>
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
            borderWidth: 1,
            borderColor: isEmpty || error ? 'red' : '#E7E7E7',
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            color: '#111',
            height: 48,
          }}
        />
        <Pressable
          onPress={() => !disabled && setOpen(true)}
          style={{ position: 'absolute', right: 10, top: 10, padding: 8 }}
        >
          <Text>📅</Text>
        </Pressable>
      </View>
      {!!error && <Text style={{ color: 'red', marginTop: 4 }}>{error}</Text>}
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


