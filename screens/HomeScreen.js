import React, { useState, useEffect } from 'react';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

const MovieCard = ({ item, onPress }) => {
    if (!item || !item.poster_path) {
        return (
            <View style={[styles.movieCard, styles.moviePosterPlaceholder]}>
                <Text style={styles.placeholderText}>Sem Imagem</Text>
            </View>
        );
    }
    return (
        <TouchableOpacity style={styles.movieCard} onPress={() => onPress(item)}>
            <Image
                source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }}
                style={styles.moviePoster}
                resizeMode="cover"
            />
        </TouchableOpacity>
    );
};

const MovieRow = ({ title, data, onMoviePress, isLoading, error }) => {
    if (isLoading) {
        return (
            <View style={styles.movieRowContainer}>
                <Text style={styles.rowTitle}>{title}</Text>
                <ActivityIndicator size="large" color="#FF7A59" style={styles.loaderOrError} />
            </View>
        );
    }
    if (error) {
        return (
            <View style={styles.movieRowContainer}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={[styles.errorTextInRow]}>Falha ao carregar filmes.</Text>
            </View>
        );
    }
    if (!data || data.length === 0) {
        return (
             <View style={styles.movieRowContainer}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.emptyListText}>Nenhum filme encontrado.</Text>
            </View>
        );
    }
    return (
        <View style={styles.movieRowContainer}>
            <Text style={styles.rowTitle}>{title}</Text>
            <FlatList
                data={data}
                renderItem={({ item }) => <MovieCard item={item} onPress={onMoviePress} />}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.flatListContent}
            />
        </View>
    );
};


const HomeScreen = ({ navigation }) => {
    const [featuredMovie, setFeaturedMovie] = useState(null);
    const [popularMovies, setPopularMovies] = useState([]);
    const [upcomingMovies, setUpcomingMovies] = useState([]);

    const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
    const [isLoadingPopular, setIsLoadingPopular] = useState(true);
    const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);

    const [errorFeatured, setErrorFeatured] = useState(null);
    const [errorPopular, setErrorPopular] = useState(null);
    const [errorUpcoming, setErrorUpcoming] = useState(null);

    const buscarDadosTMDB = async (endpoint, setData, setIsLoading, setErrorState) => {
        setIsLoading(true);
        setErrorState(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/tmdb/${endpoint}`);
            const responseText = await response.text(); 

            if (!response.ok) {
                throw new Error(`Erro ao buscar ${endpoint}: ${response.status} - ${responseText || response.statusText}`);
            }
            
            const jsonData = JSON.parse(responseText); 
            setData(jsonData);

        } catch (err) {
            setErrorState(err.message || `Falha ao carregar dados de ${endpoint}.`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        buscarDadosTMDB('featured', setFeaturedMovie, setIsLoadingFeatured, setErrorFeatured);
        buscarDadosTMDB('popular', setPopularMovies, setIsLoadingPopular, setErrorPopular);
        buscarDadosTMDB('upcoming', setUpcomingMovies, setIsLoadingUpcoming, setErrorUpcoming);
    }, []);

    const aoPressionarFilme = (movie) => {
        if (movie && movie.id) {
            try {
                navigation.navigate('MovieDetails', { movieId: movie.id, movieTitle: movie.title });
            } catch (e) {
                console.error("Erro ao tentar navegar:", e); 
            }
        } else {
            console.warn("Tentativa de navegar para filme com dados inválidos:", movie);
        }
    };

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

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={styles.safeArea.backgroundColor} />
            <ScrollView style={styles.scrollView}>
                {isLoadingFeatured ? (
                    <View style={[styles.featuredMovieBackground, styles.loadingOrErrorContainerForBanner]}>
                        <ActivityIndicator size="large" color="#FF7A59" />
                    </View>
                ) : errorFeatured ? (
                     <View style={[styles.featuredMovieBackground, styles.loadingOrErrorContainerForBanner]}>
                        <Text style={styles.errorText}>Falha ao carregar destaque.</Text>
                        <Text style={styles.errorTextSmall}>{errorFeatured}</Text>
                    </View>
                ) : featuredMovie && featuredMovie.backdrop_path ? (
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
                ) : ( 
                     <View style={[styles.featuredMovieBackground, styles.loadingOrErrorContainerForBanner]}>
                        <Text style={styles.errorText}>Destaque não disponível.</Text>
                    </View>
                )}

                <MovieRow
                    title="Populares esta semana"
                    data={popularMovies}
                    onMoviePress={aoPressionarFilme}
                    isLoading={isLoadingPopular}
                    error={errorPopular}
                />
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

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#10141E', 
    },
    scrollView: {
        flex: 1,
    },
    centeredMessageContainer: { 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#FF7A59',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 5,
    },
     errorTextSmall: {
        color: '#A0A3A8',
        fontSize: 14,
        textAlign: 'center',
    },
    errorTextInRow: { 
        color: '#FF7A59',
        fontSize: 14,
        marginLeft: 15,
        fontStyle: 'italic',
    },
    loadingOrErrorContainerForBanner: { 
        height: screenHeight * 0.55, 
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#181D2A', 
    },
    loaderOrError: { 
        marginVertical: 20, 
        alignSelf: 'center', 
    },
    emptyListText: {
        color: '#777',
        marginLeft: 15,
        fontSize: 14,
        fontStyle: 'italic',
    },
    featuredMovieBackground: {
        width: '100%',
        height: screenHeight * 0.55,
        justifyContent: 'flex-end',
        backgroundColor: '#181D2A', 
    },
    featuredOverlay: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15,
        paddingVertical: 20,
    },
    featuredMovieTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
    movieRowContainer: {
        marginTop: 30, 
        marginBottom: 15,
    },
    rowTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 15,
        marginBottom: 15, 
    },
    flatListContent: {
        paddingLeft: 15,
        paddingRight: 3, 
    },
    movieCard: {
        width: screenWidth * 0.38, 
        marginRight: 15, 
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#222222',
    },
    moviePoster: {
        width: '100%',
        height: (screenWidth * 0.38) * 1.5, 
    },
    moviePosterPlaceholder: {
        height: (screenWidth * 0.38) * 1.5, 
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    placeholderText: {
        color: '#777',
        fontSize: 12,
    },
});

export default HomeScreen;