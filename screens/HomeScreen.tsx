import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function NotesScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1c1b1f" />

      {/* ── Search Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          activeOpacity={0.7}
          onPress={() => navigation.openDrawer()}>
          <MaterialCommunityIcons name="menu" color="#c8c8d8" size={24} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Keep"
            placeholderTextColor="#9898a8"
            value={searchText}
            onChangeText={setSearchText}
            selectionColor="#a78bfa"
          />
          <TouchableOpacity style={styles.searchIcon} activeOpacity={0.7}>
            <MaterialCommunityIcons name="view-grid-outline" color="#c8c8d8" size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchIcon} activeOpacity={0.7}>
            <MaterialCommunityIcons name="sort" color="#c8c8d8" size={22} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.avatar} activeOpacity={0.8}>
          <Text style={styles.avatarText}>r</Text>
        </TouchableOpacity>
      </View>

      {/* ── Empty State ── */}
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="lightbulb-outline" color="#9898a8" size={96} />
        <Text style={styles.emptyText}>Notes you add appear here</Text>
      </View>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <MaterialCommunityIcons name="plus" color="#e8e0ff" size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1c1b1f',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 8,
    gap: 10,
  },
  menuBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3d',
    borderRadius: 28,
    paddingLeft: 16,
    paddingRight: 8,
    height: 52,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#e0e0f0',
    letterSpacing: 0.2,
  },
  searchIcon: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5b6abf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#9898a8',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#6d5fd4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6d5fd4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
});