import issue_request from './issue_request';
import { ISSUE_TYPE } from '../helpers/issues.helper';

const PORTAL_ISSUES_BASE = '/api/issues/portal';

const withIssueType = (data = {}) => ({
  ...data,
  issueType: ISSUE_TYPE.COMPLAINT,
});

export const createPortalIssue = data => {
  const payload = withIssueType(data);
  return issue_request.post(PORTAL_ISSUES_BASE, payload);
};

const resolveUploadUri = file => {
  const raw =
    file?.fileCopyUri ||
    file?.localUri ||
    file?.fileCopyURI ||
    file?.uri ||
    file?.path ||
    '';
  const value = String(raw || '').trim();
  if (!value) return '';
  if (value.startsWith('file://') || value.startsWith('content://')) {
    return value;
  }
  if (value.startsWith('/')) return `file://${value}`;
  return value;
};

const toUploadFilePart = file => {
  const uri = resolveUploadUri(file);
  if (!uri) return null;
  return {
    uri,
    name: file?.name || file?.fileName || 'attachment',
    type: file?.type || 'application/octet-stream',
  };
};

export const uploadIssueAttachments = (issueId, files = []) => {
  const formData = new FormData();
  files.forEach(file => {
    if (!file) return;
    const part = toUploadFilePart(file);
    if (part) {
      formData.append('files', part);
      return;
    }
    formData.append('files', file);
  });

  return issue_request.post(
    `${PORTAL_ISSUES_BASE}/${issueId}/attachments`,
    formData,
  );
};

export const fetchMyPortalIssues = () =>
  issue_request.get(`${PORTAL_ISSUES_BASE}/mine`);

export const fetchPortalIssueById = id =>
  issue_request.get(`${PORTAL_ISSUES_BASE}/${id}`);

export const fetchPortalIssueActivities = id =>
  issue_request.get(`${PORTAL_ISSUES_BASE}/${id}/activities`);

export const fetchPortalIssueHistory = id =>
  issue_request.get(`${PORTAL_ISSUES_BASE}/${id}/history`);

export const createPortalIssueActivity = (id, { body = '', file } = {}) => {
  const trimmedBody = String(body || '').trim();

  if (file) {
    const formData = new FormData();
    if (trimmedBody) {
      formData.append('body', trimmedBody);
    }
    const part = toUploadFilePart(file);
    if (part) {
      formData.append('file', part);
    } else {
      formData.append('file', file);
    }
    return issue_request.post(
      `${PORTAL_ISSUES_BASE}/${id}/activities`,
      formData,
    );
  }

  return issue_request.post(`${PORTAL_ISSUES_BASE}/${id}/activities`, {
    body: trimmedBody,
  });
};

export const downloadPortalIssueActivityAttachment = (
  issueId,
  activityId,
  attachmentIndex,
) =>
  issue_request.get(
    `${PORTAL_ISSUES_BASE}/${issueId}/activities/${activityId}/attachments/${attachmentIndex}/download`,
  );

export const updatePortalIssueActivity = (issueId, activityId, { body = '' } = {}) =>
  issue_request.put(`${PORTAL_ISSUES_BASE}/${issueId}/activities/${activityId}`, {
    body: String(body || '').trim(),
  });

export const deletePortalIssueActivity = (issueId, activityId) =>
  issue_request.delete(`${PORTAL_ISSUES_BASE}/${issueId}/activities/${activityId}`);

export const deletePortalIssueActivityAttachment = (
  issueId,
  activityId,
  attachmentIndex,
) =>
  issue_request.delete(
    `${PORTAL_ISSUES_BASE}/${issueId}/activities/${activityId}/attachments/${attachmentIndex}`,
  );
