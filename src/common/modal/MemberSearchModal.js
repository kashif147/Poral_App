import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Label } from '../text/label';
import { Colors } from '../../utils/Styles';
import { searchPortalMembers } from '../../api/issue.api';
import {
  getIssueApiErrorMessage,
  isIssueApiSuccess,
  mapPortalMemberOption,
  parseMemberSearchResponse,
} from '../../helpers/issues.helper';

const MemberSearchModal = ({
  visible,
  title = 'Search Member',
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setError('');
      return undefined;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError('');
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await searchPortalMembers(trimmed);
        if (isIssueApiSuccess(response)) {
          setResults(
            parseMemberSearchResponse(response)
              .map(mapPortalMemberOption)
              .filter(member => member.id),
          );
        } else {
          setResults([]);
          setError(getIssueApiErrorMessage(response, 'Unable to search members'));
        }
      } catch (err) {
        setResults([]);
        setError('Unable to search members');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={() => {}}>
          <Label style={styles.title}>{title}</Label>
          <TextInput
            style={styles.searchInput}
            placeholder="Member name or membership number"
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : null}
          {error ? <Label style={styles.errorText}>{error}</Label> : null}
          {!loading && query.trim().length >= 2 && !results.length && !error ? (
            <Label style={styles.emptyText}>No members found</Label>
          ) : null}
          <FlatList
            data={results}
            keyExtractor={item => String(item.id)}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => onSelect?.(item)}
                activeOpacity={0.7}
              >
                <Label style={styles.itemTitle}>{item.name}</Label>
                {item.membershipNumber ? (
                  <Label style={styles.itemSubtitle}>{item.membershipNumber}</Label>
                ) : null}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Label style={styles.cancelText}>Cancel</Label>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 24,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: Colors.textPrimary,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 12,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  list: {
    maxHeight: 280,
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemTitle: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});

export default MemberSearchModal;
