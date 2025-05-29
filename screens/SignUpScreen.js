// Importações de módulos e componentes necessários
import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput, // Campo de entrada de texto
    TouchableOpacity, // Para botões clicáveis
    ImageBackground, // Para imagem de fundo
    SafeAreaView, // Garante que o conteúdo não sobreponha barras de status, etc.
    Dimensions, // Para obter dimensões da tela
    Platform, // Para verificações de OS (Android/iOS)
    Alert // Para exibir alertas nativos
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Biblioteca de ícones

// Obtém as dimensões da tela (largura e altura)
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// URL base da API do backend
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

// Componente da tela de Cadastro (Sign Up)
const SignUpScreen = ({ navigation }) => {
    // Estados para os campos do formulário e controle de UI
    const [email, setEmail] = useState(''); // Email do usuário
    const [password, setPassword] = useState(''); // Senha do usuário
    const [confirmPassword, setConfirmPassword] = useState(''); // Confirmação de senha
    const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Visibilidade da senha
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false); // Visibilidade da confirmação de senha
    const [isLoading, setIsLoading] = useState(false); // Estado de carregamento (ao submeter)

    // Função para manipular o processo de cadastro
    const manipularCadastro = async () => {
        // Validação: senhas coincidem?
        if (password !== confirmPassword) {
            Alert.alert('Atenção', 'As senhas não coincidem!');
            return;
        }
        // Validação: email e senha preenchidos?
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campos Obrigatórios', 'Por favor, preencha o seu email e senha.');
            return;
        }
        // Validação: senha tem pelo menos 6 caracteres?
        if (password.length < 6) {
            Alert.alert('Senha Fraca', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true); // Inicia o indicador de carregamento

        try {
            // Requisição POST para a API de registro
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Indica que o corpo é JSON
                },
                body: JSON.stringify({ email, password }), // Envia email e senha no corpo da requisição
            });

            const responseText = await response.text(); // Lê a resposta como texto primeiro
            let data;
            try {
                data = JSON.parse(responseText); // Tenta converter o texto para JSON
            } catch (jsonError) {
                console.error("Erro ao fazer parse do JSON da resposta:", jsonError);
                Alert.alert('Erro de Resposta', 'O servidor retornou uma resposta inesperada.');
                setIsLoading(false);
                return;
            }

            if (response.ok) { // Se o registro foi bem-sucedido (status 2xx)
                Alert.alert('Registo Realizado!', data.message || 'A sua conta foi criada com sucesso. Por favor, faça o login.');
                // Navega para a tela de Login após o sucesso
                if (navigation && typeof navigation.navigate === 'function') {
                    navigation.navigate('Login');
                }
            } else { // Se houve erro no registro (status 4xx, 5xx)
                Alert.alert('Falha no Registo', data.message || 'Não foi possível criar a sua conta. Tente novamente.');
            }
        } catch (error) { // Se houve erro na requisição (ex: rede, servidor offline)
            console.error('Erro ao registar (rede ou servidor):', error);
            // Trata erros específicos de rede
            if (error.message === 'Network request failed' || error.message.includes('Failed to fetch')) {
                Alert.alert('Erro de Conexão', 'Não foi possível ligar ao servidor. Verifique sua conexão e se o servidor está online no Render.');
            } else {
                Alert.alert('Erro de Conexão', `Ocorreu um erro inesperado: ${error.message}`);
            }
        } finally {
            setIsLoading(false); // Finaliza o indicador de carregamento
        }
    };

    // Função para navegar para a tela de Login
    const navegarParaLogin = () => {
        if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('Login');
        }
    };

    return (
        // Container SafeArea para a tela
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Imagem de fundo no topo da tela */}
                <ImageBackground
                    source={require('../assets/Cadastro.png')} // Imagem local
                    style={styles.topImageBackground}
                    resizeMode="cover" // Modo de redimensionamento da imagem
                >
                    {/* Botão de voltar */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation && navigation.goBack()} // Volta para a tela anterior
                        disabled={isLoading} // Desabilita se estiver carregando
                    >
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </ImageBackground>

                {/* Container do formulário de cadastro */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Cadastro</Text>

                    {/* Campo de entrada para o Email */}
                    <TextInput
                        style={[styles.input, isLoading && styles.inputDisabled]} // Estilo condicional se estiver carregando
                        placeholder="Email"
                        placeholderTextColor="#7A7A7A"
                        keyboardType="email-address" // Tipo de teclado otimizado para email
                        value={email}
                        onChangeText={setEmail} // Atualiza o estado do email
                        autoCapitalize="none" // Desabilita capitalização automática
                        selectionColor="#4A90E2" // Cor do cursor e seleção
                        editable={!isLoading} // Não editável se estiver carregando
                    />

                    {/* Container do campo de Senha (com ícone de visibilidade) */}
                    <View style={[styles.passwordInputContainer, isLoading && styles.inputDisabled]}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder="Senha"
                            placeholderTextColor="#7A7A7A"
                            secureTextEntry={!isPasswordVisible} // Oculta o texto se isPasswordVisible for false
                            value={password}
                            onChangeText={setPassword} // Atualiza o estado da senha
                            autoCapitalize="none"
                            selectionColor="#4A90E2"
                            editable={!isLoading}
                        />
                        {/* Botão para alternar a visibilidade da senha */}
                        <TouchableOpacity
                            style={styles.eyeIconContainer}
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)} // Alterna o estado de visibilidade
                            disabled={isLoading}
                        >
                            <MaterialCommunityIcons
                                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} // Ícone muda conforme a visibilidade
                                size={24}
                                color="#7A7A7A"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Container do campo de Confirmar Senha */}
                    <View style={[styles.passwordInputContainer, isLoading && styles.inputDisabled]}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder="Confirmar Senha"
                            placeholderTextColor="#7A7A7A"
                            secureTextEntry={!isConfirmPasswordVisible} // Oculta o texto
                            value={confirmPassword}
                            onChangeText={setConfirmPassword} // Atualiza o estado da confirmação de senha
                            autoCapitalize="none"
                            selectionColor="#4A90E2"
                            editable={!isLoading}
                        />
                        {/* Botão para alternar a visibilidade da confirmação de senha */}
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

                    {/* Botão de Registrar */}
                    <TouchableOpacity
                        style={[styles.signUpButton, isLoading && styles.buttonDisabled]} // Estilo condicional
                        onPress={manipularCadastro} // Chama a função de cadastro
                        disabled={isLoading} // Desabilitado se estiver carregando
                    >
                        {/* Texto do botão (muda se estiver carregando) */}
                        <Text style={styles.signUpButtonText}>{isLoading ? "A registar..." : "Registar"}</Text>
                    </TouchableOpacity>
                </View>

                {/* Container do rodapé com link para Login */}
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

// Estilos do componente
const styles = StyleSheet.create({
    safeArea: { // Área segura da tela
        flex: 1,
        backgroundColor: '#10141E', // Cor de fundo
    },
    container: { // Container principal da tela
        flex: 1,
    },
    topImageBackground: { // Imagem de fundo no topo
        height: screenHeight * 0.32, // Altura relativa à tela
        width: '100%',
        backgroundColor: '#181D2A', // Cor de fallback caso a imagem não carregue
        justifyContent: 'flex-start', // Alinha o conteúdo (botão de voltar) no início
        alignItems: 'flex-start',
    },
    backButton: { // Botão de voltar
        paddingTop: Platform.OS === 'android' ? 30 : 50, // Padding superior ajustado por plataforma
        paddingLeft: 15,
        zIndex: 10, // Para ficar sobre outros elementos, se houver
    },
    formContainer: { // Container do formulário
        flex: 1, // Ocupa o espaço restante
        paddingHorizontal: 25,
        paddingTop: 30,
    },
    title: { // Título "Cadastro"
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 25,
        textAlign: 'left',
    },
    input: { // Estilo base para campos de entrada
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
    passwordInputContainer: { // Container para campos de senha (com ícone)
        flexDirection: 'row', // Alinha input e ícone na horizontal
        alignItems: 'center',
        backgroundColor: '#1B202D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3A3F4B',
        marginBottom: 20,
    },
    inputPassword: { // Estilo específico para o TextInput dentro do container de senha
        flex: 1, // Ocupa o espaço restante
        color: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
    },
    eyeIconContainer: { // Container do ícone de olho (visibilidade da senha)
        padding: 12, // Área de toque
    },
    signUpButton: { // Botão de Registrar
        backgroundColor: '#4A90E2', // Cor de fundo
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 25,
    },
    buttonDisabled: { // Estilo para botões desabilitados
        opacity: 0.6,
    },
    inputDisabled: { // Estilo para inputs desabilitados
        backgroundColor: '#282c34', // Cor de fundo mais escura
        opacity: 0.7, // Levemente transparente
    },
    signUpButtonText: { // Texto do botão de Registrar
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    footerContainer: { // Container do rodapé (link para Login)
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 30,
    },
    footerText: { // Texto "Já tem uma conta?"
        color: '#A0A3A8',
        fontSize: 15,
    },
    loginLinkText: { // Texto do link "Entrar"
        color: '#4A90E2', // Cor do link
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default SignUpScreen; // Exporta o componente