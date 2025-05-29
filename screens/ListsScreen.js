// Importa React e hooks (useState, useEffect, useContext, useCallback)
import React, { useState, useEffect, useContext, useCallback } from 'react';
// Importa componentes e APIs do React Native
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Platform,
    Alert
} from 'react-native';
// Importa ícones da biblioteca MaterialCommunityIcons
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Importa o AuthContext para acessar o token do usuário
import { AuthContext } from '../AuthContext';
// Importa o hook useFocusEffect para executar código quando a tela ganha foco
import { useFocusEffect } from '@react-navigation/native';

// URL base da API backend
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

// Componente da tela de Listas do Usuário
const ListsScreen = ({ navigation }) => {
    // Obtém o token do usuário do AuthContext
    const { userToken } = useContext(AuthContext);
    // Estados para armazenar as listas, estado de carregamento e erros
    const [lists, setLists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Função para buscar as listas do usuário da API (usando useCallback para memorização)
    const buscarListasDoUsuario = useCallback(async () => {
        // Se não houver token, limpa as listas e para o carregamento
        if (!userToken) {
            setLists([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true); // Ativa o indicador de carregamento
        setError(null); // Limpa erros anteriores
        try {
            // Realiza a requisição GET para buscar as listas
            const response = await fetch(`${API_BASE_URL}/api/lists`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userToken}`, // Token de autorização
                    'Content-Type': 'application/json'
                }
            });
            const responseText = await response.text(); // Obtém o texto da resposta
            // Se a resposta não for OK, lança um erro
            if (!response.ok) {
                let errorMessage = `Erro HTTP ${response.status}`;
                try { const errorJson = JSON.parse(responseText); errorMessage = errorJson.message || errorMessage; } catch (e) {}
                throw new Error(errorMessage);
            }
            const data = JSON.parse(responseText); // Converte a resposta para JSON
            setLists(data); // Define as listas no estado
        } catch (err) {
            setError(err.message || 'Falha ao carregar suas listas.'); // Define a mensagem de erro
            setLists([]); // Limpa as listas em caso de erro
        } finally {
            setIsLoading(false); // Desativa o indicador de carregamento
        }
    }, [userToken]); // Dependência do useCallback: userToken

    // useFocusEffect para buscar os dados sempre que a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
            const fetchDataOnFocus = async () => {
                await buscarListasDoUsuario();
            };
            fetchDataOnFocus();
        }, [buscarListasDoUsuario]) // Dependência: a função buscarListasDoUsuario memorizada
    );

    // Componente para renderizar cada item da lista de listas
    const ListItem = ({ item }) => (
        // Container tocável para o item da lista, navega para ListDetails ao pressionar
        <TouchableOpacity 
            style={styles.listItemContainer} 
            onPress={() => navigation.navigate('ListDetails', { listId: item._id, listName: item.name })}
        >
            {/* Container para os textos da lista (nome e descrição) */}
            <View style={styles.listItemTextContainer}>
                <Text style={styles.listItemName}>{item.name}</Text>
                {item.description && <Text style={styles.listItemDescription} numberOfLines={1}>{item.description}</Text>}
            </View>
            {/* Container para metadados da lista (contagem de filmes e ícone de seta) */}
            <View style={styles.listItemMetaContainer}>
                <Text style={styles.listItemMovieCount}>{item.movies?.length || 0} filmes</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#7A7A7A" />
            </View>
        </TouchableOpacity>
    );

    // Se estiver carregando e não houver listas, mostra um indicador de carregamento centralizado
    if (isLoading && lists.length === 0) {
        return (
            <SafeAreaView style={styles.safeAreaLoading}>
                <StatusBar barStyle="light-content" backgroundColor={styles.safeAreaLoading.backgroundColor} />
                <View style={styles.centeredMessageContainer}>
                    <ActivityIndicator size="large" color="#FF7A59" />
                </View>
            </SafeAreaView>
        );
    }
    
    // Renderização principal da tela
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Configura a barra de status */}
            <StatusBar barStyle="light-content" backgroundColor={styles.header.backgroundColor} />
            {/* Cabeçalho personalizado */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Minhas Listas</Text>
                {/* Botão para adicionar nova lista */}
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate('CreateList')} // Navega para a tela de criação de lista
                >
                    <MaterialCommunityIcons name="plus-circle-outline" size={28} color="#FF7A59" />
                </TouchableOpacity>
            </View>

            {/* Se houver erro, mostra a mensagem de erro e um botão para tentar novamente */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={buscarListasDoUsuario} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Se não estiver carregando, não houver erro e a lista de listas estiver vazia */}
            {!isLoading && !error && lists.length === 0 && (
                 <View style={styles.centeredMessageContainer}>
                    <MaterialCommunityIcons name="format-list-bulleted-type" size={60} color="#3A3F4B" />
                    <Text style={styles.emptyListText}>Você ainda não criou nenhuma lista.</Text>
                    <Text style={styles.emptyListSubText}>Toque no '+' para começar!</Text>
                </View>
            )}

            {/* FlatList para renderizar as listas do usuário */}
            <FlatList
                data={lists} // Dados das listas
                renderItem={ListItem} // Renderiza cada item usando o componente ListItem
                keyExtractor={item => item._id.toString()} // Chave única para cada item
                contentContainerStyle={styles.listContentContainer} // Estilo do container da lista
                onRefresh={buscarListasDoUsuario} // Função para atualizar a lista (pull-to-refresh)
                refreshing={isLoading} // Indica se está atualizando
            />
        </SafeAreaView>
    );
};

// Define os estilos para os componentes
const styles = StyleSheet.create({
    safeArea: { // Estilo para o container principal que respeita as áreas seguras
        flex: 1,
        backgroundColor: '#10141E',
    },
    safeAreaLoading: { // Estilo para o container principal durante o carregamento inicial
        flex: 1,
        backgroundColor: '#10141E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: { // Estilo do cabeçalho da tela
        flexDirection: 'row',
        justifyContent: 'space-between', // Título à esquerda, botão à direita
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, // Padding para barra de status
        paddingBottom: 15,
        backgroundColor: '#181D2A',
        borderBottomWidth: 1,
        borderBottomColor: '#22283C',
    },
    headerTitle: { // Estilo do título no cabeçalho
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    addButton: { // Estilo do botão de adicionar no cabeçalho
        padding: 5, // Área de toque
    },
    centeredMessageContainer: { // Estilo para containers de mensagens centralizadas (vazio, carregamento)
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyListText: { // Estilo para o texto quando a lista de listas está vazia
        marginTop: 15,
        fontSize: 18,
        color: '#A0A3A8',
        textAlign: 'center',
    },
    emptyListSubText: { // Estilo para o subtexto quando a lista de listas está vazia
        fontSize: 14,
        color: '#7A7A7A',
        textAlign: 'center',
        marginTop: 5,
    },
    listContentContainer: { // Estilo para o container de conteúdo da FlatList
        paddingVertical: 10, // Espaçamento vertical
    },
    listItemContainer: { // Estilo para o container de cada item da lista de listas
        flexDirection: 'row', // Alinha o conteúdo do item horizontalmente
        justifyContent: 'space-between', // Nome/descrição à esquerda, contagem/seta à direita
        alignItems: 'center', // Alinha verticalmente ao centro
        backgroundColor: '#1B202D', // Cor de fundo do item
        paddingHorizontal: 20, // Espaçamento interno horizontal
        paddingVertical: 15, // Espaçamento interno vertical
        borderBottomWidth: 1, // Borda inferior sutil (se não houver borderRadius ou margin)
        borderBottomColor: '#22283C',
        marginHorizontal: 10, // Margem horizontal para o cartão
        borderRadius: 8, // Bordas arredondadas para o cartão
        marginBottom: 10, // Margem inferior para separar os cartões
    },
    listItemTextContainer: { // Container para o nome e descrição da lista
        flex: 1, // Ocupa o espaço disponível à esquerda
    },
    listItemName: { // Estilo para o nome da lista
        fontSize: 17,
        fontWeight: 'bold',
        color: '#E0E0E0',
    },
    listItemDescription: { // Estilo para a descrição da lista
        fontSize: 13,
        color: '#A0A3A8',
        marginTop: 3,
    },
    listItemMetaContainer: { // Container para a contagem de filmes e a seta
        flexDirection: 'row', // Alinha horizontalmente
        alignItems: 'center', // Alinha verticalmente ao centro
    },
    listItemMovieCount: { // Estilo para a contagem de filmes
        fontSize: 13,
        color: '#7A7A7A',
        marginRight: 5, // Espaço antes da seta
    },
    errorContainer: { // Container para exibir mensagens de erro
        alignItems: 'center',
        padding: 20,
    },
    errorText: { // Estilo para o texto de erro
        color: '#FF7A59',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: { // Estilo para o botão de "Tentar Novamente"
        backgroundColor: '#FF7A59',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    retryButtonText: { // Estilo para o texto do botão de "Tentar Novamente"
        color: '#FFFFFF',
        fontWeight: 'bold',
    }
});

export default ListsScreen;