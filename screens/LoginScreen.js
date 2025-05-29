// Importa React e hooks (useState, useContext)
import React, { useState, useContext } from 'react';
// Importa componentes e APIs do React Native
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
// Importa ícones da biblioteca MaterialCommunityIcons
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Importa o AuthContext para acessar a função signIn
import { AuthContext } from '../AuthContext';

// Obtém as dimensões da tela
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// URL base da API backend
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

// Componente da tela de Login
const LoginScreen = ({ navigation }) => {
    // Estados para os campos de email, senha, visibilidade da senha e carregamento
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Obtém a função signIn do AuthContext
    const { signIn } = useContext(AuthContext);

    // Função para manipular o processo de login
    const manipularLogin = async () => {
        // Validação: verifica se email e senha foram preenchidos
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campos Obrigatórios', 'Por favor, preencha seu email e senha.');
            return;
        }
        setIsLoading(true); // Ativa o indicador de carregamento

        try {
            // Realiza a requisição POST para a API de login
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }), // Envia email e senha no corpo da requisição
            });

            const responseText = await response.text(); // Obtém o texto da resposta
            let data;
            try {
                data = JSON.parse(responseText); // Tenta converter a resposta para JSON
            } catch (jsonError) {
                // Se houver erro na conversão, loga e mostra alerta
                console.error("Erro ao fazer parse do JSON da resposta:", jsonError, "\nResposta recebida:", responseText);
                Alert.alert('Erro de Resposta', 'O servidor retornou uma resposta inesperada. Verifique os logs do console.');
                setIsLoading(false);
                return;
            }

            // Se a resposta for OK e houver um token, chama a função signIn do AuthContext
            if (response.ok && data.token) {
                await signIn(data.token);
                // A navegação para a tela principal é gerenciada pelo AppNavigator ao detectar a mudança no userToken
            } else {
                // Caso contrário, mostra alerta de falha no login
                Alert.alert('Falha no Login', data.message || 'Email ou senha inválidos. Verifique seus dados.');
            }
        } catch (error) {
            // Trata erros de rede ou servidor
            console.error('Erro ao fazer login (rede ou servidor):', error);
            if (error.message === 'Network request failed' || error.message.includes('Failed to fetch')) {
                Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão e se o servidor está online no Render.');
            } else {
                Alert.alert('Erro de Conexão', `Ocorreu um erro inesperado: ${error.message}`);
            }
        } finally {
            setIsLoading(false); // Desativa o indicador de carregamento
        }
    };

    // Função para navegar para a tela de Cadastro
    const navegarParaCadastro = () => {
        if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('SignUp');
        }
    };

    // Função para lidar com "Esqueci a senha" (placeholder)
    const manipularEsqueciSenha = () => {
        // Ação para "Esqueci a senha" (ainda não implementado)
        Alert.alert("Esqueci Senha", "Funcionalidade ainda não implementada.");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#10141E" />
            <View style={styles.container}>
                {/* Imagem de fundo para a parte superior da tela */}
                <ImageBackground
                    source={require('../assets/Login.png')} // Imagem local
                    style={styles.topImageBackground}
                    resizeMode="cover"
                >
                    {/* Botão de voltar */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation && navigation.goBack()} // Volta para a tela anterior
                        disabled={isLoading} // Desabilita durante o carregamento
                    >
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </ImageBackground>

                {/* Container do formulário de login */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Login</Text>
                    {/* Campo de input para o email */}
                    <TextInput
                        style={[styles.input, isLoading && styles.inputDisabled]} // Estilo condicional
                        placeholder="Email"
                        placeholderTextColor="#7A7A7A"
                        keyboardType="email-address" // Define o tipo de teclado
                        value={email}
                        onChangeText={setEmail} // Atualiza o estado email
                        autoCapitalize="none" // Desabilita capitalização automática
                        selectionColor="#FF7A59" // Cor do cursor e seleção
                        editable={!isLoading} // Desabilita edição durante o carregamento
                    />
                    {/* Container para o campo de senha com ícone de visibilidade */}
                    <View style={[styles.passwordInputContainer, isLoading && styles.inputDisabled]}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder="Senha"
                            placeholderTextColor="#7A7A7A"
                            secureTextEntry={!isPasswordVisible} // Oculta/mostra a senha
                            value={password}
                            onChangeText={setPassword} // Atualiza o estado password
                            autoCapitalize="none"
                            selectionColor="#FF7A59"
                            editable={!isLoading}
                        />
                        {/* Botão para alternar a visibilidade da senha */}
                        <TouchableOpacity
                            style={styles.eyeIconContainer}
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            disabled={isLoading}
                        >
                            <MaterialCommunityIcons
                                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} // Ícone muda conforme a visibilidade
                                size={24}
                                color="#7A7A7A"
                            />
                        </TouchableOpacity>
                    </View>
                    {/* Botão "Esqueci a senha?" */}
                    <TouchableOpacity style={styles.forgotPasswordButton} onPress={manipularEsqueciSenha} disabled={isLoading}>
                        <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
                    </TouchableOpacity>
                    {/* Botão de Login */}
                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.buttonDisabled]} // Estilo condicional
                        onPress={manipularLogin}
                        disabled={isLoading}
                    >
                        <Text style={styles.loginButtonText}>{isLoading ? "Entrando..." : "Entrar"}</Text>
                    </TouchableOpacity>
                </View>
                {/* Container do rodapé com link para cadastro */}
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

// Define os estilos para os componentes
const styles = StyleSheet.create({
    safeArea: { // Estilo para o container principal que respeita as áreas seguras
        flex: 1,
        backgroundColor: '#10141E',
    },
    container: { // Container geral da tela
        flex: 1,
    },
    topImageBackground: { // Estilo para a imagem de fundo no topo
        height: screenHeight * 0.5, // Metade da altura da tela
        width: '100%', // Largura total
        backgroundColor: '#181D2A', // Cor de fundo de fallback
        justifyContent: 'flex-start', // Alinha o conteúdo (botão de voltar) ao topo
        alignItems: 'flex-start', // Alinha o conteúdo (botão de voltar) à esquerda
    },
    backButton: { // Estilo do botão de voltar
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 55, // Padding para barra de status
        paddingLeft: 15,
        zIndex: 10, // Garante que fique sobre outros elementos se necessário
    },
    formContainer: { // Container para os elementos do formulário
        flex: 1, // Ocupa o espaço restante
        paddingHorizontal: 25, // Espaçamento horizontal interno
        paddingTop: 30, // Espaçamento superior interno
    },
    title: { // Estilo do título "Login"
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 30,
        textAlign: 'left',
    },
    input: { // Estilo base para os campos de TextInput
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
    passwordInputContainer: { // Container para o campo de senha e ícone de visibilidade
        flexDirection: 'row', // Alinha TextInput e TouchableOpacity horizontalmente
        alignItems: 'center', // Alinha verticalmente ao centro
        backgroundColor: '#1B202D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3A3F4B',
        marginBottom: 15,
    },
    inputPassword: { // Estilo específico para o TextInput da senha (para ocupar espaço flexível)
        flex: 1, // Ocupa o espaço restante na linha
        color: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
    },
    eyeIconContainer: { // Container do ícone de olho para visibilidade da senha
        padding: 12, // Área de toque
    },
    forgotPasswordButton: { // Botão "Esqueci a senha?"
        alignSelf: 'flex-end', // Alinha à direita
        marginBottom: 30,
    },
    forgotPasswordText: { // Texto do botão "Esqueci a senha?"
        color: '#A0A3A8',
        fontSize: 14,
    },
    loginButton: { // Estilo do botão principal de Login
        backgroundColor: '#FF7A59', // Cor de fundo
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center', // Centraliza o texto
        marginBottom: 25,
    },
    buttonDisabled: { // Estilo para botões desabilitados
        opacity: 0.6, // Reduz a opacidade
    },
    inputDisabled: { // Estilo para inputs desabilitados
        backgroundColor: '#282c34', // Cor de fundo mais escura
        opacity: 0.7, // Reduz a opacidade
    },
    loginButtonText: { // Texto do botão de Login
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    footerContainer: { // Container do rodapé (link para cadastro)
        flexDirection: 'row', // Alinha os textos horizontalmente
        justifyContent: 'center', // Centraliza horizontalmente
        alignItems: 'center', // Centraliza verticalmente
        paddingBottom: 30, // Espaçamento inferior
    },
    footerText: { // Texto "Não tem uma conta?"
        color: '#A0A3A8',
        fontSize: 15,
    },
    signUpLinkText: { // Texto "Cadastre-se" (link)
        color: '#FF7A59', // Cor de destaque
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default LoginScreen;