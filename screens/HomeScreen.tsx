import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  Pressable,
  StyleSheet
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { NoteCard } from '../components/NoteCard';

// Import cloud sync functions from server/cloudSync.ts
import {
  fetchAllNotesFromCloud,
  createNoteInCloud,
  updateNoteInCloud,
  deleteNoteInCloud,
} from '../server/cloudSync';

const NOTES_KEY = '@all_notes';
const TRASH_KEY = '@deleted_items';

import { Dimensions } from 'react-native';
const SCREEN_WIDTH = Dimensions.get('window').width;

// Types derived from source
export type NoteItem = {
  id: string;
  type: 'text' | 'list' | 'image';
  title: string;
  content?: string;
  items?: ChecklistItem[];
  imageUri?: string;
  createdAt: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
};

export default function HomeScreen({ navigation }: any) {
  // Navigation state is now handled by the Stack/Drawer/Tab navigators
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Load notes from cloud on mount, fallback to local
  useEffect(() => {
    const loadInitialData = async () => {
      setIsSyncing(true);
      const cloudNotes = await fetchAllNotesFromCloud();
      if (cloudNotes.length > 0) {
        setNotes(cloudNotes);
        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(cloudNotes));
      } else {
        const json = await AsyncStorage.getItem(NOTES_KEY);
        if (json) setNotes(JSON.parse(json));
      }
      setIsSyncing(false);
    };
    loadInitialData();
  }, []);

  // Reload notes when screen comes into focus (e.g., after restoring from trash)
  useFocusEffect(
    React.useCallback(() => {
      const loadNotes = async () => {
        const json = await AsyncStorage.getItem(NOTES_KEY);
        if (json) setNotes(JSON.parse(json));
      };
      loadNotes();
    }, [])
  );

  const handleSaveNote = async (note: NoteItem) => {
    const isEditing = notes.find(n => n.id === note.id);
    let updated: NoteItem[];

    if (isEditing) {
      updated = notes.map(n => (n.id === note.id ? note : n));
      await updateNoteInCloud(note);
    } else {
      updated = [note, ...notes];
      await createNoteInCloud(note);
    }

    setNotes(updated);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
  };

  const handleDeleteNote = async (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    Alert.alert('Delete Note', `Move "${noteToDelete.title || 'Untitled'}" to bin?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Data Persistence: Move to local trash
          const trashJson = await AsyncStorage.getItem(TRASH_KEY);
          const trash = trashJson ? JSON.parse(trashJson) : [];
          trash.push({ ...noteToDelete, deletedAt: new Date().toISOString() });
          await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(trash));

          // Cloud Connectivity: Delete from server
          const updated = notes.filter(n => n.id !== noteId);
          setNotes(updated);
          await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
          await deleteNoteInCloud(noteId);
        },
      },
    ]);
  };

  const toggleChecklistItem = async (noteId: string, itemId: string) => {
    const updated = notes.map(n => {
      if (n.id !== noteId || !n.items) return n;
      return {
        ...n,
        items: n.items.map(i => (i.id === itemId ? { ...i, checked: !i.checked } : i)),
      };
    });
    setNotes(updated);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
    const changed = updated.find(n => n.id === noteId);
    if (changed) await updateNoteInCloud(changed);
  };

  const renderNoteCard = ({ item }: { item: NoteItem }) => (
    <NoteCard
      note={item}
      onPress={() => navigation.navigate('AddListNote', { initialNote: item, onSave: handleSaveNote })}
      onLongPress={() => handleDeleteNote(item.id)}
      onToggleChecklistItem={toggleChecklistItem}
    />
  );
  const syncFromCloud = async () => {
    setIsSyncing(true);
    try {
      const cloudNotes = await fetchAllNotesFromCloud();
      if (cloudNotes.length > 0) {
        setNotes(cloudNotes);
        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(cloudNotes));
      }
      Alert.alert('Sync Complete', 'Your notes are up to date');
    } catch (error) {
      console.error(error);
      Alert.alert('Sync Error', 'Could not sync with cloud');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1c1b1f" />

      {/* Header with Drawer Trigger */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
          <MaterialCommunityIcons name="menu" color="#c8c8d8" size={24} />
        </TouchableOpacity>
        <TextInput
          style={styles.searchBar}
          placeholder="Search your notes"
          placeholderTextColor="#9898a8"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity onPress={syncFromCloud} style={styles.syncBtn}>
          <MaterialCommunityIcons name="cloud-sync" color="#c8c8d8" size={24} />
        </TouchableOpacity>
        <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
      </View>

      <FlatList
        data={notes.filter(n => n.title.toLowerCase().includes(searchText.toLowerCase()))}
        keyExtractor={item => item.id}
        renderItem={renderNoteCard}
        contentContainerStyle={styles.notesList}
        refreshing={isSyncing}
        onRefresh={async () => {
          setIsSyncing(true);
          const cloudNotes = await fetchAllNotesFromCloud();
          if (cloudNotes.length > 0) setNotes(cloudNotes);
          setIsSyncing(false);
        }}
      />

      {/* FAB uses navigation.navigate to reach the AddListNote screen */}
      <View style={styles.fabContainer}>
        {isMenuVisible && (
          <View style={styles.menuItemsContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                Alert.alert('Info', 'Text note feature coming soon');
              }}
            >
              <MaterialCommunityIcons name="text" color="#e8e0ff" size={24} />
              <Text style={styles.menuItemText}>Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('AddListNote', { initialNote: null, onSave: handleSaveNote });
              }}
            >
              <MaterialCommunityIcons name="checkbox-marked-outline" color="#e8e0ff" size={24} />
              <Text style={styles.menuItemText}>List</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                Alert.alert('Info', 'Image note feature coming soon');
              }}
            >
              <MaterialCommunityIcons name="image" color="#e8e0ff" size={24} />
              <Text style={styles.menuItemText}>Image</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.fab, isMenuVisible && styles.fabClose]}
          onPress={() => setIsMenuVisible(!isMenuVisible)}
        >
          <MaterialCommunityIcons
            name={isMenuVisible ? 'close' : 'plus'}
            color={isMenuVisible ? '#1c1b1f' : '#e8e0ff'}
            size={32}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1c1b1f' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  menuBtn: { padding: 8 },
  searchBar: {
    flex: 1,
    backgroundColor: '#2a2a3d',
    borderRadius: 28,
    height: 48,
    justifyContent: 'center',
    paddingLeft: 16,
    color: '#9898a8',
  },
  syncBtn: { padding: 8 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#5b6abf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9898a8', marginTop: 10 },

  notesList: { padding: 16 },
  notesRow: { justifyContent: 'space-between' },
  noteCard: {
    backgroundColor: '#2a2a3a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  moreText: { color: '#888', fontSize: 12, marginTop: 4 },

  drawerMask: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10 },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: '#202124',
    zIndex: 11,
    padding: 20,
    paddingTop: 50,
  },
  drawerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 30 },
  drawerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 20,
    borderRadius: 10,
  },
  activeDrawerLink: { backgroundColor: '#41334e' },
  drawerLinkText: { color: '#fff', fontSize: 16 },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: { color: '#fff', fontSize: 20, fontWeight: '500' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1 },
  fabContainer: { position: 'absolute', bottom: 30, right: 20, alignItems: 'flex-end', zIndex: 2 },
  fab: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#6d5fd4', justifyContent: 'center', alignItems: 'center' },
  fabClose: { backgroundColor: '#d7caff' },
  menuItemsContainer: { marginBottom: 15, gap: 12 },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#4a447d',
    padding: 12,
    borderRadius: 25,
    minWidth: 130,
    justifyContent: 'center',
    gap: 10,
  },
  menuItemText: { color: '#e8e0ff', fontSize: 16 },
});