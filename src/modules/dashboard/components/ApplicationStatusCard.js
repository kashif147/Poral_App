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

const hasNoApplication = status =>
  status == null || status === 'none' || status === '';

export const ApplicationStatusCard = ({
  applicationStatus,
  onStartApplication,
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

  if (hasNoApplication(applicationStatus)) {
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

  return (
    <View style={styles.statusCard}>
      <View style={styles.statusCardHeader}>
        <Label style={styles.statusCardTitle}>Application Status</Label>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                applicationStatus === 'approved'
                  ? '#D1FAE5'
                  : applicationStatus === 'in_review'
                  ? '#FEF3C7'
                  : '#DBEAFE',
            },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              {
                color:
                  applicationStatus === 'approved'
                    ? '#059669'
                    : applicationStatus === 'in_review'
                    ? '#D97706'
                    : '#2563EB',
              },
            ]}
          >
            {applicationStatus === 'approved'
              ? 'Approved'
              : applicationStatus === 'in_review'
              ? 'In Review'
              : 'Submitted'}
          </Text>
        </View>
      </View>

      <View style={styles.statusTimeline}>
      <View style={styles.statusStep}>
        <View
          style={[
            styles.statusIcon,
            {
              backgroundColor: '#E8F0FE',
              borderColor: Colors.primary,
              borderWidth: 2,
            },
          ]}
        >
          <Ionicons name="checkmark" size={14} color={Colors.primary} />
        </View>
        <View style={styles.statusStepContent}>
          <Label style={styles.statusStepLabel}>Submitted</Label>
        </View>
      </View>

      <View style={styles.statusConnectorContainer}>
        <View
          style={[
            styles.statusConnector,
            {
              backgroundColor:
                applicationStatus === 'in_review' ||
                applicationStatus === 'approved'
                  ? Colors.primary
                  : '#E5E7EB',
            },
          ]}
        />
      </View>

      <View style={styles.statusStep}>
        <View
          style={[
            styles.statusIcon,
            {
              backgroundColor:
                applicationStatus === 'in_review' ||
                applicationStatus === 'approved'
                  ? '#FFF4E6'
                  : '#F1F5F9',
              borderColor:
                applicationStatus === 'in_review' ||
                applicationStatus === 'approved'
                  ? '#FFA500'
                  : '#E5E7EB',
              borderWidth:
                applicationStatus === 'in_review' ||
                applicationStatus === 'approved'
                  ? 2
                  : 1,
            },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={
              applicationStatus === 'in_review' ||
              applicationStatus === 'approved'
                ? '#FFA500'
                : '#94A3B8'
            }
          />
        </View>
        <View style={styles.statusStepContent}>
          <Label
            style={[
              styles.statusStepLabel,
              (applicationStatus === 'in_review' ||
                applicationStatus === 'approved') && {
                color: '#FFA500',
                fontWeight: '600',
              },
            ]}
          >
            In Review
          </Label>
        </View>
      </View>

      <View style={styles.statusConnectorContainer}>
        <View
          style={[
            styles.statusConnector,
            {
              backgroundColor:
                applicationStatus === 'approved'
                  ? Colors.primary
                  : '#E5E7EB',
            },
          ]}
        />
      </View>

      <View style={styles.statusStep}>
        <View
          style={[
            styles.statusIcon,
            {
              backgroundColor:
                applicationStatus === 'approved' ? '#D1FAE5' : '#F1F5F9',
              borderColor:
                applicationStatus === 'approved' ? '#10B981' : '#E5E7EB',
              borderWidth: applicationStatus === 'approved' ? 2 : 1,
            },
          ]}
        >
          {applicationStatus === 'approved' ? (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color="#10B981"
            />
          ) : (
            <Ionicons
              name="lock-closed-outline"
              size={14}
              color="#94A3B8"
            />
          )}
        </View>
        <View style={styles.statusStepContent}>
          <Label
            style={[
              styles.statusStepLabel,
              applicationStatus === 'approved' && {
                color: '#10B981',
                fontWeight: '600',
              },
            ]}
          >
            Approved
          </Label>
        </View>
      </View>
    </View>
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
  noApplicationIcon: {
    marginBottom: 12,
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
