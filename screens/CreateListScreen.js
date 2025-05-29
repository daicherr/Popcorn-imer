// Importa React e hooks (useState, useEffect, useContext)
import React, { useState, useEffect, useContext } from 'react';
// Importa componentes do React Native para UI e funcionalidades
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Switch,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    ScrollView
} from 'react-native';
// Importa ícones da biblioteca MaterialCommunityIcons
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Importa o AuthContext para acessar o token do usuário
import { AuthContext } from '../AuthContext';

// URL base da API backend
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

// Componente da tela de criação/edição de lista
const CreateListScreen = ({ route, navigation }) => {
    // Obtém o token do usuário do AuthContext
    const { userToken } = useContext(AuthContext);
    
    // Verifica se está no modo de edição (se uma lista para editar foi passada via params)
    const listToEdit = route.params?.listToEdit;
    const isEditMode = !!listToEdit; // true se listToEdit existir, false caso contrário

    // Estados para os campos do formulário
    const [listName, setListName] = useState(isEditMode ? listToEdit.name : ''); // Nome da lista
    const [description, setDescription] = useState(isEditMode ? listToEdit.description || '' : ''); // Descrição da lista
    const [isPublic, setIsPublic] = useState(isEditMode ? listToEdit.isPublic : false); // Visibilidade da lista
    const [isLoading, setIsLoading] = useState(false); // Estado de carregamento para o botão de submissão

    // useEffect para configurar o título da tela na barra de navegação
    useEffect(() => {
        navigation.setOptions({
            title: isEditMode ? 'Editar Lista' : 'Criar Nova Lista', // Título dinâmico
        });
    }, [isEditMode, navigation]); // Dependências: executa quando isEditMode ou navigation mudam

    // Função para submeter a lista (criar ou atualizar)
    const submeterLista = async () => {
        // Validação: nome da lista é obrigatório
        if (!listName.trim()) {
            Alert.alert("Nome Obrigatório", "Por favor, insira um nome para a sua lista.");
            return;
        }
        // Validação: token do usuário é obrigatório
        if (!userToken) {
            Alert.alert("Erro", "Você precisa estar logado para esta ação.");
            return;
        }

        setIsLoading(true); // Ativa o indicador de carregamento
        
        // Dados da lista a serem enviados
        const listData = {
            name: listName.trim(),
            description: description.trim(),
            isPublic
        };

        // Define o endpoint e método HTTP baseado no modo (criação ou edição)
        const endpoint = isEditMode ? `${API_BASE_URL}/api/lists/${listToEdit._id}` : `${API_BASE_URL}/api/lists`;
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            // Realiza a requisição para a API
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}` // Token de autorização
                },
                body: JSON.stringify(listData) // Corpo da requisição com os dados da lista
            });

            const responseData = await response.json(); // Converte a resposta para JSON

            // Verifica se a requisição foi bem-sucedida
            if (response.ok) {
                Alert.alert("Sucesso", isEditMode ? `Lista "${responseData.name}" atualizada!` : `Lista "${responseData.name}" criada!`);
                navigation.goBack(); // Volta para a tela anterior
            } else {
                Alert.alert(isEditMode ? "Erro ao Atualizar" : "Erro ao Criar", responseData.message || "Não foi possível completar a operação.");
            }
        } catch (error) {
            Alert.alert("Erro de Rede", "Não foi possível conectar ao servidor. Tente novamente.");
        } finally {
            setIsLoading(false); // Desativa o indicador de carregamento
        }
    };

    return (
        // SafeAreaView para garantir que o conteúdo não fique sob áreas de sistema (notch, etc.)
        <View style={styles.safeArea}>
            {/* Configura a barra de status */}
            <StatusBar barStyle="light-content" backgroundColor={styles.header.backgroundColor} />
            {/* Cabeçalho personalizado da tela */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
                    <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditMode ? 'Editar Lista' : 'Criar Nova Lista'}</Text>
                <View style={{width: 26}} /> {/* Espaçador para centralizar o título */}
            </View>
            {/* ScrollView para permitir rolagem se o conteúdo exceder a altura da tela */}
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled" // Controla como os toques são tratados quando o teclado está visível
            >
                <Text style={styles.label}>Nome da Lista:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Filmes para Chorar"
                    placeholderTextColor="#7A7A7A"
                    value={listName}
                    onChangeText={setListName} // Atualiza o estado listName
                    maxLength={100} // Limite de caracteres
                    editable={!isLoading} // Desabilita edição durante o carregamento
                />

                <Text style={styles.label}>Descrição (Opcional):</Text>
                <TextInput
                    style={[styles.input, styles.textArea]} // Combina estilos
                    multiline // Permite múltiplas linhas
                    placeholder="Uma breve descrição sobre esta lista..."
                    placeholderTextColor="#7A7A7A"
                    value={description}
                    onChangeText={setDescription} // Atualiza o estado description
                    maxLength={500} // Limite de caracteres
                    editable={!isLoading} // Desabilita edição durante o carregamento
                />

                {/* Seção para definir a visibilidade da lista */}
                <View style={styles.switchRow}>
                    <Text style={styles.labelSwitch}>Tornar esta lista pública?</Text>
                    <Switch
                        trackColor={{ false: "#3A3F4B", true: "#FF7A59" }} // Cores do "trilho" do switch
                        thumbColor={isPublic ? "#FFFFFF" : "#f4f3f4"} // Cor do "polegar" do switch
                        ios_backgroundColor="#3e3e3e" // Cor de fundo para iOS
                        onValueChange={setIsPublic} // Atualiza o estado isPublic
                        value={isPublic}
                        disabled={isLoading} // Desabilita durante o carregamento
                    />
                </View>
                <Text style={styles.publicInfoText}>
                    Listas públicas poderão ser vistas por outros usuários no futuro.
                </Text>

                {/* Botão de submissão */}
                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} // Estilo condicional para desabilitado
                    onPress={submeterLista}
                    disabled={isLoading} // Desabilita durante o carregamento
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" /> // Mostra indicador de carregamento
                    ) : (
                        <Text style={styles.submitButtonText}>{isEditMode ? 'Salvar Alterações' : 'Criar Lista'}</Text> // Texto dinâmico
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

// Define os estilos para os componentes
const styles = StyleSheet.create({
    safeArea: { // Estilo para o container principal que respeita as áreas seguras do dispositivo
        flex: 1, // Ocupa todo o espaço disponível
        backgroundColor: '#10141E', // Cor de fundo escura
    },
    header: { // Estilo do cabeçalho da tela
        flexDirection: 'row', // Alinha os itens em linha (horizontalmente)
        alignItems: 'center', // Alinha os itens verticalmente ao centro
        justifyContent: 'space-between', // Distribui o espaço entre os itens (botão de voltar à esquerda, título ao centro, espaçador à direita)
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, // Padding superior para acomodar a barra de status (diferente para Android/iOS)
        paddingBottom: 15, // Padding inferior
        paddingHorizontal: 15, // Padding horizontal
        backgroundColor: '#181D2A', // Cor de fundo do cabeçalho
        borderBottomWidth: 1, // Largura da borda inferior
        borderBottomColor: '#22283C', // Cor da borda inferior
    },
    backButtonHeader: { // Estilo do botão de voltar no cabeçalho
        padding: 5, // Adiciona um espaçamento interno para facilitar o toque
    },
    headerTitle: { // Estilo do título no cabeçalho
        color: '#FFFFFF', // Cor do texto
        fontSize: 20, // Tamanho da fonte
        fontWeight: 'bold', // Peso da fonte
    },
    container: { // Estilo do container do ScrollView
        flex: 1, // Ocupa o espaço restante
    },
    scrollContentContainer: { // Estilo do conteúdo dentro do ScrollView
        padding: 20, // Espaçamento interno ao redor do conteúdo
    },
    label: { // Estilo para os rótulos dos campos de input
        fontSize: 16, // Tamanho da fonte
        color: '#E0E0E0', // Cor do texto
        marginBottom: 8, // Margem inferior
        marginTop: 15, // Margem superior
    },
    input: { // Estilo base para os campos de TextInput
        backgroundColor: '#1B202D', // Cor de fundo do input
        color: '#FFFFFF', // Cor do texto digitado
        borderRadius: 8, // Bordas arredondadas
        paddingHorizontal: 15, // Espaçamento interno horizontal
        paddingVertical: 12, // Espaçamento interno vertical
        fontSize: 15, // Tamanho da fonte do texto digitado
        borderWidth: 1, // Largura da borda
        borderColor: '#3A3F4B', // Cor da borda
        marginBottom: 20, // Margem inferior
    },
    textArea: { // Estilo adicional para o TextInput de descrição (multiline)
        minHeight: 100, // Altura mínima
        textAlignVertical: 'top', // Alinha o texto ao topo em Android
    },
    switchRow: { // Estilo para a linha que contém o rótulo e o Switch
        flexDirection: 'row', // Alinha os itens horizontalmente
        justifyContent: 'space-between', // Espaço entre o rótulo e o Switch
        alignItems: 'center', // Alinha verticalmente ao centro
        marginBottom: 8, // Margem inferior
        marginTop: 15, // Margem superior
    },
    labelSwitch: { // Estilo para o rótulo do Switch
        fontSize: 16, // Tamanho da fonte
        color: '#E0E0E0', // Cor do texto
        flexShrink: 1, // Permite que o texto encolha se necessário
        marginRight: 10, // Margem à direita para separar do Switch
    },
    publicInfoText: { // Estilo para o texto informativo sobre listas públicas
        fontSize: 12, // Tamanho da fonte
        color: '#7A7A7A', // Cor do texto
        marginBottom: 30, // Margem inferior
    },
    submitButton: { // Estilo do botão de submeter
        backgroundColor: '#FF7A59', // Cor de fundo do botão
        paddingVertical: 15, // Espaçamento interno vertical
        borderRadius: 25, // Bordas arredondadas
        alignItems: 'center', // Centraliza o texto do botão
        marginTop: 20, // Margem superior
    },
    submitButtonDisabled: { // Estilo do botão de submeter quando desabilitado
        opacity: 0.6, // Reduz a opacidade para indicar desabilitação
    },
    submitButtonText: { // Estilo do texto dentro do botão de submeter
        color: '#FFFFFF', // Cor do texto
        fontSize: 17, // Tamanho da fonte
        fontWeight: 'bold', // Peso da fonte
    },
});

export default CreateListScreen;