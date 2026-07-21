export const CATEGORY_DISPLAY_NAME_BY_TYPE = {
  undergraduate_student: 'Undergraduate Student',
  retired_associate: 'Retired Associate',
  postgraduate_student: 'Postgraduate Student',
  general: 'General (all grades)',
  private_nursing_home: 'Private nursing home',
  short_term_relief: 'Short-term/Relief (under 12 hrs/wk average)',
  associate: 'Associate (not currently employed as a nurse/midwife)',
  affiliate: 'Affiliate members (non-practicing)',
  lecturing: 'Lecturing (employed in universities and IT institutes)',
};

export const isUndergraduateStudentCategory = membershipCategory => {
  if (!membershipCategory) return false;
  return (
    membershipCategory === CATEGORY_DISPLAY_NAME_BY_TYPE.undergraduate_student ||
    membershipCategory === 'undergraduate_student'
  );
};

export const isRetiredAssociateCategory = membershipCategory => {
  if (!membershipCategory) return false;
  return (
    membershipCategory === CATEGORY_DISPLAY_NAME_BY_TYPE.retired_associate ||
    membershipCategory === 'retired_associate'
  );
};

export const isUndergraduateStudentFromCategoryData = categoryData =>
  categoryData?.code === 'undergraduate_student' ||
  categoryData?.name === CATEGORY_DISPLAY_NAME_BY_TYPE.undergraduate_student;
