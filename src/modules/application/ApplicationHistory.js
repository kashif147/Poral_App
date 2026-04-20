import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../utils/Styles';
import ScreenHeader from '../../common/screenHeader';
import { STACKS } from '../../enums/ScreenEnums';
import { formatToDDMMYYYY } from '../../helpers/date.helper';
import { useApplication } from '../../contexts/applicationContext';
import { useMemberRole } from '../../hooks/useMemberRole';
import {
  fetchAllApplications,
  getApplicationById,
} from '../../api/profile.api';
import { applicationConfirmationRequest } from '../../api/application.api';
import {
  buildApplicationBundleFromContext,
  extractApplicationsFromMeResponse,
  normalizeApplicationDetailResponse,
} from '../../helpers/applicationPayload.helper';
import { toast } from '../../utils/toast.utils';
import Ionicons from 'react-native-vector-icons/Ionicons';

const resolvePersonalIsActive = record => {
  if (typeof record?.personalIsActive === 'boolean') {
    return record.personalIsActive;
  }
  const v = record?.personalDetails?.meta?.isActive;
  if (typeof v === 'boolean') {
    return v;
  }
  return null;
};

const ApplicationHistory = () => {
  const navigation = useNavigation();
  const {
    isCrmUser,
    loading,
    personalDetail,
    professionalDetail,
    subscriptionDetail,
    applicationStatus: contextApplicationStatus,
  } = useApplication();
  const { isMember: hasMemberRole } = useMemberRole();

  const [applications, setApplications] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [viewingApplicationId, setViewingApplicationId] = useState(null);
  const [resolvedStatus, setResolvedStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const isApprovedListMode =
    String(resolvedStatus || '').toLowerCase() === 'approved';

  useEffect(() => {
    if (loading) return;

    if (contextApplicationStatus != null) {
      setResolvedStatus(String(contextApplicationStatus).trim().toLowerCase());
      setStatusLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      if (!personalDetail || !personalDetail.applicationId) {
        if (!cancelled) {
          setResolvedStatus('none');
          setStatusLoading(false);
        }
        return;
      }

      setStatusLoading(true);
      try {
        const response = await applicationConfirmationRequest(
          personalDetail.applicationId,
        );
        if (cancelled) return;
        if (
          response &&
          (response.status === 200 || response.data?.status === 'success')
        ) {
          const status =
            response.data?.data?.applicationStatus ||
            response.data?.applicationStatus;
          setResolvedStatus(
            status != null ? String(status).trim().toLowerCase() : 'none',
          );
        } else {
          setResolvedStatus('none');
        }
      } catch {
        if (!cancelled) setResolvedStatus('none');
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [loading, personalDetail?.applicationId, contextApplicationStatus]);

  useEffect(() => {
    if (!isApprovedListMode) {
      setApplications([]);
      setListLoading(false);
      return;
    }

    setListLoading(true);
    fetchAllApplications()
      .then(res => {
        const items = extractApplicationsFromMeResponse(res);
        setApplications(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        toast.error('Failed to load application history.');
        setApplications([]);
      })
      .finally(() => {
        setListLoading(false);
      });
  }, [isApprovedListMode]);

  const portalApplicationRecord = useMemo(() => {
    if (!personalDetail || !personalDetail.applicationId) {
      return null;
    }
    const category =
      professionalDetail?.professionalDetails?.membershipCategory ||
      subscriptionDetail?.subscriptionDetails?.membershipCategory ||
      'N/A';
    const submissionDate =
      personalDetail.submissionDate ||
      personalDetail.personalInfo?.submissionDate ||
      subscriptionDetail?.subscriptionDetails?.submissionDate ||
      null;
    const metaIsActive =
      personalDetail.meta != null &&
      typeof personalDetail.meta.isActive === 'boolean'
        ? personalDetail.meta.isActive
        : null;
    return {
      applicationId: personalDetail.applicationId,
      membershipCategory: category,
      submissionDate,
      applicationStatus: personalDetail.applicationStatus,
      personalIsActive: metaIsActive,
    };
  }, [personalDetail, professionalDetail, subscriptionDetail]);

  const displayRows = isApprovedListMode
    ? applications
    : portalApplicationRecord
      ? [portalApplicationRecord]
      : [];

  const handleViewApplication = useCallback(
    async record => {
      const id = record?.applicationId;
      if (!id) {
        toast.error('Missing application id.');
        return;
      }

      setViewingApplicationId(id);
      try {
        const res = await getApplicationById(id);
        const normalized = normalizeApplicationDetailResponse(res, {
          applicationId: id,
          submissionDate: record.submissionDate,
          applicationStatus: record.applicationStatus,
          membershipCategory: record.membershipCategory,
        });
        if (!normalized) {
          toast.error('Could not load application details.');
          return;
        }
        navigation.navigate(STACKS.APPLICATION_DETAIL, {
          application: normalized,
          applicationId: id,
        });
      } catch {
        toast.error('Failed to load application details.');
      } finally {
        setViewingApplicationId(null);
      }
    },
    [navigation],
  );

  const handleViewPortalApplication = useCallback(() => {
    const bundle = buildApplicationBundleFromContext({
      personalDetail,
      professionalDetail,
      subscriptionDetail,
    });
    const id = bundle.applicationId;
    if (!id) {
      toast.error('Missing application id.');
      return;
    }
    navigation.navigate(STACKS.APPLICATION_DETAIL, {
      application: bundle,
      applicationId: id,
    });
  }, [navigation, personalDetail, professionalDetail, subscriptionDetail]);

  const isMember = hasMemberRole || isCrmUser;
  const memberStatus = isMember ? 'Member' : 'Non Member';
  const pageBusy =
    loading || statusLoading || (isApprovedListMode && listLoading);

  const renderItem = ({ item }) => {
    const active = resolvePersonalIsActive(item);
    return (
      <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Membership Category</Text>
          <Text style={styles.value}>{item.membershipCategory || 'N/A'}</Text>
        </View>
        <View
          style={[
            styles.statusChip,
            active === true
              ? styles.statusActive
              : active === false
                ? styles.statusInactive
                : styles.statusUnknown,
          ]}
        >
          <Text
            style={[
              styles.statusChipText,
              active === true
                ? styles.statusActiveText
                : active === false
                  ? styles.statusInactiveText
                  : styles.statusUnknownText,
            ]}
          >
            {active === true
              ? 'Active'
              : active === false
                ? 'Inactive'
                : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            {item.submissionDate ? formatToDDMMYYYY(item.submissionDate) : 'N/A'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewButton}
        disabled={
          !!viewingApplicationId && viewingApplicationId !== item.applicationId
        }
        onPress={() =>
          isApprovedListMode
            ? handleViewApplication(item)
            : handleViewPortalApplication()
        }
      >
        {viewingApplicationId === item.applicationId ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.viewButtonText}>View Details</Text>
        )}
      </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Application" showBack={false} />
      <View style={styles.body}>
        <View style={styles.memberBanner}>
          <View style={styles.memberHeaderRow}>
            <View style={styles.memberIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#1D4ED8" />
            </View>
            <Text style={styles.memberLabel}>Member Status</Text>
          </View>
          <Text style={styles.memberValue}>{memberStatus}</Text>
        </View>

        {!isApprovedListMode && (
          <TouchableOpacity
            style={styles.formButton}
            onPress={() => navigation.navigate(STACKS.APPLICATION_FORM)}
          >
            <Text style={styles.formButtonText}>
              {resolvedStatus === 'rejected'
                ? 'Re-apply'
                : 'Start / Resume Application'}
            </Text>
          </TouchableOpacity>
        )}

        {pageBusy ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : displayRows.length > 0 ? (
          <FlatList
            data={displayRows}
            keyExtractor={item => String(item.applicationId)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {isApprovedListMode
                ? 'No application history found.'
                : "You don't have an application yet."}
            </Text>
            {!isApprovedListMode && (
              <TouchableOpacity
                style={styles.formButton}
                onPress={() => navigation.navigate(STACKS.APPLICATION_FORM)}
              >
                <Text style={styles.formButtonText}>Start Application</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: 16 },
  memberBanner: {
    backgroundColor: '#EEF4FF',
    borderColor: '#CFE0FF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  memberHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  memberIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  memberLabel: { color: '#2563EB', fontSize: 12, fontWeight: '600' },
  memberValue: { color: '#1E3A8A', fontSize: 17, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  label: { color: '#6B7280', fontSize: 11, marginBottom: 2, fontWeight: '600' },
  value: { color: '#111827', fontSize: 18, fontWeight: '700' },
  metaRow: { flexDirection: 'row', marginTop: 2, marginBottom: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { marginLeft: 6, color: '#4B5563', fontSize: 13, fontWeight: '500' },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipText: { fontSize: 11, fontWeight: '700' },
  statusActive: { backgroundColor: '#ECFDF3', borderColor: '#BBF7D0' },
  statusActiveText: { color: '#15803D' },
  statusInactive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusInactiveText: { color: '#B91C1C' },
  statusUnknown: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  statusUnknownText: { color: '#4B5563' },
  viewButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#6B7280', marginBottom: 12, textAlign: 'center' },
  formButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 12,
  },
  formButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default ApplicationHistory;
