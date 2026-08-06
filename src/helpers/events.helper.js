import moment from 'moment';
import {
  buildApplicationPersonalInfo,
  validateApplicationStep,
} from './applicationForm.helper';

export const PRICING_TIER_TYPES = {
  EARLY_BIRD_MEMBER: 'EARLY_BIRD_MEMBER',
  EARLY_BIRD_NON_MEMBER: 'EARLY_BIRD_NON_MEMBER',
  STUDENT: 'STUDENT',
  GROUP_STUDENT: 'GROUP_STUDENT',
};

const decodeHtmlEntities = text =>
  String(text)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );

const stripHtml = html => {
  if (!html) return '';
  return decodeHtmlEntities(String(html).replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
};

export const getEventCategoryLabel = (eventCategoryLookupCode, fallback = 'General') => {
  if (eventCategoryLookupCode === 'CPD') return 'Course';
  if (eventCategoryLookupCode === 'EVENT') return 'Event';
  return eventCategoryLookupCode || fallback;
};

export const getEventImageUrl = apiEvent => {
  const raw =
    apiEvent?.imageUrl ||
    apiEvent?.image ||
    apiEvent?.bannerImageUrl ||
    apiEvent?.coverImageUrl ||
    '';

  if (typeof raw === 'string') {
    return raw.trim();
  }

  if (raw && typeof raw === 'object') {
    const nested = raw.url || raw.uri || raw.href || '';
    return typeof nested === 'string' ? nested.trim() : '';
  }

  return '';
};

/** Normalize API approval/status into UI card status. */
export const resolveRegistrationCardStatus = (item = {}) => {
  const approval = String(item?.approvalStatus || '').toLowerCase();
  const status = String(item?.status || '').toLowerCase();

  // Prefer explicit approvalStatus from registrations API.
  if (approval === 'pending_review' || approval === 'pending') {
    return 'submitted';
  }
  if (approval === 'approved' || approval === 'confirmed') {
    return 'registered';
  }

  if (
    status === 'pending_review' ||
    status === 'pending' ||
    status === 'submitted'
  ) {
    return 'submitted';
  }

  if (
    status === 'confirmed' ||
    status === 'approved' ||
    status === 'registered'
  ) {
    return 'registered';
  }

  return status || 'registered';
};

export const getRegistrationStatusLabel = status => {
  switch (String(status || '').toLowerCase()) {
    case 'registered':
      return 'Registered';
    case 'submitted':
      return 'Submitted';
    case 'available':
      return 'Available';
    case 'waitlist':
      return 'Waitlist';
    case 'completed':
      return 'Completed';
    default:
      return status ? String(status) : 'Available';
  }
};

/** True when user already applied (approved or pending) — block re-register. */
export const isRegistrationLocked = (item = {}) => {
  const status = String(item?.status || '').toLowerCase();
  const approval = String(item?.approvalStatus || '').toLowerCase();

  return (
    status === 'registered' ||
    status === 'submitted' ||
    status === 'completed' ||
    Boolean(item?.registrationId) ||
    approval === 'approved' ||
    approval === 'confirmed' ||
    approval === 'pending_review' ||
    approval === 'pending'
  );
};

export const isCourseRegistration = item => {
  if (!item) return false;

  const registrationType = String(
    item.registrationType || item.type || '',
  ).toLowerCase();
  const categoryCode = String(
    item.eventCategoryLookupCode ||
      item.categoryCode ||
      item.event?.eventCategoryLookupCode ||
      item.course?.eventCategoryLookupCode ||
      '',
  ).toUpperCase();
  const eventTypeName = String(
    item.eventTypeName || item.category || item.event?.eventTypeName || '',
  ).toLowerCase();

  if (registrationType === 'course' || registrationType === 'cpd') {
    return true;
  }
  if (categoryCode === 'CPD') {
    return true;
  }
  if (item.courseId && !item.eventId) {
    return true;
  }
  if (
    eventTypeName.includes('course') ||
    eventTypeName === 'cpd' ||
    eventTypeName.includes('self-paced')
  ) {
    return true;
  }

  const title = String(item.title || '').toLowerCase();
  if (title.includes('course') && categoryCode !== 'EVENT') {
    return true;
  }

  return Boolean(item.courseId) && registrationType !== 'event';
};

export const getEventTimingType = startDate => {
  if (!startDate) return 'upcoming';
  return moment(startDate).isBefore(moment(), 'day') ? 'past' : 'upcoming';
};

export const formatEventDate = dateString => {
  if (!dateString) return 'Date TBD';
  const date = moment(dateString);
  return date.isValid() ? date.format('D MMMM YYYY') : 'Date TBD';
};

export const formatEventTime = (startDate, endDate) => {
  const start = moment(startDate);
  if (!start.isValid()) return 'Time TBD';

  const end = moment(endDate);
  if (end.isValid() && !start.isSame(end)) {
    return `${start.format('h:mm A')} - ${end.format('h:mm A')}`;
  }

  return start.format('h:mm A');
};

export const formatRegistrationPrice = (price, currency = 'EUR') => {
  if (price == null || price === '') return 'Free';
  const amount = Number(price);
  if (Number.isNaN(amount) || amount <= 0) return 'Free';
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `€${amount.toFixed(2)}`;
  }
};

export const getEventPricingTiers = event => {
  const tiers = event?.pricingTiers || event?.raw?.pricingTiers || [];
  return Array.isArray(tiers) ? tiers : [];
};

export const getActivePricingTiers = event =>
  getEventPricingTiers(event).filter(tier => tier?.isActive !== false);

export const findPricingTierByType = (event, tierType) =>
  getActivePricingTiers(event).find(tier => tier?.tierType === tierType) || null;

export const isEarlyBirdPricingActive = (earlyBirdTier, now = moment()) => {
  if (!earlyBirdTier) return false;
  if (!earlyBirdTier.cutoffDate) return true;
  const cutoff = moment(earlyBirdTier.cutoffDate);
  if (!cutoff.isValid()) return true;
  return now.isSameOrBefore(cutoff);
};

export const isUndergraduateMembershipCategory = ({
  membershipCategory,
  categoryCode,
  categoryName,
} = {}) => {
  const values = [membershipCategory, categoryCode, categoryName]
    .filter(Boolean)
    .map(value => String(value).trim().toLowerCase());

  return values.some(
    value =>
      value === 'undergraduate_student' ||
      value === 'undergraduate student' ||
      value.includes('undergraduate'),
  );
};

/**
 * Build pricing options for registration based on API tiers.
 * - When early-bird member/non-member tiers are active, standard rates are hidden.
 * - Non-members see member / early-bird member prices as display-only (not selectable).
 */
export const buildAvailablePricingOptions = (
  event,
  {
    isMember = true,
    membershipCategory = '',
    categoryCode = '',
    categoryName = '',
    now = moment(),
  } = {},
) => {
  if (!event) return [];

  const options = [];
  const earlyBirdMemberTier = findPricingTierByType(
    event,
    PRICING_TIER_TYPES.EARLY_BIRD_MEMBER,
  );
  const earlyBirdNonMemberTier = findPricingTierByType(
    event,
    PRICING_TIER_TYPES.EARLY_BIRD_NON_MEMBER,
  );
  const studentTier = findPricingTierByType(event, PRICING_TIER_TYPES.STUDENT);
  const groupStudentTier = findPricingTierByType(
    event,
    PRICING_TIER_TYPES.GROUP_STUDENT,
  );
  const earlyBirdMemberActive = isEarlyBirdPricingActive(
    earlyBirdMemberTier,
    now,
  );
  const earlyBirdNonMemberActive = isEarlyBirdPricingActive(
    earlyBirdNonMemberTier,
    now,
  );
  const isUndergraduate = isUndergraduateMembershipCategory({
    membershipCategory,
    categoryCode,
    categoryName,
  });

  const memberSelectable = Boolean(isMember);
  const memberOnlySubtitle = 'Members only — not available for non-members';

  if (earlyBirdMemberActive) {
    options.push({
      id: 'early-bird-member',
      tierType: PRICING_TIER_TYPES.EARLY_BIRD_MEMBER,
      title: 'Early Bird Member',
      subtitle: !memberSelectable
        ? memberOnlySubtitle
        : earlyBirdMemberTier.cutoffDate
          ? `Available until ${formatEventDate(earlyBirdMemberTier.cutoffDate)}`
          : 'Special early registration rate for members',
      price: Number(earlyBirdMemberTier.price) || 0,
      unitPrice: Number(earlyBirdMemberTier.price) || 0,
      isGroup: false,
      minGroupSize: null,
      cutoffDate: earlyBirdMemberTier.cutoffDate || null,
      selectable: memberSelectable,
    });
  } else {
    options.push({
      id: 'member',
      tierType: 'MEMBER',
      title: 'Member Price',
      subtitle: memberSelectable
        ? 'Standard member registration rate'
        : memberOnlySubtitle,
      price: Number(event.memberPrice) || 0,
      unitPrice: Number(event.memberPrice) || 0,
      isGroup: false,
      minGroupSize: null,
      cutoffDate: null,
      selectable: memberSelectable,
    });
  }

  if (earlyBirdNonMemberActive) {
    options.push({
      id: 'early-bird-non-member',
      tierType: PRICING_TIER_TYPES.EARLY_BIRD_NON_MEMBER,
      title: 'Early Bird Non-Member',
      subtitle: earlyBirdNonMemberTier.cutoffDate
        ? `Available until ${formatEventDate(earlyBirdNonMemberTier.cutoffDate)}`
        : 'Special early registration rate for non-members',
      price: Number(earlyBirdNonMemberTier.price) || 0,
      unitPrice: Number(earlyBirdNonMemberTier.price) || 0,
      isGroup: false,
      minGroupSize: null,
      cutoffDate: earlyBirdNonMemberTier.cutoffDate || null,
      selectable: true,
    });
  } else {
    options.push({
      id: 'non-member',
      tierType: 'NON_MEMBER',
      title: 'Non-Member Price',
      subtitle: 'Standard non-member registration rate',
      price: Number(event.nonMemberPrice) || 0,
      unitPrice: Number(event.nonMemberPrice) || 0,
      isGroup: false,
      minGroupSize: null,
      cutoffDate: null,
      selectable: true,
    });
  }

  // Members only need member-side rates (+ student tiers below).
  if (isMember) {
    const memberOptions = options.filter(
      option =>
        option.id === 'member' ||
        option.id === 'early-bird-member',
    );
    options.length = 0;
    options.push(...memberOptions);
  }

  if (studentTier) {
    const showStudent = !isMember || isUndergraduate;
    if (showStudent) {
      options.push({
        id: 'student',
        tierType: PRICING_TIER_TYPES.STUDENT,
        title: 'Student',
        subtitle: isMember
          ? 'Available for undergraduate student members'
          : 'Student registration rate',
        price: Number(studentTier.price) || 0,
        unitPrice: Number(studentTier.price) || 0,
        isGroup: false,
        minGroupSize: null,
        cutoffDate: studentTier.cutoffDate || null,
        selectable: true,
      });
    }
  }

  if (groupStudentTier) {
    const minGroupSize = Number(groupStudentTier.minGroupSize) || 1;
    options.push({
      id: 'group-student',
      tierType: PRICING_TIER_TYPES.GROUP_STUDENT,
      title: 'Group Student',
      subtitle: `Minimum ${minGroupSize} students · charged per student`,
      price: Number(groupStudentTier.price) || 0,
      unitPrice: Number(groupStudentTier.price) || 0,
      isGroup: true,
      minGroupSize,
      cutoffDate: groupStudentTier.cutoffDate || null,
      selectable: true,
    });
  }

  return options;
};

export const createInitialQuantities = (options = []) => {
  const quantities = {};
  options.forEach(option => {
    quantities[option.id] = 0;
  });
  return quantities;
};

export const getOptionQuantity = (quantities, optionOrId) => {
  const id = typeof optionOrId === 'string' ? optionOrId : optionOrId?.id;
  return Math.max(0, Number(quantities?.[id]) || 0);
};

export const clampOptionQuantity = (option, quantity) => {
  const next = Math.max(0, Number(quantity) || 0);
  if (!option?.isGroup) return next;
  if (next === 0) return 0;
  return Math.max(Number(option.minGroupSize) || 1, next);
};

export const calculateQuantitiesTotal = (options = [], quantities = {}) =>
  (options || []).reduce((sum, option) => {
    if (option?.selectable === false) return sum;
    const quantity = getOptionQuantity(quantities, option);
    if (quantity <= 0) return sum;
    return sum + (Number(option.unitPrice ?? option.price) || 0) * quantity;
  }, 0);

export const buildSelectedPricingLineItems = (options = [], quantities = {}) =>
  (options || [])
    .map(option => {
      if (option?.selectable === false) return null;
      const quantity = getOptionQuantity(quantities, option);
      if (quantity <= 0) return null;
      const unitPrice = Number(option.unitPrice ?? option.price) || 0;
      return {
        id: option.id,
        title: option.title,
        unitPrice,
        quantity,
        price: unitPrice * quantity,
        tierType: option.tierType,
        tierKey: option.tierType,
      };
    })
    .filter(Boolean);

export const buildRegistrationLineItems = (options = [], quantities = {}) =>
  buildSelectedPricingLineItems(options, quantities).map(item => ({
    tierKey: item.tierKey,
    quantity: item.quantity,
  }));

export const getDefaultPricingOption = (options = [], isMember = true) => {
  const selectable = (options || []).filter(
    option => option?.selectable !== false,
  );
  if (!selectable.length) return null;
  return (
    selectable.find(option => option.id === 'early-bird-member') ||
    selectable.find(option => option.id === 'early-bird-non-member') ||
    selectable.find(option => option.id === 'early-bird') ||
    selectable.find(
      option => option.id === (isMember ? 'member' : 'non-member'),
    ) ||
    selectable[0]
  );
};

export const resolveDisplayPrice = (
  event,
  {
    isMember = true,
    membershipCategory = '',
    categoryCode = '',
    categoryName = '',
  } = {},
) => {
  const options = buildAvailablePricingOptions(event, {
    isMember,
    membershipCategory,
    categoryCode,
    categoryName,
  });
  if (!options.length) {
    return isMember ? event?.memberPrice : event?.nonMemberPrice;
  }

  const preferred = getDefaultPricingOption(options, isMember);
  return preferred?.unitPrice ?? preferred?.price ?? 0;
};

export const calculatePricingOptionTotal = (option, quantity = 1) => {
  if (!option) return 0;
  const unitPrice = Number(option.unitPrice ?? option.price) || 0;
  if (!option.isGroup) return unitPrice;
  const count = Math.max(
    Number(quantity) || 0,
    Number(option.minGroupSize) || 1,
  );
  return unitPrice * count;
};

export const mapApiEventToCard = apiEvent => {
  if (!apiEvent) return null;

  const id = apiEvent._id || apiEvent.id;
  const courseId = apiEvent.courseId || id;
  const location = apiEvent.isVirtual
    ? 'Online'
    : apiEvent.venue || 'Location TBD';

  return {
    id,
    courseId,
    title: apiEvent.title,
    description: stripHtml(apiEvent.description),
    descriptionHtml: apiEvent.description || '',
    date: formatEventDate(apiEvent.startDate),
    time: formatEventTime(apiEvent.startDate, apiEvent.endDate),
    location,
    category: getEventCategoryLabel(apiEvent.eventCategoryLookupCode || 'CPD'),
    eventCategoryLookupCode: apiEvent.eventCategoryLookupCode || 'CPD',
    type: getEventTimingType(apiEvent.startDate),
    status: 'available',
    attendees: apiEvent.capacity,
    memberPrice: apiEvent.memberPrice,
    nonMemberPrice: apiEvent.nonMemberPrice,
    pricingTiers: Array.isArray(apiEvent.pricingTiers)
      ? apiEvent.pricingTiers
      : [],
    sessions: Array.isArray(apiEvent.sessions) ? apiEvent.sessions : [],
    sessionIds: Array.isArray(apiEvent.sessionIds) ? apiEvent.sessionIds : [],
    cpdCredits: apiEvent.cpdCredits,
    isVirtual: apiEvent.isVirtual,
    startDate: apiEvent.startDate,
    endDate: apiEvent.endDate,
    image: getEventImageUrl(apiEvent) || undefined,
    raw: apiEvent,
  };
};

export const resolveCourseRegistrationId = ({
  courseId,
  event,
  course,
} = {}) => {
  const source = event || course || {};
  const raw = source.raw || source;

  return (
    courseId ||
    source.courseId ||
    raw.courseId ||
    raw._id ||
    source.id ||
    raw.id ||
    null
  );
};

export const parseEventsResponse = response => {
  const events = response?.data?.data;
  if (!Array.isArray(events)) return [];
  return events.map(mapApiEventToCard).filter(Boolean);
};

export const filterEventsByTiming = (events, timing = 'all') => {
  if (timing === 'all' || timing === 'my') return events;
  return events.filter(event => event.type === timing);
};

const extractRegistrationsList = response => {
  if (!response) return [];

  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.registrations)) return payload.registrations;
  return [];
};

export const mapRegistrationToCard = item => {
  if (!item) return null;

  const isCourse = isCourseRegistration(item);
  const entityId =
    (isCourse
      ? item.courseId || item.eventId || item.event?._id || item.event?.id
      : item.eventId || item.event?._id || item.event?.id) || null;

  if (!entityId) return null;

  const cardStatus = resolveRegistrationCardStatus(item);

  return {
    id: entityId,
    courseId: isCourse ? entityId : item.courseId || undefined,
    title: item.title || 'Registration',
    description: item.eventTypeName
      ? `${item.eventTypeName}${item.format ? ` · ${item.format}` : ''}`
      : '',
    date: formatEventDate(item.startDate),
    time: formatEventTime(item.startDate, item.endDate),
    location: item.isVirtual ? 'Online' : item.venue || 'Location TBD',
    category:
      item.eventTypeName || (isCourse ? 'Course' : 'Event'),
    eventCategoryLookupCode: isCourse
      ? item.eventCategoryLookupCode || 'CPD'
      : item.eventCategoryLookupCode || 'EVENT',
    type: item.timing || getEventTimingType(item.startDate),
    status: cardStatus,
    kind: isCourse ? 'course' : 'event',
    registrationId: item._id || item.id,
    registrationType: isCourse ? 'course' : 'event',
    approvalStatus: item.approvalStatus,
    paymentStatus: item.paymentStatus,
    amount: item.amount,
    currency: item.currency,
    startDate: item.startDate,
    endDate: item.endDate,
    isVirtual: item.isVirtual,
    cpdCredits: item.cpdCredits,
    image:
      getEventImageUrl(item) ||
      getEventImageUrl(item.event) ||
      getEventImageUrl(item.course) ||
      undefined,
    rawRegistration: item,
  };
};

export const parseRegistrationsResponse = response => {
  return extractRegistrationsList(response)
    .map(item => {
      if (!item) return null;

      const isCourse = isCourseRegistration(item);
      const eventId = String(
        (isCourse
          ? item.courseId || item.eventId
          : item.eventId || item.courseId) ||
          item.event?._id ||
          item.event?.id ||
          '',
      );

      if (!eventId) return null;

      const card = mapRegistrationToCard(item);
      if (!card) return null;

      return {
        id: item._id || item.id || eventId,
        eventId,
        courseId: isCourse
          ? String(item.courseId || eventId)
          : item.courseId
            ? String(item.courseId)
            : null,
        registrationType: isCourse ? 'course' : 'event',
        status: String(item.status || 'registered').toLowerCase(),
        approvalStatus: item.approvalStatus,
        paymentStatus: item.paymentStatus,
        card: {
          ...card,
          kind: isCourse ? 'course' : 'event',
          registrationType: isCourse ? 'course' : 'event',
        },
        raw: item,
      };
    })
    .filter(Boolean);
};

export const getRegisteredCatalogItems = (
  registrations = [],
  registrationType = null,
) =>
  (registrations || [])
    .filter(reg =>
      registrationType ? reg.registrationType === registrationType : true,
    )
    .map(reg => reg.card)
    .filter(Boolean)
    .filter(item => item.type !== 'past');

export const applyRegistrationStatus = (items = [], registrations = []) => {
  const byEntityId = new Map();

  (registrations || []).forEach(reg => {
    byEntityId.set(String(reg.eventId), reg);
    if (reg.courseId) {
      byEntityId.set(String(reg.courseId), reg);
    }
  });

  return (items || []).map(item => {
    const reg =
      byEntityId.get(String(item.id)) ||
      (item.courseId ? byEntityId.get(String(item.courseId)) : null);
    if (!reg) return item;
    const nextStatus = resolveRegistrationCardStatus({
      ...reg.card,
      approvalStatus: reg.approvalStatus,
      status: reg.status || reg.card?.status,
    });
    return {
      ...item,
      status: nextStatus,
      registrationId: reg.id,
      registrationType: item.kind || reg.registrationType,
      approvalStatus: reg.approvalStatus,
      paymentStatus: reg.paymentStatus,
    };
  });
};

export const filterRegisteredItems = (
  items = [],
  registrations = [],
  registrationType = null,
) => {
  // Prefer catalog items — they already have correct event/course `kind`.
  const fromCatalog = (items || []).filter(item => {
    const isRegistered =
      String(item?.status || '').toLowerCase() === 'registered' ||
      String(item?.status || '').toLowerCase() === 'submitted' ||
      Boolean(item?.registrationId);
    if (!isRegistered) return false;
    if (!registrationType) return true;
    return (
      item.kind === registrationType ||
      item.registrationType === registrationType
    );
  });

  if (fromCatalog.length) {
    return fromCatalog;
  }

  const fromProfile = getRegisteredCatalogItems(
    registrations,
    registrationType,
  ).filter(item =>
    registrationType ? item.kind === registrationType : true,
  );
  if (fromProfile.length) {
    return fromProfile;
  }

  const registeredIds = new Set(
    (registrations || [])
      .filter(reg =>
        registrationType ? reg.registrationType === registrationType : true,
      )
      .map(reg => String(reg.eventId)),
  );

  return (items || []).filter(
    item =>
      registeredIds.has(String(item.id)) &&
      (!registrationType || item.kind === registrationType),
  );
};

export const filterEventsBySearch = (events, searchQuery = '') => {
  const q = String(searchQuery || '')
    .trim()
    .toLowerCase();
  if (!q) return events;

  return events.filter(event => {
    return (
      event.title?.toLowerCase().includes(q) ||
      event.description?.toLowerCase().includes(q) ||
      event.category?.toLowerCase().includes(q) ||
      event.location?.toLowerCase().includes(q)
    );
  });
};

export const getUpcomingEvents = (events, limit = 3) =>
  (events || [])
    .filter(event => event?.type === 'upcoming')
    .sort(
      (a, b) =>
        new Date(a.startDate || 0).getTime() -
        new Date(b.startDate || 0).getTime(),
    )
    .slice(0, limit);

export const hasCompletePersonalInformation = personalDetail => {
  const personalInfo = buildApplicationPersonalInfo(personalDetail);
  return validateApplicationStep({ currentStep: 1, personalInfo });
};

export const buildEventRegistrationData = (
  event,
  {
    isMember = true,
    membershipCategory = '',
    categoryCode = '',
    categoryName = '',
  } = {},
) => {
  if (!event) return null;

  const pricingOptions = buildAvailablePricingOptions(event, {
    isMember,
    membershipCategory,
    categoryCode,
    categoryName,
  });
  const defaultOption = pricingOptions[0];
  const dayId = 'day-1';

  return {
    ...event,
    venue: event.location || event.venue,
    credits: event.cpdCredits
      ? `${event.cpdCredits} CPD Credits`
      : 'No CPD credits',
    pricingOptions,
    days: [
      {
        id: dayId,
        title: defaultOption?.title || event.title,
        date: event.date,
        price: defaultOption?.unitPrice ?? 0,
        tierType: defaultOption?.tierType,
      },
    ],
    // Keep API session ids for registrations payload (do not overwrite with UI schedule).
    apiSessions: event.sessions || event.raw?.sessions || [],
    scheduleSessions: event.time
      ? [
          {
            dayId,
            time: event.time,
            title: 'Event Session',
          },
        ]
      : [],
  };
};

export const extractEventSessionIds = event => {
  if (!event) return [];

  const raw = event.raw || {};
  const candidates = [
    event.sessionIds,
    raw.sessionIds,
    event.apiSessions,
    event.sessions,
    raw.sessions,
    raw.schedule?.sessions,
    raw.agenda,
  ];

  for (const list of candidates) {
    if (!Array.isArray(list) || !list.length) continue;

    // Plain id arrays
    if (typeof list[0] === 'string' || typeof list[0] === 'number') {
      return list.map(String).filter(Boolean);
    }

    const ids = list
      .map(item => item?._id || item?.id || item?.sessionId)
      .filter(Boolean)
      .map(String);

    // Ignore UI-only schedule sessions (no real ids)
    if (ids.length) return ids;
  }

  return [];
};

export const buildEventsRegistrationProfile = ({
  formData = {},
  profileId = '',
  user = null,
} = {}) => {
  const email =
    formData.personalEmail ||
    formData.workEmail ||
    user?.userEmail ||
    user?.email ||
    '';
  const workLocation =
    formData.workLocation === 'other'
      ? formData.otherWorkLocation
      : formData.workLocation;
  const grade =
    formData.grade === 'other' ? formData.otherGrade : formData.grade;

  const profile = {
    profileId: profileId || formData.profileId || undefined,
    email,
    firstName: formData.forename || user?.userFirstName || user?.firstName || '',
    lastName: formData.surname || user?.userLastName || user?.lastName || '',
    phone: formData.mobileNo || user?.userMobilePhone || user?.mobilePhone || '',
    workLocation: workLocation || '',
    grade: grade || '',
    addressLine1: formData.addressLine1 || '',
    addressLine2: formData.addressLine2 || '',
    townCity: formData.addressLine3 || '',
    countyState: formData.addressLine4 || '',
    eircode: formData.eircode || '',
    country: formData.country || 'Ireland',
  };

  // Drop empty profileId so API can create one when missing.
  if (!profile.profileId) delete profile.profileId;
  return profile;
};

export const buildEventsRegistrationPayload = ({
  source = 'event-registration',
  eventId,
  courseId,
  event,
  lineItems = [],
  selectedDays = [],
  profile,
  paymentMethod = 'stripe',
  registeredVia = 'portal',
  stripePaymentIntentId,
} = {}) => {
  const id = eventId || courseId || event?.id;
  const registrationType =
    source === 'course-registration' || event?.eventCategoryLookupCode === 'CPD'
      ? 'course'
      : 'event';

  const resolvedLineItems = (lineItems?.length
    ? lineItems
    : (selectedDays || []).map(day => ({
        tierKey: day.tierType || day.tierKey,
        quantity: Number(day.quantity) || 1,
      }))
  ).filter(item => item?.tierKey && Number(item.quantity) > 0);

  const payload = {
    registrationType,
    profile,
    paymentMethod,
    registeredVia,
  };

  if (registrationType === 'course') {
    payload.courseId = resolveCourseRegistrationId({ courseId, event });
    payload.sessionIds = extractEventSessionIds(event);
  } else {
    payload.eventId = id;
    payload.sessionIds = extractEventSessionIds(event);
    payload.lineItems = resolvedLineItems;
  }

  if (stripePaymentIntentId) {
    payload.stripePaymentIntentId = stripePaymentIntentId;
  }

  return payload;
};
