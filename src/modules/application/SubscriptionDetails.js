import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { InputField } from '../../common/inputField';
import Picker from '../../common/picker';
import SearchablePicker from '../../common/SearchablePicker';
import { Colors, wp } from '../../utils/Styles';
import { useLookup } from '../../contexts/lookupContext';
import { useProfile } from '../../contexts/profileContext';
import { getPaymentFormPrefill } from '../../api/paymentForms.api';
import {
  extractPaymentFormPrefill,
  getOrganizationNameFromPrefill,
  isPaymentApiSuccess,
} from '../../helpers/paymentForm.helper';
import { calculateAgeFromDateOfBirth } from '../../helpers/date.helper';
import {
  getDefaultFrequencyForPaymentType,
  getFrequencyOptionsForPaymentType,
  getPaymentFrequencyCategory,
  getPriceForFrequency,
  getSubscriptionFeeLabel,
  isSalaryDeductionPaymentType,
  workLocationAllowsSalaryDeduction,
} from '../../helpers/subscriptionPricing.helper';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Fallback payment types if lookups not loaded yet
const paymentTypes = ['Deduction at Source', 'Credit Card'];

// Format price - convert from cents to currency
const formatPrice = (priceInCents, currency = 'EUR') => {
  if (!priceInCents || priceInCents === 0) return '€0.00';
  const priceInEuros = priceInCents / 100;
  const currencySymbol =
    currency.toUpperCase() === 'EUR' ? '€' : currency.toUpperCase();
  return `${currencySymbol}${priceInEuros.toFixed(2)}`;
};

const SubscriptionDetails = ({
  formData,
  onFormDataChange,
  showValidation = false,
  categoryData = null,
  dateOfBirth = '',
  workLocation = '',
}) => {
  const { profileDetail } = useProfile();
  const [organizationName, setOrganizationName] = useState('');
  const {
    primarySectionLookups,
    secondarySectionLookups,
    paymentTypeLookups,
    youthForumLookups,
    workLocationLookups,
  } = useLookup() || {};

  const memberAge = calculateAgeFromDateOfBirth(dateOfBirth);
  const isUnder35 = memberAge !== null && memberAge < 35;
  const isNewOrGraduate =
    formData?.memberStatus === 'new' || formData?.memberStatus === 'graduate';
  const isRejoinOrCareerBreak =
    formData?.memberStatus === 'rejoin' ||
    formData?.memberStatus === 'careerBreak';

  useEffect(() => {
    let cancelled = false;

    const loadOrganizationName = async () => {
      const profileId = profileDetail?.profileId;
      if (!profileId) return;

      try {
        const response = await getPaymentFormPrefill(profileId);
        if (cancelled || !isPaymentApiSuccess(response)) return;

        const prefill = extractPaymentFormPrefill(response);
        const name = getOrganizationNameFromPrefill(prefill);
        if (name) setOrganizationName(name);
      } catch (error) {
        console.error('Failed to load organization name from prefill:', error);
      }
    };

    loadOrganizationName();

    return () => {
      cancelled = true;
    };
  }, [profileDetail?.profileId]);

  const allowSalaryDeduction = workLocationAllowsSalaryDeduction(
    workLocation,
    workLocationLookups,
  );

  // Context handles fetching lookups centrally - no need to fetch here
  // categoryData is now passed as prop from Application.js (matching web version)

  const primaryNames = useMemo(() => {
    const names = (primarySectionLookups || [])
      .map(s => s?.DisplayName || s?.lookupname)
      .filter(Boolean);
    console.log('📋 Primary section names:', names.length);
    return names;
  }, [primarySectionLookups]);

  const secondaryNames = useMemo(() => {
    const names = (secondarySectionLookups || [])
      .map(s => s?.DisplayName || s?.lookupname)
      .filter(Boolean);
    console.log('📋 Secondary section names:', names.length);
    return names;
  }, [secondarySectionLookups]);

  const paymentOptions = useMemo(() => {
    const options = (paymentTypeLookups || [])
      .map(l => ({
        value: l?.DisplayName || l?.lookupname || '',
        label: l?.DisplayName || l?.lookupname || '',
        code: l?.code,
      }))
      .filter(option => {
        if (!option.value) return false;
        if (isSalaryDeductionPaymentType(option.value)) {
          return allowSalaryDeduction;
        }
        return true;
      });
    return options;
  }, [paymentTypeLookups, allowSalaryDeduction]);

  const youthForumOptions = useMemo(
    () =>
      (youthForumLookups || [])
        .map(l => ({
          value: l?.DisplayName || l?.lookupname || '',
          label: l?.DisplayName || l?.lookupname || '',
        }))
        .filter(option => option.value),
    [youthForumLookups],
  );

  const paymentFrequencyCategory = getPaymentFrequencyCategory(
    formData?.paymentType,
  );
  const frequencyOptions = getFrequencyOptionsForPaymentType(
    formData?.paymentType,
  );
  const isFrequencyAutoAnnual = paymentFrequencyCategory === 'annual';
  const showFrequencyDropdown = Boolean(paymentFrequencyCategory);
  const selectedFrequency =
    formData?.paymentFrequency ||
    getDefaultFrequencyForPaymentType(formData?.paymentType) ||
    'Annually';
  const selectedPricing = getPriceForFrequency(
    categoryData,
    selectedFrequency || 'Annually',
  );
  const displayPrice = selectedPricing?.price;
  const displayCurrency =
    selectedPricing?.currency ||
    categoryData?.currentPricing?.currency ||
    'EUR';
  const feeLabel = getSubscriptionFeeLabel(selectedFrequency);

  useEffect(() => {
    if (
      !formData?.paymentType ||
      !isSalaryDeductionPaymentType(formData.paymentType) ||
      allowSalaryDeduction
    ) {
      return;
    }

    onFormDataChange({
      ...formData,
      paymentType: '',
      paymentFrequency: '',
      payrollNo: '',
    });
  }, [allowSalaryDeduction, workLocation]);

  useEffect(() => {
    if (!formData?.paymentType || !paymentFrequencyCategory) return;

    const defaultFrequency = getDefaultFrequencyForPaymentType(
      formData.paymentType,
    );
    const validFrequencies = getFrequencyOptionsForPaymentType(
      formData.paymentType,
    ).map(option => option.value);
    const currentFrequency = formData?.paymentFrequency;

    if (paymentFrequencyCategory === 'annual') {
      if (currentFrequency !== 'Annually') {
        onFormDataChange({
          ...formData,
          paymentFrequency: 'Annually',
        });
      }
      return;
    }

    if (!validFrequencies.includes(currentFrequency)) {
      onFormDataChange({
        ...formData,
        paymentFrequency: defaultFrequency,
      });
    }
  }, [formData?.paymentType, paymentFrequencyCategory]);

  const requiresPayrollNo = paymentType =>
    isSalaryDeductionPaymentType(paymentType);

  return (
    <View
      style={{
        backgroundColor: Colors.background,
        paddingBottom: 16,
        paddingTop: 4,
      }}
    >
      {/* Your Subscription Fees Section */}
      {categoryData && (
        <View style={styles.pricingCard}>
          <View style={styles.pricingContent}>
            <View style={styles.pricingLeft}>
              <Ionicons name="cash-outline" size={22} color="#FFFFFF" />

              <View style={styles.pricingTextContainer}>
                <Text style={styles.pricingTitle}>Your Subscription Fees</Text>
                <Text style={styles.pricingSubtitle}>
                  Based on the {categoryData?.name || 'selected'} membership
                </Text>
              </View>
            </View>
            <View style={styles.pricingRight}>
              <Text style={styles.pricingLabel}>{feeLabel}</Text>
              {displayPrice ? (
                <Text style={styles.pricingValue}>
                  {formatPrice(displayPrice, displayCurrency)}
                </Text>
              ) : (
                <Text style={styles.pricingValue}>€0.00</Text>
              )}
              {formData?.paymentType && selectedFrequency ? (
                <Text style={styles.pricingFrequency}>
                  Payment frequency: {selectedFrequency}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      )}
      {/* Payment Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Information</Text>

        {/* Payment Type */}
        <Text style={styles.label}>Payment Type *</Text>
        <View
          style={[
            styles.pickerField,
            showValidation &&
              !formData.paymentType && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 12,
              },
          ]}
        >
          <Picker
            selectedValue={formData.paymentType || ''}
            onValueChange={val => {
              if (val) {
                const oldPaymentType = formData?.paymentType;
                const newPaymentType = val;
                const defaultFrequency =
                  getDefaultFrequencyForPaymentType(newPaymentType);

                onFormDataChange({
                  ...formData,
                  paymentType: newPaymentType,
                  paymentFrequency: defaultFrequency,
                  payrollNo:
                    requiresPayrollNo(oldPaymentType) &&
                    !requiresPayrollNo(newPaymentType)
                      ? ''
                      : formData?.payrollNo || '',
                });
              }
            }}
          >
            <Picker.Item label="Select payment type" value="" />
            {paymentOptions.length > 0
              ? paymentOptions.map(option => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))
              : paymentTypes
                  .filter(
                    t =>
                      !isSalaryDeductionPaymentType(t) || allowSalaryDeduction,
                  )
                  .map(t => (
                    <Picker.Item key={t} label={t} value={t} />
                  ))}
          </Picker>
        </View>

        {showFrequencyDropdown && (
          <>
            <Text style={styles.label}>Payment Frequency *</Text>
            <View
              style={[
                styles.pickerField,
                showValidation &&
                  !selectedFrequency && {
                    borderColor: Colors.red,
                    borderWidth: 1,
                    borderRadius: 12,
                  },
              ]}
            >
              <Picker
                selectedValue={selectedFrequency}
                enabled={!isFrequencyAutoAnnual}
                onValueChange={val => {
                  if (val) {
                    onFormDataChange({ ...formData, paymentFrequency: val });
                  }
                }}
              >
                {(isFrequencyAutoAnnual
                  ? [{ value: 'Annually', label: 'Annually' }]
                  : frequencyOptions
                ).map(option => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </>
        )}

        {/* Payroll No */}
        <Text style={styles.label}>
          Payroll No {requiresPayrollNo(formData.paymentType) && '*'}
        </Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.payrollNo}
            editable={requiresPayrollNo(formData.paymentType)}
            checkValue={
              showValidation &&
              requiresPayrollNo(formData.paymentType) &&
              !formData.payrollNo
            }
            holderTextColor={'#94A3B8'}
            onChange={text =>
              onFormDataChange({ ...formData, payrollNo: text })
            }
            placeholder="Enter your payroll number"
          />
        </View>
      </View>

      {/* Member Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {organizationName ? `${organizationName} Rewards` : 'Member Status'}
        </Text>

        <Text style={styles.radioGroupLabel}>
          Please select the most appropriate option below *
        </Text>
        <View
          style={[
            styles.radioGroupVertical,
            showValidation &&
              !formData.memberStatus && {
                borderColor: Colors.red,
                borderWidth: 1,
                borderRadius: 12,
              },
          ]}
        >
          {[
            { value: 'new', label: 'New member' },
            { value: 'graduate', label: 'Newly graduated' },
            {
              value: 'rejoin',
              label: `Rejoining (Previous ${organizationName} Member)`,
            },
            { value: 'careerBreak', label: 'Returning from career break' },
            { value: 'nursingAbroad', label: 'Returning from nursing abroad' },
          ].map(status => {
            const isSelected = formData.memberStatus === status.value;
            return (
              <TouchableOpacity
                key={status.value}
                style={styles.radioOption}
                onPress={() => {
                  const updatedData = {
                    ...formData,
                    memberStatus: status.value,
                    exclusiveDiscountsAndOffers: false,
                    incomeProtectionScheme: false,
                    inmoRewards: false,
                    otherIrishTradeUnion: '',
                    otherIrishTradeUnionName: '',
                    otherScheme: '',
                    previousMembershipNumber: '',
                  };
                  onFormDataChange(updatedData);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={styles.radioOptionLabel}>{status.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isRejoinOrCareerBreak && (
          <View style={styles.inputField}>
            <Text style={styles.label}>Membership Number</Text>
            <InputField
              value={formData.previousMembershipNumber || ''}
              holderTextColor={'#94A3B8'}
              onChange={text =>
                onFormDataChange({
                  ...formData,
                  previousMembershipNumber: text,
                })
              }
              placeholder="Enter previous membership number (optional)"
            />
          </View>
        )}

        {/* Conditional checkboxes for new members */}
        {formData?.memberStatus === 'new' && (
          <View style={styles.conditionalCheckboxContainer}>
            <Text style={styles.conditionalCheckboxTitle}>
              Additional Options for New Members
            </Text>
            {formData?.otherScheme === 'no' && (
              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() =>
                  onFormDataChange({
                    ...formData,
                    inmoRewards: !formData?.inmoRewards,
                  })
                }
              >
                <View
                  style={[
                    styles.checkboxBox,
                    formData?.inmoRewards && styles.checkboxBoxChecked,
                  ]}
                >
                  {formData?.inmoRewards ? (
                    <Text style={styles.checkboxTick}>✓</Text>
                  ) : null}
                </View>
                <View style={styles.checkboxLabelContainer}>
                  <Text style={styles.checkboxLabelBold}>
                    Tick here to join{' '}
                    <Text
                      style={styles.link}
                      onPress={() =>
                        Linking.openURL('https://cornmarket.ie/rewards')
                      }
                    >
                      Rewards
                    </Text>{' '}
                    for INMO members
                  </Text>
                  <Text style={styles.checkboxLabelSubtext}>
                    By ticking here, you confirm that you agree to the Terms &
                    Conditions available on{' '}
                    <Text
                      style={styles.link}
                      onPress={() =>
                        Linking.openURL(
                          'https://cornmarket.ie/rewards-club-terms',
                        )
                      }
                    >
                      Cornmarket.ie/rewards-club-terms
                    </Text>{' '}
                    and the Data Protection Statement available on{' '}
                    <Text
                      style={styles.link}
                      onPress={() =>
                        Linking.openURL('https://cornmarket.ie/rewards-dps')
                      }
                    >
                      Cornmarket.ie/rewards-dps
                    </Text>
                    . Cornmarket will contact you about your Rewards Benefits.
                    You can opt out at any time.
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Conditional checkboxes for newly graduated */}
        {formData?.otherScheme === 'no' &&
          formData?.memberStatus === 'graduate' && (
            <View style={styles.conditionalCheckboxContainer}>
              <Text style={styles.conditionalCheckboxTitle}>
                Additional Options for Newly Graduated Members
              </Text>
              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() =>
                  onFormDataChange({
                    ...formData,
                    exclusiveDiscountsAndOffers:
                      !formData?.exclusiveDiscountsAndOffers,
                  })
                }
              >
                <View
                  style={[
                    styles.checkboxBox,
                    formData?.exclusiveDiscountsAndOffers &&
                      styles.checkboxBoxChecked,
                  ]}
                >
                  {formData?.exclusiveDiscountsAndOffers ? (
                    <Text style={styles.checkboxTick}>✓</Text>
                  ) : null}
                </View>
                <Text style={styles.checkboxLabelBold}>
                  Would you like to hear about exclusive discounts and offers
                  for INMO members?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() =>
                  onFormDataChange({
                    ...formData,
                    incomeProtectionScheme: !formData?.incomeProtectionScheme,
                  })
                }
              >
                <View
                  style={[
                    styles.checkboxBox,
                    formData?.incomeProtectionScheme &&
                      styles.checkboxBoxChecked,
                  ]}
                >
                  {formData?.incomeProtectionScheme ? (
                    <Text style={styles.checkboxTick}>✓</Text>
                  ) : null}
                </View>
                <View style={styles.checkboxLabelContainer}>
                  <Text style={styles.checkboxLabelBold}>
                    I consent to{' '}
                    <Text
                      style={styles.link}
                      onPress={() =>
                        Linking.openURL(
                          'https://cornmarket.ie/income-protection',
                        )
                      }
                    >
                      INMO Income Protection Scheme
                    </Text>
                    .
                  </Text>
                  <Text style={styles.checkboxLabelSubtext}>
                    By selecting 'I consent' below, you are agreeing to the
                    INMO, sharing your Trade Union membership details with
                    Cornmarket. Cornmarket as Scheme Administrator will process
                    and retain details of your Trade Union membership for the
                    purposes of assessing eligibility and admitting eligible
                    members (automatically) to the Income Protection Scheme
                    (with 9 Months' Free Cover), and for the ongoing
                    administration of the Scheme. Where you have also opted in
                    to receiving marketing communications, Cornmarket will
                    provide you with information on discounts and offers they
                    have for INMO members. This consent can be withdrawn at any
                    time by emailing Cornmarket at dataprotection@cornmarket.ie.
                    Please note, if you do consent below, your data will be
                    shared with Cornmarket, and you will be assessed for
                    eligibility for automatic Income Protection Scheme
                    membership. If you do not consent, your data will not be
                    shared with Cornmarket for this purpose, you will not be
                    assessed for automatic Scheme membership (including 9
                    Months' Free Cover) and you will have to contact Cornmarket
                    separately should you wish to apply for Scheme membership.
                    This offer will run on a pilot basis. Terms and conditions
                    apply and are subject to change.
                  </Text>
                  <Text style={styles.checkboxLabelImportant}>
                    Important: If you do not give your consent, your Trade union
                    membership data will not be shared with Cornmarket for this
                    purpose. This means you will not be assessed for Automatic
                    Access to the Scheme.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
      </View>

      {isNewOrGraduate && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Memberships</Text>
          <Text style={styles.radioGroupLabel}>
            Are you a member of another Trade Union? If yes, which Union? *
          </Text>
          <View
            style={[
              showValidation &&
                !formData.otherIrishTradeUnion && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                },
            ]}
          >
            <View style={styles.radioRow}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => {
                  onFormDataChange({
                    ...formData,
                    otherIrishTradeUnion: 'yes',
                  });
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    formData.otherIrishTradeUnion === 'yes' &&
                      styles.radioCircleSelected,
                  ]}
                >
                  {formData.otherIrishTradeUnion === 'yes' && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioOptionLabel}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => {
                  onFormDataChange({
                    ...formData,
                    otherIrishTradeUnion: 'no',
                    otherIrishTradeUnionName: '', // Clear union name when "no" is selected
                  });
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    formData.otherIrishTradeUnion === 'no' &&
                      styles.radioCircleSelected,
                  ]}
                >
                  {formData.otherIrishTradeUnion === 'no' && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioOptionLabel}>No</Text>
              </TouchableOpacity>
            </View>
            {formData.otherIrishTradeUnion === 'yes' && (
              <View style={styles.inputField}>
                <Text style={styles.label}>If yes, which Union? *</Text>
                <InputField
                  value={formData.otherIrishTradeUnionName || ''}
                  checkValue={
                    showValidation &&
                    formData.otherIrishTradeUnion === 'yes' &&
                    !formData.otherIrishTradeUnionName
                  }
                  holderTextColor={'#94A3B8'}
                  onChange={text =>
                    onFormDataChange({
                      ...formData,
                      otherIrishTradeUnionName: text,
                    })
                  }
                  placeholder="Enter Union Name"
                />
              </View>
            )}
          </View>

          <Text style={styles.radioGroupLabel}>
            Are you or were you a member of another Irish trade Union salary or
            Income Protection Scheme? *
          </Text>
          <View
            style={[
              showValidation &&
                !formData.otherScheme && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                },
            ]}
          >
            <View style={styles.radioRow}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() =>
                  onFormDataChange({
                    ...formData,
                    otherScheme: 'yes',
                    inmoRewards: false,
                    exclusiveDiscountsAndOffers: false,
                    incomeProtectionScheme: false,
                  })
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    formData.otherScheme === 'yes' &&
                      styles.radioCircleSelected,
                  ]}
                >
                  {formData.otherScheme === 'yes' && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioOptionLabel}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() =>
                  onFormDataChange({ ...formData, otherScheme: 'no' })
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    formData.otherScheme === 'no' && styles.radioCircleSelected,
                  ]}
                >
                  {formData.otherScheme === 'no' && (
                    <View style={styles.radioInnerCircle} />
                  )}
                </View>
                <Text style={styles.radioOptionLabel}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {isUnder35 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Youth Forum</Text>
          <Text style={styles.radioGroupLabel}>
            Available to members under 35 years of age.
          </Text>

          <Text style={styles.radioGroupLabel}>
            Would you like to join Youth Forum? *
          </Text>
          <View
            style={[
              styles.radioRow,
              showValidation &&
                !formData.joinYouthForum && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                },
            ]}
          >
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() =>
                onFormDataChange({
                  ...formData,
                  joinYouthForum: 'yes',
                  youthForum: formData?.youthForum || '',
                })
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioCircle,
                  formData.joinYouthForum === 'yes' &&
                    styles.radioCircleSelected,
                ]}
              >
                {formData.joinYouthForum === 'yes' && (
                  <View style={styles.radioInnerCircle} />
                )}
              </View>
              <Text style={styles.radioOptionLabel}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() =>
                onFormDataChange({
                  ...formData,
                  joinYouthForum: 'no',
                  youthForum: '',
                })
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioCircle,
                  formData.joinYouthForum === 'no' &&
                    styles.radioCircleSelected,
                ]}
              >
                {formData.joinYouthForum === 'no' && (
                  <View style={styles.radioInnerCircle} />
                )}
              </View>
              <Text style={styles.radioOptionLabel}>No</Text>
            </TouchableOpacity>
          </View>

          {formData?.joinYouthForum === 'yes' && (
            <>
              <Text style={styles.label}>Youth Forum *</Text>
              <View
                style={[
                  styles.pickerField,
                  showValidation &&
                    !formData.youthForum && {
                      borderColor: Colors.red,
                      borderWidth: 1,
                      borderRadius: 12,
                    },
                ]}
              >
                <Picker
                  selectedValue={formData.youthForum || ''}
                  onValueChange={val => {
                    if (val) {
                      onFormDataChange({ ...formData, youthForum: val });
                    }
                  }}
                >
                  <Picker.Item label="Select Youth Forum" value="" />
                  {youthForumOptions.map(option => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </>
          )}
        </View>
      )}

      {/* Recruitment Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recruitment Details</Text>

        {/* Recruited By */}
        <Text style={styles.label}>Recruited By</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.recuritedBy || ''}
            holderTextColor={'#94A3B8'}
            onChange={text =>
              onFormDataChange({
                ...formData,
                recuritedBy: text,
                recruitedBy: text,
              })
            }
            placeholder="Enter Name"
          />
        </View>

        {/* Recruited By Membership No */}
        <Text style={styles.label}>Recruited By (Membership No)</Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.recuritedByMembershipNo || ''}
            holderTextColor={'#94A3B8'}
            onChange={text =>
              onFormDataChange({
                ...formData,
                recuritedByMembershipNo: text,
                recruitedByMembershipNo: text,
              })
            }
            placeholder="Enter Membership No"
          />
        </View>
      </View>

      {/* Section Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Section Details</Text>

        {/* Primary Section */}
        <Text style={styles.label}>Primary Section</Text>
        <View style={styles.pickerField}>
          <SearchablePicker
            items={[
              ...primaryNames.map(name => ({ label: name, value: name })),
              { label: 'Other', value: 'other' },
            ]}
            selectedValue={formData.primarySection || ''}
            onValueChange={val => {
              if (val) {
                onFormDataChange({
                  ...formData,
                  primarySection: val,
                  ...(val !== 'other' ? { otherPrimarySection: '' } : {}),
                });
              }
            }}
            placeholder="Select primary section"
          />
        </View>

        {/* Other Primary Section */}
        <Text style={styles.label}>
          Other Primary Section {formData.primarySection === 'other' && '*'}
        </Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.otherPrimarySection || ''}
            editable={formData.primarySection === 'other'}
            checkValue={
              showValidation &&
              (formData.primarySection === 'other' ||
                formData.primarySection === 'Other') &&
              !formData.otherPrimarySection
            }
            holderTextColor={'#94A3B8'}
            onChange={text =>
              onFormDataChange({ ...formData, otherPrimarySection: text })
            }
            placeholder="Specify primary section"
          />
        </View>

        {/* Secondary Section */}
        <Text style={styles.label}>Secondary Section</Text>
        <View style={styles.pickerField}>
          <SearchablePicker
            items={[
              ...secondaryNames.map(name => ({ label: name, value: name })),
              { label: 'Other', value: 'other' },
            ]}
            selectedValue={formData.secondarySection || ''}
            onValueChange={val => {
              if (val) {
                onFormDataChange({
                  ...formData,
                  secondarySection: val,
                  ...(val !== 'other' ? { otherSecondarySection: '' } : {}),
                });
              }
            }}
            placeholder="Select secondary section"
          />
        </View>

        {/* Other Secondary Section */}
        <Text style={styles.label}>
          Other Secondary Section {formData.secondarySection === 'other' && '*'}
        </Text>
        <View style={styles.inputField}>
          <InputField
            value={formData.otherSecondarySection || ''}
            editable={formData.secondarySection === 'other'}
            checkValue={
              showValidation &&
              (formData.secondarySection === 'other' ||
                formData.secondarySection === 'Other') &&
              !formData.otherSecondarySection
            }
            holderTextColor={'#94A3B8'}
            onChange={text =>
              onFormDataChange({ ...formData, otherSecondarySection: text })
            }
            placeholder="Specify secondary section"
          />
        </View>
      </View>

      {/* Additional Services & Terms Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Additional Services & Terms</Text>

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkboxItem}
            onPress={() =>
              onFormDataChange({
                ...formData,
                valueAddedServices: !formData?.valueAddedServices,
              })
            }
          >
            <View
              style={[
                styles.checkboxBox,
                formData?.valueAddedServices && styles.checkboxBoxChecked,
              ]}
            >
              {formData?.valueAddedServices ? (
                <Text style={styles.checkboxTick}>✓</Text>
              ) : null}
            </View>
            <Text style={styles.checkboxLabel}>
              Tick here to allow our partners to contact you about Value added
              Services by Email and SMS
            </Text>
          </TouchableOpacity>

          <View
            style={[
              showValidation &&
                !formData?.termsAndConditions && {
                  borderColor: Colors.red,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                },
            ]}
          >
            <TouchableOpacity
              style={[styles.checkboxItem, { alignItems: 'flex-start' }]}
              onPress={() =>
                onFormDataChange({
                  ...formData,
                  termsAndConditions: !formData?.termsAndConditions,
                })
              }
            >
              <View
                style={[
                  styles.checkboxBox,
                  formData?.termsAndConditions && styles.checkboxBoxChecked,
                ]}
              >
                {formData?.termsAndConditions ? (
                  <Text style={styles.checkboxTick}>✓</Text>
                ) : null}
              </View>
              <Text style={[styles.checkboxLabel, { flex: 1 }]}>
                I have read and agree to the INMO{' '}
                <Text
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL('https://www.inmo.ie/DataProtection')
                  }
                >
                  Data Protection Statement
                </Text>
                , the INMO{' '}
                <Text
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL('https://www.inmo.ie/PrivacyStatement')
                  }
                >
                  Privacy Statement
                </Text>{' '}
                and the INMO{' '}
                <Text
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL(
                      'https://www.inmo.ie/ConditionsOfMembership',
                    )
                  }
                >
                  Conditions of Membership
                </Text>
                {showValidation && !formData?.termsAndConditions && (
                  <Text style={{ color: 'red' }}> (Required)</Text>
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Pricing Card Styles
  pricingCard: {
    // marginTop: 16,
    // marginBottom: 16,
    padding: 20,
    marginHorizontal: 0,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pricingGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  pricingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  pricingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    marginRight: 14,
    minWidth: 0,
  },
  pricingIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pricingTextContainer: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingRight: 8,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  pricingSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  pricingRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    flexGrow: 0,
    marginLeft: 10,
    minWidth: 125, // Minimum width to guarantee space
    paddingLeft: 6,
  },
  pricingLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'right',
    fontWeight: '500',
  },
  pricingValue: {
    fontSize: 25,
    fontWeight: '700',
    color: '#2563EB',
    lineHeight: 31,
    textAlign: 'right',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },
  pricingFrequency: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
    fontWeight: '500',
  },
  // Card Styles
  card: {
    backgroundColor: Colors.cardBackground,
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 16,
    letterSpacing: 0.2,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  // Gradient Container Styles
  gradientContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    marginBottom: 16,
  },
  radioGroupLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  radioGroupVertical: {
    flexDirection: 'column',
    gap: 12,
  },
  // Radio Button Styles (Circular)
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioOptionLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '400',
    flexShrink: 1,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 6,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  halfInput: {
    width: '100%',
    marginBottom: 4,
  },
  inputField: { marginBottom: 8 },
  pickerField: { marginBottom: 8 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 12,
  },
  radioButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  radioSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radioLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  radioLabelSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  priceLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  priceLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  priceValue: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  priceNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: 'column',
    marginTop: 16,
  },
  checkboxCol: {
    flex: 1,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    flex: 1,
    textAlign: 'left',
    lineHeight: 18,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '400',
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 12,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  // Conditional Checkbox Container Styles
  conditionalCheckboxContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
  },
  conditionalCheckboxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  checkboxLabelSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 8,
  },
  checkboxLabelImportant: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
    lineHeight: 16,
  },
});

export default SubscriptionDetails;
