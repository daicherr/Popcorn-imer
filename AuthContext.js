import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  const autenticar = async (token) => {
    setIsLoadingToken(true);
    try {
      await AsyncStorage.setItem('@userToken', token);
      setUserToken(token);
    } catch (e) {
      console.error("AuthContext: Erro ao guardar o token:", e);
    }
    setIsLoadingToken(false);
  };

  const desautenticar = async () => {
    setIsLoadingToken(true);
    try {
      await AsyncStorage.removeItem('@userToken');
      setUserToken(null);
    } catch (e) {
      console.error("AuthContext: Erro ao remover o token:", e);
    }
    setIsLoadingToken(false);
  };

  useEffect(() => {
    const carregarTokenInicial = async () => {
      let tokenFromStorage;
      try {
        tokenFromStorage = await AsyncStorage.getItem('@userToken');
        if (tokenFromStorage) {
          setUserToken(tokenFromStorage);
        }
      } catch (e) {
        console.error("AuthContext: Erro ao restaurar o token:", e);
      }
      setIsLoadingToken(false);
    };

    carregarTokenInicial();
  }, []);

  return (
    <AuthContext.Provider value={{ userToken, isLoadingToken, signIn: autenticar, signOut: desautenticar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};