/**
 * Dashboard constants: quick action colors, featured/upcoming events, event status maps.
 */

export const QUICK_ACTION_COLORS = {
  blue: { cardBackground: '#DBEAFE', iconBackground: '#3B82F6' },
  green: { cardBackground: '#D1FAE5', iconBackground: '#10B981' },
  purple: { cardBackground: '#EDE9FE', iconBackground: '#7C3AED' },
  orange: { cardBackground: '#FFEDD5', iconBackground: '#F97316' },
  teal: { cardBackground: '#CCFBF1', iconBackground: '#14B8A6' },
};

export const FEATURED_EVENT = {
  id: 1,
  title: 'Annual General Meeting Reminder',
  date: 'April 29, 2026',
  time: '4:00 PM - 6:00 PM',
  location: 'Convention Center, Downtown',
  category: 'Meeting',
  description: "Don't miss our most important meeting of the year. Register now to secure your spot.",
  image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
  attendees: 250,
  status: 'available',
};

export const UPCOMING_EVENTS = [
  {
    id: 2,
    title: 'Networking Mixer',
    date: 'May 25, 2026',
    time: '7:00 PM - 10:00 PM',
    location: 'Grand Hotel Ballroom',
    category: 'Networking',
    description: 'Connect with industry professionals and expand your network in a relaxed atmosphere.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&h=200&fit=crop',
    attendees: 180,
    status: 'available',
  },
  {
    id: 3,
    title: 'Leadership Webinar',
    date: 'May 2, 2026',
    time: '10:00 AM - 12:00 PM',
    location: 'Online',
    category: 'Webinar',
    description: 'Learn from industry leaders about effective leadership strategies and team management.',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=200&h=200&fit=crop',
    attendees: 320,
    status: 'available',
  },
  {
    id: 4,
    title: 'Tech Skills Workshop',
    date: 'May 15, 2026',
    time: '2:00 PM - 5:00 PM',
    location: 'Tech Hub, Innovation Center',
    category: 'Workshop',
    description: 'Hands-on workshop covering the latest technologies and development practices.',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&h=200&fit=crop',
    attendees: 45,
    status: 'available',
  },
];

export const EVENT_STATUS_COLORS = {
  registered: { bg: '#D1FAE5', text: '#059669' },
  submitted: { bg: '#FEF3C7', text: '#B45309' },
  available: { bg: '#DBEAFE', text: '#2563EB' },
  waitlist: { bg: '#FEF3C7', text: '#D97706' },
  completed: { bg: '#F3F4F6', text: '#6B7280' },
};
export const EVENT_STATUS_DEFAULT = { bg: '#F3F4F6', text: '#6B7280' };

export const EVENT_STATUS_LABELS = {
  registered: 'Registered',
  submitted: 'Submitted',
  available: 'Register Now',
  waitlist: 'Waitlist',
  completed: 'Completed',
};
export const EVENT_STATUS_LABEL_DEFAULT = 'Available';
