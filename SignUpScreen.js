import React, { useState } from 'react'; // Importa React e o Hook useState para gerenciar estados.
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
} from 'react-native'; // Importa componentes do React Native.

import { MaterialCommunityIcons } from '@expo/vector-icons'; // Ícones usados nos botões (olho, seta etc).

// Pega a largura e altura da tela
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// URL base da API
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

const SignUpScreen = ({ navigation }) => {
    // Estados para armazenar os dados do formulário
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Estados para controlar a visualização das senhas
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    // Estado para controlar carregamento
    const [isLoading, setIsLoading] = useState(false);

    // Função que executa o cadastro
    const manipularCadastro = async () => {
        // Validação: se senhas são diferentes
        if (password !== confirmPassword) {
            Alert.alert('Atenção', 'As senhas não coincidem!');
            return;
        }

        // Validação: campos obrigatórios
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campos Obrigatórios', 'Por favor, preencha o seu email e senha.');
            return;
        }

        // Validação: tamanho mínimo da senha
        if (password.length < 6) {
            Alert.alert('Senha Fraca', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true); // Mostra que está carregando

        try {
            // Envia requisição de cadastro
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const responseText = await response.text();

            let data;
            try {
                // Tenta converter a resposta em JSON
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error("Erro ao fazer parse do JSON da resposta:", jsonError);
                Alert.alert('Erro de Resposta', 'O servidor retornou uma resposta inesperada.');
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                // Sucesso: exibe mensagem e navega para tela de Login
                Alert.alert('Registo Realizado!', data.message || 'A sua conta foi criada com sucesso. Por favor, faça o login.');
                if (navigation && typeof navigation.navigate === 'function') {
                    navigation.navigate('Login');
                }
            } else {
                // Erro: mostra mensagem
                Alert.alert('Falha no Registo', data.message || 'Não foi possível criar a sua conta. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao registar (rede ou servidor):', error);
            if (error.message === 'Network request failed' || error.message.includes('Failed to fetch')) {
                Alert.alert('Erro de Conexão', 'Não foi possível ligar ao servidor. Verifique sua conexão e se o servidor está online no Render.');
            } else {
                Alert.alert('Erro de Conexão', `Ocorreu um erro inesperado: ${error.message}`);
            }
        } finally {
            setIsLoading(false); // Finaliza carregamento
        }
    };

    // Função que navega para a tela de Login
    const navegarParaLogin = () => {
        if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('Login');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#10141E" />
            <View style={styles.container}>
                {/* Imagem de fundo no topo */}
                <ImageBackground
                    source={require('../assets/Cadastro.png')}
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

                {/* Formulário de Cadastro */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Cadastro</Text>

                    {/* Campo Email */}
                    <TextInput
                        style={[styles.input, isLoading && styles.inputDisabled]}
                        placeholder="Email"
                        placeholderTextColor="#7A7A7A"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        selectionColor="#4A90E2"
                        editable={!isLoading}
                    />

                    {/* Campo Senha com botão de visualizar */}
                    <View style={[styles.passwordInputContainer, isLoading && styles.inputDisabled]}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder="Senha"
                            placeholderTextColor="#7A7A7A"
                            secureTextEntry={!isPasswordVisible}
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            selectionColor="#4A90E2"
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

                    {/* Campo Confirmar Senha */}
                    <View style={[styles.passwordInputContainer, isLoading && styles.inputDisabled]}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder="Confirmar Senha"
                            placeholderTextColor="#7A7A7A"
                            secureTextEntry={!isConfirmPasswordVisible}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            autoCapitalize="none"
                            selectionColor="#4A90E2"
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            style={styles.eyeIconContainer}
                            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                            disabled={isLoading}
                        >
                            <MaterialCommunityIcons
                                name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                size={24}
                                color="#7A7A7A"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Botão de Cadastro */}
                    <TouchableOpacity
                        style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
                        onPress={manipularCadastro}
                        disabled={isLoading}
                    >
                        <Text style={styles.signUpButtonText}>
                            {isLoading ? "A registar..." : "Registar"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Rodapé com link para Login */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Já tem uma conta? </Text>
                    <TouchableOpacity onPress={navegarParaLogin} disabled={isLoading}>
                        <Text style={styles.loginLinkText}>Entrar</Text>
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
        height: screenHeight * 0.32,
        width: '100%',
        backgroundColor: '#181D2A',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    backButton: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
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
        marginBottom: 25,
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
        marginBottom: 20,
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
    signUpButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 25,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    inputDisabled: {
        backgroundColor: '#282c34',
        opacity: 0.7,
    },
    signUpButtonText: {
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
    loginLinkText: {
        color: '#4A90E2',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default SignUpScreen;