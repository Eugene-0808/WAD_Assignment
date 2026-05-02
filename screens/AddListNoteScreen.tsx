import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NoteItem, ChecklistItem } from './HomeScreen'; //

export default function AddListNoteScreen({ route, navigation }: any) {
  // Extract parameters passed from HomeScreen_2
  const { initialNote, onSave } = route.params || {};

  const [title, setTitle] = useState(initialNote?.title || '');
  const [items, setItems] = useState<ChecklistItem[]>(initialNote?.items || []);
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      checked: false,
    };
    setItems(prev => [...prev, newItem]);
    setNewItemText('');
  };

  const handleToggle = (id: string) => {
    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i)
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = () => {
    let finalItems = items;
    if (newItemText.trim()) {
      finalItems = [...items, { id: Date.now().toString(), text: newItemText.trim(), checked: false }];
    }

    // If empty, just go back without saving[cite: 10]
    if (!title.trim() && finalItems.length === 0) {
      navigation.goBack();
      return;
    }

    const note: NoteItem = {
      id: initialNote?.id || Date.now().toString(),
      type: 'list',
      title: title.trim(),
      items: finalItems,
      createdAt: initialNote?.createdAt || new Date().toISOString(),
    };

    // Execute the save function passed from HomeScreen and navigate back[cite: 10, 13]
    if (onSave) {
      onSave(note);
    }
    navigation.goBack(); //
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Refactored Header with Navigation goBack[cite: 1, 10] */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="arrow-left" color="#c8c8d8" size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleSave} style={styles.iconBtn}>
          <MaterialCommunityIcons name="check" color="#c8c8d8" size={24} />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.titleInput}
        placeholder="Title"
        placeholderTextColor="#555"
        value={title}
        onChangeText={setTitle}
        autoFocus={!initialNote}
      />

      <View style={styles.addRow}>
        <MaterialCommunityIcons name="plus" size={22} color="#8877cc" />
        <TextInput
          style={styles.addInput}
          placeholder="Add list item"
          placeholderTextColor="#555"
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        {newItemText.length > 0 && (
          <TouchableOpacity onPress={handleAddItem} style={styles.addBtn}>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#8877cc" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <TouchableOpacity onPress={() => handleToggle(item.id)}>
              <MaterialCommunityIcons
                name={item.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={item.checked ? '#8877cc' : '#c8c8d8'}
              />
            </TouchableOpacity>
            <Text style={[styles.itemText, item.checked && styles.itemChecked]}>
              {item.text}
            </Text>
            <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
              <MaterialCommunityIcons name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyHint}>No items yet. Type above and press Enter or →</Text>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1b1f' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  iconBtn: { padding: 8 },
  titleInput: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3a',
  },
  list: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a3a',
  },
  itemText: { flex: 1, color: '#c8c8d8', fontSize: 16 },
  itemChecked: { textDecorationLine: 'line-through', color: '#555' },
  removeBtn: { padding: 4 },
  emptyHint: { color: '#444', fontSize: 14, textAlign: 'center', marginTop: 24 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3a',
    gap: 12,
  },
  addInput: {
    flex: 1,
    color: '#c8c8d8',
    fontSize: 16,
  },
  addBtn: { padding: 4 },
});