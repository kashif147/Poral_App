export const CASE_CATEGORY_OPTIONS = [
  { label: 'Civil', value: 'civil' },
  { label: 'Criminal', value: 'criminal' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Family', value: 'family' },
  { label: 'Other', value: 'other' },
];

export const CASE_TYPE_OPTIONS = [
  { label: 'Complaint', value: 'complaint' },
  { label: 'Inquiry', value: 'inquiry' },
  { label: 'Appeal', value: 'appeal' },
  { label: 'Other', value: 'other' },
];

export const CASE_FILTERS = ['All', 'Open', 'In Progress', 'Closed'];

export const CASE_STATUS_STYLES = {
  Open: { color: '#10B981', bg: '#D1FAE5' },
  'In Progress': { color: '#F59E0B', bg: '#FEF3C7' },
  Closed: { color: '#6B7280', bg: '#F3F4F6' },
};

export const QUERIES_CASES_DUMMY_DATA = [
  {
    id: 'CS-2023-001',
    subject: 'Membership Renewal Issue',
    title: 'Membership Renewal Issue',
    date: 'Oct 24, 2023',
    status: 'Open',
    description: 'I cannot proceed with my payment for renewal.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop',
  },
  {
    id: 'CS-2023-002',
    subject: 'Certificate Request',
    title: 'Certificate Request',
    date: 'Oct 20, 2023',
    status: 'Closed',
    image: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=800&h=400&fit=crop',
    description: 'Requesting a copy of my membership certificate.',
  },
  {
    id: 'CS-2023-003',
    subject: 'Event Registration',
    title: 'Event Registration',
    date: 'Oct 15, 2023',
    status: 'In Progress',
    description: 'Need help registering for the Annual Meetup.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
  },
  {
    id: 'CS-2023-004',
    subject: 'Profile Update',
    title: 'Profile Update',
    date: 'Oct 10, 2023',
    status: 'Closed',
    description: 'Updated my contact details but not reflecting.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=400&fit=crop',
  },
];

export const AVAILABLE_STAFF = [
  { id: '1', name: 'David Chen' },
  { id: '2', name: 'Lisa Volkov' },
  { id: '3', name: 'James Wilson' },
  { id: '4', name: 'Sarah Miller' },
];
