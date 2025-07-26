import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LocalSvg } from 'react-native-svg/css';
import { styles } from './styles';
import { Button } from '../button';
import { Colors, form } from '../../utils/Styles';
import { Label } from '../text/label';

export const InputField = ({
  bgStyle,
  keyboardType,
  textStyle,
  value,
  maxLength,
  icon1,
  icon2,
  secureTextEntry,
  placeholder,
  sign,
  TextInputRef,
  onChange,
  onSubmit,
  index,
  field,
  title,
  editable,
  checkValue,
  onpressIcon,
  icon3,
  formData,
  numberOfLines,
  multiline,
  icon4,
  holderTextColor,
  buttonTitle,
  btnStyle,
  btnText,
  pressIcon4,
  pressIcon3,
  onpressButton,
  loading,
  pressIn,
  autoCapitalize,
  ...props
}) => {
  return (
    <View style={[styles.textinputContainer, bgStyle, checkValue && { borderColor: Colors.red }]}>
      {sign && <Text style={styles.textStyle}> $ </Text>}
      {icon1 && <LocalSvg style={styles.svgStyle} asset={icon1} />}
      <TextInput
        textAlignVertical="top"
        ref={TextInputRef}
        onPressIn={pressIn}
        style={{
          ...form.inputText,
          ...textStyle,
          color: checkValue
            ? Colors.red
            : formData
              ? Colors.white
              : editable
                ? Colors.grey
                : Colors.black,
        }}
        value={value}
        selectionColor={Colors.gray}
        {...props}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        // numberOfLines={numberOfLines}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={
          holderTextColor ? holderTextColor : Colors.grey500
        }
        autoCapitalize={
          keyboardType === 'email-address'
            ? 'none'
            : autoCapitalize
              ? autoCapitalize
              : 'sentences'
        }
        onChangeText={txt => onChange && onChange(txt, index, field)}
        onSubmitEditing={() => onSubmit && onSubmit()}
        editable={!editable}
        maxLength={maxLength}
        numberOfLines={numberOfLines}
        {...(Platform.OS === 'ios' &&
          numberOfLines && { height: 11 * numberOfLines })}
      />
      {buttonTitle && (
        <Button
          title={buttonTitle}
          style={btnStyle}
          textStyle={btnText}
          onPress={onpressButton}
        />
      )}

      {title ? (
        <TouchableOpacity onPress={pressIcon4} style={styles.pressicon4}>
          <Label style={styles.titleStyle}>{title}</Label>
          {icon4 && <LocalSvg asset={icon4} />}
        </TouchableOpacity>
      ) : (
        icon3 && (
          <LocalSvg
            style={styles.smallMargin}
            asset={icon3}
            onPress={pressIcon3}
          />
        )
      )}
      {icon2 && <LocalSvg asset={icon2} onPress={onpressIcon} />}
      {loading && <ActivityIndicator size="small" color={Colors.blueStream} />}
    </View>
  );
};
