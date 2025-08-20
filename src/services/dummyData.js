export const dummyData = {
  user: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=male',
    role: 'Premium Member',
    memberSince: '2020-01-01',
  },
  
  communications: [
    {
      id: 1,
      title: 'Annual General Meeting',
      date: '2024-02-05',
      type: 'Meeting',
      status: 'Upcoming',
    },
    {
      id: 2,
      title: 'Membership Renewal Notice',
      date: '2024-01-25',
      type: 'Notice',
      status: 'Read',
    },
    {
      id: 3,
      title: 'Monthly Newsletter',
      date: '2024-01-15',
      type: 'Newsletter',
      status: 'Read',
    },
  ],

  events: [
    {
      id: 1,
      title: 'Professional Development Workshop',
      date: '2024-05-10',
      location: 'Virtual',
      status: 'Upcoming',
      description: 'Learn about the latest industry trends and best practices.',
    },
    {
      id: 2,
      title: 'Networking Event',
      date: '2024-06-15',
      location: 'City Convention Center',
      status: 'Upcoming',
      description: 'Connect with industry professionals and expand your network.',
    },
  ],

  subscriptionStatus: {
    status: 'Active',
    type: 'Premium',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    features: [
      'Access to all events',
      'Premium content',
      'Priority support',
      'CPD tracking',
    ],
  },

  payments: [
    {
      id: 1,
      date: '2024-01-01',
      amount: 599.99,
      description: 'Annual Membership Renewal',
      status: 'Paid',
    },
    {
      id: 2,
      date: '2023-12-15',
      amount: 49.99,
      description: 'Workshop Registration',
      status: 'Paid',
    },
  ],
};

export const statistics = {
  totalEvents: 15,
  upcomingEvents: 5,
  unreadMessages: 3,
  cpd_points: 45,
}; 