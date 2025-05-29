// Importa React e hook useEffect para efeitos colaterais
import React, { useEffect } from 'react';
// Importa NavigationContainer para envolver a navegação do app
import { NavigationContainer } from '@react-navigation/native';
// Importa createNativeStackNavigator para navegação baseada em pilha (telas empilhadas)
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Importa createBottomTabNavigator para navegação com abas na parte inferior
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Importa componentes do React Native para construir a UI e funcionalidades
import { View, Text, ActivityIndicator, StyleSheet, Platform, StatusBar } from 'react-native';
// Importa * como NavigationBar de 'expo-navigation-bar' para controlar a barra de navegação do sistema Android
import * as NavigationBar from 'expo-navigation-bar';

// Importa o provedor de autenticação e o hook useAuth do AuthContext
import { AuthProvider, useAuth } from './AuthContext';

// Importa o componente de barra de abas flutuante personalizado
import CustomFabTabBar from './components/CustomFabTabBar';

// Importa todas as telas da aplicação
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

// Cria instâncias dos navegadores Stack e Tab
const AuthStackNav = createNativeStackNavigator(); // Navegador de pilha para o fluxo de autenticação
const HomeStackNav = createNativeStackNavigator(); // Navegador de pilha para a seção Home
const ListStackNav = createNativeStackNavigator(); // Navegador de pilha para a seção de Listas
const MainTabNav = createBottomTabNavigator(); // Navegador de abas principal

// Componente para o Stack Navigator da Home
function HomeStackNavigator() {
  return (
    <HomeStackNav.Navigator
      screenOptions={{ // Opções padrão para todas as telas neste navegador
        headerShown: false, // Oculta o cabeçalho padrão
        animation: 'fade', // Define a animação de transição entre telas como 'fade'
      }}
    >
      {/* Define as telas dentro do HomeStackNav */}
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="MovieDetails" component={MovieDetailsScreen} />
      <HomeStackNav.Screen name="ReviewForm" component={ReviewFormScreen} />
    </HomeStackNav.Navigator>
  );
}

// Componente para o Stack Navigator de Listas
function ListStackNavigator() {
  return (
    <ListStackNav.Navigator screenOptions={{ headerShown: false }}> {/* Oculta o cabeçalho padrão */}
      {/* Define as telas dentro do ListStackNav */}
      <ListStackNav.Screen name="MyLists" component={ListsScreen} />
      <ListStackNav.Screen name="CreateList" component={CreateListScreen} />
      <ListStackNav.Screen name="ListDetails" component={ListDetailsScreen} />
    </ListStackNav.Navigator>
  );
}

// Componente para o Tab Navigator Principal (após login)
function MainAppTabs() {
  return (
    <MainTabNav.Navigator
      tabBar={props => <CustomFabTabBar {...props} />} // Usa o componente de barra de abas personalizado
      screenOptions={{
          headerShown: false, // Oculta o cabeçalho padrão para as telas do TabNavigator
      }}
    >
      {/* Define as abas e seus respectivos componentes/navegadores */}
      <MainTabNav.Screen name="HomeStack" component={HomeStackNavigator} />
      <MainTabNav.Screen name="SearchTab" component={SearchScreen} />
      <MainTabNav.Screen name="ListsStack" component={ListStackNavigator} />
      <MainTabNav.Screen name="ProfileTab" component={ProfileScreen} />
    </MainTabNav.Navigator>
  );
}

// Componente para o Stack Navigator do Fluxo de Autenticação
function AuthFlowStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Oculta o cabeçalho e define animação de slide da direita para esquerda */}
      {/* Define as telas dentro do AuthFlowStack */}
      <AuthStackNav.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="SignUp" component={SignUpScreen} />
    </AuthStackNav.Navigator>
  );
}

// Componente principal do navegador do aplicativo, decide qual fluxo mostrar (Auth ou Main)
function AppNavigator() {
  // Obtém o token do usuário e o estado de carregamento do token do contexto de autenticação
  const { userToken, isLoadingToken } = useAuth();

  // useEffect para configurar a interface assim que o componente montar
  useEffect(() => {
    // Oculta a StatusBar com animação de slide
    StatusBar.setHidden(true, 'slide');

    // Função assíncrona para configurar a barra de navegação do sistema (Android)
    const configurarBarraNavegacaoSistema = async () => {
      if (Platform.OS === 'android') { // Verifica se a plataforma é Android
        try {
          // Define a visibilidade da barra de navegação do sistema como oculta
          await NavigationBar.setVisibilityAsync('hidden');
          // Define o comportamento da barra de navegação para 'inset-sticky' (imersão)
          await NavigationBar.setBehaviorAsync('inset-sticky');
        } catch (e) {
          // Adverte no console se houver erro ao configurar
          console.warn("Erro ao configurar NavigationBar do sistema para imersão:", e);
        }
      }
    };
    // Chama a função de configuração
    configurarBarraNavegacaoSistema();
  }, []); // Array de dependências vazio, executa apenas uma vez ao montar


  // Se o token ainda está carregando, mostra um indicador de atividade
  if (isLoadingToken) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7A59" />
      </View>
    );
  }

  // Retorna o NavigationContainer que envolve todo o sistema de navegação
  return (
    <NavigationContainer>
      {/* Condicionalmente renderiza o fluxo de autenticação ou as abas principais do app */}
      {/* Se userToken for nulo, mostra AuthFlowStack, senão mostra MainAppTabs */}
      {userToken == null ? <AuthFlowStack /> : <MainAppTabs />}
    </NavigationContainer>
  );
}

// Componente raiz da aplicação
export default function App() {
  return (
    // Envolve o AppNavigator com o AuthProvider para disponibilizar o contexto de autenticação
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

// Define os estilos para os componentes
const styles = StyleSheet.create({
  loadingContainer: { // Estilo para o container do indicador de carregamento
    flex: 1, // Ocupa todo o espaço disponível
    justifyContent: 'center', // Centraliza o conteúdo verticalmente
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
    backgroundColor: '#10141E', // Cor de fundo
  },
});