import React, { useState, useContext } from 'react'; // Importa React, hook para estados e contexto.
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ImageBackground,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Platform,
    Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Ícones do Material
import { AuthContext } from '../AuthContext'; // Contexto de autenticação

// Pega as dimensões da tela para ajustar elementos responsivos
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com'; // URL da API

const LoginScreen = ({ navigation }) => {
    // Estados para armazenar email, senha, visibilidade da senha e carregamento
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { signIn } = useContext(AuthContext); // Usa a função de login do contexto

    // Função que lida com o processo de login
    const manipularLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campos Obrigatórios', 'Por favor, preencha seu email e senha.');
            return;
        }
        setIsLoading(true); // Mostra que está carregando

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText); // Tenta transformar a resposta em JSON
            } catch (jsonError) {
                console.error("Erro ao fazer parse do JSON:", jsonError, "\nResposta:", responseText);
                Alert.alert('Erro de Resposta', 'Resposta inesperada do servidor.');
                setIsLoading(false);
                return;
            }

            if (response.ok && data.token) {
                await signIn(data.token); // Salva o token no contexto para autenticar
            } else {
                Alert.alert('Falha no Login', data.message || 'Email ou senha inválidos.');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            if (error.message.includes('Network')) {
                Alert.alert('Erro de Conexão', 'Verifique sua internet ou se o servidor está online.');
            } else {
                Alert.alert('Erro', `Erro inesperado: ${error.message}`);
            }
        } finally {
            setIsLoading(false); // Finaliza o carregamento
        }
    };

    // Função para navegar até a tela de cadastro
    const navegarParaCadastro = () => {
        if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('SignUp');
        }
    };

    // Placeholder para a função de "Esqueci a senha"
    const manipularEsqueciSenha = () => {
        // Ação futura para recuperação de senha
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#10141E" />
            <View style={styles.container}>
                {/* Imagem de fundo do topo */}
                <ImageBackground
                    source={require('../assets/Login.png')}
                    style={styles.topImageBackground}
                    resizeMode="cover"
                >
                    {/* Botão de voltar */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation && navigation.goBack()}
                        disabled={isLoading}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </ImageBackground>

                {/* Formulário de login */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Login</Text>
                    {/* Campo de email */}
                    <TextInput
                        style={[styles.input, isLoading && styles.inputDisabled]}
                        placeholder="Email"
                        placeholderTextColor="#7A7A7A"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        selectionColor="#FF7A59"
                        editable={!isLoading}
                    />
                    {/* Campo de senha com ícone de olho */}
                    <View style={[styles.passwordInputContainer, isLoading && styles.inputDisabled]}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder="Senha"
                            placeholderTextColor="#7A7A7A"
                            secureTextEntry={!isPasswordVisible}
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            selectionColor="#FF7A59"
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            style={styles.eyeIconContainer}
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            disabled={isLoading}
                        >
                            <MaterialCommunityIcons
                                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                size={24}
                                color="#7A7A7A"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Link de "Esqueceu a senha?" */}
                    <TouchableOpacity style={styles.forgotPasswordButton} onPress={manipularEsqueciSenha} disabled={isLoading}>
                        <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
                    </TouchableOpacity>

                    {/* Botão de login */}
                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                        onPress={manipularLogin}
                        disabled={isLoading}
                    >
                        <Text style={styles.loginButtonText}>{isLoading ? "Entrando..." : "Entrar"}</Text>
                    </TouchableOpacity>
                </View>

                {/* Rodapé com link para cadastro */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Não tem uma conta? </Text>
                    <TouchableOpacity onPress={navegarParaCadastro} disabled={isLoading}>
                        <Text style={styles.signUpLinkText}>Cadastre-se</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#10141E',
    },
    container: {
        flex: 1,
    },
    topImageBackground: {
        height: screenHeight * 0.5,
        width: '100%',
        backgroundColor: '#181D2A',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    backButton: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 55,
        paddingLeft: 15,
        zIndex: 10,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: 30,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 30,
        textAlign: 'left',
    },
    input: {
        backgroundColor: '#1B202D',
        color: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#3A3F4B',
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1B202D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3A3F4B',
        marginBottom: 15,
    },
    inputPassword: {
        flex: 1,
        color: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
    },
    eyeIconContainer: {
        padding: 12,
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotPasswordText: {
        color: '#A0A3A8',
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: '#FF7A59',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 25,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    inputDisabled: {
        backgroundColor: '#282c34',
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 30,
    },
    footerText: {
        color: '#A0A3A8',
        fontSize: 15,
    },
    signUpLinkText: {
        color: '#FF7A59',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default LoginScreen;