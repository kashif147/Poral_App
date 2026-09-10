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
  Keyboard,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  pick as pickDocument,
  errorCodes as documentPickerErrorCodes,
  isErrorWithCode as isDocumentPickerErrorWithCode,
} from '@react-native-documents/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  fetchPortalIssueHistory,
  updatePortalIssueActivity,
} from '../../api/issue.api';
import {
  formatDisplayValue,
  getHistoryActionColor,
  getIssueApiErrorMessage,
  isIssueApiSuccess,
  mapPortalIssueActivities,
  mapPortalIssueDetail,
  mapPortalIssueHistory,
  parseAttachmentDownloadResponse,
  parseIssueDetailResponse,
} from '../../helpers/issues.helper';
import ScreenHeader from '../../common/screenHeader';

const CaseDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const issueId = route.params?.issueId;

  const [issue, setIssue] = useState(null);
  const [activities, setActivities] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commentFile, setCommentFile] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState('');
  const [editingBody, setEditingBody] = useState('');
  const [savingActivityId, setSavingActivityId] = useState('');
  const [attachmentsExpanded, setAttachmentsExpanded] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, event => {
      if (Platform.OS === 'android') {
        setKeyboardHeight(0);
        return;
      }
      setKeyboardHeight(event?.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  const loadHistory = useCallback(async () => {
    if (!issueId) return;
    setHistoryLoading(true);
    try {
      const response = await fetchPortalIssueHistory(issueId);
      if (isIssueApiSuccess(response)) {
        setHistory(mapPortalIssueHistory(response));
      } else {
        setHistory([]);
      }
    } catch (error) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadIssue(), loadActivities(), loadHistory()]);
      setLoading(false);
    };
    init();
  }, [loadIssue, loadActivities, loadHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadIssue(), loadActivities(), loadHistory()]);
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
        await Promise.all([loadActivities(), loadHistory(), loadIssue()]);
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

  const resolveActivityAttachmentUrl = async (activity, attachment) => {
    if (attachment?.url) return attachment.url;

    const response = await downloadPortalIssueActivityAttachment(
      issueId,
      activity.id,
      attachment.index,
    );

    if (!isIssueApiSuccess(response)) {
      throw new Error(
        getIssueApiErrorMessage(response, 'Failed to open attachment'),
      );
    }

    const downloadInfo = parseAttachmentDownloadResponse(response);
    const url = downloadInfo?.url;
    if (!url) {
      throw new Error('Download link was not returned by the server.');
    }

    return url;
  };

  const handleDownloadAttachment = async (activity, attachment) => {
    try {
      const url = await resolveActivityAttachmentUrl(activity, attachment);
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to download attachment');
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
        await Promise.all([loadActivities(), loadHistory()]);
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
                await Promise.all([loadActivities(), loadHistory(), loadIssue()]);
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
                await Promise.all([loadActivities(), loadHistory()]);
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

  const activityAttachments = useMemo(
    () =>
      activities.flatMap(activity =>
        (activity.attachments || []).map(attachment => ({
          ...attachment,
          activity,
        })),
      ),
    [activities],
  );

  const issueAttachments = issue?.attachments || [];
  const attachmentCount = issueAttachments.length + activityAttachments.length;

  const caseReference =
    issue?.internalReferenceNumber || issue?.id || '';
  const statusLabel = issue?.issueStatus || issue?.status || 'Open';
  const isResolved =
    String(statusLabel).toLowerCase().includes('closed') ||
    String(statusLabel).toLowerCase().includes('resolved');

  // Detail = case title when it is not just a repeat of the reference
  const detailValue = useMemo(() => {
    const title = String(issue?.caseTitle || '').trim();
    const ref = String(caseReference || '').trim();
    if (!title || title === ref) {
      return issue?.raw?.detail || issue?.raw?.details || '';
    }
    return title;
  }, [issue, caseReference]);

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

      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Ref + Status */}
          <View style={styles.refStatusCard}>
            <View style={styles.refStatusRow}>
              <View style={styles.refBlock}>
                <Text style={styles.fieldLabel}>Ref</Text>
                <View style={styles.refRow}>
                  <View style={styles.typeIcon}>
                    <Ionicons name="bug" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={styles.refValue}>
                    {formatDisplayValue(caseReference)}
                  </Text>
                </View>
              </View>

              <View style={styles.statusBlock}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBg(statusLabel) },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: getStatusColor(statusLabel) },
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionCard}>
            <Text style={styles.fieldLabel}>Description</Text>
            <Text style={styles.bodyText}>
              {formatDisplayValue(issue.description)}
            </Text>
          </View>

          {/* Detail collapse */}
          <SectionCard
            title="Details"
            subtitle="Issue Type, Complaint Type, Priority, Received..."
            expanded={detailsExpanded}
            onToggle={() => setDetailsExpanded(prev => !prev)}
          >
            <FieldRow label="Issue Type" value={issue.issueType} />
            <FieldRow
              label="Complaint Type"
              value={issue.complaintTypeLabel || issue.complaintType}
            />
            <FieldRow label="Priority">
              <View
                style={[
                  styles.priorityTag,
                  { backgroundColor: getPriorityBg(issue.priority) },
                ]}
              >
                <Text
                  style={[
                    styles.priorityTagText,
                    { color: getPriorityColor(issue.priority) },
                  ]}
                >
                  {formatDisplayValue(issue.priority)}
                </Text>
              </View>
            </FieldRow>
            <FieldRow label="Received" value={issue.dateReceived} />
            <FieldRow label="Assigned Team" value={issue.ownerTeam} />
            <FieldRow label="Last Activity" value={issue.lastActivityAt} last />
          </SectionCard>

          {/* Attachments */}
          <SectionCard
            title="Attachments"
            badge={attachmentCount > 0 ? String(attachmentCount) : null}
            subtitle={
              attachmentCount > 0
                ? `${attachmentCount} file${attachmentCount === 1 ? '' : 's'}`
                : 'No files attached'
            }
            expanded={attachmentsExpanded}
            onToggle={() => setAttachmentsExpanded(prev => !prev)}
          >
            {attachmentCount === 0 ? (
              <Text style={styles.emptyInline}>No attachments yet.</Text>
            ) : (
              <View style={styles.attachmentGrid}>
                {issueAttachments.map((attachment, index) => (
                  <AttachmentItem
                    key={`issue-${attachment.id || index}`}
                    name={attachment.name || `Attachment ${index + 1}`}
                    createdAt={attachment.createdAt}
                    onDownload={
                      attachment.url
                        ? () => Linking.openURL(attachment.url)
                        : undefined
                    }
                  />
                ))}
                {activityAttachments.map(attachment => (
                  <AttachmentItem
                    key={`activity-${attachment.activity.id}-${attachment.index}`}
                    name={attachment.name}
                    createdAt={attachment.createdAt}
                    onDownload={() =>
                      handleDownloadAttachment(attachment.activity, attachment)
                    }
                    onRemove={() =>
                      handleDeleteAttachment(attachment.activity, attachment)
                    }
                  />
                ))}
              </View>
            )}
          </SectionCard>

          {/* 12. Activity */}
          <SectionCard
            title="Activity"
            subtitle={`${activities.length} update${
              activities.length === 1 ? '' : 's'
            }`}
            expanded={activityExpanded}
            onToggle={() => setActivityExpanded(prev => !prev)}
          >
            {activitiesLoading ? (
              <ActivityIndicator
                color={Colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : activities.length === 0 ? (
              <Text style={styles.emptyInline}>No activity yet.</Text>
            ) : (
              activities.map(activity => (
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
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color="#6B778C"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteActivity(activity)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ marginLeft: 12 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#DE350B"
                        />
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
                            {savingActivityId === activity.id
                              ? 'Saving...'
                              : 'Save'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : activity.body ? (
                    <Text style={styles.bodyText}>{activity.body}</Text>
                  ) : null}

                  {activity.attachments?.length ? (
                    <View style={styles.attachmentGrid}>
                      {activity.attachments.map(attachment => (
                        <AttachmentItem
                          key={`${activity.id}-${attachment.index}`}
                          name={attachment.name}
                          createdAt={attachment.createdAt}
                          onDownload={() =>
                            handleDownloadAttachment(activity, attachment)
                          }
                          onRemove={() =>
                            handleDeleteAttachment(activity, attachment)
                          }
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </SectionCard>

          {/* 13. History */}
          <SectionCard
            title="History"
            subtitle={`${history.length} event${
              history.length === 1 ? '' : 's'
            }`}
            expanded={historyExpanded}
            onToggle={() => setHistoryExpanded(prev => !prev)}
          >
            {historyLoading ? (
              <ActivityIndicator
                color={Colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : history.length === 0 ? (
              <Text style={styles.emptyInline}>No history yet.</Text>
            ) : (
              history.map(entry => (
                <View key={entry.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historySummary}>{entry.summary}</Text>
                    {entry.action ? (
                      <View
                        style={[
                          styles.historyActionBadge,
                          {
                            backgroundColor: `${getHistoryActionColor(
                              entry.action,
                            )}18`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyActionText,
                            { color: getHistoryActionColor(entry.action) },
                          ]}
                        >
                          {String(entry.action).toLowerCase()}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.historyMeta}>
                    {entry.actorName || entry.actorEmail || 'Unknown actor'}
                    {' · '}
                    {entry.createdAt || 'Date unavailable'}
                  </Text>
                  {entry.entityType ? (
                    <Text style={styles.historyEntity}>
                      {String(entry.entityType).toLowerCase()}
                    </Text>
                  ) : null}
                  {entry.changedFields?.length
                    ? entry.changedFields.map((field, index) => {
                        const label =
                          field?.field ||
                          field?.name ||
                          field?.key ||
                          `Field ${index + 1}`;
                        const from = field?.from ?? field?.oldValue ?? '—';
                        const to = field?.to ?? field?.newValue ?? '—';
                        return (
                          <Text
                            key={`${entry.id}-field-${index}`}
                            style={styles.historyField}
                          >
                            {label}: {String(from)} → {String(to)}
                          </Text>
                        );
                      })
                    : null}
                </View>
              ))
            )}
          </SectionCard>
        </ScrollView>

        <View
          style={[
            styles.commentBar,
            {
              marginBottom: keyboardHeight,
              paddingBottom:
                keyboardHeight > 0 ? 10 : Math.max(insets.bottom, 10),
            },
          ]}
        >
          {commentFile ? (
            <View style={styles.fileChip}>
              <Text style={styles.fileChipText} numberOfLines={1}>
                {commentFile.name}
              </Text>
              <TouchableOpacity onPress={() => setCommentFile(null)}>
                <Ionicons name="close" size={16} color="#172B4D" />
              </TouchableOpacity>
            </View>
          ) : null}

          {isResolved ? (
            <Text style={styles.resolvedHint}>
              Case is resolved — replies will notify the assigned team.
            </Text>
          ) : null}

          <View style={styles.commentInputRow}>
            <TouchableOpacity
              style={styles.attachIconBtn}
              onPress={handlePickAttachment}
            >
              <Ionicons name="attach-outline" size={22} color="#6B778C" />
            </TouchableOpacity>
            <TextInput
              style={styles.commentInput}
              value={commentBody}
              onChangeText={setCommentBody}
              placeholder="Add a comment..."
              placeholderTextColor="#6B778C"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendIconBtn,
                submittingComment && styles.sendIconBtnDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const getPriorityColor = priority => {
  const value = String(priority || '').toLowerCase();
  if (value.includes('high') || value.includes('urgent')) return '#DE350B';
  if (value.includes('medium')) return '#FF8B00';
  if (value.includes('low')) return '#006644';
  return '#0052CC';
};

const getPriorityBg = priority => {
  const value = String(priority || '').toLowerCase();
  if (value.includes('high') || value.includes('urgent')) return '#FFEBE6';
  if (value.includes('medium')) return '#FFFAE6';
  if (value.includes('low')) return '#E3FCEF';
  return '#DEEBFF';
};

const FieldRow = ({ label, value, last, children }) => (
  <View style={[styles.fieldRow, last && styles.fieldRowLast]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children ? (
      children
    ) : (
      <Text style={styles.fieldValue}>{formatDisplayValue(value)}</Text>
    )}
  </View>
);

const SectionCard = ({ title, subtitle, badge, expanded, onToggle, children }) => (
  <View style={styles.sectionCard}>
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderText}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle && !expanded ? (
          <Text style={styles.sectionSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={expanded ? 'chevron-down' : 'chevron-forward'}
        size={18}
        color="#6B778C"
      />
    </TouchableOpacity>
    {expanded ? <View style={styles.sectionBody}>{children}</View> : null}
  </View>
);

const AttachmentItem = ({ name, createdAt, onDownload, onRemove }) => (
  <View style={styles.attachmentCard}>
    <View style={styles.attachmentPreview}>
      <Ionicons name="document-text-outline" size={22} color="#DE350B" />
    </View>
    <Text style={styles.attachmentCardName}>
      {name || 'Attachment'}
    </Text>
    {createdAt ? (
      <Text style={styles.attachmentCardDate}>{createdAt}</Text>
    ) : null}
    <View style={styles.attachmentCardActions}>
      {onDownload ? (
        <TouchableOpacity
          onPress={onDownload}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="download-outline" size={16} color="#42526E" />
        </TouchableOpacity>
      ) : null}
      {onRemove ? (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginLeft: 14 }}
        >
          <Ionicons name="trash-outline" size={16} color="#42526E" />
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
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
    color: '#6B778C',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyInline: {
    color: '#6B778C',
    fontSize: 14,
    paddingVertical: 4,
  },
  refStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  refStatusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  refBlock: {
    flex: 1,
  },
  statusBlock: {
    alignItems: 'flex-end',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#E34935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#172B4D',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeaderText: {
    flex: 1,
    paddingRight: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#172B4D',
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B778C',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: '#EBECF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#42526E',
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBECF0',
    paddingTop: 4,
  },
  fieldRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F4F5F7',
  },
  fieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B778C',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#172B4D',
  },
  priorityTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priorityTagText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#172B4D',
  },
  activityCard: {
    backgroundColor: '#F4F5F7',
    borderRadius: 10,
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
    color: '#6B778C',
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCard: {
    backgroundColor: '#F4F5F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  historySummary: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#172B4D',
  },
  historyActionBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historyActionText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  historyMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B778C',
  },
  historyEntity: {
    marginTop: 4,
    fontSize: 11,
    color: '#97A0AF',
    textTransform: 'capitalize',
  },
  historyField: {
    marginTop: 6,
    fontSize: 12,
    color: '#42526E',
  },
  editInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#DFE1E6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    color: '#172B4D',
    fontSize: 14,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 10,
  },
  cancelText: {
    color: '#6B778C',
    fontWeight: '600',
  },
  saveText: {
    color: '#0052CC',
    fontWeight: '700',
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 2,
  },
  attachmentCard: {
    width: 112,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE1E6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  attachmentPreview: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE1E6',
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  attachmentCardName: {
    width: '100%',
    fontSize: 11,
    fontWeight: '600',
    color: '#172B4D',
    textAlign: 'center',
    lineHeight: 13,
  },
  attachmentCardDate: {
    marginTop: 2,
    fontSize: 9,
    color: '#97A0AF',
    textAlign: 'center',
  },
  attachmentCardActions: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentRow: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DFE1E6',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
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
    color: '#172B4D',
  },
  attachmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  downloadText: {
    color: '#0052CC',
    fontWeight: '600',
    fontSize: 12,
  },
  removeText: {
    color: '#DE350B',
    fontWeight: '600',
    fontSize: 12,
  },
  commentBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DFE1E6',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  resolvedHint: {
    fontSize: 11,
    color: '#6B778C',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: '#F4F5F7',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#172B4D',
  },
  sendIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0052CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIconBtnDisabled: {
    opacity: 0.6,
  },
  fileChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEEBFF',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '100%',
    gap: 6,
  },
  fileChipText: {
    color: '#0052CC',
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 200,
  },
});

export default CaseDetail;
