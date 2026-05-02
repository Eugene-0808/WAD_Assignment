import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { NoteItem, ChecklistItem } from './HomeScreen'; // Import the shared type
import { createNoteInCloud } from '../server/cloudSync';

const TRASH_KEY = '@deleted_items';
const NOTES_KEY = '@all_notes';

// Trash item extends NoteItem with a deletion timestamp
type TrashItem = NoteItem & {
  deletedAt: string;
};

const DeletedScreen = ({ onRestore }: { onRestore?: () => void }) => {
    const navigation = useNavigation<StackNavigationProp<any>>();
    const [trashItems, setTrashItems] = useState<TrashItem[]>([]);

    const loadTrash = async () => {
        const json = await AsyncStorage.getItem(TRASH_KEY);
        const data = json != null ? JSON.parse(json) : [];
        setTrashItems(data);
    };

    useEffect(() => {
        loadTrash();
        // Optional: you can remove the interval and just refresh when needed (e.g., after restore/delete)
        const interval = setInterval(loadTrash, 1000);
        return () => clearInterval(interval);
    }, []);

    // Days remaining (7 days auto-delete)
    const daysLeft = (deletedAt: string) => {
        const deleted = new Date(deletedAt);
        const now = new Date();
        const diffDays = Math.max(7 - Math.ceil((now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24)), 0);
        return diffDays;
    };

    const restoreToLocalNotes = async (note: NoteItem) => {
        const json = await AsyncStorage.getItem(NOTES_KEY);
        const currentNotes: NoteItem[] = json ? JSON.parse(json) : [];
        const updatedNotes = [note, ...currentNotes.filter(n => n.id !== note.id)];
        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
    };

    const handleRestore = async (item: TrashItem) => {
    try {
        // 1. Prepare the note for restoration (remove the deletedAt field)
        const { deletedAt, ...restoredNote } = item;
        const noteToRestore: NoteItem = { ...restoredNote, createdAt: new Date().toISOString() };

        // 2. Add it back to the Cloud
        const success = await createNoteInCloud(noteToRestore);

        if (success) {
            // 3. Add the restored note to local storage so HomeScreen can load it
            await restoreToLocalNotes(noteToRestore);

            // 4. Remove it from local trash
            const updatedTrash = trashItems.filter(t => t.id !== item.id);
            await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(updatedTrash));
            setTrashItems(updatedTrash);
            
            Alert.alert('Restored', `"${item.title || 'Untitled'}" moved back to Notes.`, [
                {
                    text: 'OK',
                    onPress: () => {
                        onRestore?.();
                        navigation.navigate('NotesHome');
                    },
                },
            ]);
        } else {
            Alert.alert('Sync Error', 'Failed to restore note to the server.');
        }
    } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Could not restore note.');
    }
};

    const handlePermanentDelete = async (item: TrashItem) => {
        Alert.alert('Delete permanently', `Remove "${item.title || 'Untitled'}" forever?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const updatedTrash = trashItems.filter(t => t.id !== item.id);
                    await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(updatedTrash));
                    setTrashItems(updatedTrash);
                },
            },
        ]);
    };

    const renderItemContent = (item: TrashItem) => {
        switch (item.type) {
            case 'text':
                return item.content ? (
                    <Text style={styles.itemPreview} numberOfLines={2}>
                        {item.content}
                    </Text>
                ) : null;
            case 'list':
                return item.items && item.items.length > 0 ? (
                    <Text style={styles.itemPreview} numberOfLines={2}>
                        {item.items.map(i => i.text).join(', ')}
                    </Text>
                ) : null;
            case 'image':
                return <Text style={styles.itemPreview}>📷 Image note</Text>;
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Recycle Bin</Text>
            </View>
            <Text style={styles.subHeader}>
                Notes in Recycle Bin are deleted after 7 days
            </Text>

            {trashItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="delete-outline" color="#3d3d4d" size={120} />
                    <Text style={styles.emptyText}>No notes in recycle bin</Text>
                </View>
            ) : (
                <FlatList
                    data={trashItems}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.trashItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle}>
                                    {item.type === 'text' && '📄 '}
                                    {item.type === 'list' && '☑️ '}
                                    {item.type === 'image' && '🖼️ '}
                                    {item.title || 'Untitled'}
                                </Text>
                                {renderItemContent(item)}
                                <Text style={styles.daysLeft}>
                                    {daysLeft(item.deletedAt)} day(s) left
                                </Text>
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={styles.restoreBtn}
                                    onPress={() => handleRestore(item)}
                                >
                                    <Text style={styles.restoreText}>Restore</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => handlePermanentDelete(item)}
                                >
                                    <Text style={styles.deleteText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#1c1b1f', // match app theme
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subHeader: {
        fontSize: 14,
        color: '#9898a8',
        marginBottom: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#9898a8',
    },
    trashItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: '#2a2a3a',
        borderRadius: 8,
        marginBottom: 8,
        paddingHorizontal: 12,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    itemPreview: {
        fontSize: 13,
        color: '#c8c8d8',
        marginTop: 4,
    },
    daysLeft: {
        fontSize: 12,
        color: '#e67e22',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
    },
    restoreBtn: {
        backgroundColor: '#286090',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    restoreText: {
        color: '#fff',
        fontSize: 14,
    },
    deleteBtn: {
        backgroundColor: '#c9302c',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    deleteText: {
        color: '#fff',
        fontSize: 14,
    },
});

export default DeletedScreen;