import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Text } from 'react-native';

import { CommentsScreen } from './screens/Comments';
import { PostsScreen } from './screens/Posts';
import { ViewerScreen } from './screens/Viewer';

const Tab = createBottomTabNavigator();

export function Tabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#111827',
            borderTopColor: '#1f2937',
            height: 64,
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 6,
          },
        }}
      >
        <Tab.Screen
          name="Posts"
          component={PostsScreen}
          options={{
            tabBarLabel: ({ color }) => <Text style={{ color }}>Posts</Text>,
          }}
        />
        <Tab.Screen
          name="Comments"
          component={CommentsScreen}
          options={{
            tabBarLabel: ({ color }) => <Text style={{ color }}>Comments</Text>,
          }}
        />
        <Tab.Screen
          name="Viewer"
          component={ViewerScreen}
          options={{
            tabBarLabel: ({ color }) => <Text style={{ color }}>Viewer</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
