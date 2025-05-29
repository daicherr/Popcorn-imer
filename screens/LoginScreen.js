import React, { useState, useContext } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { signIn } = useContext(AuthContext);

    const manipularLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campos Obrigatórios', 'Por favor, preencha seu email e senha.');
            return;
        }
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error("Erro ao fazer parse do JSON da resposta:", jsonError, "\nResposta recebida:", responseText);
                Alert.alert('Erro de Resposta', 'O servidor retornou uma resposta inesperada. Verifique os logs do console.');
                setIsLoading(false);
                return;
            }

            if (response.ok && data.token) {
                await signIn(data.token);
            } else {
                Alert.alert('Falha no Login', data.message || 'Email ou senha inválidos. Verifique seus dados.');
            }
        } catch (error) {
            console.error('Erro ao fazer login (rede ou servidor):', error);
            if (error.message === 'Network request failed' || error.message.includes('Failed to fetch')) {
                Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão e se o servidor está online no Render.');
            } else {
                Alert.alert('Erro de Conexão', `Ocorreu um erro inesperado: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const navegarParaCadastro = () => {
        if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('SignUp');
        }
    };

    const manipularEsqueciSenha = () => {
        // Ação para "Esqueci a senha"
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#10141E" />
            <View style={styles.container}>
                <ImageBackground
                    source={require('../assets/Login.png')}
                    style={styles.topImageBackground}
                    resizeMode="cover"
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation && navigation.goBack()}
                        disabled={isLoading}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </ImageBackground>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>Login</Text>
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
                    <TouchableOpacity style={styles.forgotPasswordButton} onPress={manipularEsqueciSenha} disabled={isLoading}>
                        <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                        onPress={manipularLogin}
                        disabled={isLoading}
                    >
                        <Text style={styles.loginButtonText}>{isLoading ? "Entrando..." : "Entrar"}</Text>
                    </TouchableOpacity>
                </View>
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