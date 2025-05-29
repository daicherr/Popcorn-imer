import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, Platform, StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

import { AuthProvider, useAuth } from './AuthContext';

import CustomFabTabBar from './components/CustomFabTabBar';

import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import MovieDetailsScreen from './screens/MovieDetailsScreen';
import ReviewFormScreen from './screens/ReviewFormScreen';
import ListsScreen from './screens/ListsScreen';
import CreateListScreen from './screens/CreateListScreen';
import ListDetailsScreen from './screens/ListDetailsScreen';
import ProfileScreen from './screens/ProfileScreen';
import SearchScreen from './screens/SearchScreen';

const AuthStackNav = createNativeStackNavigator();
const HomeStackNav = createNativeStackNavigator();
const ListStackNav = createNativeStackNavigator();
const MainTabNav = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <HomeStackNav.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="MovieDetails" component={MovieDetailsScreen} />
      <HomeStackNav.Screen name="ReviewForm" component={ReviewFormScreen} />
    </HomeStackNav.Navigator>
  );
}

function ListStackNavigator() {
  return (
    <ListStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ListStackNav.Screen name="MyLists" component={ListsScreen} />
      <ListStackNav.Screen name="CreateList" component={CreateListScreen} />
      <ListStackNav.Screen name="ListDetails" component={ListDetailsScreen} />
    </ListStackNav.Navigator>
  );
}

function MainAppTabs() {
  return (
    <MainTabNav.Navigator
      tabBar={props => <CustomFabTabBar {...props} />}
      screenOptions={{
          headerShown: false,
      }}
    >
      <MainTabNav.Screen name="HomeStack" component={HomeStackNavigator} />
      <MainTabNav.Screen name="SearchTab" component={SearchScreen} />
      <MainTabNav.Screen name="ListsStack" component={ListStackNavigator} />
      <MainTabNav.Screen name="ProfileTab" component={ProfileScreen} />
    </MainTabNav.Navigator>
  );
}

function AuthFlowStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <AuthStackNav.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="SignUp" component={SignUpScreen} />
    </AuthStackNav.Navigator>
  );
}

function AppNavigator() {
  const { userToken, isLoadingToken } = useAuth();

  useEffect(() => {
    StatusBar.setHidden(true, 'slide');

    const configurarBarraNavegacaoSistema = async () => {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('inset-sticky');
        } catch (e) {
          console.warn("Erro ao configurar NavigationBar do sistema para imersão:", e);
        }
      }
    };
    configurarBarraNavegacaoSistema();
  }, []);


  if (isLoadingToken) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7A59" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userToken == null ? <AuthFlowStack /> : <MainAppTabs />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10141E',
  },
});