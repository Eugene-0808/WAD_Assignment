import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from './HomeScreen';
import DeletedScreen from './DeletedScreen';
import AddListNoteScreen from './AddListNoteScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// 1. Tab Navigator (Organizes the Home view)
function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={{ 
      headerShown: false,
      tabBarStyle: { backgroundColor: '#1c1b1f', borderTopColor: '#333' },
      tabBarActiveTintColor: '#8877cc',
      tabBarInactiveTintColor: '#9898a8'
    }}>
      <Tab.Screen 
        name="AllNotes" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Notes',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="lightbulb-outline" color={color} size={24} />
        }}
      />
    </Tab.Navigator>
  );
}

// 2. Drawer Navigator (Primary App Structure)
function DrawerGroup() {
  return (
    <Drawer.Navigator screenOptions={{
      headerShown: false,
      drawerStyle: { backgroundColor: '#1c1b1f', width: 280 },
      drawerActiveTintColor: '#fff',
      drawerActiveBackgroundColor: '#41334e',
      drawerInactiveTintColor: '#9898a8',
    }}>
      <Drawer.Screen 
        name="NotesHome" 
        component={HomeTabs} 
        options={{ 
          title: 'Notes',
          drawerIcon: ({color}) => <MaterialCommunityIcons name="lightbulb-outline" color={color} size={22}/>
        }} 
      />
      <Drawer.Screen 
        name="Bin" 
        component={DeletedScreen} 
        options={{ 
          title: 'Recycle Bin',
          drawerIcon: ({color}) => <MaterialCommunityIcons name="delete-outline" color={color} size={22}/>
        }} 
      />
    </Drawer.Navigator>
  );
}

// 3. Root Stack (For Modals and Screens outside the Drawer)
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={DrawerGroup} />
        <Stack.Screen name="AddListNote" component={AddListNoteScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}