import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  pick as pickDocument,
  errorCodes as documentPickerErrorCodes,
  isErrorWithCode as isDocumentPickerErrorWithCode,
} from '@react-native-documents/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../../common/screenHeader';
import { Button } from '../../common/button';
import { Colors } from '../../utils/Styles';
import { getStatusColor, getStatusBg } from '../../utils/status.utils';
import {
  createPortalIssueActivity,
  deletePortalIssueActivity,
  deletePortalIssueActivityAttachment,
  downloadPortalIssueActivityAttachment,
  fetchPortalIssueActivities,
  fetchPortalIssueById,
  updatePortalIssueActivity,
} from '../../api/issue.api';
import {
  formatDisplayValue,
  getIssueApiErrorMessage,
  isIssueApiSuccess,
  mapPortalIssueActivities,
  mapPortalIssueDetail,
  parseAttachmentDownloadResponse,
  parseIssueDetailResponse,
} from '../../helpers/issues.helper';

const CaseDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const issueId = route.params?.issueId;

  const [issue, setIssue] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commentFile, setCommentFile] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [editingActivityId, setEditingActivityId] = useState('');
  const [editingBody, setEditingBody] = useState('');
  const [savingActivityId, setSavingActivityId] = useState('');

  const loadIssue = useCallback(async () => {
    if (!issueId) return;
    try {
      const response = await fetchPortalIssueById(issueId);
      if (isIssueApiSuccess(response)) {
        setIssue(mapPortalIssueDetail(parseIssueDetailResponse(response)));
      } else {
        setIssue(null);
        Alert.alert(
          'Error',
          getIssueApiErrorMessage(response, 'Failed to load case details'),
        );
      }
    } catch (error) {
      setIssue(null);
      Alert.alert('Error', 'Failed to load case details');
    }
  }, [issueId]);

  const loadActivities = useCallback(async () => {
    if (!issueId) return;
    setActivitiesLoading(true);
    try {
      const response = await fetchPortalIssueActivities(issueId);
      if (isIssueApiSuccess(response)) {
        setActivities(mapPortalIssueActivities(response));
      } else {
        setActivities([]);
      }
    } catch (error) {
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadIssue(), loadActivities()]);
      setLoading(false);
    };
    init();
  }, [loadIssue, loadActivities]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadIssue(), loadActivities()]);
    setRefreshing(false);
  };

  const handlePickAttachment = async () => {
    try {
      const results = await pickDocument({
        type: [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        allowMultiSelection: false,
      });
      if (results?.[0]) {
        setCommentFile(results[0]);
      }
    } catch (err) {
      if (
        isDocumentPickerErrorWithCode(err) &&
        err.code === documentPickerErrorCodes.OPERATION_CANCELED
      ) {
        return;
      }
      console.warn('Document picker error', err);
    }
  };

  const handleSubmitComment = async () => {
    const trimmedBody = commentBody.trim();
    if (!trimmedBody && !commentFile) {
      Alert.alert('Validation', 'Please enter a comment or attach a file.');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await createPortalIssueActivity(issueId, {
        body: trimmedBody,
        file: commentFile,
      });

      if (isIssueApiSuccess(response)) {
        setCommentBody('');
        setCommentFile(null);
        await Promise.all([loadActivities(), loadIssue()]);
        return;
      }

      Alert.alert(
        'Error',
        getIssueApiErrorMessage(response, 'Failed to add comment'),
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDownloadAttachment = async (activity, attachment) => {
    try {
      const response = await downloadPortalIssueActivityAttachment(
        issueId,
        activity.id,
        attachment.index,
      );

      if (!isIssueApiSuccess(response)) {
        Alert.alert(
          'Error',
          getIssueApiErrorMessage(response, 'Failed to download attachment'),
        );
        return;
      }

      const downloadInfo = parseAttachmentDownloadResponse(response);
      const url = downloadInfo?.url || attachment.url;
      if (!url) {
        Alert.alert('Error', 'Download link was not returned by the server.');
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Failed to download attachment');
    }
  };

  const startEditActivity = activity => {
    setEditingActivityId(activity.id);
    setEditingBody(activity.body || '');
  };

  const cancelEditActivity = () => {
    setEditingActivityId('');
    setEditingBody('');
  };

  const handleUpdateActivity = async activity => {
    const trimmedBody = editingBody.trim();
    if (!trimmedBody) {
      Alert.alert('Validation', 'Please enter a comment.');
      return;
    }

    setSavingActivityId(activity.id);
    try {
      const response = await updatePortalIssueActivity(issueId, activity.id, {
        body: trimmedBody,
      });

      if (isIssueApiSuccess(response)) {
        cancelEditActivity();
        await loadActivities();
        return;
      }

      Alert.alert(
        'Error',
        getIssueApiErrorMessage(response, 'Failed to update comment'),
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update comment');
    } finally {
      setSavingActivityId('');
    }
  };

  const handleDeleteActivity = activity => {
    Alert.alert(
      'Delete comment',
      'Are you sure you want to delete this comment? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deletePortalIssueActivity(
                issueId,
                activity.id,
              );
              if (isIssueApiSuccess(response)) {
                if (editingActivityId === activity.id) {
                  cancelEditActivity();
                }
                await Promise.all([loadActivities(), loadIssue()]);
                return;
              }
              Alert.alert(
                'Error',
                getIssueApiErrorMessage(response, 'Failed to delete comment'),
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ],
    );
  };

  const handleDeleteAttachment = (activity, attachment) => {
    Alert.alert(
      'Remove attachment',
      `Remove "${attachment.name}" from this comment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deletePortalIssueActivityAttachment(
                issueId,
                activity.id,
                attachment.index,
              );
              if (isIssueApiSuccess(response)) {
                await loadActivities();
                return;
              }
              Alert.alert(
                'Error',
                getIssueApiErrorMessage(response, 'Failed to remove attachment'),
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to remove attachment');
            }
          },
        },
      ],
    );
  };

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'comments') {
      return activities.filter(activity => {
        const type = String(activity.type || '').toLowerCase();
        return !type || type.includes('comment') || Boolean(activity.body);
      });
    }
    return activities;
  }, [activities, activityFilter]);

  const caseReference =
    issue?.internalReferenceNumber || issue?.caseTitle || issue?.id || '';
  const statusLabel = issue?.issueStatus || issue?.status || 'Open';
  const isResolved =
    String(statusLabel).toLowerCase().includes('closed') ||
    String(statusLabel).toLowerCase().includes('resolved') ||
    Boolean(issue?.resolution && issue.resolution !== '—');

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Case Detail" showBack />
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Case Detail" showBack />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Case not found.</Text>
          <Button
            title="Back to Cases"
            onPress={() => navigation.goBack()}
            primary
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Case Detail" showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          <View style={styles.headerBlock}>
            <Text style={styles.refText}>
              Issues / #{formatDisplayValue(caseReference)}
            </Text>
            <Text style={styles.title}>
              {formatDisplayValue(issue.caseTitle || caseReference)}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.typeChip}>
                <Text style={styles.typeChipText}>
                  {formatDisplayValue(
                    issue.complaintTypeLabel || issue.complaintType,
                  )}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBg(statusLabel) },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(statusLabel) },
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>
            <Text style={styles.metaDate}>
              Received {formatDisplayValue(issue.dateReceived)}
            </Text>
          </View>

          {isResolved && issue.resolution ? (
            <View style={styles.resolutionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={styles.sectionTitle}>Resolution & Outcome</Text>
              </View>
              <Text style={styles.bodyText}>{issue.resolution}</Text>
              {issue.dateResolved ? (
                <Text style={styles.metaDate}>
                  Resolved on {issue.dateResolved}
                  {issue.ownerTeam ? ` • ${issue.ownerTeam}` : ''}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.bodyText}>
              {formatDisplayValue(issue.description)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Query Summary</Text>
            <SummaryRow label="Reference" value={issue.internalReferenceNumber} />
            <SummaryRow label="Issue Type" value={issue.issueType} />
            <SummaryRow
              label="Complaint Type"
              value={issue.complaintTypeLabel || issue.complaintType}
            />
            <SummaryRow label="Priority" value={issue.priority} />
            <SummaryRow label="Assigned Team" value={issue.ownerTeam} />
            <SummaryRow label="Received" value={issue.dateReceived} />
            <SummaryRow label="Last Activity" value={issue.lastActivityAt} />
            {issue.serviceProvider ? (
              <SummaryRow label="Service Provider" value={issue.serviceProvider} />
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.activityHeader}>
              <Text style={styles.sectionTitle}>Activity & Messages</Text>
              <Text style={styles.activityCount}>
                {activities.length} update{activities.length === 1 ? '' : 's'}
              </Text>
            </View>

            <View style={styles.filterRow}>
              {[
                { key: 'all', label: 'All Activity' },
                { key: 'comments', label: 'Comments Only' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.filterChip,
                    activityFilter === tab.key && styles.filterChipActive,
                  ]}
                  onPress={() => setActivityFilter(tab.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activityFilter === tab.key && styles.filterChipTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activitiesLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
            ) : filteredActivities.length === 0 ? (
              <Text style={styles.emptyText}>No activity yet.</Text>
            ) : (
              filteredActivities.map(activity => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityDate}>
                      {activity.createdAt || 'Date unavailable'}
                    </Text>
                    <View style={styles.activityActions}>
                      <TouchableOpacity
                        onPress={() => startEditActivity(activity)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="create-outline" size={18} color="#64748B" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteActivity(activity)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ marginLeft: 12 }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {editingActivityId === activity.id ? (
                    <View>
                      <TextInput
                        style={styles.editInput}
                        value={editingBody}
                        onChangeText={setEditingBody}
                        multiline
                        textAlignVertical="top"
                      />
                      <View style={styles.editActions}>
                        <TouchableOpacity onPress={cancelEditActivity}>
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleUpdateActivity(activity)}
                          disabled={savingActivityId === activity.id}
                        >
                          <Text style={styles.saveText}>
                            {savingActivityId === activity.id ? 'Saving...' : 'Save'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : activity.body ? (
                    <Text style={styles.bodyText}>{activity.body}</Text>
                  ) : null}

                  {activity.attachments?.length
                    ? activity.attachments.map(attachment => (
                        <View
                          key={`${activity.id}-${attachment.index}`}
                          style={styles.attachmentRow}
                        >
                          <View style={styles.attachmentInfo}>
                            <Ionicons
                              name="attach-outline"
                              size={16}
                              color={Colors.textSecondary}
                            />
                            <Text style={styles.attachmentName} numberOfLines={1}>
                              {attachment.name}
                            </Text>
                          </View>
                          <View style={styles.attachmentActions}>
                            <TouchableOpacity
                              onPress={() =>
                                handleDownloadAttachment(activity, attachment)
                              }
                            >
                              <Text style={styles.downloadText}>Download</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                handleDeleteAttachment(activity, attachment)
                              }
                              style={{ marginLeft: 12 }}
                            >
                              <Text style={styles.removeText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    : null}
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add a comment or inquiry</Text>
            {isResolved ? (
              <Text style={styles.fieldHint}>
                Case is resolved — replies will notify the assigned team.
              </Text>
            ) : null}
            <TextInput
              style={styles.commentInput}
              value={commentBody}
              onChangeText={setCommentBody}
              placeholder="Type your message or response to the support team..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              textAlignVertical="top"
            />

            {commentFile ? (
              <View style={styles.fileChip}>
                <Text style={styles.fileChipText} numberOfLines={1}>
                  {commentFile.name}
                </Text>
                <TouchableOpacity onPress={() => setCommentFile(null)}>
                  <Ionicons name="close" size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={handlePickAttachment}
              >
                <Ionicons name="attach-outline" size={18} color={Colors.primary} />
                <Text style={styles.attachText}>Attach file</Text>
              </TouchableOpacity>
              <Button
                title={submittingComment ? 'Sending...' : 'Send Message'}
                primary
                onPress={handleSubmitComment}
                disabled={submittingComment}
                style={styles.sendButton}
              />
            </View>
          </View>

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Need further assistance?</Text>
            <Text style={styles.helpText}>
              Use the comment box to follow up with the{' '}
              {formatDisplayValue(issue.ownerTeam || 'assigned')} team. Quote
              reference {formatDisplayValue(caseReference)} when contacting
              support.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const SummaryRow = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{formatDisplayValue(value)}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  headerBlock: {
    marginBottom: 16,
  },
  refText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typeChip: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeChipText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.white || '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resolutionCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  activityCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 10,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  attachmentRow: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 10,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  attachmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  downloadText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 12,
  },
  removeText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 12,
  },
  fieldHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  commentInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
    fontSize: 14,
    marginTop: 8,
  },
  fileChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 20,
    marginTop: 10,
    maxWidth: '100%',
    gap: 6,
  },
  fileChipText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 180,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  sendButton: {
    minWidth: 140,
  },
  helpCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
});

export default CaseDetail;
