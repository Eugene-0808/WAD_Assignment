import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ----------- Type definitions -----------
type ListNote = {
  id: string;
  title: string;
  items: string[];
  createdAt: string;
};

const STORAGE_KEY = '@list_notes';

// ----------- Helper functions for AsyncStorage -----------
const saveLists = async (lists: ListNote[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (error) {
    console.log('Error saving lists:', error);
  }
};

const loadLists = async (): Promise<ListNote[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json != null ? JSON.parse(json) : [];
  } catch (error) {
    console.log('Error loading lists:', error);
    return [];
  }
};

// ----------- Main screen component -----------
const ListNoteScreen = () => {
  const [allLists, setAllLists] = useState<ListNote[]>([]);
  const [currentList, setCurrentList] = useState<ListNote | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newItemText, setNewItemText] = useState('');

  // Load lists on mount
  useEffect(() => {
    const fetchLists = async () => {
      const lists = await loadLists();
      setAllLists(lists);
    };
    fetchLists();
  }, []);

  // Helper to generate a simple unique ID
  const generateId = () => Date.now().toString();

  // ----------- CRUD Operations -----------

  // CREATE a new list
  const handleCreateList = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation', 'Please enter a list title.');
      return;
    }
    const newList: ListNote = {
      id: generateId(),
      title: newTitle.trim(),
      items: [],
      createdAt: new Date().toISOString(),
    };
    const updatedLists = [...allLists, newList];
    setAllLists(updatedLists);
    await saveLists(updatedLists);
    setNewTitle('');
    setCurrentList(newList); // automatically open the new list
  };

  // DELETE a whole list
  const handleDeleteList = async (listId: string) => {
    Alert.alert('Delete list', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const updatedLists = allLists.filter((l) => l.id !== listId);
          setAllLists(updatedLists);
          await saveLists(updatedLists);
          if (currentList?.id === listId) setCurrentList(null);
        },
      },
    ]);
  };

  // ADD an item to the currently open list
  const handleAddItem = async () => {
    if (!currentList) {
      Alert.alert('Error', 'Please create or select a list first.');
      return;
    }
    if (!newItemText.trim()) {
      Alert.alert('Validation', 'Item cannot be empty.');
      return;
    }
    const updatedItems = [...currentList.items, newItemText.trim()];
    const updatedList = { ...currentList, items: updatedItems };
    const updatedLists = allLists.map((l) =>
      l.id === updatedList.id ? updatedList : l
    );
    setAllLists(updatedLists);
    setCurrentList(updatedList);
    await saveLists(updatedLists);
    setNewItemText('');
  };

  // DELETE an item from the currently open list
  const handleDeleteItem = async (itemIndex: number) => {
    if (!currentList) return;
    const updatedItems = currentList.items.filter((_, i) => i !== itemIndex);
    const updatedList = { ...currentList, items: updatedItems };
    const updatedLists = allLists.map((l) =>
      l.id === updatedList.id ? updatedList : l
    );
    setAllLists(updatedLists);
    setCurrentList(updatedList);
    await saveLists(updatedLists);
  };

  // If a list is selected, show its items; otherwise show list overview
  if (currentList) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setCurrentList(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{currentList.title}</Text>
          <View style={{ flex: 1 }} />
        </View>

        {/* Add item input */}
        <View style={styles.addItemRow}>
          <TextInput
            style={styles.itemInput}
            placeholder="Add new item"
            value={newItemText}
            onChangeText={setNewItemText}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* List of items */}
        <FlatList
          data={currentList.items}
          keyExtractor={(item, index) => `${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.itemRow}>
              <Text style={styles.itemText}>{item}</Text>
              <TouchableOpacity
                style={styles.deleteItemBtn}
                onPress={() => handleDeleteItem(index)}
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No items yet. Add one above!</Text>
          }
        />
      </KeyboardAvoidingView>
    );
  }

  // Show list overview (all lists)
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>My Lists</Text>

      {/* Create new list */}
      <View style={styles.addItemRow}>
        <TextInput
          style={styles.itemInput}
          placeholder="New list title"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleCreateList}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* FlatList of existing lists */}
      <FlatList
        data={allLists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setCurrentList(item)}
            >
              <Text style={styles.listTitle}>{item.title}</Text>
              <Text style={styles.listMeta}>
                {item.items.length} items · Created {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteList(item.id)}
            >
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No lists yet. Create one above!</Text>
        }
      />
    </KeyboardAvoidingView>
  );
};

// ----------- Styles -----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    fontSize: 18,
    color: '#286090',
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addItemRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#286090',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  deleteItemBtn: {
    padding: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  listMeta: {
    fontSize: 14,
    color: '#888',
  },
  deleteBtn: {
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
    color: '#c9302c',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default ListNoteScreen;