import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NoteItem, ChecklistItem } from '../screens/HomeScreen';

interface NoteCardProps {
  note: NoteItem;
  onPress: () => void;
  onLongPress: () => void;
  onToggleChecklistItem?: (noteId: string, itemId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onLongPress, onToggleChecklistItem }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onLongPress}>
      {note.title ? <Text style={styles.title}>{note.title}</Text> : null}
      
      {note.type === 'text' && (
        <Text style={styles.content} numberOfLines={6}>{note.content}</Text>
      )}

      {note.type === 'list' && note.items && (
        <View>
          {note.items.slice(0, 5).map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.checklistRow}
              onPress={() => onToggleChecklistItem?.(note.id, item.id)}
            >
              <MaterialCommunityIcons
                name={item.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={16}
                color={item.checked ? '#8877cc' : '#c8c8d8'}
              />
              <Text style={[styles.checklistText, item.checked && styles.checked]}>
                {item.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Text style={styles.date}>{new Date(note.createdAt).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a2a3a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a3a4a',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  content: { color: '#c8c8d8', fontSize: 14, lineHeight: 20 },
  date: { color: '#666', fontSize: 11, marginTop: 8 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  checklistText: { color: '#c8c8d8', fontSize: 13, flex: 1 },
  checked: { textDecorationLine: 'line-through', color: '#666' },
});