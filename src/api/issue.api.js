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

export const uploadIssueAttachments = (issueId, files = []) => {
  const formData = new FormData();
  files.forEach(file => {
    if (!file) return;
    if (file?.uri) {
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'attachment',
        type: file.type || 'application/octet-stream',
      });
      return;
    }
    formData.append('file', file);
  });

  return issue_request.post(
    `${PORTAL_ISSUES_BASE}/${issueId}/activities`,
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
    if (file?.uri) {
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'attachment',
        type: file.type || 'application/octet-stream',
      });
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
