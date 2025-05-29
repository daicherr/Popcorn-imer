// Importações de módulos e componentes necessários
import React, { useEffect } from 'react'; // useEffect não está sendo usado, pode ser removido se não for planejado uso futuro.
import {
    StyleSheet,
    View,
    Text,
    ImageBackground, // Para imagem de fundo
    TouchableOpacity, // Para o botão "Iniciar"
    Platform, // Para ajustes específicos de plataforma (iOS/Android)
    SafeAreaView, // Garante que o conteúdo não sobreponha barras de status, etc.
    Dimensions, // Para obter dimensões da tela
    StatusBar // Para interagir com a barra de status (neste caso, para padding no iOS)
} from 'react-native';

// Obtém as dimensões da tela (largura e altura)
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Componente da tela de Boas-Vindas
const WelcomeScreen = ({ navigation }) => {
    // Constantes para textos e cores do logo
    const appName = "POPCORN";
    const appSlogan = "Acompanhe os filmes que você assistiu. Salve o que você quer ver. Compartilhe com seus amigos o que é bom..";
    const logoColor1 = '#FF8000'; // Laranja
    const logoColor2 = '#00C853'; // Verde
    const logoColor3 = '#40C4FF'; // Azul claro

    // Função chamada ao pressionar o botão "Iniciar"
    const aoPressionarIniciar = () => {
        // Verifica se o objeto de navegação e a função navigate existem
        if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('Login'); // Navega para a tela de Login
        } else {
            // Aviso no console caso a navegação não esteja disponível (improvável em um setup normal)
            console.warn("Propriedade de navegação não encontrada ou não é uma função!");
        }
    };

    // Proporção para posicionar o conteúdo verticalmente na tela
    const proporcaoPosicaoVerticalConteudo = 0.25; // 25% da altura da tela como margem superior para o conteúdo principal

    return (
        // SafeAreaView para garantir que o conteúdo fique dentro da área visível da tela
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Imagem de fundo no topo da tela */}
                <ImageBackground
                    source={require('../assets/seu_collage_topo.png')} // Imagem local
                    style={styles.topImageBackground}
                    resizeMode="cover" // Modo de redimensionamento da imagem
                >
                    {/* Nenhum conteúdo dentro do ImageBackground aqui, ele serve apenas como fundo visual */}
                </ImageBackground>

                {/* Overlay escuro sobre toda a tela para melhorar a legibilidade do texto */}
                <View style={styles.fullScreenOverlay} />

                {/* Container principal do conteúdo (logo, slogan, botão) */}
                <View style={[styles.content, { marginTop: screenHeight * proporcaoPosicaoVerticalConteudo }]}>
                    {/* Container do logo (círculos coloridos e nome do app) */}
                    <View style={styles.logoContainer}>
                        {/* Container dos círculos do logo */}
                        <View style={styles.logoCirclesContainer}>
                            <View style={[styles.logoCircle, { backgroundColor: logoColor1, zIndex: 1, marginLeft: 0 }]} />
                            <View style={[styles.logoCircle, { backgroundColor: logoColor2, zIndex: 2, marginLeft: -15 }]} />
                            <View style={[styles.logoCircle, { backgroundColor: logoColor3, zIndex: 1, marginLeft: -15 }]} />
                        </View>
                        {/* Nome do aplicativo */}
                        <Text style={styles.appNameText}>{appName}</Text>
                    </View>

                    {/* Slogan do aplicativo */}
                    <Text style={styles.sloganText}>{appSlogan}</Text>

                    {/* Botão "Iniciar" */}
                    <TouchableOpacity style={styles.getStartedButton} onPress={aoPressionarIniciar}>
                        <Text style={styles.getStartedButtonText}>Iniciar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

// Estilos do componente
const styles = StyleSheet.create({
    safeArea: { // Estilo para a área segura da tela
        flex: 1,
        backgroundColor: '#1D2740', // Cor de fundo da área segura (visível em áreas de notch/status bar)
        // Padding superior para iOS para evitar sobreposição com a StatusBar (se translúcida)
        // No Android, a StatusBar geralmente é opaca ou controlada de outra forma (ex: no AndroidManifest.xml ou via `StatusBar` component)
        paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight : 0,
    },
    container: { // Container principal da tela
        flex: 1,
        alignItems: 'center', // Centraliza o conteúdo horizontalmente
    },
    topImageBackground: { // Imagem de fundo no topo
        width: '100%',
        height: screenHeight * 0.48, // Altura relativa à tela (48%)
        justifyContent: 'flex-end', // Alinha conteúdo (se houvesse) ao final
        alignItems: 'center', // Centraliza conteúdo (se houvesse)
        position: 'absolute', // Posicionamento absoluto para ficar atrás de outros elementos
        top: 0,
        left: 0,
        zIndex: 0, // Camada inferior
    },
    fullScreenOverlay: { // Overlay escuro sobre toda a tela
        ...StyleSheet.absoluteFillObject, // Preenche todo o container pai
        backgroundColor: 'rgba(0,0,0,0.35)', // Cor preta com 35% de opacidade
        zIndex: 1, // Camada acima da imagem de fundo, mas abaixo do conteúdo principal
    },
    content: { // Container do conteúdo principal (logo, slogan, botão)
        flex: 1, // Ocupa o espaço vertical disponível
        width: '100%',
        alignItems: 'center', // Centraliza itens horizontalmente
        justifyContent: 'center', // Centraliza itens verticalmente (dentro do espaço 'flex:1' e após marginTop)
        paddingHorizontal: 40, // Espaçamento horizontal interno
        zIndex: 2, // Camada acima do overlay
    },
    logoContainer: { // Container do logo
        alignItems: 'center',
        marginBottom: 25,
    },
    logoCirclesContainer: { // Container dos círculos do logo
        flexDirection: 'row', // Alinha os círculos horizontalmente
        marginBottom: 15,
    },
    logoCircle: { // Estilo de cada círculo do logo
        width: 50,
        height: 50,
        borderRadius: 25, // Metade da largura/altura para formar um círculo perfeito
    },
    appNameText: { // Nome do aplicativo
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    sloganText: { // Slogan do aplicativo
        fontSize: 19,
        color: '#E0E0E0', // Cor de texto clara
        textAlign: 'center',
        lineHeight: 27, // Altura da linha para melhor legibilidade
        marginBottom: 35,
    },
    getStartedButton: { // Botão "Iniciar"
        backgroundColor: '#FFC0CB', // Cor de fundo rosa claro (Pink)
        paddingVertical: 16, // Espaçamento vertical interno
        paddingHorizontal: 60, // Espaçamento horizontal interno
        borderRadius: 30, // Bordas arredondadas
        elevation: 3, // Sombra para Android
        // Sombra para iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    getStartedButtonText: { // Texto do botão "Iniciar"
        fontSize: 18,
        color: '#333333', // Cor de texto escura para contraste com o fundo rosa
        fontWeight: 'bold',
    },
});

export default WelcomeScreen; // Exporta o componente