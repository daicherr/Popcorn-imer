// Importa módulos essenciais do React e React Native
import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ImageBackground,
    TouchableOpacity,
    StatusBar,
    Platform,
    SafeAreaView,
    Dimensions
} from 'react-native';

// Importa a biblioteca do Expo para manipular a barra de navegação no Android
import * as NavigationBar from 'expo-navigation-bar';

// Obtém as dimensões atuais da tela (largura e altura)
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define o componente funcional WelcomeScreen, que recebe a prop navigation
const WelcomeScreen = ({ navigation }) => {

    // Nome e slogan do app
    const appName = "POPCORN";
    const appSlogan = "Acompanhe os filmes que você assistiu. Salve o que você quer ver. Compartilhe com seus amigos o que é bom..";

    // Cores para os círculos do logo
    const logoColor1 = '#FF8000';  // laranja
    const logoColor2 = '#00C853';  // verde
    const logoColor3 = '#40C4FF';  // azul

    // Hook useEffect para configurar a barra de navegação do Android quando o componente for montado
    useEffect(() => {
        const configurarBarraNavegacao = async () => {
            if (Platform.OS === 'android') {  // Só aplica no Android
                try {
                    // Define o estilo dos botões da barra de navegação como claros
                    await NavigationBar.setButtonStyleAsync('light');
                    // Define a cor de fundo da barra de navegação
                    await NavigationBar.setBackgroundColorAsync('#1D2740');
                } catch (e) {
                    // Em caso de erro, imprime no console
                    console.log("Erro ao configurar NavigationBar:", e);
                }
            }
        };
        // Chama a função
        configurarBarraNavegacao();
    }, []);  // Executa apenas uma vez ao montar o componente

    // Função executada ao pressionar o botão "Iniciar"
    const aoPressionarIniciar = () => {
        // Verifica se navigation existe e se navigation.navigate é uma função
        if (navigation && typeof navigation.navigate === 'function') {
            // Navega para a tela 'Login'
            navigation.navigate('Login');
        } else {
            // Caso contrário, exibe um aviso no console
            console.warn("Propriedade de navegação não encontrada ou não é uma função!");
        }
    };

    // Define a proporção vertical para posicionar o conteúdo abaixo da imagem
    const proporcaoPosicaoVerticalConteudo = 0.25;

    // Retorna a estrutura visual da tela
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Barra de status com estilo claro */}
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={true} />

            <View style={styles.container}>
                {/* Imagem de fundo na parte superior */}
                <ImageBackground
                    source={require('../assets/seu_collage_topo.png')}
                    style={styles.topImageBackground}
                    resizeMode="cover">
                </ImageBackground>

                {/* Sobreposição escura sobre a imagem para melhorar o contraste */}
                <View style={styles.fullScreenOverlay} />

                {/* Conteúdo principal da tela */}
                <View style={[styles.content, { marginTop: screenHeight * proporcaoPosicaoVerticalConteudo }]}>
                    
                    {/* Logo com círculos e nome do app */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCirclesContainer}>
                            {/* Círculo laranja */}
                            <View style={[styles.logoCircle, { backgroundColor: logoColor1, zIndex: 1, marginLeft: 0 }]} />
                            {/* Círculo verde sobreposto */}
                            <View style={[styles.logoCircle, { backgroundColor: logoColor2, zIndex: 2, marginLeft: -15 }]} />
                            {/* Círculo azul sobreposto */}
                            <View style={[styles.logoCircle, { backgroundColor: logoColor3, zIndex: 1, marginLeft: -15 }]} />
                        </View>
                        {/* Nome do aplicativo */}
                        <Text style={styles.appNameText}>{appName}</Text>
                    </View>

                    {/* Slogan abaixo do nome */}
                    <Text style={styles.sloganText}>{appSlogan}</Text>

                    {/* Botão de iniciar */}
                    <TouchableOpacity style={styles.getStartedButton} onPress={aoPressionarIniciar}>
                        <Text style={styles.getStartedButtonText}>Iniciar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

// Define os estilos da tela
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#1D2740',  // Cor de fundo da tela
        paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight : 0,  // Ajuste para iOS
    },
    container: {
        flex: 1,
        alignItems: 'center',  // Centraliza conteúdo na horizontal
    },
    topImageBackground: {
        width: '100%',
        height: screenHeight * 0.48,  // Ocupa 48% da altura da tela
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,  // Atrás dos demais elementos
    },
    fullScreenOverlay: {
        ...StyleSheet.absoluteFillObject,  // Ocupa toda a tela
        backgroundColor: 'rgba(0,0,0,0.35)',  // Preto semi-transparente
        zIndex: 1,  // Sobre a imagem
    },
    content: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        zIndex: 2,  // Sobre a sobreposição
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    logoCirclesContainer: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    logoCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,  // Torna o quadrado um círculo
    },
    appNameText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    sloganText: {
        fontSize: 19,
        color: '#E0E0E0',
        textAlign: 'center',
        lineHeight: 27,
        marginBottom: 35,
    },
    getStartedButton: {
        backgroundColor: '#FFC0CB',  // Cor rosa
        paddingVertical: 16,
        paddingHorizontal: 60,
        borderRadius: 30,  // Bordas arredondadas
        elevation: 3,  // Sombra no Android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    getStartedButtonText: {
        fontSize: 18,
        color: '#333333',
        fontWeight: 'bold',
    },
});

// Exporta o componente para ser usado em outros arquivos
export default WelcomeScreen;
