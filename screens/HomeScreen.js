// Importa React e hooks (useState, useEffect)
import React, { useState, useEffect } from 'react';
// Importa componentes e APIs do React Native
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    ImageBackground,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Image,
    SafeAreaView,
    StatusBar,
    ActivityIndicator
} from 'react-native';

// Obtém as dimensões da tela (largura e altura)
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// URL base da API backend
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

// Componente para renderizar cada cartão de filme individualmente
const MovieCard = ({ item, onPress }) => {
    // Se o item não existir ou não tiver poster_path, renderiza um placeholder
    if (!item || !item.poster_path) {
        return (
            <View style={[styles.movieCard, styles.moviePosterPlaceholder]}>
                <Text style={styles.placeholderText}>Sem Imagem</Text>
            </View>
        );
    }
    // Caso contrário, renderiza o cartão do filme com a imagem do poster
    return (
        <TouchableOpacity style={styles.movieCard} onPress={() => onPress(item)}>
            <Image
                source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }} // URL da imagem do poster
                style={styles.moviePoster}
                resizeMode="cover" // Modo de redimensionamento da imagem
            />
        </TouchableOpacity>
    );
};

// Componente para renderizar uma fileira de filmes (ex: Populares, Em Breve)
const MovieRow = ({ title, data, onMoviePress, isLoading, error }) => {
    // Se estiver carregando, mostra um indicador de atividade
    if (isLoading) {
        return (
            <View style={styles.movieRowContainer}>
                <Text style={styles.rowTitle}>{title}</Text>
                <ActivityIndicator size="large" color="#FF7A59" style={styles.loaderOrError} />
            </View>
        );
    }
    // Se houver erro, mostra uma mensagem de erro
    if (error) {
        return (
            <View style={styles.movieRowContainer}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={[styles.errorTextInRow]}>Falha ao carregar filmes.</Text>
            </View>
        );
    }
    // Se não houver dados, mostra uma mensagem indicando que não há filmes
    if (!data || data.length === 0) {
        return (
             <View style={styles.movieRowContainer}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.emptyListText}>Nenhum filme encontrado.</Text>
            </View>
        );
    }
    // Caso contrário, renderiza a fileira de filmes usando FlatList
    return (
        <View style={styles.movieRowContainer}>
            <Text style={styles.rowTitle}>{title}</Text>
            <FlatList
                data={data} // Dados dos filmes
                renderItem={({ item }) => <MovieCard item={item} onPress={onMoviePress} />} // Renderiza cada filme usando MovieCard
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()} // Chave única para cada item
                horizontal // Define a lista como horizontal
                showsHorizontalScrollIndicator={false} // Oculta a barra de rolagem horizontal
                contentContainerStyle={styles.flatListContent} // Estilo do container da lista
            />
        </View>
    );
};

// Componente principal da tela Home
const HomeScreen = ({ navigation }) => {
    // Estados para armazenar os dados dos filmes e o estado de carregamento/erro
    const [featuredMovie, setFeaturedMovie] = useState(null); // Filme em destaque
    const [popularMovies, setPopularMovies] = useState([]); // Filmes populares
    const [upcomingMovies, setUpcomingMovies] = useState([]); // Filmes em breve

    const [isLoadingFeatured, setIsLoadingFeatured] = useState(true); // Carregando filme em destaque
    const [isLoadingPopular, setIsLoadingPopular] = useState(true); // Carregando filmes populares
    const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true); // Carregando filmes em breve

    const [errorFeatured, setErrorFeatured] = useState(null); // Erro ao carregar filme em destaque
    const [errorPopular, setErrorPopular] = useState(null); // Erro ao carregar filmes populares
    const [errorUpcoming, setErrorUpcoming] = useState(null); // Erro ao carregar filmes em breve

    // Função genérica para buscar dados da API TMDB
    const buscarDadosTMDB = async (endpoint, setData, setIsLoading, setErrorState) => {
        setIsLoading(true); // Define o carregamento como true
        setErrorState(null); // Limpa erros anteriores
        try {
            // Realiza a requisição para o endpoint da API
            const response = await fetch(`${API_BASE_URL}/api/tmdb/${endpoint}`);
            const responseText = await response.text(); // Obtém o texto da resposta

            // Se a resposta não for OK, lança um erro
            if (!response.ok) {
                throw new Error(`Erro ao buscar ${endpoint}: ${response.status} - ${responseText || response.statusText}`);
            }
            
            const jsonData = JSON.parse(responseText); // Converte o texto da resposta para JSON
            setData(jsonData); // Define os dados no estado correspondente

        } catch (err) {
            setErrorState(err.message || `Falha ao carregar dados de ${endpoint}.`); // Define a mensagem de erro
        } finally {
            setIsLoading(false); // Define o carregamento como false
        }
    };

    // useEffect para buscar os dados dos filmes quando o componente montar
    useEffect(() => {
        buscarDadosTMDB('featured', setFeaturedMovie, setIsLoadingFeatured, setErrorFeatured);
        buscarDadosTMDB('popular', setPopularMovies, setIsLoadingPopular, setErrorPopular);
        buscarDadosTMDB('upcoming', setUpcomingMovies, setIsLoadingUpcoming, setErrorUpcoming);
    }, []); // Array de dependências vazio, executa apenas uma vez

    // Função chamada ao pressionar um filme (navega para MovieDetailsScreen)
    const aoPressionarFilme = (movie) => {
        if (movie && movie.id) { // Verifica se o filme e seu ID existem
            try {
                navigation.navigate('MovieDetails', { movieId: movie.id, movieTitle: movie.title }); // Navega
            } catch (e) {
                console.error("Erro ao tentar navegar:", e); 
            }
        } else {
            console.warn("Tentativa de navegar para filme com dados inválidos:", movie);
        }
    };

    // Função similar para o filme em destaque
    const aoPressionarFilmeDestaque = (movie) => {
        if (movie && movie.id) {
            try {
                navigation.navigate('MovieDetails', { movieId: movie.id, movieTitle: movie.title });
            } catch (e) {
                console.error("Erro ao tentar navegar (featured):", e); 
            }
        } else {
            console.warn("Tentativa de navegar para filme em destaque com dados inválidos:", movie);
        }
    };

    // Se houver erro ao carregar o filme em destaque e as outras listas estiverem vazias, mostra uma mensagem de erro geral
    if (errorFeatured && !featuredMovie && popularMovies.length === 0 && upcomingMovies.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                 <StatusBar barStyle="light-content" backgroundColor={styles.safeArea.backgroundColor} />
                <View style={styles.centeredMessageContainer}>
                    <Text style={styles.errorText}>Não foi possível carregar os dados.</Text>
                    <Text style={styles.errorTextSmall}>Verifique a sua ligação ou tente mais tarde.</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Renderização principal da tela
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={styles.safeArea.backgroundColor} />
            <ScrollView style={styles.scrollView}>
                {/* Seção do filme em destaque */}
                {isLoadingFeatured ? ( // Se estiver carregando o destaque
                    <View style={[styles.featuredMovieBackground, styles.loadingOrErrorContainerForBanner]}>
                        <ActivityIndicator size="large" color="#FF7A59" />
                    </View>
                ) : errorFeatured ? ( // Se houver erro no destaque
                     <View style={[styles.featuredMovieBackground, styles.loadingOrErrorContainerForBanner]}>
                        <Text style={styles.errorText}>Falha ao carregar destaque.</Text>
                        <Text style={styles.errorTextSmall}>{errorFeatured}</Text>
                    </View>
                ) : featuredMovie && featuredMovie.backdrop_path ? ( // Se houver filme em destaque com imagem
                    <TouchableOpacity activeOpacity={0.8} onPress={() => aoPressionarFilmeDestaque(featuredMovie)}>
                        <ImageBackground
                            source={{ uri: `https://image.tmdb.org/t/p/w780${featuredMovie.backdrop_path}` }}
                            style={styles.featuredMovieBackground}
                            resizeMode="cover"
                        >
                            <View style={styles.featuredOverlay}>
                                <Text style={styles.featuredMovieTitle}>{featuredMovie.title}</Text>
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>
                ) : ( // Se o destaque não estiver disponível
                     <View style={[styles.featuredMovieBackground, styles.loadingOrErrorContainerForBanner]}>
                        <Text style={styles.errorText}>Destaque não disponível.</Text>
                    </View>
                )}

                {/* Fileira de filmes populares */}
                <MovieRow
                    title="Populares esta semana"
                    data={popularMovies}
                    onMoviePress={aoPressionarFilme}
                    isLoading={isLoadingPopular}
                    error={errorPopular}
                />
                {/* Fileira de filmes em breve */}
                <MovieRow
                    title="Em Breve nos Cinemas"
                    data={upcomingMovies}
                    onMoviePress={aoPressionarFilme}
                    isLoading={isLoadingUpcoming}
                    error={errorUpcoming}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

// Define os estilos para os componentes
const styles = StyleSheet.create({
    safeArea: { // Estilo para o container principal que respeita as áreas seguras
        flex: 1, // Ocupa todo o espaço
        backgroundColor: '#10141E', // Cor de fundo escura
    },
    scrollView: { // Estilo para o ScrollView principal
        flex: 1, // Ocupa todo o espaço
    },
    centeredMessageContainer: {  // Estilo para container de mensagens centralizadas (erro, vazio)
        flex: 1, // Ocupa todo o espaço
        justifyContent: 'center', // Centraliza verticalmente
        alignItems: 'center', // Centraliza horizontalmente
        padding: 20, // Espaçamento interno
    },
    errorText: { // Estilo para texto de erro principal
        color: '#FF7A59', // Cor do texto
        fontSize: 16, // Tamanho da fonte
        textAlign: 'center', // Alinhamento do texto
        marginBottom: 5, // Margem inferior
    },
     errorTextSmall: { // Estilo para texto de erro secundário/detalhe
        color: '#A0A3A8', // Cor do texto
        fontSize: 14, // Tamanho da fonte
        textAlign: 'center', // Alinhamento do texto
    },
    errorTextInRow: { // Estilo para texto de erro dentro de uma fileira de filmes
        color: '#FF7A59', // Cor do texto
        fontSize: 14, // Tamanho da fonte
        marginLeft: 15, // Margem esquerda
        fontStyle: 'italic', // Estilo da fonte
    },
    loadingOrErrorContainerForBanner: { // Estilo para o container do banner de destaque em caso de carregamento ou erro
        height: screenHeight * 0.55, // Altura relativa à tela
        width: '100%', // Largura total
        justifyContent: 'center', // Centraliza verticalmente
        alignItems: 'center', // Centraliza horizontalmente
        backgroundColor: '#181D2A', // Cor de fundo
    },
    loaderOrError: { // Estilo para o ActivityIndicator ou mensagem de erro dentro de uma fileira
        marginVertical: 20, // Margem vertical
        alignSelf: 'center', // Alinha ao centro do container pai
    },
    emptyListText: { // Estilo para texto quando uma lista de filmes está vazia
        color: '#777', // Cor do texto
        marginLeft: 15, // Margem esquerda
        fontSize: 14, // Tamanho da fonte
        fontStyle: 'italic', // Estilo da fonte
    },
    featuredMovieBackground: { // Estilo para o fundo do filme em destaque
        width: '100%', // Largura total
        height: screenHeight * 0.55, // Altura relativa à tela
        justifyContent: 'flex-end', // Alinha o conteúdo (overlay) à parte inferior
        backgroundColor: '#181D2A', // Cor de fundo de fallback
    },
    featuredOverlay: { // Estilo para o overlay sobre a imagem de destaque (para o título)
        backgroundColor: 'rgba(0,0,0,0.5)', // Cor de fundo semi-transparente
        paddingHorizontal: 15, // Espaçamento horizontal interno
        paddingVertical: 20, // Espaçamento vertical interno
    },
    featuredMovieTitle: { // Estilo para o título do filme em destaque
        fontSize: 26, // Tamanho da fonte
        fontWeight: 'bold', // Peso da fonte
        color: '#FFFFFF', // Cor do texto
        marginBottom: 5, // Margem inferior
        textShadowColor: 'rgba(0, 0, 0, 0.75)', // Cor da sombra do texto
        textShadowOffset: { width: 1, height: 1 }, // Deslocamento da sombra
        textShadowRadius: 5, // Raio da sombra
    },
    movieRowContainer: { // Estilo para o container de cada fileira de filmes
        marginTop: 30, // Margem superior
        marginBottom: 15, // Margem inferior
    },
    rowTitle: { // Estilo para o título de cada fileira de filmes
        fontSize: 20, // Tamanho da fonte
        fontWeight: 'bold', // Peso da fonte
        color: '#FFFFFF', // Cor do texto
        marginLeft: 15, // Margem esquerda
        marginBottom: 15, // Margem inferior
    },
    flatListContent: { // Estilo para o conteúdo dentro da FlatList horizontal
        paddingLeft: 15, // Espaçamento à esquerda (para o primeiro item não colar na borda)
        paddingRight: 3, // Pequeno espaçamento à direita
    },
    movieCard: { // Estilo para cada cartão de filme
        width: screenWidth * 0.38, // Largura relativa à tela
        marginRight: 15, // Margem à direita para separar os cartões
        borderRadius: 8, // Bordas arredondadas
        overflow: 'hidden', // Garante que a imagem não ultrapasse as bordas arredondadas
        backgroundColor: '#222222', // Cor de fundo de fallback para o cartão
    },
    moviePoster: { // Estilo para a imagem do poster do filme
        width: '100%', // Largura total do cartão
        height: (screenWidth * 0.38) * 1.5, // Altura proporcional à largura (aspect ratio 2:3)
    },
    moviePosterPlaceholder: { // Estilo para o placeholder quando a imagem do poster não está disponível
        height: (screenWidth * 0.38) * 1.5, // Mesma altura do poster
        justifyContent: 'center', // Centraliza o texto verticalmente
        alignItems: 'center', // Centraliza o texto horizontalmente
        borderWidth: 1, // Borda
        borderColor: '#333', // Cor da borda
    },
    placeholderText: { // Estilo para o texto dentro do placeholder de imagem
        color: '#777', // Cor do texto
        fontSize: 12, // Tamanho da fonte
    },
});

export default HomeScreen;