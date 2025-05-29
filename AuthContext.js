// Importa React, hooks createContext, useState, useEffect, useContext
import React, { createContext, useState, useEffect, useContext } from 'react';
// Importa AsyncStorage para armazenamento persistente de dados no dispositivo
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cria um Contexto de Autenticação, inicializado como null
export const AuthContext = createContext(null);

// Componente Provedor de Autenticação
export const AuthProvider = ({ children }) => {
  // Estado para armazenar o token do usuário, inicializado como null
  const [userToken, setUserToken] = useState(null);
  // Estado para indicar se o token está sendo carregado, inicializado como true
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  // Função assíncrona para autenticar o usuário
  const autenticar = async (token) => {
    setIsLoadingToken(true); // Define o carregamento como true
    try {
      // Armazena o token no AsyncStorage com a chave '@userToken'
      await AsyncStorage.setItem('@userToken', token);
      // Define o token do usuário no estado
      setUserToken(token);
    } catch (e) {
      // Loga erro no console se houver falha ao guardar o token
      console.error("AuthContext: Erro ao guardar o token:", e);
    }
    setIsLoadingToken(false); // Define o carregamento como false
  };

  // Função assíncrona para desautenticar o usuário
  const desautenticar = async () => {
    setIsLoadingToken(true); // Define o carregamento como true
    try {
      // Remove o token do AsyncStorage
      await AsyncStorage.removeItem('@userToken');
      // Define o token do usuário como null no estado
      setUserToken(null);
    } catch (e) {
      // Loga erro no console se houver falha ao remover o token
      console.error("AuthContext: Erro ao remover o token:", e);
    }
    setIsLoadingToken(false); // Define o carregamento como false
  };

  // useEffect para carregar o token inicial do AsyncStorage quando o componente montar
  useEffect(() => {
    // Função assíncrona para carregar o token
    const carregarTokenInicial = async () => {
      let tokenFromStorage;
      try {
        // Tenta obter o token do AsyncStorage
        tokenFromStorage = await AsyncStorage.getItem('@userToken');
        if (tokenFromStorage) {
          // Se o token existir, define no estado
          setUserToken(tokenFromStorage);
        }
      } catch (e) {
        // Loga erro no console se houver falha ao restaurar o token
        console.error("AuthContext: Erro ao restaurar o token:", e);
      }
      setIsLoadingToken(false); // Define o carregamento como false após a tentativa
    };

    carregarTokenInicial(); // Chama a função de carregamento
  }, []); // Array de dependências vazio, executa apenas uma vez

  // Retorna o Provedor do Contexto, disponibilizando o token, estado de carregamento e funções de login/logout
  return (
    <AuthContext.Provider value={{ userToken, isLoadingToken, signIn: autenticar, signOut: desautenticar }}>
      {children} {/* Renderiza os componentes filhos envolvidos pelo Provedor */}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  // Obtém o contexto
  const context = useContext(AuthContext);
  // Se o contexto for indefinido (ou seja, useAuth usado fora de AuthProvider), lança um erro
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  // Retorna o contexto
  return context;
};