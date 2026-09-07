import React from 'react';
import { SafeAreaView, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import FontIcons from '../../utils/FontIcons';

const LandingPage = ({ onLoginPress, onGoogleLoginPress, onSignUpPress }) => {
  const MCI = FontIcons.MATERIAL_COMMUNITY_ICONS;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.layout}>
          <View style={styles.authCard}>
            <View style={styles.topSection}>
              <View style={styles.authHeader}>
                <View>
                  <Text style={styles.authTitle}>Already signed up?</Text>
                  <Text style={styles.authSubtitle}>Sign in to access your portal.</Text>
                </View>
                <View style={styles.ssoBadge}>
                  <Text style={styles.ssoBadgeText}>SECURE SSO</Text>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={onLoginPress} style={styles.primaryButton}>
                <MCI name="shield-account-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Sign in with your email</Text>
                <MCI name="arrow-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.orDividerWrap}>
                <View style={styles.orDividerLine} />
                <Text style={styles.orDividerText}>OR</Text>
                <View style={styles.orDividerLine} />
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={onGoogleLoginPress} style={styles.googleButton}>
                <Image
                  source={{ uri: 'https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png' }}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.middleSpacer} />
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.firstTimeDividerWrap}>
                <View style={styles.orDividerLine} />
                <Text style={styles.firstTimeDividerText}>FIRST TIME HERE?</Text>
                <View style={styles.orDividerLine} />
              </View>

              <Text style={styles.newPortalTitle}>New to the portal?</Text>
              <Text style={styles.newPortalSubtitle}>
                Apply for membership and create your account to access exclusive services.
              </Text>

              <TouchableOpacity activeOpacity={0.9} onPress={onSignUpPress} style={styles.secondaryButton}>
                <MCI name="plus" size={18} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Create an Account</Text>
                <MCI name="chevron-right" size={18} color={Colors.primary} />
              </TouchableOpacity>

              <View style={styles.privacyRow}>
                <Text style={styles.privacyText}>PRIVACY</Text>
                <Text style={styles.privacyText}>•</Text>
                <Text style={styles.privacyText}>TERMS</Text>
                <Text style={styles.privacyText}>•</Text>
                <Text style={styles.privacyText}>SUPPORT</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  heroBackgroundImage: { ...StyleSheet.absoluteFillObject },
  heroBackgroundOverlay: { ...StyleSheet.absoluteFillObject },
  heroTopOverlay: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
  layout: { flex: 1, paddingHorizontal: wp(4), paddingVertical: hp(1.2), justifyContent: 'center' },
  authCard: {
    flex: 1,
    marginVertical: hp(0.6),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.6),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
    justifyContent: 'space-between',
  },
  topSection: {
    flexGrow: 1,
    justifyContent: 'space-evenly',
  },
  bottomSection: {
    flexGrow: 1,
    justifyContent: 'space-evenly',
  },
  authHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(2) },
  authTitle: { color: '#0F172A', fontWeight: '700', fontSize: 24 },
  authSubtitle: { color: '#64748B', fontSize: 13, marginTop: hp(1.4) },
  ssoBadge: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5', borderRadius: 999, paddingHorizontal: wp(2.5), paddingVertical: hp(0.45), alignSelf: 'flex-start' },
  ssoBadgeText: { fontSize: 9, color: '#047857', fontWeight: '700', letterSpacing: 0.6 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  orDividerWrap: { flexDirection: 'row', alignItems: 'center', marginVertical: hp(2.4) },
  orDividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orDividerText: { marginHorizontal: wp(2.3), fontSize: 10, color: '#94A3B8', fontWeight: '700', letterSpacing: 1.2 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: hp(2),
  },
  googleIcon: { width: 20, height: 20, marginRight: wp(2) },
  googleButtonText: { color: '#334155', fontWeight: '600', fontSize: 15 },
  middleSpacer: { height: hp(3.2) },
  firstTimeDividerWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(2.2) },
  firstTimeDividerText: { marginHorizontal: wp(2.3), fontSize: 10, color: '#94A3B8', fontWeight: '700', letterSpacing: 1 },
  newPortalTitle: { color: '#0F172A', fontWeight: '700', textAlign: 'center', fontSize: 19 },
  newPortalSubtitle: { color: '#64748B', textAlign: 'center', marginTop: hp(0.7), marginBottom: hp(1.7), fontSize: 13, lineHeight: 19 },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  secondaryButtonText: { color: '#1E3A8A', fontWeight: '700', fontSize: 15 },
  privacyRow: { marginTop: hp(2.4), borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: hp(2), flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  privacyText: { color: '#94A3B8', fontWeight: '600', fontSize: 10, letterSpacing: 1, marginHorizontal: wp(1) },
});

export default LandingPage;


