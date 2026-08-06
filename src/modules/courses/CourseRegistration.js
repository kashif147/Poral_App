import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../common/screenHeader';
import PersonalInformation from '../application/PersonalInformation';
import RegistrationPricingOptions from '../../common/RegistrationPricingOptions';
import FullWidthContainImage from '../../common/FullWidthContainImage';
import { fetchPublishedCourses } from '../../api/events.api';
import {
  buildEventRegistrationData,
  buildRegistrationLineItems,
  buildSelectedPricingLineItems,
  calculateQuantitiesTotal,
  createInitialQuantities,
  formatRegistrationPrice,
  mapApiEventToCard,
} from '../../helpers/events.helper';
import { useApplication } from '../../contexts/applicationContext';
import { useMemberRole } from '../../hooks/useMemberRole';
import { useRegistrationPersonalInfoGate } from '../../hooks/useRegistrationPersonalInfoGate';
import { toast } from '../../utils/toast.utils';
import { Button } from '../../common/button';

const CourseRegistration = () => {
  const { isMember } = useMemberRole();
  const {
    professionalDetail,
    subscriptionDetail,
    categoryData,
  } = useApplication();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const courseId = route.params?.courseId || route.params?.course?.id;

  const [quantities, setQuantities] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);

  const membershipCategory =
    professionalDetail?.professionalDetails?.membershipCategory ||
    subscriptionDetail?.subscriptionDetails?.membershipCategory ||
    '';

  const {
    registrationStep,
    personalInfo,
    setPersonalInfo,
    showValidation,
    isSaving,
    handleRegisterClick,
    handlePersonalInfoContinue,
    handlePersonalInfoBack,
  } = useRegistrationPersonalInfoGate();

  const loadCourse = useCallback(async () => {
    if (!courseId) {
      setCourse(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchPublishedCourses();
      if (response?.status >= 200 && response?.status < 300) {
        const apiCourse = (response?.data?.data || []).find(
          item => String(item._id || item.id) === String(courseId),
        );
        const mappedCourse = mapApiEventToCard(apiCourse);
        const registrationData = buildEventRegistrationData(mappedCourse, {
          isMember,
          membershipCategory,
          categoryCode: categoryData?.code,
          categoryName: categoryData?.name,
        });
        setCourse(registrationData);
        setQuantities(
          createInitialQuantities(registrationData?.pricingOptions || []),
        );
      } else {
        setCourse(null);
        toast.error('Error', 'Unable to load course details.');
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      setCourse(null);
      toast.error('Error', 'Unable to load course details.');
    } finally {
      setLoading(false);
    }
  }, [
    courseId,
    isMember,
    membershipCategory,
    categoryData?.code,
    categoryData?.name,
  ]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const venue = course?.venue || course?.location || 'TBD';
  const credits = course?.credits || '—';
  const courseLocation = course?.location || venue;
  const pricingOptions = course?.pricingOptions || [];

  const totalCost = useMemo(
    () => calculateQuantitiesTotal(pricingOptions, quantities),
    [pricingOptions, quantities],
  );

  const selectedLineItems = useMemo(
    () => buildSelectedPricingLineItems(pricingOptions, quantities),
    [pricingOptions, quantities],
  );

  const getCourseYear = () => {
    const d = course?.date;
    if (typeof d === 'string' && /\d{4}/.test(d)) {
      const match = d.match(/\d{4}/);
      return match ? match[0] : new Date().getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  };

  const handleQuantityChange = (optionId, quantity) => {
    setQuantities(prev => ({
      ...prev,
      [optionId]: quantity,
    }));
  };

  const handleRegisterAndPay = () => {
    if (!course || !selectedLineItems.length) {
      toast.warning('Validation', 'Please select at least one ticket quantity.');
      return;
    }

    const selectedDays = selectedLineItems.map(item => ({
      id: item.id,
      title: item.title,
      date: course.date,
      price: item.price,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      tierType: item.tierType,
    }));

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      handleRegisterClick({
        source: 'course-registration',
        courseId: course.courseId || course.id,
        courseTitle: course.title,
        course,
        event: course,
        selectedDays,
        lineItems: buildRegistrationLineItems(pricingOptions, quantities),
        quantities,
        totalCost,
      });
    }, 450);
  };

  const canProceed = selectedLineItems.length > 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Course Registration" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Course Registration" showBack />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Course Not Found</Text>
          <Text style={styles.notFoundText}>
            This course is unavailable or has been removed.
          </Text>
          <Button title="Back to Courses" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  if (registrationStep === 'personal-info') {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Personal Information"
          showBack
          onBackPress={handlePersonalInfoBack}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 120 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.personalInfoIntro}>
            Please provide your details before completing registration for{' '}
            <Text style={styles.personalInfoHighlight}>{course.title}</Text>.
          </Text>
          <PersonalInformation
            formData={personalInfo}
            onFormDataChange={setPersonalInfo}
            showValidation={showValidation}
            showProfessionalFields
          />
        </ScrollView>
        <View style={[styles.footerBar, { paddingBottom: insets.bottom || 16 }]}>
          <Button
            title={isSaving ? 'Saving...' : 'Continue to Payment'}
            onPress={handlePersonalInfoContinue}
            disabled={isSaving}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Course Registration" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerContainer}>
          <View style={styles.bannerHeroRow}>
            {course?.image ? (
              <View style={styles.bannerImageCol}>
                <FullWidthContainImage
                  uri={course.image}
                  height={160}
                  resizeMode="contain"
                  style={styles.bannerSideImage}
                />
              </View>
            ) : null}
            <View
              style={[
                styles.headerNoImage,
                course?.image ? styles.headerBesideImage : null,
              ]}
            >
              {course?.category ? (
                <View style={styles.bannerTag}>
                  <Text style={styles.bannerTagText}>{course.category}</Text>
                </View>
              ) : null}
              <Text style={styles.headerNoImageTitle}>
                {course?.title || 'Course'}
              </Text>
              <Text style={styles.headerNoImageYear}>{getCourseYear()}</Text>
              <View style={styles.bannerLocationRow}>
                <Ionicons
                  name="location"
                  size={16}
                  color={Colors.textSecondary}
                />
                <Text style={styles.headerNoImageLocation}>{courseLocation}</Text>
              </View>
            </View>
          </View>
        </View>

        {course?.description ? (
          <Text style={styles.description}>{course.description}</Text>
        ) : null}

        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color={Colors.primary} style={styles.infoIcon} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Venue</Text>
            <Text style={styles.infoValue}>{venue}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={styles.infoIcon} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Credits</Text>
            <Text style={styles.infoValue}>{credits}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Pricing Options</Text>
        <RegistrationPricingOptions
          options={pricingOptions}
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
        />
      </ScrollView>

      <View style={[styles.footerBar, { paddingBottom: insets.bottom || 16 }]}>
        <View>
          <Text style={styles.footerLabel}>TOTAL COST</Text>
          <Text style={styles.footerAmount}>{formatRegistrationPrice(totalCost)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.registerButton,
            (!canProceed || isSubmitting) && styles.registerButtonDisabled,
          ]}
          onPress={handleRegisterAndPay}
          disabled={!canProceed || isSubmitting}
        >
          <Text style={styles.registerButtonText}>
            {isSubmitting ? 'Processing...' : 'Register & Pay'}
          </Text>
          <MaterialCommunityIcons name="credit-card" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundContainer: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  notFoundTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  notFoundText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  personalInfoIntro: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  personalInfoHighlight: { color: Colors.textPrimary, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  bannerContainer: {
    marginBottom: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerHeroRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  bannerImageCol: {
    width: '46%',
    backgroundColor: '#F1F5F9',
  },
  bannerSideImage: {
    borderRadius: 0,
  },
  bannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  bannerTagText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  bannerLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingRight: 4,
  },
  headerNoImage: { padding: 16, paddingBottom: 12 },
  headerBesideImage: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  headerNoImageTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    lineHeight: 24,
  },
  headerNoImageYear: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  headerNoImageLocation: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    marginLeft: 6,
    lineHeight: 20,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  infoIcon: { marginRight: 12, marginTop: 2 },
  infoTextWrap: { flex: 1, paddingRight: 4 },
  infoLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  divider: { height: 1, backgroundColor: Colors.divider },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  footerLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  footerAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  registerButtonDisabled: { opacity: 0.6 },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 8,
  },
});

export default CourseRegistration;
