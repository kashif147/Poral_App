/**
 * Extended event data for registration flow.
 * Merges with base events from Event.js for events that support registration.
 */
export const EVENT_REGISTRATION_DATA = {
  1: {
    venue: 'Convention Center, Downtown',
    credits: '12 CPD Credits',
    days: [
      { id: 'd1', title: 'Day 1: Opening & Keynotes', date: 'December 15, 2024', price: 75 },
      { id: 'd2', title: 'Day 2: Workshops', date: 'December 16, 2024', price: 75 },
    ],
    sessions: [
      { dayId: 'd1', time: '09:00 - 10:30', title: 'Annual Report Overview' },
      { dayId: 'd1', time: '11:00 - 12:30', title: 'Elections & Board Updates' },
      { dayId: 'd2', time: '10:00 - 12:00', title: 'Member Q&A Session' },
    ],
  },
  2: {
    venue: 'Grand Hotel Ballroom',
    credits: '6 CPD Credits',
    days: [
      { id: 'd1', title: 'Full Event', date: 'October 25, 2024', price: 150 },
    ],
    sessions: [
      { dayId: 'd1', time: '19:00 - 22:00', title: 'Networking Mixer' },
    ],
  },
  3: {
    venue: 'Online',
    credits: '8 CPD Credits',
    days: [
      { id: 'd1', title: 'Webinar Session', date: 'November 2, 2024', price: 99 },
    ],
    sessions: [
      { dayId: 'd1', time: '10:00 - 12:00', title: 'Leadership Webinar' },
    ],
  },
};

/**
 * Global Tech Summit / Innovation Summit style event for design mockups
 */
export const GLOBAL_TECH_SUMMIT_EVENT = {
  id: 9,
  title: 'Global Tech Summit',
  date: 'Oct 12-14, 2024',
  time: '9:00 AM - 6:00 PM',
  location: 'San Francisco, CA',
  category: 'Conference',
  type: 'upcoming',
  image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
  attendees: 500,
  status: 'available',
  description: 'Join us for our annual technology conference featuring industry experts and networking opportunities. Experience three days of cutting-edge innovation and keynote sessions.',
  venue: 'San Francisco Convention Center',
  credits: '12 CPD Credits',
  days: [
    { id: 'd1', title: 'Day 1: Opening & Keynotes', date: 'October 12, 2024', price: 150 },
    { id: 'd2', title: 'Day 2: Technical Workshops', date: 'October 13, 2024', price: 150 },
    { id: 'd3', title: 'Day 3: Workshops & Closing', date: 'October 14, 2024', price: 150 },
  ],
  sessions: [
    { dayId: 'd1', time: '09:00 - 10:30', title: 'The Future of AI in Enterprise' },
    { dayId: 'd1', time: '11:00 - 12:30', title: 'Scaling Engineering Teams' },
    { dayId: 'd2', time: '10:00 - 13:00', title: 'Hands-on: Next.js & Tailwind' },
    { dayId: 'd2', time: '14:00 - 16:00', title: 'Cybersecurity Essentials' },
    { dayId: 'd3', time: '09:00 - 11:00', title: 'Industry Expert Panel' },
    { dayId: 'd3', time: '11:30 - 13:00', title: 'Awards Ceremony & Brunch' },
  ],
};

const FALLBACK_REGISTRATION = {
  venue: 'San Francisco Convention Center',
  credits: '12 CPD Credits',
  days: GLOBAL_TECH_SUMMIT_EVENT.days,
  sessions: GLOBAL_TECH_SUMMIT_EVENT.sessions,
};

export const getEventWithRegistrationData = (event) => {
  if (!event) return { ...GLOBAL_TECH_SUMMIT_EVENT };
  const ext = EVENT_REGISTRATION_DATA[event.id];
  if (ext) return { ...event, ...ext };
  return { ...event, ...FALLBACK_REGISTRATION };
};
