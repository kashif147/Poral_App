import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { pickerPresentDelayMs } from './documentPicker.helper';

/**
 * Source chooser — ActionSheet/Alert (not RN Modal), then delay before the
 * system picker (same iOS race mitigation as MemberHub / CustomImagePicker).
 */
export function chooseAttachSource(onSelect) {
  const select = source => {
    setTimeout(() => onSelect(source), pickerPresentDelayMs);
  };

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Camera', 'Photos', 'Files'],
        cancelButtonIndex: 0,
      },
      buttonIndex => {
        if (buttonIndex === 1) select('camera');
        else if (buttonIndex === 2) select('photos');
        else if (buttonIndex === 3) select('files');
      },
    );
    return;
  }

  Alert.alert('Upload files', 'Choose a source', [
    { text: 'Camera', onPress: () => select('camera') },
    { text: 'Photos', onPress: () => select('photos') },
    { text: 'Files', onPress: () => select('files') },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
