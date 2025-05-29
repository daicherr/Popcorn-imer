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
    Alert,
    Image,
    Platform,
    Dimensions
} from 'react-native';
// Importa ícones da biblioteca MaterialCommunityIcons
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Importa o AuthContext para acessar o token do usuário
import { AuthContext } from '../AuthContext';
// Importa o hook useFocusEffect para executar código quando a tela ganha foco
import { useFocusEffect } from '@react-navigation/native';

// URL base da API backend
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';
// Obtém a largura da tela
const { width: screenWidth } = Dimensions.get('window');

// Componente para renderizar cada item de filme na lista
const MovieItemCard = ({ item, onRemovePress, onCardPress }) => {
    // Constrói a URL da imagem do poster, se disponível
    const posterImageUrl = item.posterPath 
        ? `https://image.tmdb.org/t/p/w342${item.posterPath}`
        : null;

    return (
        // Container tocável para o item do filme, navega para os detalhes do filme ao pressionar
        <TouchableOpacity style={styles.movieItemContainer} onPress={() => onCardPress(item.tmdbId, item.title)}>
            {posterImageUrl ? (
                // Se a URL do poster existir, renderiza a imagem
                <Image source={{ uri: posterImageUrl }} style={styles.movieItemPoster} />
            ) : (
                // Caso contrário, renderiza um placeholder
                <View style={[styles.movieItemPoster, styles.movieItemPosterPlaceholder]}>
                    <MaterialCommunityIcons name="movie-open-outline" size={30} color="#7A7A7A" />
                </View>
            )}
            {/* Container para os detalhes textuais do filme */}
            <View style={styles.movieItemDetails}>
                <Text style={styles.movieItemTitle} numberOfLines={2}>{item.title}</Text>
            </View>
            {/* Botão para remover o filme da lista */}
            <TouchableOpacity onPress={() => onRemovePress(item.tmdbId)} style={styles.removeButton}>
                <MaterialCommunityIcons name="close-circle-outline" size={26} color="#FF7A59" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

// Componente principal da tela de Detalhes da Lista
const ListDetailsScreen = ({ route, navigation }) => {
    // Obtém parâmetros da rota (ID da lista e nome inicial da lista)
    const { listId, listName: initialListName } = route.params;
    // Obtém o token do usuário do AuthContext
    const { userToken } = useContext(AuthContext);

    // Estados da tela
    const [listDetails, setListDetails] = useState(null); // Detalhes da lista
    const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
    const [error, setError] = useState(null); // Estado de erro
    const [currentListName, setCurrentListName] = useState(initialListName); // Nome atual da lista (pode mudar se editado)

    // Função para buscar os detalhes da lista da API (usando useCallback para memorização)
    const buscarDetalhesDaLista = useCallback(async () => {
        // Verifica se o token ou ID da lista estão ausentes
        if (!userToken || !listId) {
            setError("Token ou ID da lista ausente.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true); // Ativa o carregamento
        setError(null); // Limpa erros anteriores
        try {
            // Realiza a requisição GET para buscar os detalhes da lista
            const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
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
            setListDetails(data); // Define os detalhes da lista no estado
            setCurrentListName(data.name); // Atualiza o nome da lista no estado
        } catch (err) {
            setError(err.message || 'Falha ao carregar detalhes da lista.'); // Define a mensagem de erro
            setListDetails(null); // Limpa os detalhes da lista em caso de erro
        } finally {
            setIsLoading(false); // Desativa o carregamento
        }
    }, [userToken, listId]); // Dependências do useCallback

    // useFocusEffect para buscar os dados sempre que a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
          const fetchDataOnFocus = async () => {
            await buscarDetalhesDaLista();
          };
          fetchDataOnFocus();
        }, [buscarDetalhesDaLista]) // Dependência: a função buscarDetalhesDaLista memorizada
      );

    // Função para remover um filme da lista
    const removerFilmeDaLista = async (tmdbIdToRemove) => {
        if (!userToken || !listId || !tmdbIdToRemove) return; // Verifica se os dados necessários estão presentes
        // Mostra um alerta de confirmação antes de remover
        Alert.alert(
            "Remover Filme",
            "Tem certeza que deseja remover este filme da lista?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover",
                    style: "destructive",
                    onPress: async () => { // Ação ao pressionar "Remover"
                        setIsLoading(true);
                        try {
                            // Realiza a requisição DELETE para remover o filme
                            const response = await fetch(`${API_BASE_URL}/api/lists/${listId}/movies/${tmdbIdToRemove}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${userToken}` }
                            });
                            const responseData = await response.json();
                            if (response.ok) {
                                Alert.alert("Sucesso", "Filme removido da lista.");
                                buscarDetalhesDaLista(); // Recarrega os detalhes da lista
                            } else {
                                Alert.alert("Erro", responseData.message || "Não foi possível remover o filme.");
                            }
                        } catch (e) {
                            Alert.alert("Erro de Rede", "Não foi possível conectar ao servidor.");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };
    
    // Função para navegar para a tela de detalhes do filme
    const navegarParaDetalhesFilme = (tmdbMovieId, movieTitleString) => {
        navigation.navigate('MovieDetails', { movieId: tmdbMovieId, movieTitle: movieTitleString });
    };

    // Função para navegar para a tela de edição da lista
    const editarLista = () => {
        if (listDetails) { // Verifica se os detalhes da lista existem
            navigation.navigate('CreateList', { // Navega para CreateList passando os dados da lista para edição
                listToEdit: {
                    _id: listDetails._id,
                    name: listDetails.name,
                    description: listDetails.description,
                    isPublic: listDetails.isPublic
                } 
            });
        }
    };

    // Função para deletar a lista atual
    const deletarLista = async () => {
        if (!userToken || !listId) return; // Verifica se os dados necessários estão presentes
        // Mostra um alerta de confirmação
        Alert.alert(
            "Deletar Lista",
            `Tem certeza que deseja deletar a lista "${currentListName}"? Esta ação não pode ser desfeita.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Deletar",
                    style: "destructive",
                    onPress: async () => { // Ação ao pressionar "Deletar"
                        setIsLoading(true);
                        try {
                            // Realiza a requisição DELETE para deletar a lista
                            const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${userToken}` }
                            });
                            if (response.ok) {
                                Alert.alert("Sucesso", `Lista "${currentListName}" deletada.`);
                                navigation.goBack(); // Volta para a tela anterior
                            } else {
                                const responseData = await response.json();
                                Alert.alert("Erro", responseData.message || "Não foi possível deletar a lista.");
                            }
                        } catch (e) {
                            Alert.alert("Erro de Rede", "Não foi possível conectar ao servidor.");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Se estiver carregando e não houver detalhes da lista, mostra um indicador de carregamento
    if (isLoading && !listDetails) {
        return (
            <SafeAreaView style={styles.safeAreaLoading}>
                 <StatusBar barStyle="light-content" backgroundColor={styles.header?.backgroundColor || '#181D2A'} />
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
                    <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{currentListName || 'Detalhes da Lista'}</Text>
                {/* Ícones de ação no cabeçalho (editar, deletar) */}
                <View style={styles.headerIconsContainer}>
                    <TouchableOpacity onPress={editarLista} style={styles.headerIconButton}>
                        <MaterialCommunityIcons name="pencil-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deletarLista} style={styles.headerIconButton}>
                        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF7A59" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Se houver erro, mostra a mensagem de erro e um botão para tentar novamente */}
            {error && (
                <View style={styles.errorContainerFull}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={buscarDetalhesDaLista} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Se os detalhes da lista e os filmes existirem, renderiza a FlatList de filmes */}
            {listDetails && listDetails.movies && listDetails.movies.length > 0 && (
                <FlatList
                    data={listDetails.movies} // Dados dos filmes
                    renderItem={({ item }) => ( // Renderiza cada item usando MovieItemCard
                        <MovieItemCard 
                            item={item} 
                            onRemovePress={removerFilmeDaLista}
                            onCardPress={navegarParaDetalhesFilme}
                        />
                    )}
                    keyExtractor={(item) => item.tmdbId.toString()} // Chave única para cada item
                    contentContainerStyle={styles.listContentContainer} // Estilo do container da lista
                    ListHeaderComponent={listDetails.description ? ( // Componente de cabeçalho da lista (descrição)
                        <Text style={styles.listDescription}>{listDetails.description}</Text>
                    ) : null}
                    onRefresh={buscarDetalhesDaLista} // Função para atualizar a lista (pull-to-refresh)
                    refreshing={isLoading} // Indica se está atualizando
                />
            )}

            {/* Se não estiver carregando, não houver erro, e a lista de filmes estiver vazia */}
            {!isLoading && !error && listDetails && listDetails.movies && listDetails.movies.length === 0 && (
                 <View style={styles.centeredMessageContainer}>
                    {listDetails.description && <Text style={styles.listDescriptionCentered}>{listDetails.description}</Text>}
                    <MaterialCommunityIcons name="movie-search-outline" size={60} color="#3A3F4B" style={{marginTop: 20}}/>
                    <Text style={styles.emptyListText}>Esta lista ainda não tem filmes.</Text>
                    <Text style={styles.emptyListSubText}>Adicione filmes a partir da tela de detalhes.</Text>
                </View>
            )}
             {/* Se não estiver carregando, não houver erro, mas os detalhes da lista não foram carregados */}
             {!isLoading && !error && !listDetails && (
                 <View style={styles.centeredMessageContainer}>
                     <Text style={styles.emptyListText}>Não foi possível carregar os detalhes da lista.</Text>
                 </View>
            )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#181D2A',
        borderBottomWidth: 1,
        borderBottomColor: '#22283C',
    },
    headerBackButton: { // Estilo do botão de voltar no cabeçalho
        padding: 5,
    },
    headerTitle: { // Estilo do título no cabeçalho
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1, // Permite que o título ocupe o espaço central disponível
        textAlign: 'center', // Centraliza o texto
        marginHorizontal: 5, // Pequena margem para não colar nos ícones
    },
    headerIconsContainer: { // Container para os ícones de ação no cabeçalho
        flexDirection: 'row', // Alinha os ícones horizontalmente
    },
    headerIconButton: { // Estilo para cada botão de ícone no cabeçalho
        padding: 5,
        marginLeft: 10, // Espaçamento entre os ícones
    },
    centeredMessageContainer: { // Estilo para containers de mensagens centralizadas (erro, vazio, carregamento)
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContainerFull: { // Estilo para o container de erro que ocupa toda a tela
        flex: 1,
        justifyContent: 'center',
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
    },
    listContentContainer: { // Estilo para o container de conteúdo da FlatList
        paddingVertical: 10,
    },
    listDescription: { // Estilo para a descrição da lista (quando no cabeçalho da FlatList)
        fontSize: 14,
        color: '#A0A3A8',
        paddingHorizontal: 20,
        paddingBottom: 10,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    listDescriptionCentered: { // Estilo para a descrição da lista quando centralizada (lista vazia)
        fontSize: 15,
        color: '#A0A3A8',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    movieItemContainer: { // Estilo para o container de cada item de filme na lista
        flexDirection: 'row', // Alinha poster, detalhes e botão de remover horizontalmente
        backgroundColor: '#1B202D', // Cor de fundo do item
        marginHorizontal: 10, // Margem horizontal
        marginBottom: 10, // Margem inferior para separar os itens
        borderRadius: 8, // Bordas arredondadas
        overflow: 'hidden', // Garante que o conteúdo não ultrapasse as bordas
        alignItems: 'center', // Alinha os itens verticalmente ao centro
    },
    movieItemPoster: { // Estilo para o poster do filme no item da lista
        width: screenWidth * 0.18, // Largura relativa à tela
        height: (screenWidth * 0.18) * 1.5, // Altura proporcional (aspect ratio 2:3)
        borderTopLeftRadius: 8, // Arredonda canto superior esquerdo
        borderBottomLeftRadius: 8, // Arredonda canto inferior esquerdo
    },
    movieItemPosterPlaceholder: { // Estilo para o placeholder do poster
        backgroundColor: '#2C3244', // Cor de fundo do placeholder
        justifyContent: 'center', // Centraliza o ícone verticalmente
        alignItems: 'center', // Centraliza o ícone horizontalmente
    },
    movieItemDetails: { // Estilo para a seção de detalhes textuais do filme
        flex: 1, // Ocupa o espaço restante na linha
        paddingHorizontal: 12, // Espaçamento interno horizontal
        paddingVertical: 10, // Espaçamento interno vertical
    },
    movieItemTitle: { // Estilo para o título do filme no item da lista
        color: '#E0E0E0', // Cor do texto
        fontSize: 15, // Tamanho da fonte
        fontWeight: 'bold', // Peso da fonte
    },
    removeButton: { // Estilo para o botão de remover filme
        padding: 15, // Área de toque maior
    },
    emptyListText: { // Estilo para o texto quando a lista está vazia
        marginTop: 15,
        fontSize: 18,
        color: '#A0A3A8',
        textAlign: 'center',
    },
    emptyListSubText: { // Estilo para o subtexto quando a lista está vazia
        fontSize: 14,
        color: '#7A7A7A',
        textAlign: 'center',
        marginTop: 5,
    },
});

export default ListDetailsScreen;