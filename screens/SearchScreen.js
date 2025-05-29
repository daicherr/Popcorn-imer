import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    SafeAreaView,
    StatusBar,
    Platform,
    Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';
const { width: screenWidth } = Dimensions.get('window');

const MovieResultCard = ({ item, onPress }) => {
    const posterImageUrl = item.poster_path
        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
        : null;

    return (
        <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(item)}>
            {posterImageUrl ? (
                <Image source={{ uri: posterImageUrl }} style={styles.cardPoster} />
            ) : (
                <View style={[styles.cardPoster, styles.cardPosterPlaceholder]}>
                    <MaterialCommunityIcons name="movie-open-outline" size={40} color="#7A7A7A" />
                </View>
            )}
            <View style={styles.cardDetails}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardYear}>{item.release_date ? item.release_date.substring(0, 4) : 'N/A'}</Text>
            </View>
        </TouchableOpacity>
    );
};

const SearchScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const realizarBusca = async (query) => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            setHasSearched(query.trim().length > 0);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/tmdb/search/movie?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro HTTP ${response.status}`);
            }
            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err.message || 'Falha ao buscar filmes.');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timerId = setTimeout(() => {
            if (searchQuery.trim() === '' && !hasSearched) {
                 setResults([]);
                 setHasSearched(false);
                 setIsLoading(false);
                 return;
            }
            if (searchQuery.trim() !== '' || (searchQuery.trim() === '' && hasSearched) ) {
                realizarBusca(searchQuery);
            }
        }, 700);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchQuery, hasSearched]);

    const aoPressionarFilme = (movie) => {
        navigation.navigate('HomeStack', {
            screen: 'MovieDetails',
            params: { movieId: movie.id, movieTitle: movie.title },
        });
    };

    const renderizarEstadoVazio = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color="#FF7A59" style={styles.activityIndicator} />;
        }
        if (error) {
            return <Text style={styles.messageText}>Erro: {error}</Text>;
        }
        if (!hasSearched && searchQuery.trim() === '') {
             return (
                <View style={styles.centeredMessageContainer}>
                    <MaterialCommunityIcons name="movie-search-outline" size={60} color="#3A3F4B" />
                    <Text style={styles.messageText}>Comece a digitar para buscar filmes...</Text>
                </View>
            );
        }
        if (hasSearched && results.length === 0 && searchQuery.trim() !== '') {
            return (
                 <View style={styles.centeredMessageContainer}>
                    <MaterialCommunityIcons name="emoticon-sad-outline" size={60} color="#3A3F4B" />
                    <Text style={styles.messageText}>Nenhum filme encontrado para "{searchQuery}".</Text>
                </View>
            );
        }
        return null;
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={styles.header.backgroundColor} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Buscar Filmes</Text>
            </View>
            <View style={styles.container}>
                <View style={styles.searchBarContainer}>
                    <MaterialCommunityIcons name="magnify" size={22} color="#7A7A7A" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Digite o nome do filme..."
                        placeholderTextColor="#7A7A7A"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={false}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <MaterialCommunityIcons name="close-circle" size={20} color="#7A7A7A" />
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={results}
                    renderItem={({ item }) => <MovieResultCard item={item} onPress={aoPressionarFilme} />}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    contentContainerStyle={styles.listContentContainer}
                    ListEmptyComponent={renderizarEstadoVazio}
                    keyboardShouldPersistTaps="handled"
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#10141E',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
        paddingBottom: 15,
        backgroundColor: '#181D2A',
        borderBottomWidth: 1,
        borderBottomColor: '#22283C',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1B202D',
        borderRadius: 25,
        marginHorizontal: 15,
        marginVertical: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#3A3F4B'
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        color: '#FFFFFF',
        fontSize: 16,
    },
    clearButton: {
        padding: 5,
    },
    listContentContainer: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    cardContainer: {
        backgroundColor: '#181D2A',
        borderRadius: 8,
        overflow: 'hidden',
        margin: 5,
        width: (screenWidth / 2) - 20,
        borderWidth: 1,
        borderColor: '#22283C'
    },
    cardPoster: {
        width: '100%',
        height: ((screenWidth / 2) - 20) * 1.5,
    },
    cardPosterPlaceholder: {
        backgroundColor: '#2C3244',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardDetails: {
        padding: 10,
    },
    cardTitle: {
        color: '#E0E0E0',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    cardYear: {
        color: '#A0A3A8',
        fontSize: 12,
    },
    activityIndicator: {
        marginTop: 50,
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: screenWidth * 0.2,
    },
    messageText: {
        color: '#7A7A7A',
        fontSize: 16,
        marginTop: 15,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default SearchScreen;