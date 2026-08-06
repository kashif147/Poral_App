import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FullWidthContainImage from '../FullWidthContainImage';

const DetailModal = ({
  visible,
  onClose,
  item,
  children,
  imageProperty = 'image',
}) => {
  if (!item) return null;

  const imageUri = item[imageProperty];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <TouchableOpacity
          style={[styles.closeButton, { top: Platform.OS === 'ios' ? 20 : 20 }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {imageUri ? <FullWidthContainImage uri={imageUri} /> : null}

          <View
            style={[
              styles.contentContainer,
              !imageUri && styles.contentContainerNoImage,
            ]}
          >
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}

            <Text style={styles.title}>{item.title}</Text>

            {item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}

            <View style={styles.customContent}>{children}</View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  contentContainerNoImage: {
    paddingTop: 64,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  customContent: {
    marginTop: 8,
  },
});

export default DetailModal;
