// Importa a função registerRootComponent da biblioteca expo
// Esta função é usada para registrar o componente raiz da sua aplicação.
// É o ponto de entrada principal para uma aplicação Expo.
import { registerRootComponent } from 'expo';

// Importa o componente App, que é o componente raiz definido em App.js
import App from './App';

// registerRootComponent é responsável por registrar o componente App
// como o componente principal da aplicação. Isso garante que, quando o
// JavaScript bundle for carregado, o Expo saiba qual componente renderizar primeiro.
registerRootComponent(App);