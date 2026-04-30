import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRASH_KEY = '@deleted_items';

type DeletedItem = {
  id: string;
  type: 'list' | 'item';
  title: string;
  listId?: string;
  listTitle?: string;
  items?: string[];           
  deletedAt: string;
};

const DeletedScreen = () => {
    const [trashItems, setTrashItems] = useState<DeletedItem[]>([]);

    const loadTrash = async () => {
        const json = await AsyncStorage.getItem(TRASH_KEY);
        const data = json != null ? JSON.parse(json) : [];
        setTrashItems(data);
    };

    useEffect(() => {
        loadTrash();
        const interval = setInterval(loadTrash, 1000); // refresh every second (could be optimized)
        return () => clearInterval(interval);
    }, []);

    // Calculate days remaining (7 - days since deletion)
    const daysLeft = (deletedAt: string) => {
        const deleted = new Date(deletedAt);
        const now = new Date();
        const diffDays = Math.max(7 - Math.ceil((now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24)), 0);
        return diffDays;
    };

    const handleRestore = async (item: DeletedItem) => {
        // Restore logic: move back from trash to @list_notes
        try {
            if (item.type === 'list') {
                // Recreate the list with empty items
                const listsJson = await AsyncStorage.getItem('@list_notes');
                const lists = listsJson != null ? JSON.parse(listsJson) : [];
                const newList = {
                    id: item.id,
                    title: item.title,
                    items: item.items || [],  
                    createdAt: new Date().toISOString(),
                };
                lists.push(newList);
                await AsyncStorage.setItem('@list_notes', JSON.stringify(lists));
            } else if (item.type === 'item' && item.listId) {
                // Find the list and append the item
                const listsJson = await AsyncStorage.getItem('@list_notes');
                let lists = listsJson != null ? JSON.parse(listsJson) : [];
                lists = lists.map((l: any) => {
                    if (l.id === item.listId) {
                        return { ...l, items: [...l.items, item.title] };
                    }
                    return l;
                });
                await AsyncStorage.setItem('@list_notes', JSON.stringify(lists));
            }

            // Remove from trash
            const updatedTrash = trashItems.filter(t => t.id !== item.id);
            await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(updatedTrash));
            setTrashItems(updatedTrash);
            Alert.alert('Restored', `"${item.title}" has been restored.`);
        } catch (error) {
            Alert.alert('Error', 'Could not restore item.');
        }
    };

    const handlePermanentDelete = async (item: DeletedItem) => {
        Alert.alert('Delete permanently', `Remove "${item.title}" forever?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                onPress: async () => {
                    const updatedTrash = trashItems.filter(t => t.id !== item.id);
                    await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(updatedTrash));
                    setTrashItems(updatedTrash);
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Deleted</Text>
            <Text style={styles.subHeader}>
                Notes in Recycle Bin are deleted after 7 days
            </Text>

            {trashItems.length === 0 ? (
                <View style={styles.emptyContainer}>
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
                                    {item.type === 'list' ? '📋 List: ' : '📝 Item: '}
                                    {item.title}
                                </Text>
                                {item.listTitle && (
                                    <Text style={styles.itemSubtitle}>from {item.listTitle}</Text>
                                )}
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
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subHeader: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#888',
    },
    trashItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemSubtitle: {
        fontSize: 12,
        color: '#888',
    },
    daysLeft: {
        fontSize: 12,
        color: '#e67e22',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
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