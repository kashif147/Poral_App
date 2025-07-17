import { CommonActions } from '@react-navigation/native';
import moment from 'moment';
import { Alert, Linking, Platform } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
// import { allCountries } from 'country-telephone-data';
// import CryptoJS from 'crypto-js';
// import { createThumbnail } from 'react-native-create-thumbnail';

export const utils = {
  alert({ title, message }) {
    Alert.alert(title || 'Info', message);
  },

  isArrayEmpty(array) {
    return !Array.isArray(array) || array.length === 0;
  },

  isObjectEmpty(object) {
    return object && Object.keys(object).length === 0;
  },

  isStringEmpty(str) {
    return !str || str?.trim?.() === '';
  },

  checkObjectHasNullValue(object, objectsToDelete) {
    const copiedObj = JSON.parse(JSON.stringify(object));

    if (objectsToDelete) {
      objectsToDelete.forEach(key => {
        delete copiedObj[key];
      });
    }

    return Object.values(copiedObj).some(value =>
      [null, '', undefined].includes(value),
    );
  },

  resetAndGo(navigation, routeName, params) {
    if (navigation && !this.isStringEmpty(routeName)) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        }),
      );
    }
  },

  openNativeLink(url) {
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          this.console("Can't handle url: " + url);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(err => console.error('An error occurred', err));
  },

  openSettings() {
    Linking.openSettings();
  },

  async openLink(url, checkHttp = true) {
    if (!url) {
      this.console('URL is required');
      return;
    }
    if (checkHttp && !/^[a-zA-Z]+:\/\//.test(url)) {
      url = 'http://' + url;
    }

    try {
      const isAvailable = await InAppBrowser.isAvailable();
      if (isAvailable) {
        await InAppBrowser.open(url, {
          dismissButtonStyle: 'close',
          preferredBarTintColor: '#345E58',
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          showTitle: true,
          toolbarColor: '#345E58',
          secondaryToolbarColor: 'black',
          navigationBarColor: 'black',
          navigationBarDividerColor: 'white',
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
          animations: {
            startEnter: 'slide_in_right',
            startExit: 'slide_out_left',
            endEnter: 'slide_in_left',
            endExit: 'slide_out_right',
          },
        });
      } else {
        this.openNativeLink(url);
      }
    } catch (error) {
      this.console('Error opening InAppBrowser:', error);
      this.openNativeLink(url);
    }
  },

  detailAlert(title, description, confirmText, cancelText, onConfirmPress) {
    Alert.alert(title, description, [
      { text: cancelText },
      ...(!this.isStringEmpty(confirmText)
        ? [{ text: confirmText, onPress: () => onConfirmPress && onConfirmPress() }]
        : []),
    ]);
  },

  isLocalImage(imageUri) {
    return ['file://', 'content://', 'asset://', 'data:image/'].some(prefix =>
      imageUri.startsWith(prefix),
    );
  },

  checkLinkIsLive(url) {
    return url?.startsWith('http://') || url.startsWith('https://');
  },

  isIOS() {
    return Platform.OS === 'ios';
  },

  console(message, optionalParams) {
    if (__DEV__) {
      optionalParams ? console.log(message, optionalParams) : console.log(message);
    }
  },

  checkPasswordCriteria(password) {
    const hasMinimumLength = password?.length >= 8;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);

    const criteriaMet = [
      { text: 'At least 8 characters long', met: hasMinimumLength },
      { text: 'Combination of letters and numbers', met: hasLetters && hasNumbers },
    ];

    return criteriaMet.map(criterion => ({
      text: criterion.text,
      isError: !criterion.met,
    }));
  },

  addZeroBeforeNumber(number, length) {
    return String(number).padStart(length, '0');
  },

  getMomentDate(date, type) {
    return moment(date).format(type);
  },

  formatFSDate(date, format) {
    if (date && format) {
      return moment(date.seconds * 1000).format(format);
    }
    return '';
  },

  countDaysFromTodayToDate(tillDate) {
    const today = moment();
    const endDate = moment(tillDate);
    return endDate.diff(today, 'days');
  },

  getAuthProviderFromProviderData(providerData) {
    if (!this.isArrayEmpty(providerData)) {
      const providerId = providerData?.[0]?.providerId ?? '';

      return ['password', 'phone'].includes(providerId)
        ? 'email'
        : providerId === 'google.com'
        ? 'google'
        : providerId === 'facebook.com'
        ? 'facebook'
        : providerId === 'apple.com'
        ? 'apple'
        : providerId === 'linkedin.com'
        ? 'linkedin'
        : '';
    }
    return '';
  },

  getDummyUserImageByName(name) {
    return `https://ui-avatars.com/api/?name=${name}&length=1&background=345E58&color=ffffff&size=150&font-size=0.5`;
  },

  getFullNameFromUserData(userData, onlyFirstName) {
    if (onlyFirstName) {
      return this.isStringEmpty(userData?.firstName) ? 'CollabMind' : userData?.firstName;
    }
    return `${this.isStringEmpty(userData?.firstName) ? 'CollabMind' : userData?.firstName} ${
      this.isStringEmpty(userData?.lastName) ? 'User' : userData?.lastName
    }`;
  },

  getInitialsFromName(userData) {
    const { firstName, lastName } = userData;
    if (!firstName || !lastName) return '';
    return firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
  },

  getPlatformSpecificUri(url) {
    return Platform.OS === 'ios' ? url?.replace('file://', '') : url;
  },

  isValidEmail(email) {
    var re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  },

  secondsToMinutesFormat(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      this.console('Invalid input. Please provide a non-negative number of seconds.');
      return seconds;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${this.addZeroBeforeNumber(minutes, 1)}:${this.addZeroBeforeNumber(remainingSeconds, 2)}`;
  },

  generateSixDigitUniqueCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  normalizePhoneNumber(number, defaultCountryCode) {
    let formatted = number.replace(/[\s-()]/g, '');
    if (!formatted.startsWith('+')) {
      formatted = `${defaultCountryCode || ''}${formatted}`;
    }
    return formatted;
  },

  chunkArrayIfIDsMaxLengthReached(array, size = 30) {
    return new Promise(resolve => {
      const chunks = array.reduce((result, item, index) => {
        const chunkIndex = Math.floor(index / size);
        if (!result[chunkIndex]) result[chunkIndex] = [];
        result[chunkIndex].push(item);
        return result;
      }, []);
      resolve(chunks);
    });
  },

  splitPhoneNumber(formattedNumber) {
    if (!formattedNumber.includes('-')) {
      throw new Error('Invalid phone number format. Expected format: +<country code>-<phone number>');
    }

    const [code, number] = formattedNumber.split('-');
    return { code, number };
  },

  async countryCode(code) {
    const countryCode = code.replace('+', '');
    const country = await allCountries.find(c => c.dialCode === countryCode);
    return country?.iso2.toUpperCase();
  },

  generate16DigitNumber(email) {
    // const hash = CryptoJS.SHA256(email).toString(CryptoJS.enc.Hex);
    // let uid = hash.substring(0, 28);
    // if (hash.length > 28) {
    //   uid = hash.substring(0, 14) + hash.substring(hash.length - 14);
    // }
    // return uid;
    return email; // Placeholder if CryptoJS is commented
  },

  reachedProjectCreationLimit(createdProjects, projectsLimit, displayMessage = true) {
    const limitReached = projectsLimit !== 'unlimited' && createdProjects >= projectsLimit;
    if (displayMessage && limitReached) {
      this.alert({
        title: 'Warning!',
        message: 'You have reached your projects limit.',
      });
    }
    return limitReached;
  },

  reachedFileStorageLimit(uploadedDocuments, storageLimit, displayMessage = true) {
    const usedStorage = uploadedDocuments?.reduce((sum, doc) => sum + doc.size, 0) ?? 0;
    const limitReached = usedStorage >= storageLimit;

    if (displayMessage && limitReached) {
      this.alert({
        title: 'Warning!',
        message: 'You have reached your file storage limit.',
      });
    }
    return limitReached;
  },

  fallingAnimateRange(count) {
    const array = [];
    for (let i = 0; i < count; i++) array.push(i);
    return array;
  },

  getImageDelay(index) {
    return index === 0 ? 2000 : index === 1 ? 4000 : 6000;
  },

  calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0;
    const total = ratings.reduce((sum, item) => sum + item.rating, 0);
    return total / ratings.length;
  },

  openEmailLink(url) {
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          this.console("Can't handle url: " + url);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(err => console.error('An error occurred', err));
  },

  deconstructPhoneNumber(phoneNumber) {
    if (!phoneNumber) return { countryCode: '', mobileNumber: phoneNumber, countryISO: '' };

    for (let country of allCountries) {
      const { dialCode, iso2 } = country;
      const regex = new RegExp(`^\\+${dialCode}\\s?`);

      if (regex.test(phoneNumber)) {
        return {
          countryCode: `+${dialCode}`,
          mobileNumber: phoneNumber.replace(regex, '').trim(),
          countryISO: iso2.toUpperCase(),
        };
      }
    }
    return { countryCode: '', mobileNumber: phoneNumber, countryISO: '' };
  },

  parsePhoneNumber(phoneNumber) {
    if (!phoneNumber) return { countryCode: '', mobileNumber: '', countryISO: '' };

    const parsed = parsePhoneNumberFromString(phoneNumber);
    if (parsed) {
      return {
        countryCode: `+${parsed.countryCallingCode}`,
        mobileNumber: parsed.nationalNumber,
        countryISO: parsed.country || '',
      };
    }
    return { countryCode: '', mobileNumber: phoneNumber, countryISO: '' };
  },


};
