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
import * as NavigationBar from 'expo-navigation-bar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
    const appName = "POPCORN";
    const appSlogan = "Acompanhe os filmes que você assistiu. Salve o que você quer ver. Compartilhe com seus amigos o que é bom..";
    const logoColor1 = '#FF8000';
    const logoColor2 = '#00C853';
    const logoColor3 = '#40C4FF';

    useEffect(() => {
        const configurarBarraNavegacao = async () => {
            if (Platform.OS === 'android') {
                try {
                    await NavigationBar.setButtonStyleAsync('light');
                    await NavigationBar.setBackgroundColorAsync('#1D2740');
                } catch (e) {
                    console.log("Erro ao configurar NavigationBar:", e);
                }
            }
        };
        configurarBarraNavegacao();
    }, []);

    const aoPressionarIniciar = () => {
        if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('Login');
        } else {
            console.warn("Propriedade de navegação não encontrada ou não é uma função!");
        }
    };

    const proporcaoPosicaoVerticalConteudo = 0.25;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={true} />
            <View style={styles.container}>
                <ImageBackground
                    source={require('../assets/seu_collage_topo.png')}
                    style={styles.topImageBackground}
                    resizeMode="cover">
                </ImageBackground>

                <View style={styles.fullScreenOverlay} />

                <View style={[styles.content, { marginTop: screenHeight * proporcaoPosicaoVerticalConteudo }]}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCirclesContainer}>
                            <View style={[styles.logoCircle, { backgroundColor: logoColor1, zIndex: 1, marginLeft: 0 }]} />
                            <View style={[styles.logoCircle, { backgroundColor: logoColor2, zIndex: 2, marginLeft: -15 }]} />
                            <View style={[styles.logoCircle, { backgroundColor: logoColor3, zIndex: 1, marginLeft: -15 }]} />
                        </View>
                        <Text style={styles.appNameText}>{appName}</Text>
                    </View>

                    <Text style={styles.sloganText}>{appSlogan}</Text>

                    <TouchableOpacity style={styles.getStartedButton} onPress={aoPressionarIniciar}>
                        <Text style={styles.getStartedButtonText}>Iniciar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#1D2740',
        paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
        alignItems: 'center',
    },
    topImageBackground: {
        width: '100%',
        height: screenHeight * 0.48,
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
    },
    fullScreenOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
        zIndex: 1,
    },
    content: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        zIndex: 2,
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
        borderRadius: 25,
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
        backgroundColor: '#FFC0CB',
        paddingVertical: 16,
        paddingHorizontal: 60,
        borderRadius: 30,
        elevation: 3,
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

export default WelcomeScreen;