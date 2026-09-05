import moment from 'moment';
import { COMPLAINT_TYPE_OPTIONS } from '../constants/queriesCases';

export const COMPLAINT_TYPE = {
  MOM: 'MOM',
  MOSP: 'MOSP',
};

export const ISSUE_TYPE = {
  COMPLAINT: 'COMPLAINT',
  FTP: 'FTP',
  IR: 'IR',
  DP: 'DP',
};

export const COMPLAINT_TYPE_LOOKUP = 'Complaint Type';

const normalizeComplaintTypeKey = value =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

const getComplaintTypeLookupLabel = item =>
  String(
    item?.displayname ||
      item?.lookupname ||
      item?.DisplayName ||
      item?.name ||
      item?.code ||
      '',
  );

export const getComplaintTypeLookupValue = item =>
  item?.code || item?.lookupname || item?._id || item?.id || '';

export const filterComplaintTypeLookups = lookups =>
  (lookups || []).filter(
    item => item?.lookuptypeId?.lookuptype === COMPLAINT_TYPE_LOOKUP,
  );

export const mapComplaintTypeLookupOption = item => ({
  value: getComplaintTypeLookupValue(item),
  label: getComplaintTypeLookupLabel(item),
});

export const mapComplaintTypeLookupOptions = lookups =>
  filterComplaintTypeLookups(lookups)
    .map(mapComplaintTypeLookupOption)
    .filter(option => option.value);

const findComplaintTypeLookup = (value, complaintTypeLookups = []) =>
  complaintTypeLookups.find(item => getComplaintTypeLookupValue(item) === value);

export const isMemberOnMemberComplaintType = (value, complaintTypeLookups = []) => {
  if (normalizeComplaintTypeKey(value) === COMPLAINT_TYPE.MOM) return true;

  const lookup = findComplaintTypeLookup(value, complaintTypeLookups);
  const label = getComplaintTypeLookupLabel(lookup).toLowerCase();
  const code = normalizeComplaintTypeKey(lookup?.code || lookup?.lookupname);

  return code === COMPLAINT_TYPE.MOM || label.includes('member on member');
};

export const isMemberOnServiceProviderComplaintType = (
  value,
  complaintTypeLookups = [],
) => {
  if (normalizeComplaintTypeKey(value) === COMPLAINT_TYPE.MOSP) return true;

  const lookup = findComplaintTypeLookup(value, complaintTypeLookups);
  const label = getComplaintTypeLookupLabel(lookup).toLowerCase();
  const code = normalizeComplaintTypeKey(lookup?.code || lookup?.lookupname);

  return (
    code === COMPLAINT_TYPE.MOSP ||
    label.includes('member on service provider') ||
    label.includes('service provider')
  );
};

export const isIssueApiSuccess = response =>
  response?.status >= 200 && response?.status < 300;

export const getIssueApiErrorMessage = (response, fallback = 'Request failed') => {
  const data = response?.data;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error?.message === 'string') return data.error.message;
  if (typeof data?.error === 'string') return data.error;
  if (response?.status) return `${fallback} (HTTP ${response.status})`;
  return fallback;
};

export const getComplaintTypeLabel = (value, options = COMPLAINT_TYPE_OPTIONS) => {
  const match = options.find(option => option.value === value);
  if (match?.label) return match.label;

  const fallback = COMPLAINT_TYPE_OPTIONS.find(option => option.value === value);
  return fallback?.label || value || 'Complaint';
};

export const mapIssueStatusLabel = status => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACTIVE') return 'Open';
  if (normalized === 'CLOSED') return 'Closed';
  if (normalized === 'IN_PROGRESS' || normalized === 'IN PROGRESS') {
    return 'In Progress';
  }
  return status || 'Open';
};

export const formatIssueDate = value => {
  if (!value) return '';
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('D MMM YYYY') : String(value);
};

export const formatIssueDateTime = value => {
  if (!value) return '';
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('D MMM YYYY • h:mm A') : String(value);
};

export const parseIssuesListResponse = response => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : payload?.items || [];
};

export const stripHtmlToPlainText = value => {
  if (value == null || value === '') return '';
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export const mapPortalIssueToListItem = issue => {
  const id = issue?._id || issue?.id || issue?.issueNumber;
  return {
    id,
    subject:
      issue?.caseTitle ||
      issue?.internalReferenceNumber ||
      getComplaintTypeLabel(issue?.complaintType),
    title:
      issue?.caseTitle ||
      issue?.internalReferenceNumber ||
      getComplaintTypeLabel(issue?.complaintType),
    date: formatIssueDate(issue?.dateReceived || issue?.createdOn || issue?.createdAt),
    status: mapIssueStatusLabel(issue?.issueStatus),
    description: stripHtmlToPlainText(issue?.description || ''),
    complaintType: issue?.complaintType,
    priority: issue?.priority || 'Medium',
    raw: issue,
  };
};

export const parseIssueDetailResponse = response =>
  response?.data?.data ?? response?.data ?? null;

export const parseIssueIdFromResponse = response => {
  const data = parseIssueDetailResponse(response);
  return data?._id || data?.id || data?.issueId || null;
};

export const parseIssueAttachments = issue => {
  const attachments = issue?.attachments ?? issue?.documents ?? [];
  return (Array.isArray(attachments) ? attachments : []).map((item, index) => ({
    id: item?._id || item?.id || index,
    name: item?.fileName || item?.name || item?.originalName || 'Attachment',
    url: item?.url || item?.fileUrl || item?.downloadUrl,
    mimeType: item?.mimeType || item?.contentType,
  }));
};

export const parseIssueActivitiesResponse = response => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : payload?.items || [];
};

export const mapPortalIssueActivity = (activity, index = 0) => {
  if (!activity) return null;

  const id = activity?._id || activity?.id || `activity-${index}`;
  const attachments = Array.isArray(activity?.attachments)
    ? activity.attachments
    : Array.isArray(activity?.files)
      ? activity.files
      : [];

  return {
    id,
    body: stripHtmlToPlainText(
      activity?.body || activity?.comment || activity?.message || '',
    ),
    createdAt: formatIssueDateTime(
      activity?.createdAt || activity?.createdOn || activity?.timestamp,
    ),
    createdAtRaw:
      activity?.createdAt || activity?.createdOn || activity?.timestamp || '',
    createdBy:
      activity?.createdByName ||
      activity?.createdBy?.name ||
      activity?.authorName ||
      activity?.createdBy ||
      '',
    type: activity?.type || activity?.activityType || 'COMMENT',
    attachments: attachments.map((item, attachmentIndex) => ({
      index: attachmentIndex,
      id: item?._id || item?.id || attachmentIndex,
      name:
        item?.fileName ||
        item?.originalName ||
        item?.name ||
        `Attachment ${attachmentIndex + 1}`,
      mimeType: item?.mimeType || item?.contentType || '',
      url: item?.url || item?.fileUrl || item?.downloadUrl || '',
    })),
    raw: activity,
  };
};

export const mapPortalIssueActivities = response =>
  parseIssueActivitiesResponse(response)
    .map(mapPortalIssueActivity)
    .filter(Boolean);

export const parseAttachmentDownloadResponse = response => {
  const payload = response?.data?.data ?? response?.data ?? null;
  if (!payload?.url) return null;

  return {
    url: payload.url,
    filename: payload.filename || payload.fileName || 'attachment',
    contentType: payload.contentType || payload.mimeType || '',
  };
};

export const formatDisplayValue = value => {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

export const mapPortalIssueDetail = issue => {
  if (!issue) return null;

  const summary = mapPortalIssueToListItem(issue);

  return {
    ...summary,
    caseTitle: issue?.caseTitle || issue?.internalReferenceNumber || '',
    internalReferenceNumber: issue?.internalReferenceNumber || '',
    issueType: issue?.issueType || ISSUE_TYPE.COMPLAINT,
    issueStatus: mapIssueStatusLabel(issue?.issueStatus),
    issueStatusRaw: issue?.issueStatus || '',
    complaintType: issue?.complaintType || '',
    complaintTypeLabel: getComplaintTypeLabel(issue?.complaintType),
    dateReceived: formatIssueDate(issue?.dateReceived),
    createdOn: formatIssueDate(issue?.createdOn || issue?.createdAt),
    dateResolved: formatIssueDate(issue?.dateResolved),
    lastActivityAt: formatIssueDate(issue?.lastActivityAt),
    description: stripHtmlToPlainText(issue?.description || ''),
    complainant: issue?.complainant || '',
    priority: issue?.priority || '',
    origin: issue?.origin || '',
    ownerTeam: issue?.owner?.team || '',
    serviceProvider: issue?.serviceProvider || '',
    memberIds: issue?.memberIds || [],
    memberCount: Array.isArray(issue?.memberIds) ? issue.memberIds.length : 0,
    createdViaPortal: issue?.createdViaPortal,
    externalSolicitorInvolved: issue?.externalSolicitorInvolved,
    resolution: stripHtmlToPlainText(
      issue?.resolution || issue?.resolutionOther || '',
    ),
    dueDate: formatIssueDate(issue?.dueDate),
    externalAgency: issue?.externalAgency || '',
    externalCaseRef: issue?.externalCaseRef || '',
    attachments: parseIssueAttachments(issue),
    raw: issue,
  };
};

export const buildPortalComplaintPayload = ({
  description,
  dateReceived,
  complaintType,
  relatedMember,
  serviceProvider,
  complainantId,
  complaintTypeLookups = [],
}) => {
  const payload = {
    issueType: ISSUE_TYPE.COMPLAINT,
    description: String(description || '').trim(),
    dateReceived: moment(dateReceived).toISOString(),
    complaintType,
  };

  if (
    isMemberOnMemberComplaintType(complaintType, complaintTypeLookups) &&
    relatedMember
  ) {
    payload.relatedMember = String(relatedMember).trim();
  }

  if (
    isMemberOnMemberComplaintType(complaintType, complaintTypeLookups) &&
    complainantId
  ) {
    payload.complainantId = complainantId;
  }

  if (
    isMemberOnServiceProviderComplaintType(complaintType, complaintTypeLookups) &&
    serviceProvider
  ) {
    payload.serviceProvider = String(serviceProvider).trim();
  }

  return payload;
};
