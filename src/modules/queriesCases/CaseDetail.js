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
import ScreenHeader from '../../common/screenHeader';

const SECTION_KEYS = {
  general: 'general',
  attachments: 'attachments',
  details: 'details',
  more: 'more',
  resolution: 'resolution',
  activity: 'activity',
};

const CaseDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
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
  const [expanded, setExpanded] = useState({
    [SECTION_KEYS.general]: true,
    [SECTION_KEYS.attachments]: true,
    [SECTION_KEYS.details]: true,
    [SECTION_KEYS.more]: true,
    [SECTION_KEYS.resolution]: true,
    [SECTION_KEYS.activity]: true,
  });
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, event => {
      // Android uses windowSoftInputMode=adjustResize, so the window
      // already shrinks — only lift the bar manually on iOS.
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

  const toggleSection = key => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
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
    issue?.internalReferenceNumber || issue?.caseTitle || issue?.id || '';
  const statusLabel = issue?.issueStatus || issue?.status || 'Open';
  const isResolved =
    String(statusLabel).toLowerCase().includes('closed') ||
    String(statusLabel).toLowerCase().includes('resolved') ||
    Boolean(issue?.resolution && issue.resolution !== '—');

  const avatarLetter = String(
    issue?.complainant || issue?.ownerTeam || issue?.caseTitle || 'C',
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  const renderHeader = () => (
    <View
      style={[
        styles.topBar,
        { paddingTop: Platform.OS === 'ios' ? insets.top + 8 : 12 },
      ]}
    >
      <TouchableOpacity
        style={styles.backCircle}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={22} color="#172B4D" />
      </TouchableOpacity>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={handleRefresh}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="flash-outline" size={18} color="#172B4D" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() =>
            setExpanded({
              [SECTION_KEYS.general]: true,
              [SECTION_KEYS.attachments]: true,
              [SECTION_KEYS.details]: true,
              [SECTION_KEYS.more]: true,
              [SECTION_KEYS.resolution]: true,
              [SECTION_KEYS.activity]: true,
            })
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="list-outline" size={18} color="#172B4D" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={handlePickAttachment}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#172B4D" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.container}>
        {/* {renderHeader()} */}
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
      {/* {renderHeader()} */}
      <ScreenHeader title="Case Detail" showBack={true} />

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
          <View style={styles.keyRow}>
            <View style={styles.typeIcon}>
              <Ionicons name="bug" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.keyText}>
              {formatDisplayValue(caseReference)}
            </Text>
            <Ionicons name="link-outline" size={14} color="#6B778C" />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {formatDisplayValue(issue.caseTitle || caseReference)}
            </Text>
            {/* <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View> */}
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusButton,
                { backgroundColor: getStatusBg(statusLabel) },
              ]}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  { color: getStatusColor(statusLabel) },
                ]}
              >
                {statusLabel}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={getStatusColor(statusLabel)}
              />
            </View>

            <View style={styles.transitionButton}>
              <Ionicons name="checkmark" size={16} color="#172B4D" />
              <Text style={styles.transitionText} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>

            <View style={styles.iconSquare}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#172B4D" />
            </View>
          </View>

          {isResolved && issue.resolution ? (
            <SectionCard
              title="Resolution"
              subtitle="Outcome and resolved date"
              expanded={expanded[SECTION_KEYS.resolution]}
              onToggle={() => toggleSection(SECTION_KEYS.resolution)}
            >
              <Text style={styles.bodyText}>{issue.resolution}</Text>
              {issue.dateResolved ? (
                <Text style={styles.metaHint}>
                  Resolved on {issue.dateResolved}
                  {issue.ownerTeam ? ` • ${issue.ownerTeam}` : ''}
                </Text>
              ) : null}
            </SectionCard>
          ) : null}

          <SectionCard
            title="General"
            subtitle="Priority, Description, Complaint type, and Origin"
            expanded={expanded[SECTION_KEYS.general]}
            onToggle={() => toggleSection(SECTION_KEYS.general)}
          >
            <FieldRow label="Priority" value={issue.priority} />
            <FieldRow
              label="Complaint Type"
              value={issue.complaintTypeLabel || issue.complaintType}
            />
            <FieldRow label="Origin" value={issue.origin} />
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.bodyText}>
                {formatDisplayValue(issue.description)}
              </Text>
            </View>
          </SectionCard>

          <SectionCard
            title="Attachments"
            badge={attachmentCount > 0 ? String(attachmentCount) : null}
            subtitle={
              attachmentCount > 0
                ? `${attachmentCount} file${attachmentCount === 1 ? '' : 's'}`
                : 'No files attached'
            }
            expanded={expanded[SECTION_KEYS.attachments]}
            onToggle={() => toggleSection(SECTION_KEYS.attachments)}
          >
            {attachmentCount === 0 ? (
              <Text style={styles.emptyInline}>No attachments yet.</Text>
            ) : (
              <>
                {issueAttachments.map((attachment, index) => (
                  <AttachmentItem
                    key={`issue-${attachment.id || index}`}
                    name={attachment.name || `Attachment ${index + 1}`}
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
                    onDownload={() =>
                      handleDownloadAttachment(attachment.activity, attachment)
                    }
                    onRemove={() =>
                      handleDeleteAttachment(attachment.activity, attachment)
                    }
                  />
                ))}
              </>
            )}
          </SectionCard>

          <SectionCard
            title="Details"
            subtitle="Issue Type, Assignee, Reporter, Labels, Received..."
            expanded={expanded[SECTION_KEYS.details]}
            onToggle={() => toggleSection(SECTION_KEYS.details)}
          >
            <FieldRow label="Issue Type" value={issue.issueType} />
            <FieldRow label="Assigned Team" value={issue.ownerTeam} />
            <FieldRow label="Complainant" value={issue.complainant} />
            <FieldRow label="Service Provider" value={issue.serviceProvider} />
            <FieldRow label="Received" value={issue.dateReceived} />
            <FieldRow label="Last Activity" value={issue.lastActivityAt} />
            <FieldRow
              label="Reference"
              value={issue.internalReferenceNumber}
            />
          </SectionCard>

          <SectionCard
            title="More fields"
            subtitle="Due date, External agency, Members, Portal..."
            expanded={expanded[SECTION_KEYS.more]}
            onToggle={() => toggleSection(SECTION_KEYS.more)}
          >
            <FieldRow label="Due Date" value={issue.dueDate} />
            <FieldRow label="Created On" value={issue.createdOn} />
            <FieldRow label="External Agency" value={issue.externalAgency} />
            <FieldRow label="External Case Ref" value={issue.externalCaseRef} />
            <FieldRow
              label="Members"
              value={
                issue.memberCount > 0 ? String(issue.memberCount) : undefined
              }
            />
            <FieldRow
              label="Created via Portal"
              value={
                issue.createdViaPortal === true
                  ? 'Yes'
                  : issue.createdViaPortal === false
                    ? 'No'
                    : undefined
              }
            />
            <FieldRow
              label="External Solicitor"
              value={
                issue.externalSolicitorInvolved === true
                  ? 'Yes'
                  : issue.externalSolicitorInvolved === false
                    ? 'No'
                    : undefined
              }
            />
          </SectionCard>

          <SectionCard
            title="Activity"
            subtitle={`${activities.length} update${
              activities.length === 1 ? '' : 's'
            }`}
            expanded={expanded[SECTION_KEYS.activity]}
            onToggle={() => toggleSection(SECTION_KEYS.activity)}
          >
            <View style={styles.filterRow}>
              {[
                { key: 'all', label: 'All Activity' },
                { key: 'comments', label: 'Comments' },
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
              <ActivityIndicator
                color={Colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : filteredActivities.length === 0 ? (
              <Text style={styles.emptyInline}>No activity yet.</Text>
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

                  {activity.attachments?.length
                    ? activity.attachments.map(attachment => (
                        <AttachmentItem
                          key={`${activity.id}-${attachment.index}`}
                          name={attachment.name}
                          onDownload={() =>
                            handleDownloadAttachment(activity, attachment)
                          }
                          onRemove={() =>
                            handleDeleteAttachment(activity, attachment)
                          }
                        />
                      ))
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

const SectionCard = ({
  title,
  subtitle,
  badge,
  expanded,
  onToggle,
  children,
}) => (
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

const FieldRow = ({ label, value }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{formatDisplayValue(value)}</Text>
  </View>
);

const AttachmentItem = ({ name, onDownload, onRemove }) => (
  <View style={styles.attachmentRow}>
    <View style={styles.attachmentInfo}>
      <Ionicons name="attach-outline" size={16} color="#6B778C" />
      <Text style={styles.attachmentName} numberOfLines={1}>
        {name}
      </Text>
    </View>
    <View style={styles.attachmentActions}>
      {onDownload ? (
        <TouchableOpacity onPress={onDownload}>
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
      ) : null}
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} style={{ marginLeft: 12 }}>
          <Text style={styles.removeText}>Remove</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#F4F5F7',
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#091E42',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: '#091E42',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  headerActionBtn: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
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
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  typeIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#E34935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B778C',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#172B4D',
    lineHeight: 28,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0052CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  transitionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EBECF0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  transitionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#172B4D',
  },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EBECF0',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBECF0',
    paddingTop: 10,
  },
  fieldRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F4F5F7',
  },
  fieldBlock: {
    paddingVertical: 10,
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
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#172B4D',
  },
  metaHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B778C',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F4F5F7',
  },
  filterChipActive: {
    backgroundColor: '#DEEBFF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#42526E',
  },
  filterChipTextActive: {
    color: '#0052CC',
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
