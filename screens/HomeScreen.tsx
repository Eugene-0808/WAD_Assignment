import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Pressable,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DeletedScreen from './DeletedScreen';
import AddListNoteScreen from './AddListNoteScreen';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NOTES_KEY = '@all_notes';
const TRASH_KEY = '@deleted_items';

export type NoteItem = {
  id: string;
  type: 'text' | 'list' | 'image';
  title: string;
  content?: string;         // for text notes
  items?: ChecklistItem[];  // for list notes
  imageUri?: string;        // for image notes
  createdAt: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
};

const saveNotes = async (notes: NoteItem[]) => {
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

const loadNotes = async (): Promise<NoteItem[]> => {
  const json = await AsyncStorage.getItem(NOTES_KEY);
  return json ? JSON.parse(json) : [];
};

export default function HomeScreen() {
  const [currentPage, setCurrentPage] = useState<'home' | 'bin' | 'addList'>('home');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadNotes().then(setNotes);
  }, []);

  const navigateTo = (page: 'home' | 'bin' | 'addList') => {
    setCurrentPage(page);
    setIsDrawerOpen(false);
    setIsMenuVisible(false);
    if (page === 'home') setEditingNote(null);
  };

  const handleSaveNote = async (note: NoteItem) => {
    let updated: NoteItem[];
    if (editingNote) {
      updated = notes.map(n => n.id === note.id ? note : n);
    } else {
      updated = [note, ...notes];
    }
    setNotes(updated);
    await saveNotes(updated);
    setEditingNote(null);
    setCurrentPage('home');
  };

  const moveToTrash = async (note: NoteItem) => {
    const trashJson = await AsyncStorage.getItem(TRASH_KEY);
    const trash = trashJson ? JSON.parse(trashJson) : [];
    // Store the full note with a deletion timestamp
    const trashItem = {
      ...note,
      deletedAt: new Date().toISOString(),
    };
    trash.push(trashItem);
    await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  };

  const handleDeleteNote = async (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    // Show confirmation dialog
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${noteToDelete.title || 'Untitled'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Move to trash first
            await moveToTrash(noteToDelete);
            // Remove from active notes
            const updated = notes.filter(n => n.id !== noteId);
            setNotes(updated);
            await saveNotes(updated);
          },
        },
      ]
    );
  };

  const refreshNotes = async () => {
    const loadedNotes = await loadNotes();
    setNotes(loadedNotes);
  };

  const toggleChecklistItem = async (noteId: string, itemId: string) => {
    const updated = notes.map(n => {
      if (n.id !== noteId || !n.items) return n;
      return {
        ...n,
        items: n.items.map(i =>
          i.id === itemId ? { ...i, checked: !i.checked } : i
        ),
      };
    });
    setNotes(updated);
    await saveNotes(updated);
  };

  const renderNoteCard = ({ item }: { item: NoteItem }) => (
    <TouchableOpacity
      style={styles.noteCard}
      onPress={() => {
        setEditingNote(item);
        setCurrentPage(item.type === 'list' ? 'addList' : 'home');
      }}
      onLongPress={() => handleDeleteNote(item.id)}
    >
      {item.title ? <Text style={styles.noteCardTitle}>{item.title}</Text> : null}

      {item.type === 'text' && item.content ? (
        <Text style={styles.noteCardContent} numberOfLines={6}>{item.content}</Text>
      ) : null}

      {item.type === 'list' && item.items ? (
        <View>
          {item.items.slice(0, 5).map(ci => (
            <TouchableOpacity
              key={ci.id}
              style={styles.checklistRow}
              onPress={() => toggleChecklistItem(item.id, ci.id)}
            >
              <MaterialCommunityIcons
                name={ci.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={16}
                color={ci.checked ? '#8877cc' : '#c8c8d8'}
              />
              <Text style={[styles.checklistText, ci.checked && styles.checklistChecked]}>
                {ci.text}
              </Text>
            </TouchableOpacity>
          ))}
          {item.items.length > 5 && (
            <Text style={styles.moreText}>+{item.items.length - 5} more</Text>
          )}
        </View>
      ) : null}

      <Text style={styles.noteDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'bin':
        return (
          <View style={{ flex: 1 }}>
            <View style={styles.headerBar}>
              <TouchableOpacity onPress={() => navigateTo('home')} style={styles.menuBtn}>
                <MaterialCommunityIcons name="arrow-left" color="#c8c8d8" size={24} />
              </TouchableOpacity>
              <Text style={styles.headerText}>Recycle Bin</Text>
            </View>
            <DeletedScreen onRestore={refreshNotes} />
          </View>
        );

      case 'addList':
        return (
          <AddListNoteScreen
            initialNote={editingNote}
            onSave={handleSaveNote}
            onBack={() => navigateTo('home')}
          />
        );

      default: // home
        return (
          <>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => setIsDrawerOpen(true)} style={styles.menuBtn}>
                <MaterialCommunityIcons name="menu" color="#c8c8d8" size={24} />
              </TouchableOpacity>
              <TextInput
                style={styles.searchBar}
                placeholder="Search your notes"
                placeholderTextColor="#9898a8"
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
              />
              <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
            </View>

            {notes.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="lightbulb-outline" color="#3d3d4d" size={120} />
                <Text style={styles.emptyText}>Notes you add appear here</Text>
              </View>
            ) : (
              <FlatList
                data={notes}
                keyExtractor={item => item.id}
                renderItem={renderNoteCard}
                contentContainerStyle={styles.notesList}
              />
            )}
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1c1b1f" />

      {isDrawerOpen && (
        <>
          <Pressable style={styles.drawerMask} onPress={() => setIsDrawerOpen(false)} />
          <View style={styles.drawerContainer}>
            <Text style={styles.drawerTitle}>Google Keep</Text>
            <TouchableOpacity
              style={[styles.drawerLink, currentPage === 'home' && styles.activeDrawerLink]}
              onPress={() => navigateTo('home')}
            >
              <MaterialCommunityIcons name="lightbulb-outline" size={22} color="#fff" />
              <Text style={styles.drawerLinkText}>Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawerLink, currentPage === 'bin' && styles.activeDrawerLink]}
              onPress={() => navigateTo('bin')}
            >
              <MaterialCommunityIcons name="delete-outline" size={22} color="#fff" />
              <Text style={styles.drawerLinkText}>Bin</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {renderContent()}

      {currentPage === 'home' && (
        <>
          {isMenuVisible && <Pressable style={styles.overlay} onPress={() => setIsMenuVisible(false)} />}
          <View style={styles.fabContainer}>
            {isMenuVisible && (
              <View style={styles.menuItemsContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setEditingNote(null); navigateTo('home'); }}>
                  <MaterialCommunityIcons name="format-text-variant" color="#e8e0ff" size={24} />
                  <Text style={styles.menuItemText}>Text</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setEditingNote(null); navigateTo('addList'); }}>
                  <MaterialCommunityIcons name="checkbox-marked-outline" color="#e8e0ff" size={24} />
                  <Text style={styles.menuItemText}>List</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setEditingNote(null); navigateTo('home'); }}>
                  <MaterialCommunityIcons name="image-outline" color="#e8e0ff" size={24} />
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1c1b1f' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  menuBtn: { padding: 8 },
  searchBar: { flex: 1, backgroundColor: '#2a2a3d', borderRadius: 28, height: 48, justifyContent: 'center', paddingLeft: 16, color: '#9898a8' },
  searchPlaceholder: { color: '#9898a8', fontSize: 16 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#5b6abf', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9898a8', marginTop: 10 },

  // Notes grid
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
  noteCardTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  noteCardContent: { color: '#c8c8d8', fontSize: 14, lineHeight: 20 },
  noteDate: { color: '#666', fontSize: 11, marginTop: 8 },

  // Checklist in card
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  checklistText: { color: '#c8c8d8', fontSize: 13, flex: 1 },
  checklistChecked: { textDecorationLine: 'line-through', color: '#666' },
  moreText: { color: '#888', fontSize: 12, marginTop: 4 },

  // Drawer
  drawerMask: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10 },
  drawerContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: SCREEN_WIDTH * 0.75, backgroundColor: '#202124', zIndex: 11, padding: 20, paddingTop: 50 },
  drawerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 30 },
  drawerLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, gap: 20, borderRadius: 10 },
  activeDrawerLink: { backgroundColor: '#41334e' },
  drawerLinkText: { color: '#fff', fontSize: 16 },

  // Sub-page header
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerText: { color: '#fff', fontSize: 20, fontWeight: '500' },

  // FAB
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1 },
  fabContainer: { position: 'absolute', bottom: 30, right: 20, alignItems: 'flex-end', zIndex: 2 },
  fab: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#6d5fd4', justifyContent: 'center', alignItems: 'center' },
  fabClose: { backgroundColor: '#d7caff' },
  menuItemsContainer: { marginBottom: 15, gap: 12 },
  menuItem: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#4a447d', padding: 12, borderRadius: 25, minWidth: 130, justifyContent: 'center', gap: 10 },
  menuItemText: { color: '#e8e0ff', fontSize: 16 },
});