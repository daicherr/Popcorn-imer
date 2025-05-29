import React, { useState, useEffect, useContext, useCallback } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';
const { width: screenWidth } = Dimensions.get('window');

const MovieItemCard = ({ item, onRemovePress, onCardPress }) => {
    const posterImageUrl = item.posterPath 
        ? `https://image.tmdb.org/t/p/w342${item.posterPath}`
        : null;

    return (
        <TouchableOpacity style={styles.movieItemContainer} onPress={() => onCardPress(item.tmdbId, item.title)}>
            {posterImageUrl ? (
                <Image source={{ uri: posterImageUrl }} style={styles.movieItemPoster} />
            ) : (
                <View style={[styles.movieItemPoster, styles.movieItemPosterPlaceholder]}>
                    <MaterialCommunityIcons name="movie-open-outline" size={30} color="#7A7A7A" />
                </View>
            )}
            <View style={styles.movieItemDetails}>
                <Text style={styles.movieItemTitle} numberOfLines={2}>{item.title}</Text>
            </View>
            <TouchableOpacity onPress={() => onRemovePress(item.tmdbId)} style={styles.removeButton}>
                <MaterialCommunityIcons name="close-circle-outline" size={26} color="#FF7A59" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};


const ListDetailsScreen = ({ route, navigation }) => {
    const { listId, listName: initialListName } = route.params;
    const { userToken } = useContext(AuthContext);

    const [listDetails, setListDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentListName, setCurrentListName] = useState(initialListName);

    const buscarDetalhesDaLista = useCallback(async () => {
        if (!userToken || !listId) {
            setError("Token ou ID da lista ausente.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const responseText = await response.text();
            if (!response.ok) {
                let errorMessage = `Erro HTTP ${response.status}`;
                try { const errorJson = JSON.parse(responseText); errorMessage = errorJson.message || errorMessage; } catch (e) {}
                throw new Error(errorMessage);
            }
            const data = JSON.parse(responseText);
            setListDetails(data);
            setCurrentListName(data.name); 
        } catch (err) {
            setError(err.message || 'Falha ao carregar detalhes da lista.');
            setListDetails(null);
        } finally {
            setIsLoading(false);
        }
    }, [userToken, listId]);

    useFocusEffect(
        useCallback(() => {
          const fetchDataOnFocus = async () => {
            await buscarDetalhesDaLista();
          };
          fetchDataOnFocus();
        }, [buscarDetalhesDaLista])
      );

    const removerFilmeDaLista = async (tmdbIdToRemove) => {
        if (!userToken || !listId || !tmdbIdToRemove) return;
        Alert.alert(
            "Remover Filme",
            "Tem certeza que deseja remover este filme da lista?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/lists/${listId}/movies/${tmdbIdToRemove}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${userToken}`,
                                }
                            });
                            const responseData = await response.json();
                            if (response.ok) {
                                Alert.alert("Sucesso", "Filme removido da lista.");
                                buscarDetalhesDaLista();
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
    
    const navegarParaDetalhesFilme = (tmdbMovieId, movieTitleString) => {
        navigation.navigate('MovieDetails', { movieId: tmdbMovieId, movieTitle: movieTitleString });
    };

    const editarLista = () => {
        if (listDetails) {
            navigation.navigate('CreateList', { 
                listToEdit: {
                    _id: listDetails._id,
                    name: listDetails.name,
                    description: listDetails.description,
                    isPublic: listDetails.isPublic
                } 
            });
        }
    };

    const deletarLista = async () => {
        if (!userToken || !listId) return;
        Alert.alert(
            "Deletar Lista",
            `Tem certeza que deseja deletar a lista "${currentListName}"? Esta ação não pode ser desfeita.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Deletar",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${userToken}`
                                }
                            });
                            if (response.ok) {
                                Alert.alert("Sucesso", `Lista "${currentListName}" deletada.`);
                                navigation.goBack();
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={styles.header.backgroundColor} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
                    <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{currentListName || 'Detalhes da Lista'}</Text>
                <View style={styles.headerIconsContainer}>
                    <TouchableOpacity onPress={editarLista} style={styles.headerIconButton}>
                        <MaterialCommunityIcons name="pencil-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deletarLista} style={styles.headerIconButton}>
                        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF7A59" />
                    </TouchableOpacity>
                </View>
            </View>

            {error && (
                <View style={styles.errorContainerFull}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={buscarDetalhesDaLista} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            )}

            {listDetails && listDetails.movies && listDetails.movies.length > 0 && (
                <FlatList
                    data={listDetails.movies}
                    renderItem={({ item }) => (
                        <MovieItemCard 
                            item={item} 
                            onRemovePress={removerFilmeDaLista}
                            onCardPress={navegarParaDetalhesFilme}
                        />
                    )}
                    keyExtractor={(item) => item.tmdbId.toString()}
                    contentContainerStyle={styles.listContentContainer}
                    ListHeaderComponent={listDetails.description ? (
                        <Text style={styles.listDescription}>{listDetails.description}</Text>
                    ) : null}
                    onRefresh={buscarDetalhesDaLista}
                    refreshing={isLoading}
                />
            )}

            {!isLoading && !error && listDetails && listDetails.movies && listDetails.movies.length === 0 && (
                 <View style={styles.centeredMessageContainer}>
                    {listDetails.description && <Text style={styles.listDescriptionCentered}>{listDetails.description}</Text>}
                    <MaterialCommunityIcons name="movie-search-outline" size={60} color="#3A3F4B" style={{marginTop: 20}}/>
                    <Text style={styles.emptyListText}>Esta lista ainda não tem filmes.</Text>
                    <Text style={styles.emptyListSubText}>Adicione filmes a partir da tela de detalhes.</Text>
                </View>
            )}
             {!isLoading && !error && !listDetails && (
                 <View style={styles.centeredMessageContainer}>
                     <Text style={styles.emptyListText}>Não foi possível carregar os detalhes da lista.</Text>
                 </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#10141E',
    },
    safeAreaLoading: {
        flex: 1,
        backgroundColor: '#10141E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
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
    headerBackButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 5, 
    },
    headerIconsContainer: {
        flexDirection: 'row',
    },
    headerIconButton: {
        padding: 5,
        marginLeft: 10,
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContainerFull: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#FF7A59',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: '#FF7A59',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    listContentContainer: {
        paddingVertical: 10,
    },
    listDescription: {
        fontSize: 14,
        color: '#A0A3A8',
        paddingHorizontal: 20,
        paddingBottom: 10,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    listDescriptionCentered: {
        fontSize: 15,
        color: '#A0A3A8',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    movieItemContainer: {
        flexDirection: 'row',
        backgroundColor: '#1B202D',
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center',
    },
    movieItemPoster: {
        width: screenWidth * 0.18,
        height: (screenWidth * 0.18) * 1.5,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
    },
    movieItemPosterPlaceholder: {
        backgroundColor: '#2C3244',
        justifyContent: 'center',
        alignItems: 'center',
    },
    movieItemDetails: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    movieItemTitle: {
        color: '#E0E0E0',
        fontSize: 15,
        fontWeight: 'bold',
    },
    removeButton: {
        padding: 15,
    },
    emptyListText: {
        marginTop: 15,
        fontSize: 18,
        color: '#A0A3A8',
        textAlign: 'center',
    },
    emptyListSubText: {
        fontSize: 14,
        color: '#7A7A7A',
        textAlign: 'center',
        marginTop: 5,
    },
});

export default ListDetailsScreen;