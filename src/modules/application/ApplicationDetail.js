import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import moment from 'moment';
import ScreenHeader from '../../common/screenHeader';
import { Colors } from '../../utils/Styles';
import { STACKS } from '../../enums/ScreenEnums';
import { useApplication } from '../../contexts/applicationContext';
import { useLookup } from '../../contexts/lookupContext';
import { getApplicationById } from '../../api/profile.api';
import {
  applicationDetailHasSections,
  normalizeApplicationDetailResponse,
} from '../../helpers/applicationPayload.helper';
import { formatToDDMMYYYY } from '../../helpers/date.helper';
import { toast } from '../../utils/toast.utils';
import Ionicons from 'react-native-vector-icons/Ionicons';

const formatPhoneNumber = phoneNumber => {
  if (!phoneNumber) return phoneNumber;
  const phoneStr = String(phoneNumber).trim();
  const digits = phoneStr.replace(/\D/g, '');

  if (phoneStr.startsWith('+353') || digits.startsWith('353')) {
    if (digits.startsWith('353') && digits.length >= 10) {
      const rest = digits.substring(3);
      if (rest.length >= 7) {
        const part1 = rest.substring(0, 2);
        const part2 = rest.substring(2, 5);
        const part3 = rest.substring(5);
        return `+353 ${part1} ${part2} ${part3}`;
      }
    }
    return phoneStr;
  }

  if (digits.length >= 7) {
    let numberToFormat = digits;
    if (!digits.startsWith('0')) numberToFormat = `0${digits}`;
    if (numberToFormat.length >= 9) {
      return `${numberToFormat.substring(0, 3)} ${numberToFormat.substring(
        3,
        6,
      )} ${numberToFormat.substring(6)}`;
    }
  }
  return phoneStr;
};

const isDateValue = value => {
  if (!value || typeof value !== 'string') return false;
  return (
    moment(value, moment.ISO_8601, true).isValid() ||
    /^\d{4}-\d{2}-\d{2}/.test(value) ||
    /T\d{2}:\d{2}:\d{2}/.test(value)
  );
};

const isPhoneField = key => {
  const phoneKeywords = [
    'mobilenumber',
    'telephonenumber',
    'phonenumber',
    'mobile',
    'telephone',
    'phone',
    'tel',
  ];
  const lowerKey = key.toLowerCase().replace(/\s/g, '');
  const isPhone = phoneKeywords.some(
    keyword => lowerKey === keyword || lowerKey.includes(keyword),
  );
  const excludeKeywords = [
    'id',
    'payrollno',
    'pensionno',
    'pension',
    'payroll',
    'applicationid',
    'memberid',
  ];
  const shouldExclude = excludeKeywords.some(keyword => lowerKey.includes(keyword));
  return isPhone && !shouldExclude;
};

const Field = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

const SectionCard = ({ title, icon, data, categoryName }) => {
  if (!data || Object.keys(data).length === 0) return null;
  const nonNullData = Object.entries(data).filter(
    ([, value]) =>
      value !== null && value !== undefined && value !== '' && value !== false,
  );
  if (nonNullData.length === 0) return null;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={16} color={Colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {nonNullData.map(([key, value], idx) => {
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, s => s.toUpperCase());

        if (
          key === 'membershipCategory' ||
          key.toLowerCase() === 'membershipcategory'
        ) {
          return (
            <View key={key} style={styles.fieldRow}>
              <Field label={label} value={categoryName || String(value || 'N/A')} />
              {idx < nonNullData.length - 1 && <View style={styles.fieldDivider} />}
            </View>
          );
        }
        if (isDateValue(String(value))) {
          return (
            <View key={key} style={styles.fieldRow}>
              <Field
                label={label}
                value={formatToDDMMYYYY(value) || String(value)}
              />
              {idx < nonNullData.length - 1 && <View style={styles.fieldDivider} />}
            </View>
          );
        }
        if (isPhoneField(key)) {
          return (
            <View key={key} style={styles.fieldRow}>
              <Field label={label} value={formatPhoneNumber(value)} />
              {idx < nonNullData.length - 1 && <View style={styles.fieldDivider} />}
            </View>
          );
        }
        if (typeof value === 'boolean') {
          return (
            <View key={key} style={styles.fieldRow}>
              <Field label={label} value={value ? 'Yes' : 'No'} />
              {idx < nonNullData.length - 1 && <View style={styles.fieldDivider} />}
            </View>
          );
        }
        if (typeof value === 'string' && value.includes('_')) {
          return (
            <View key={key} style={styles.fieldRow}>
              <Field
                label={label}
                value={value
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase())}
              />
              {idx < nonNullData.length - 1 && <View style={styles.fieldDivider} />}
            </View>
          );
        }
        return (
          <View key={key} style={styles.fieldRow}>
            <Field label={label} value={String(value)} />
            {idx < nonNullData.length - 1 && <View style={styles.fieldDivider} />}
          </View>
        );
      })}
    </View>
  );
};

const ApplicationDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeApplicationId =
    route.params?.applicationId ?? route.params?.application?.applicationId;
  const stateApplication = route.params?.application ?? null;

  const [application, setApplication] = useState(stateApplication);
  const [detailFetchLoading, setDetailFetchLoading] = useState(() => {
    if (!routeApplicationId) return false;
    return !applicationDetailHasSections(stateApplication);
  });

  const { categoryData, categoryLoading, getCategoryData } = useApplication();
  const { categoryLookups } = useLookup();

  useEffect(() => {
    if (!routeApplicationId) {
      setApplication(null);
      setDetailFetchLoading(false);
      return;
    }

    if (stateApplication && applicationDetailHasSections(stateApplication)) {
      setApplication(stateApplication);
      setDetailFetchLoading(false);
      return;
    }

    let cancelled = false;
    setDetailFetchLoading(true);
    getApplicationById(routeApplicationId)
      .then(res => {
        if (cancelled) return;
        const normalized = normalizeApplicationDetailResponse(res, {
          applicationId: routeApplicationId,
        });
        setApplication(normalized);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load application details.');
          setApplication(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailFetchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [routeApplicationId, stateApplication]);

  useEffect(() => {
    const membershipCategory =
      application?.subscriptionDetail?.subscriptionDetails?.membershipCategory;
    if (membershipCategory) {
      getCategoryData(membershipCategory, categoryLookups);
    }
  }, [
    application?.subscriptionDetail?.subscriptionDetails?.membershipCategory,
    getCategoryData,
    categoryLookups,
  ]);

  const personalInfo = useMemo(
    () => ({
      ...(application?.personalDetail?.personalInfo || {}),
      ...(application?.personalDetail?.contactInfo || {}),
    }),
    [application],
  );
  const professionalInfo =
    application?.professionalDetail?.professionalDetails || {};
  const subscriptionInfo = application?.subscriptionDetail?.subscriptionDetails || {};

  if (detailFetchLoading || categoryLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Application Detail" showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Application Detail" showBack />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No application data available.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate(STACKS.APPLICATION_HISTORY)}
          >
            <Text style={styles.backButtonText}>Back to Applications</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Application Detail" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View style={styles.overviewBadgeIcon}>
              <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.overviewTitle}>{categoryData?.name || 'N/A'}</Text>
              <Text style={styles.overviewSubTitle}>
                {application?.submissionDate
                  ? `Submitted on ${formatToDDMMYYYY(application.submissionDate)}`
                  : 'Not yet submitted'}
              </Text>
            </View>
          </View>
        </View>

        <SectionCard
          title="Personal Information"
          icon="person-outline"
          data={personalInfo}
          categoryName={categoryData?.name}
        />
        <SectionCard
          title="Professional Information"
          icon="briefcase-outline"
          data={professionalInfo}
          categoryName={categoryData?.name}
        />
        <SectionCard
          title="Subscription Information"
          icon="card-outline"
          data={subscriptionInfo}
          categoryName={categoryData?.name}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 28 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#6B7280', fontSize: 14, marginBottom: 12 },
  backButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: { color: '#fff', fontWeight: '600' },
  overviewCard: {
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#CFE0FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E2EAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  overviewTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  overviewSubTitle: { marginTop: 2, color: '#4B5563', fontSize: 13, fontWeight: '500' },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  fieldRow: { paddingTop: 2 },
  fieldDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 8,
    marginBottom: 2,
  },
  field: { marginBottom: 4 },
  fieldLabel: { fontSize: 11, color: '#6B7280' },
  fieldValue: { fontSize: 15, color: '#111827', fontWeight: '700' },
});

export default ApplicationDetail;
