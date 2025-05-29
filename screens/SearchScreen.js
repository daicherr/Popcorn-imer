// Importações de módulos e componentes necessários
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput, // Campo de entrada de texto para busca
    FlatList, // Lista otimizada para exibir resultados da busca
    TouchableOpacity, // Para tornar itens da lista clicáveis
    StyleSheet,
    ActivityIndicator, // Indicador de carregamento
    Image, // Para exibir pôsteres dos filmes
    SafeAreaView, // Garante que o conteúdo não sobreponha barras de status, etc.
    Platform, // Para verificações de OS (Android/iOS)
    Dimensions // Para obter dimensões da tela (largura)
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Biblioteca de ícones

// URL base da API do backend
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';
// Obtém a largura da tela para dimensionamento responsivo dos cards
const { width: screenWidth } = Dimensions.get('window');

// Componente para renderizar cada card de resultado de filme
const MovieResultCard = ({ item, onPress }) => {
    // URL do pôster do filme (se disponível)
    const posterImageUrl = item.poster_path
        ? `https://image.tmdb.org/t/p/w342${item.poster_path}` // TMDB base URL + poster path
        : null;

    return (
        // TouchableOpacity para tornar o card clicável
        <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(item)}>
            {posterImageUrl ? (
                // Exibe a imagem do pôster se a URL existir
                <Image source={{ uri: posterImageUrl }} style={styles.cardPoster} />
            ) : (
                // Exibe um placeholder se não houver imagem de pôster
                <View style={[styles.cardPoster, styles.cardPosterPlaceholder]}>
                    <MaterialCommunityIcons name="movie-open-outline" size={40} color="#7A7A7A" />
                </View>
            )}
            {/* Detalhes do filme (título e ano) */}
            <View style={styles.cardDetails}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardYear}>{item.release_date ? item.release_date.substring(0, 4) : 'N/A'}</Text>
            </View>
        </TouchableOpacity>
    );
};

// Componente principal da tela de Busca
const SearchScreen = ({ navigation }) => {
    // Estado para a query de busca digitada pelo usuário
    const [searchQuery, setSearchQuery] = useState('');
    // Estado para armazenar os resultados da busca
    const [results, setResults] = useState([]);
    // Estado para controlar o indicador de carregamento
    const [isLoading, setIsLoading] = useState(false);
    // Estado para armazenar mensagens de erro
    const [error, setError] = useState(null);
    // Estado para controlar se uma busca já foi realizada (para UI condicional)
    const [hasSearched, setHasSearched] = useState(false);

    // Função para realizar a busca de filmes na API
    const realizarBusca = async (query) => {
        // Se a query for vazia ou menor que 2 caracteres, limpa os resultados e para
        if (!query || query.trim().length < 2) {
            setResults([]);
            setHasSearched(query.trim().length > 0); // Define hasSearched se algo foi digitado e apagado
            setIsLoading(false);
            return;
        }

        setIsLoading(true); // Inicia o carregamento
        setError(null); // Limpa erros anteriores
        setHasSearched(true); // Marca que uma busca foi tentada

        try {
            // Requisição GET para a API de busca do TMDB via backend
            const response = await fetch(`${API_BASE_URL}/api/tmdb/search/movie?query=${encodeURIComponent(query)}`);
            if (!response.ok) { // Se a resposta não for OK (ex: erro 4xx, 5xx)
                const errorData = await response.json(); // Tenta obter dados do erro da resposta
                throw new Error(errorData.message || `Erro HTTP ${response.status}`); // Lança um erro
            }
            const data = await response.json(); // Converte a resposta para JSON
            setResults(data); // Atualiza o estado com os resultados da busca
        } catch (err) {
            setError(err.message || 'Falha ao buscar filmes.'); // Define a mensagem de erro
            setResults([]); // Limpa os resultados em caso de erro
        } finally {
            setIsLoading(false); // Finaliza o carregamento
        }
    };

    // Efeito para realizar a busca automaticamente após um delay (debounce)
    useEffect(() => {
        // Define um timer para evitar buscas a cada tecla digitada
        const timerId = setTimeout(() => {
            // Se a query estiver vazia e nenhuma busca foi feita ainda, não faz nada
            if (searchQuery.trim() === '' && !hasSearched) {
                 setResults([]);
                 setHasSearched(false);
                 setIsLoading(false);
                 return;
            }
            // Realiza a busca se a query não for vazia ou se foi apagada após uma busca
            if (searchQuery.trim() !== '' || (searchQuery.trim() === '' && hasSearched) ) {
                realizarBusca(searchQuery);
            }
        }, 700); // Delay de 700ms

        // Limpa o timer se o componente for desmontado ou searchQuery mudar antes do timer expirar
        return () => {
            clearTimeout(timerId);
        };
    }, [searchQuery, hasSearched]); // Dependências: searchQuery, hasSearched

    // Função chamada ao pressionar um filme nos resultados da busca
    const aoPressionarFilme = (movie) => {
        // Navega para a tela de Detalhes do Filme, passando o ID e título do filme
        navigation.navigate('HomeStack', { // Navega para o stack 'HomeStack'
            screen: 'MovieDetails', // Específica a tela 'MovieDetails' dentro do stack
            params: { movieId: movie.id, movieTitle: movie.title }, // Passa parâmetros para a tela
        });
    };

    // Função para renderizar o estado vazio da lista (loading, erro, sem resultados)
    const renderizarEstadoVazio = () => {
        if (isLoading) { // Se estiver carregando
            return <ActivityIndicator size="large" color="#FF7A59" style={styles.activityIndicator} />;
        }
        if (error) { // Se houver erro
            return <Text style={styles.messageText}>Erro: {error}</Text>;
        }
        // Se nenhuma busca foi feita e a query está vazia
        if (!hasSearched && searchQuery.trim() === '') {
             return (
                <View style={styles.centeredMessageContainer}>
                    <MaterialCommunityIcons name="movie-search-outline" size={60} color="#3A3F4B" />
                    <Text style={styles.messageText}>Comece a digitar para buscar filmes...</Text>
                </View>
            );
        }
        // Se uma busca foi feita, mas não encontrou resultados para a query atual
        if (hasSearched && results.length === 0 && searchQuery.trim() !== '') {
            return (
                 <View style={styles.centeredMessageContainer}>
                    <MaterialCommunityIcons name="emoticon-sad-outline" size={60} color="#3A3F4B" />
                    <Text style={styles.messageText}>Nenhum filme encontrado para "{searchQuery}".</Text>
                </View>
            );
        }
        return null; // Não renderiza nada se houver resultados ou outras condições não atendidas
    };


    return (
        // Container SafeArea para a tela
        <SafeAreaView style={styles.safeArea}>
            {/* Cabeçalho da tela */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Buscar Filmes</Text>
            </View>
            {/* Container principal da tela de busca */}
            <View style={styles.container}>
                {/* Container da barra de busca */}
                <View style={styles.searchBarContainer}>
                    <MaterialCommunityIcons name="magnify" size={22} color="#7A7A7A" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Digite o nome do filme..." // Placeholder do campo de busca
                        placeholderTextColor="#7A7A7A" // Cor do placeholder
                        value={searchQuery} // Valor do campo (controlado pelo estado)
                        onChangeText={setSearchQuery} // Função para atualizar o estado ao digitar
                        autoFocus={false} // Define se o campo deve focar automaticamente
                        returnKeyType="search" // Tipo do botão de retorno do teclado
                    />
                    {/* Botão para limpar a query de busca (visível apenas se houver texto) */}
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <MaterialCommunityIcons name="close-circle" size={20} color="#7A7A7A" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* FlatList para exibir os resultados da busca */}
                <FlatList
                    data={results} // Array de resultados
                    renderItem={({ item }) => <MovieResultCard item={item} onPress={aoPressionarFilme} />} // Renderiza cada item usando MovieResultCard
                    keyExtractor={(item) => item.id.toString()} // Chave única para cada item
                    numColumns={2} // Exibe os resultados em 2 colunas
                    contentContainerStyle={styles.listContentContainer} // Estilo do container da lista
                    ListEmptyComponent={renderizarEstadoVazio} // Componente a ser exibido se a lista estiver vazia
                    keyboardShouldPersistTaps="handled" // Controla o comportamento do teclado ao tocar na lista
                />
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
    header: { // Cabeçalho da tela
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? 30 : 50, // Padding superior ajustado por plataforma
        paddingBottom: 15,
        backgroundColor: '#181D2A', // Cor de fundo do cabeçalho
        borderBottomWidth: 1,
        borderBottomColor: '#22283C', // Cor da borda inferior do cabeçalho
    },
    headerTitle: { // Título do cabeçalho
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    container: { // Container principal da tela
        flex: 1,
    },
    searchBarContainer: { // Container da barra de busca
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1B202D', // Cor de fundo da barra de busca
        borderRadius: 25, // Bordas arredondadas
        marginHorizontal: 15,
        marginVertical: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#3A3F4B', // Cor da borda da barra de busca
    },
    searchIcon: { // Ícone de busca (lupa)
        marginRight: 10,
    },
    searchInput: { // Campo de texto da busca
        flex: 1, // Ocupa o espaço restante na barra
        height: 50, // Altura do campo
        color: '#FFFFFF', // Cor do texto digitado
        fontSize: 16,
    },
    clearButton: { // Botão de limpar a busca
        padding: 5, // Área de toque
    },
    listContentContainer: { // Estilo do container da lista de resultados
        paddingHorizontal: 10, // Espaçamento horizontal
        paddingBottom: 20, // Espaçamento inferior
    },
    cardContainer: { // Container de cada card de filme
        backgroundColor: '#181D2A', // Cor de fundo do card
        borderRadius: 8,
        overflow: 'hidden', // Garante que o conteúdo não ultrapasse as bordas arredondadas
        margin: 5, // Margem entre os cards
        width: (screenWidth / 2) - 20, // Largura do card (metade da tela menos margens/padding)
        borderWidth: 1,
        borderColor: '#22283C', // Cor da borda do card
    },
    cardPoster: { // Pôster do filme no card
        width: '100%',
        height: ((screenWidth / 2) - 20) * 1.5, // Altura proporcional ao pôster (aspect ratio 2:3)
    },
    cardPosterPlaceholder: { // Placeholder do pôster
        backgroundColor: '#2C3244', // Cor de fundo do placeholder
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardDetails: { // Detalhes do filme no card (título, ano)
        padding: 10,
    },
    cardTitle: { // Título do filme no card
        color: '#E0E0E0',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    cardYear: { // Ano do filme no card
        color: '#A0A3A8',
        fontSize: 12,
    },
    activityIndicator: { // Indicador de carregamento
        marginTop: 50,
    },
    centeredMessageContainer: { // Container para mensagens centralizadas (sem resultados, erro)
        flex: 1, // Ocupa o espaço disponível na FlatList quando vazia
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: screenWidth * 0.2, // Espaçamento superior relativo à largura da tela
    },
    messageText: { // Texto das mensagens centralizadas
        color: '#7A7A7A',
        fontSize: 16,
        marginTop: 15,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default SearchScreen; // Exporta o componente