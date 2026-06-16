import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Label } from '../../../common/text/label';
import { Colors } from '../../../utils/Styles';
import {
  getApplicationFormProgress,
  getApplicationReviewStatusKey,
  shouldShowApplicationReviewStatus,
} from '../../../helpers/applicationPayload.helper';

const hasNoApplication = status =>
  status == null || status === 'none' || status === '';

const FORM_STEPS = [
  { key: 'personal', label: 'Personal' },
  { key: 'professional', label: 'Professional' },
  { key: 'subscription', label: 'Subscription' },
];

const StepIcon = ({ state, reviewIcon }) => {
  if (state === 'complete') {
    return <Ionicons name="checkmark" size={14} color={Colors.primary} />;
  }

  if (reviewIcon === 'time') {
    return <Ionicons name="time-outline" size={14} color="#FFA500" />;
  }

  if (reviewIcon === 'approved') {
    return <Ionicons name="checkmark-circle" size={14} color="#10B981" />;
  }

  if (state === 'current') {
    return <Ionicons name="ellipse" size={10} color={Colors.primary} />;
  }

  return <Ionicons name="lock-closed-outline" size={14} color="#94A3B8" />;
};

const Timeline = ({ steps, connectors }) => (
  <View style={styles.statusTimeline}>
    {steps.map((step, index) => (
      <React.Fragment key={step.label}>
        <View style={styles.statusStep}>
          <View style={[styles.statusIcon, step.iconStyle]}>
            <StepIcon state={step.state} reviewIcon={step.reviewIcon} />
          </View>
          <View style={styles.statusStepContent}>
            <Label
              style={[
                styles.statusStepLabel,
                step.labelStyle,
              ]}
            >
              {step.label}
            </Label>
          </View>
        </View>
        {index < connectors.length ? (
          <View style={styles.statusConnectorContainer}>
            <View
              style={[
                styles.statusConnector,
                { backgroundColor: connectors[index] },
              ]}
            />
          </View>
        ) : null}
      </React.Fragment>
    ))}
  </View>
);

export const ApplicationStatusCard = ({
  applicationStatus,
  isApplicationSubmitted = false,
  personalDetail,
  professionalDetail,
  subscriptionDetail,
  onStartApplication,
  onContinueApplication,
}) => {
  if (applicationStatus === 'rejected') {
    return (
      <View style={styles.statusCard}>
        <View style={styles.noApplicationContent}>
          <Label style={styles.noApplicationMessage}>
            Your application was rejected.
          </Label>
          <Label style={styles.noApplicationSubtext}>
            Please update your details and re-apply.
          </Label>
          {onStartApplication && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={onStartApplication}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Re-apply</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (hasNoApplication(applicationStatus) && !personalDetail?.applicationId) {
    return (
      <View style={styles.statusCard}>
        <View style={styles.noApplicationContent}>
          <Label style={styles.noApplicationMessage}>
            You haven't started an application yet.
          </Label>
          <Label style={styles.noApplicationSubtext}>
            Start your application to get started.
          </Label>
          {onStartApplication && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={onStartApplication}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Start Application</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const showReviewStatus = shouldShowApplicationReviewStatus({
    applicationStatus,
    isApplicationSubmitted,
    personalDetail,
    professionalDetail,
    subscriptionDetail,
  });

  if (showReviewStatus) {
    const reviewStatus = getApplicationReviewStatusKey(applicationStatus);
    const badgeConfig = {
      approved: { bg: '#D1FAE5', color: '#059669', label: 'Approved' },
      in_review: { bg: '#FEF3C7', color: '#D97706', label: 'In Review' },
      submitted: { bg: '#DBEAFE', color: '#2563EB', label: 'Submitted' },
    }[reviewStatus];

    const reviewSteps = [
      {
        label: 'Submitted',
        state: 'complete',
        reviewIcon: null,
        iconStyle: {
          backgroundColor: '#E8F0FE',
          borderColor: Colors.primary,
          borderWidth: 2,
        },
        labelStyle: null,
      },
      {
        label: 'In Review',
        state:
          reviewStatus === 'in_review' || reviewStatus === 'approved'
            ? 'complete'
            : 'pending',
        reviewIcon: 'time',
        iconStyle: {
          backgroundColor:
            reviewStatus === 'in_review' || reviewStatus === 'approved'
              ? '#FFF4E6'
              : '#F1F5F9',
          borderColor:
            reviewStatus === 'in_review' || reviewStatus === 'approved'
              ? '#FFA500'
              : '#E5E7EB',
          borderWidth:
            reviewStatus === 'in_review' || reviewStatus === 'approved' ? 2 : 1,
        },
        labelStyle:
          reviewStatus === 'in_review' || reviewStatus === 'approved'
            ? { color: '#FFA500', fontWeight: '600' }
            : null,
      },
      {
        label: 'Approved',
        state: reviewStatus === 'approved' ? 'complete' : 'pending',
        reviewIcon: reviewStatus === 'approved' ? 'approved' : null,
        iconStyle: {
          backgroundColor:
            reviewStatus === 'approved' ? '#D1FAE5' : '#F1F5F9',
          borderColor:
            reviewStatus === 'approved' ? '#10B981' : '#E5E7EB',
          borderWidth: reviewStatus === 'approved' ? 2 : 1,
        },
        labelStyle:
          reviewStatus === 'approved'
            ? { color: '#10B981', fontWeight: '600' }
            : null,
      },
    ];

    const reviewConnectors = [
      reviewStatus === 'in_review' || reviewStatus === 'approved'
        ? Colors.primary
        : '#E5E7EB',
      reviewStatus === 'approved' ? Colors.primary : '#E5E7EB',
    ];

    return (
      <View style={styles.statusCard}>
        <View style={styles.statusCardHeader}>
          <Label style={styles.statusCardTitle}>Application Status</Label>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: badgeConfig.bg },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: badgeConfig.color },
              ]}
            >
              {badgeConfig.label}
            </Text>
          </View>
        </View>
        <Timeline steps={reviewSteps} connectors={reviewConnectors} />
      </View>
    );
  }

  const { completedSteps } = getApplicationFormProgress({
    personalDetail,
    professionalDetail,
    subscriptionDetail,
    applicationStatus,
  });

  const formSteps = FORM_STEPS.map((step, index) => {
    const stepNumber = index + 1;
    const isComplete = stepNumber <= completedSteps;
    const isCurrent =
      !isComplete &&
      (completedSteps === 0
        ? stepNumber === 1
        : stepNumber === completedSteps + 1);

    return {
      label: step.label,
      state: isComplete ? 'complete' : isCurrent ? 'current' : 'pending',
      iconStyle: {
        backgroundColor: isComplete
          ? '#E8F0FE'
          : isCurrent
          ? '#E8F0FE'
          : '#F1F5F9',
        borderColor: isComplete || isCurrent ? Colors.primary : '#E5E7EB',
        borderWidth: isComplete || isCurrent ? 2 : 1,
      },
      labelStyle:
        isComplete || isCurrent
          ? { color: Colors.primary, fontWeight: '600' }
          : null,
    };
  });

  const formConnectors = [
    completedSteps >= 1 ? Colors.primary : '#E5E7EB',
    completedSteps >= 2 ? Colors.primary : '#E5E7EB',
  ];

  const progressLabel =
    completedSteps >= 3
      ? 'Almost Done'
      : `Step ${Math.min(completedSteps + 1, 3)} of 3`;

  return (
    <View style={styles.statusCard}>
      <View style={styles.statusCardHeader}>
        <Label style={styles.statusCardTitle}>Application Progress</Label>
        <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.statusBadgeText, { color: '#2563EB' }]}>
            {progressLabel}
          </Text>
        </View>
      </View>

      <Timeline steps={formSteps} connectors={formConnectors} />

      {onContinueApplication && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinueApplication}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
          <Text style={styles.startButtonText}>
            {completedSteps === 0
              ? 'Start Application'
              : completedSteps >= 3
              ? 'Continue Application'
              : 'Resume Application'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    margin: 20,
    marginTop: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  noApplicationContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  noApplicationMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  noApplicationSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statusStep: {
    flex: 1,
    alignItems: 'center',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusStepContent: {
    alignItems: 'center',
  },
  statusStepLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statusConnectorContainer: {
    width: 20,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -4,
  },
  statusConnector: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.primary,
  },
});
