import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { form, Colors } from '../utils/Styles';

/**
 * A searchable picker: same trigger as Picker, but opens a modal with a search bar
 * and a scrollable list so users can search and select easily (e.g. long country/category lists).
 *
 * @param {Array<{label: string, value: string}>} items - Options to show
 * @param {string} selectedValue - Currently selected value
 * @param {function(string)} onValueChange - Called with value when user confirms (Done) or taps an item (if tapToSelect)
 * @param {string} [placeholder='Select...'] - Shown when nothing selected
 * @param {object} [containerStyle] - Style for the trigger container
 * @param {boolean} [invalid] - If true, trigger shows red border (validation)
 * @param {boolean} [enabled=true] - Whether the picker is interactive
 * @param {boolean} [tapToSelect=true] - If true, tapping an item selects and closes; if false, use Done to confirm
 */
const SearchablePicker = ({
  items = [],
  selectedValue,
  onValueChange,
  placeholder = 'Select...',
  containerStyle,
  invalid = false,
  enabled = true,
  tapToSelect = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempValue, setTempValue] = useState(selectedValue);

  const selectedItem = useMemo(
    () => items.find(i => i.value === selectedValue),
    [items, selectedValue]
  );
  const displayLabel = selectedItem?.label ?? placeholder;

  const filteredItems = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      (item.label || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const openModal = useCallback(() => {
    if (!enabled) return;
    setTempValue(selectedValue);
    setSearchQuery('');
    setModalVisible(true);
  }, [enabled, selectedValue]);

  const handleCancel = useCallback(() => {
    setSearchQuery('');
    setModalVisible(false);
  }, []);

  const handleDone = useCallback(() => {
    onValueChange?.(tempValue);
    setSearchQuery('');
    setModalVisible(false);
  }, [tempValue, onValueChange]);

  const handleSelectItem = useCallback(
    value => {
      setTempValue(value);
      if (tapToSelect) {
        onValueChange?.(value);
        setSearchQuery('');
        setModalVisible(false);
      }
    },
    [tapToSelect, onValueChange]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const isSelected = item.value === tempValue;
      return (
        <TouchableOpacity
          style={[styles.listItem, isSelected && styles.listItemSelected]}
          onPress={() => handleSelectItem(item.value)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.listItemText,
              isSelected && styles.listItemTextSelected,
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [tempValue, handleSelectItem]
  );

  const listEmpty = (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No results</Text>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          invalid && styles.triggerInvalid,
          !enabled && styles.triggerDisabled,
          containerStyle,
        ]}
        onPress={openModal}
        disabled={!enabled}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.triggerText, !enabled && styles.triggerTextDisabled]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Text style={styles.triggerIcon}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleCancel}
          />
          <View style={styles.modalContent}>
            <View style={styles.toolbar}>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.toolbarButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.toolbarButtonText}>Cancel</Text>
              </TouchableOpacity>
              {!tapToSelect && (
                <TouchableOpacity
                  onPress={handleDone}
                  style={styles.toolbarButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={[styles.toolbarButtonText, styles.toolbarDone]}>
                    Done
                  </Text>
                </TouchableOpacity>
              )}
              {tapToSelect && <View style={styles.toolbarButton} />}
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={filteredItems}
              keyExtractor={item => item.value}
              renderItem={renderItem}
              ListEmptyComponent={listEmpty}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={
                filteredItems.length === 0 ? styles.listContentEmpty : styles.listContent
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    ...form.inputBG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  triggerInvalid: {
    borderColor: Colors.red,
    borderWidth: 1,
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  triggerText: {
    ...form.inputText,
    flex: 1,
    paddingVertical: 12,
    paddingRight: 8,
  },
  triggerTextDisabled: {
    color: Colors.textSecondary,
  },
  triggerIcon: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingRight: 12,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '80%',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  toolbarButton: {
    padding: 8,
    minWidth: 60,
  },
  toolbarButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  toolbarDone: {
    fontWeight: '600',
    textAlign: 'right',
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    ...form.inputBG,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  listItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  listItemSelected: {
    backgroundColor: '#E8F0FE',
  },
  listItemText: {
    fontSize: 17,
    color: Colors.textPrimary,
  },
  listItemTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

export default SearchablePicker;
