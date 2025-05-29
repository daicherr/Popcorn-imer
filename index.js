// Importa a função registerRootComponent do Expo
// Essa função registra o componente principal da aplicação
// e garante que ele seja inicializada tanto no ambiente de desenvolvimento quanto na versão final
import { registerRootComponent } from 'expo';

// Importa o componente App, que é o componente principal da aplicação
// Esse componente geralmente define toda a estrutura e navegação do app
import App from './App';

// Chama a função registerRootComponent, passando o App como argumento
// Isso diz ao Expo que o componente App é o ponto de entrada da aplicação
// Sem essa chamada, o aplicativo não iniciaria corretamente
registerRootComponent(App);
