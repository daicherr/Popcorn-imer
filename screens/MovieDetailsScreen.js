import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
    Platform,
    StatusBar,
    FlatList,
    Modal,
    Pressable,
    Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';
import { useFocusEffect } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

const ReviewItem = ({ item, currentUserId }) => {
    const [showSpoilerContent, setShowSpoilerContent] = useState(false);
    const isUserAuthor = currentUserId === item.userId;

    const alternarSpoiler = () => {
        setShowSpoilerContent(!showSpoilerContent);
    };

    const formatarData = (dateString) => {
        if (!dateString) return 'Data não disponível';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const renderizarAvaliacaoEstrelasParaItem = (rating, starSize = 14, color = "#FFC0CB") => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        let stars = [];
        for (let i = 0; i < fullStars; i++) {
            stars.push(<MaterialCommunityIcons key={`full-item-${i}-${item._id}-review`} name="star" size={starSize} color={color} />);
        }
        if (halfStar) {
            stars.push(<MaterialCommunityIcons key={`half-item-${item._id}-review`} name="star-half-full" size={starSize} color={color} />);
        }
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<MaterialCommunityIcons key={`empty-item-${i}-${item._id}-review`} name="star-outline" size={starSize} color={color} />);
        }
        return <View style={{ flexDirection: 'row' }}>{stars}</View>;
    };

    return (
        <View style={styles.reviewItemContainer}>
            <View style={styles.reviewHeader}>
                <Text style={styles.reviewUserEmail}>{item.userEmail || 'Usuário Anônimo'}</Text>
                {renderizarAvaliacaoEstrelasParaItem(item.rating)}
            </View>

            {item.isSpoiler && !isUserAuthor && !showSpoilerContent ? (
                <TouchableOpacity onPress={alternarSpoiler} style={styles.spoilerWarningButton}>
                    <MaterialCommunityIcons name="alert-outline" size={16} color="#FFCC00" />
                    <Text style={styles.spoilerWarningText}>Esta crítica contém spoilers. Mostrar assim mesmo?</Text>
                </TouchableOpacity>
            ) : (
                item.reviewText && <Text style={styles.reviewText}>{item.reviewText}</Text>
            )}
            
            <View style={styles.reviewFooter}>
                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagsContainerReview}>
                        {item.tags.map((tag, index) => (
                            <Text key={index} style={styles.tagReview}>{tag}</Text>
                        ))}
                    </View>
                )}
                <Text style={styles.reviewDate}>{formatarData(item.createdAt)}</Text>
            </View>
        </View>
    );
};


const MovieDetailsScreen = ({ route, navigation }) => {
    const { movieId, movieTitle } = route.params;
    const { userToken } = useContext(AuthContext);
    const [currentUserId, setCurrentUserId] = useState(null);

    const [movieDetails, setMovieDetails] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [movieStats, setMovieStats] = useState({ averageRating: 0, reviewCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserReview, setCurrentUserReview] = useState(null);

    const [isListModalVisible, setIsListModalVisible] = useState(false);
    const [userListsForModal, setUserListsForModal] = useState([]);
    const [selectedListsInModal, setSelectedListsInModal] = useState({});
    const [isLoadingListsModal, setIsLoadingListsModal] = useState(false);
    const [isSubmittingToList, setIsSubmittingToList] = useState(false);
    const [moviePresenceInUserLists, setMoviePresenceInUserLists] = useState({});

    useEffect(() => {
        if (userToken) {
            try {
                const decoded = jwtDecode(userToken);
                setCurrentUserId(decoded.userId);
            } catch (e) {
                console.error("Erro ao decodificar token:", e);
                setCurrentUserId(null);
            }
        } else {
            setCurrentUserId(null);
        }
    }, [userToken]);

    const verificarPresencaFilmeEmListas = useCallback(async () => {
        if (!userToken || !movieId) return { lists: [], presenceMap: {} };
        try {
            const response = await fetch(`${API_BASE_URL}/api/lists`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const listsData = await response.json();
            if (response.ok) {
                const presenceMap = {};
                listsData.forEach(list => {
                    presenceMap[list._id] = list.movies.some(movie => movie.tmdbId === movieId.toString());
                });
                setMoviePresenceInUserLists(presenceMap);
                return { lists: listsData, presenceMap };
            } else {
                 console.warn("Resposta não OK ao buscar listas:", listsData.message || response.status);
            }
        } catch (e) {
            console.warn("Falha ao verificar presença do filme nas listas:", e);
        }
        return { lists: [], presenceMap: {} };
    }, [userToken, movieId]);

    const buscarTodosDadosFilme = useCallback(async () => {
        if (!movieId) {
            setError("ID do filme não fornecido.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const detailsPromise = fetch(`${API_BASE_URL}/api/tmdb/movie/${movieId}`).then(res => res.text().then(text => {
                if (!res.ok) throw new Error(`Detalhes: ${res.status} - ${text}`);
                try { return JSON.parse(text); } catch (e) { throw new Error(`Detalhes (JSON parse error): ${e.message} - Response: ${text}`); }
            }));
            const reviewsPromise = fetch(`${API_BASE_URL}/api/reviews/${movieId}`).then(res => res.text().then(text => {
                if (!res.ok) { console.warn(`Reviews: ${res.status} - ${text}`); return []; }
                try { return JSON.parse(text); } catch (e) { console.warn(`Reviews (JSON parse error): ${e.message} - Response: ${text}`); return []; }
            }));
            const statsPromise = fetch(`${API_BASE_URL}/api/movies/${movieId}/stats`).then(res => res.text().then(text => {
                if (!res.ok) { console.warn(`Stats: ${res.status} - ${text}`); return { averageRating: 0, reviewCount: 0 }; }
                try { return JSON.parse(text); } catch (e) { console.warn(`Stats (JSON parse error): ${e.message} - Response: ${text}`); return { averageRating: 0, reviewCount: 0 }; }
            }));
            
            await verificarPresencaFilmeEmListas();

            const [detailsData, reviewsData, statsData] = await Promise.all([
                detailsPromise, 
                reviewsPromise, 
                statsPromise
            ]);
            
            setMovieDetails(detailsData);
            setReviews(reviewsData);
            setMovieStats(statsData);
            
        } catch (err) {
            console.error("Erro em buscarTodosDadosFilme:", err);
            setError(err.message || 'Falha ao carregar dados do filme.');
        } finally {
            setIsLoading(false);
        }
    }, [movieId, verificarPresencaFilmeEmListas]); 
    
    useFocusEffect(
        useCallback(() => {
            buscarTodosDadosFilme();
        }, [buscarTodosDadosFilme])
    );
    
    useEffect(() => {
        if (currentUserId && reviews && reviews.length > 0) {
            const foundReview = reviews.find(review => review.userId === currentUserId);
            setCurrentUserReview(foundReview || null);
        } else if (!currentUserId || (reviews && reviews.length === 0)) {
            setCurrentUserReview(null);
        }
    }, [reviews, currentUserId]);

    const abrirModalListas = async () => {
        if (!userToken) return;
        setIsLoadingListsModal(true);
        setIsListModalVisible(true);
        try {
            const { lists: data, presenceMap } = await verificarPresencaFilmeEmListas();

            if (data && data.length >= 0) {
                setUserListsForModal(data);
                const currentSelections = {};
                data.forEach(list => {
                    currentSelections[list._id] = presenceMap[list._id] || false;
                });
                setSelectedListsInModal(currentSelections);
            } else {
                Alert.alert("Erro", "Não foi possível carregar suas listas.");
                setUserListsForModal([]);
                setSelectedListsInModal({});
            }
        } catch (e) {
            Alert.alert("Erro de Rede", "Não foi possível buscar suas listas.");
            setUserListsForModal([]);
            setSelectedListsInModal({});
        } finally {
            setIsLoadingListsModal(false);
        }
    };

    const alternarSelecaoListaNoModal = (listId) => {
        setSelectedListsInModal(prev => ({ ...prev, [listId]: !prev[listId] }));
    };

    const confirmarAdicionarFilmeAsListas = async () => {
        if (!movieDetails || !userToken) return;
        
        const initialPresenceMap = { ...moviePresenceInUserLists };

        const listsToModifyBasedOnModal = userListsForModal.filter(list => 
            selectedListsInModal[list._id] !== initialPresenceMap[list._id]
        );

        if (listsToModifyBasedOnModal.length === 0) {
            setIsListModalVisible(false);
            return;
        }

        setIsSubmittingToList(true);
        let successMessages = [];
        let errorMessages = [];

        for (const list of listsToModifyBasedOnModal) {
            const shouldBeInList = selectedListsInModal[list._id];
            let method, endpoint;

            if (shouldBeInList) {
                method = 'POST';
                endpoint = `${API_BASE_URL}/api/lists/${list._id}/movies`;
            } else {
                method = 'DELETE';
                endpoint = `${API_BASE_URL}/api/lists/${list._id}/movies/${movieId}`;
            }

            try {
                const body = method === 'POST' ? JSON.stringify({
                    tmdbId: movieDetails.id.toString(),
                    title: movieDetails.title,
                    posterPath: movieDetails.poster_path
                }) : null;

                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: body
                });
                const data = await response.json();

                if (response.ok) {
                    successMessages.push(method === 'POST' ? `Adicionado a "${list.name}"` : `Removido de "${list.name}"`);
                } else {
                    errorMessages.push(`Falha em "${list.name}": ${data.message || 'Erro desconhecido'}`);
                }
            } catch (e) {
                errorMessages.push(`Erro de rede em "${list.name}": ${e.message}`);
            }
        }

        setIsSubmittingToList(false);
        setIsListModalVisible(false); 

        try {
            await verificarPresencaFilmeEmListas(); 
        } catch (e) {
            console.warn("Falha ao atualizar presença do filme nas listas após modificação:", e);
        }

        if (successMessages.length > 0 && errorMessages.length === 0) {
            Alert.alert("Sucesso", successMessages.join('\n'));
        } else if (successMessages.length > 0 && errorMessages.length > 0) {
            Alert.alert("Concluído com Observações", `${successMessages.join('\n')}\n\nErros:\n${errorMessages.join('\n')}`);
        } else if (errorMessages.length > 0) {
            Alert.alert("Erro", errorMessages.join('\n'));
        }
    };

    const formatarDuracao = (runtime) => {
        if (!runtime || runtime <= 0) return '';
        const hours = Math.floor(runtime / 60);
        const minutes = runtime % 60;
        return `${hours}h ${minutes}min`;
    };

    const renderizarAvaliacaoEstrelasGlobal = (rating, starSize = 16, color = "#FFD700") => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        let stars = [];
        const baseKey = movieDetails ? movieDetails.id : 'global';
        for (let i = 0; i < fullStars; i++) {
            stars.push(<MaterialCommunityIcons key={`full-${baseKey}-${i}`} name="star" size={starSize} color={color} />);
        }
        if (halfStar) {
            stars.push(<MaterialCommunityIcons key={`half-${baseKey}`} name="star-half-full" size={starSize} color={color} />);
        }
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<MaterialCommunityIcons key={`empty-${baseKey}-${i}`} name="star-outline" size={starSize} color={color} />);
        }
        return <View style={{ flexDirection: 'row' }}>{stars}</View>;
    };

    const MovieDetailsContent = () => {
        if (!movieDetails) {
             if (isLoading && !error) return null;
             if (error) return <Text style={styles.errorTextInHeader}>{error.message || String(error)}</Text>;
             return <Text style={styles.errorTextInHeader}>Detalhes do filme não disponíveis.</Text>;
        }
        const posterPath = movieDetails.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
            : null;
        
        const isMovieCurrentlyInAnyList = Object.values(moviePresenceInUserLists).some(inList => inList);

        return (
            <View style={styles.contentContainerNoScroll}>
                <View style={styles.headerSection}>
                    {posterPath ? (
                        <Image source={{ uri: posterPath }} style={styles.posterImage} resizeMode="contain" />
                    ) : (
                        <View style={styles.posterPlaceholder}><MaterialCommunityIcons name="movie-open-outline" size={50} color="#7A7A7A" /></View>
                    )}
                    <View style={styles.titleContainer}>
                        <Text style={styles.movieTitle}>{movieDetails.title}</Text>
                        {movieDetails.tagline && <Text style={styles.tagline}>{movieDetails.tagline}</Text>}
                    </View>
                </View>

                {userToken && movieDetails && (
                    <TouchableOpacity 
                        style={[styles.addToListButton, isMovieCurrentlyInAnyList && styles.addToListButtonActive]} 
                        onPress={abrirModalListas}
                    >
                        <MaterialCommunityIcons 
                            name={isMovieCurrentlyInAnyList ? "playlist-check" : "playlist-plus"} 
                            size={24} 
                            color={isMovieCurrentlyInAnyList ? "#FFFFFF" : "#FF7A59"} />
                        <Text style={[styles.addToListButtonText, isMovieCurrentlyInAnyList && styles.addToListButtonTextActive]}>
                            {isMovieCurrentlyInAnyList ? "Gerenciar Listas" : "Adicionar à Lista"}
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={styles.infoRow}>
                    <Text style={styles.infoText}>
                        {movieDetails.release_date ? movieDetails.release_date.substring(0, 4) : 'N/A'}
                    </Text>
                    {!!formatarDuracao(movieDetails.runtime) && (
                        <>
                            <Text style={styles.infoSeparator}>•</Text>
                            <Text style={styles.infoText}>{formatarDuracao(movieDetails.runtime)}</Text>
                        </>
                    )}
                    {movieStats.reviewCount > 0 && (
                        <>
                            <Text style={styles.infoSeparator}>•</Text>
                            <MaterialCommunityIcons name="star" size={14} color="#FFD700" style={{ marginRight: 4 }}/>
                            <Text style={styles.infoTextBold}>{movieStats.averageRating.toFixed(1)}</Text>
                            <Text style={styles.infoText}> ({movieStats.reviewCount} {movieStats.reviewCount === 1 ? 'avaliação' : 'avaliações'})</Text>
                        </>
                    )}
                </View>

                 {movieDetails.genres && movieDetails.genres.length > 0 && (
                    <View style={styles.genresContainer}>
                        {movieDetails.genres.map(genre => (
                            <View key={genre.id} style={styles.genreTag}>
                                <Text style={styles.genreText}>{genre.name}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {userToken && (
                    <View style={styles.userReviewSection}>
                        <Text style={styles.sectionTitle}>Sua Avaliação</Text>
                        {currentUserReview ? (
                            <View>
                                {renderizarAvaliacaoEstrelasGlobal(currentUserReview.rating, 20)}
                                {currentUserReview.reviewText && <Text style={styles.yourReviewText}>{currentUserReview.reviewText}</Text>}
                                {currentUserReview.tags && currentUserReview.tags.length > 0 && (
                                    <Text style={styles.yourReviewTags}>Tags: {currentUserReview.tags.join(', ')}</Text>
                                )}
                                {currentUserReview.isSpoiler && <Text style={styles.yourReviewSpoiler}>Marcado como spoiler</Text>}
                                <TouchableOpacity 
                                    style={styles.actionButton} 
                                    onPress={() => navigation.navigate('ReviewForm', { 
                                        movieId, 
                                        movieTitle: movieDetails.title, 
                                        existingReview: currentUserReview 
                                    })}
                                >
                                    <Text style={styles.actionButtonText}>Editar sua Crítica</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={styles.actionButton} 
                                onPress={() => navigation.navigate('ReviewForm', { 
                                    movieId, 
                                    movieTitle: movieDetails.title 
                                })}
                            >
                                <Text style={styles.actionButtonText}>Avaliar e Escrever Crítica</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                
                <Text style={styles.sectionTitle}>Sinopse</Text>
                <Text style={styles.overviewText}>
                    {movieDetails.overview || "Sinopse não disponível."}
                </Text>

                {movieDetails.credits && movieDetails.credits.cast && movieDetails.credits.cast.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Elenco Principal</Text>
                        {movieDetails.credits.cast.slice(0, 6).map(actor => (
                            <Text key={actor.cast_id || actor.id} style={styles.actorText}>
                                {actor.name} <Text style={{color: '#888'}}>como {actor.character}</Text>
                            </Text>
                        ))}
                    </>
                )}

                 {(reviews && reviews.length > 0 || (isLoading && (!reviews || reviews.length === 0))) && (
                     <Text style={styles.sectionTitle}>Críticas {isLoading && (!reviews || reviews.length === 0) ? '' : `(${reviews.length})`}</Text>
                 )}
            </View>
        );
    };

    if (isLoading && !movieDetails) { 
        return (
            <View style={styles.centeredMessageContainer}>
                <ActivityIndicator size="large" color="#FF7A59" />
                <Text style={styles.loadingText}>Carregando detalhes...</Text>
            </View>
        );
    }

    if (error && !movieDetails) {
        return (
            <View style={styles.centeredMessageContainer}>
                <Text style={styles.errorText}>{error.message || String(error)}</Text>
            </View>
        );
    }
        
    const backdropPath = movieDetails?.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${movieDetails.backdrop_path}`
        : null;

    return (
        <View style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
            {backdropPath && (
                <Image source={{ uri: backdropPath }} style={styles.backdropImage} resizeMode="cover" />
            )}
            <View style={styles.overlay} /> 
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <FlatList
                data={reviews}
                renderItem={({item}) => <ReviewItem item={item} currentUserId={currentUserId} /> }
                keyExtractor={(item) => item._id ? item._id.toString() : `review-${Math.random()}`}
                ListHeaderComponent={MovieDetailsContent}
                ListEmptyComponent={ 
                    !isLoading && movieDetails && reviews.length === 0 ? (
                        <View style={styles.emptyReviewContainer}>
                            <Text style={styles.noReviewsText}>Ainda não há críticas para este filme.</Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={styles.flatListContentContainer}
                style={styles.container}
                onRefresh={buscarTodosDadosFilme}
                refreshing={isLoading} 
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={isListModalVisible}
                onRequestClose={() => setIsListModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setIsListModalVisible(false)}>
                    <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Adicionar "{movieTitle}" a:</Text>
                        
                        {isLoadingListsModal ? (
                            <ActivityIndicator size="small" color="#FF7A59" style={{marginVertical: 20}} />
                        ) : userListsForModal.length > 0 ? (
                            <FlatList
                                data={userListsForModal}
                                style={styles.modalFlatList}
                                keyExtractor={item => item._id.toString()}
                                renderItem={({ item }) => (
                                    <Pressable
                                        style={[styles.modalListItem, selectedListsInModal[item._id] && styles.modalListItemSelected]}
                                        onPress={() => alternarSelecaoListaNoModal(item._id)}
                                    >
                                        <Text style={styles.modalListItemText}>{item.name}</Text>
                                        <MaterialCommunityIcons
                                            name={selectedListsInModal[item._id] ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                                            size={24}
                                            color={selectedListsInModal[item._id] ? "#FF7A59" : "#7A7A7A"}
                                        />
                                    </Pressable>
                                )}
                            />
                        ) : (
                            <Text style={styles.modalNoListsText}>Você ainda não tem listas. Crie uma na aba "Listas"!</Text>
                        )}
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsListModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonConfirm, (isSubmittingToList || isLoadingListsModal || userListsForModal.length === 0) && styles.modalButtonDisabled]} 
                                onPress={confirmarAdicionarFilmeAsListas}
                                disabled={isSubmittingToList || isLoadingListsModal || userListsForModal.length === 0}
                            >
                                {isSubmittingToList ? <ActivityIndicator size="small" color="#FFFFFF"/> : <Text style={styles.modalButtonText}>Confirmar</Text> }
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#10141E',
    },
    container: {
        flex: 1,
    },
    flatListContentContainer: {
        paddingBottom: 50,
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#10141E',
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 10,
        color: '#FFFFFF',
        fontSize: 16,
    },
    errorText: {
        color: '#FF7A59',
        fontSize: 16,
        textAlign: 'center',
    },
    errorTextInHeader: {
        color: '#FF7A59',
        fontSize: 16,
        textAlign: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    backdropImage: {
        width: '100%',
        height: screenHeight * 0.35,
        position: 'absolute',
        top: 0,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(16, 20, 30, 0.5)',
        height: screenHeight * 0.35, 
        position: 'absolute',
        top: 0,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 55,
        left: 15,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        padding: 6,
    },
    contentContainerNoScroll: {
        marginTop: screenHeight * 0.28, 
        paddingHorizontal: 15,
        backgroundColor: '#10141E', 
        borderTopLeftRadius: 25, 
        borderTopRightRadius: 25,
        paddingTop: 20,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'flex-end', 
        marginTop: -90, 
        marginBottom: 15,
    },
    posterImage: {
        width: screenWidth * 0.32,
        height: (screenWidth * 0.32) * 1.5, 
        borderRadius: 10,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#2a3045'
    },
    posterPlaceholder: {
        width: screenWidth * 0.32,
        height: (screenWidth * 0.32) * 1.5,
        borderRadius: 10,
        marginRight: 15,
        backgroundColor: '#1B202D',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3A3F4B',
    },
    titleContainer: {
        flex: 1, 
        alignSelf: 'flex-end', 
        paddingBottom: 10, 
    },
    movieTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 3,
    },
    tagline: {
        fontSize: 13,
        fontStyle: 'italic',
        color: '#B0B3B8',
        marginBottom: 8,
    },
    addToListButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#22283C',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignSelf: 'flex-start', 
        marginBottom: 20,
        marginTop: 5,
    },
    addToListButtonActive: {
        backgroundColor: '#FF7A59',
    },
    addToListButtonText: {
        color: '#E0E0E0',
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 14,
    },
    addToListButtonTextActive: {
        color: '#FFFFFF',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        flexWrap: 'wrap'
    },
    infoText: {
        color: '#A0A3A8',
        fontSize: 13,
    },
    infoTextBold: {
        color: '#E0E0E0',
        fontSize: 13,
        fontWeight: 'bold',
    },
    infoSeparator: {
        color: '#777',
        marginHorizontal: 6,
        fontSize: 13,
    },
    genresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    genreTag: {
        backgroundColor: '#22283C',
        borderRadius: 15,
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginRight: 6,
        marginBottom: 6,
    },
    genreText: {
        color: '#E0E0E0',
        fontSize: 11,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 20,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#FF7A59',
        paddingLeft: 8,
    },
    overviewText: {
        fontSize: 14,
        color: '#CED1D6',
        lineHeight: 21,
        marginBottom: 15,
    },
    actorText: {
        fontSize: 13,
        color: '#B0B3B8',
        lineHeight: 19,
        marginBottom: 3,
    },
    reviewItemContainer: {
        backgroundColor: '#181C28',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        marginHorizontal: 15,
        borderWidth: 1,
        borderColor: '#22283C'
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    reviewUserEmail: {
        color: '#E0E0E0',
        fontSize: 14,
        fontWeight: 'bold',
    },
    reviewText: {
        color: '#CED1D6',
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 6,
    },
    reviewDate: {
        color: '#7A7A7A',
        fontSize: 11,
        textAlign: 'right',
        flex: 1,
    },
    noReviewsText: {
        color: '#7A7A7A',
        textAlign: 'center',
        marginTop: 15, 
        fontStyle: 'italic',
    },
    emptyReviewContainer: { 
        paddingHorizontal: 15, 
        paddingVertical: 20,
    },
    userReviewSection: {
        marginTop: 20,
        marginBottom: 10,
        padding: 15,
        backgroundColor: '#181C28',
        borderRadius: 8,
    },
    actionButton: {
        backgroundColor: '#FF7A59',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    yourReviewText: {
        color: '#CED1D6',
        fontSize: 14,
        marginTop: 8,
        marginBottom: 5,
        fontStyle: 'italic'
    },
    yourReviewTags: {
        color: '#A0A3A8',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 4,
    },
    yourReviewSpoiler: {
        color: '#FFCC00',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 4,
    },
    spoilerWarningButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a38',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginVertical: 5,
    },
    spoilerWarningText: {
        color: '#FFCC00',
        fontSize: 13,
        marginLeft: 8,
        flexShrink: 1, 
    },
    reviewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    tagsContainerReview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1, 
        marginRight: 5,
    },
    tagReview: {
        backgroundColor: '#33374C',
        color: '#B0B3B8',
        fontSize: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 5,
        marginBottom: 5,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContainer: {
        width: '85%',
        maxHeight: '70%',
        backgroundColor: '#1B202D',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 15,
        textAlign: 'center'
    },
    modalFlatList: {
        maxHeight: screenHeight * 0.4, 
    },
    modalListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#3A3F4B',
    },
    modalListItemSelected: {
    },
    modalListItemText: {
        fontSize: 16,
        color: '#E0E0E0',
        flex: 1, 
        marginRight: 10,
    },
    modalNoListsText: {
        fontSize: 15,
        color: '#A0A3A8',
        textAlign: 'center',
        marginVertical: 20,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 25,
    },
    modalButton: {
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 25,
        minWidth: 110,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#4A4E5A',
    },
    modalButtonConfirm: {
        backgroundColor: '#FF7A59',
    },
    modalButtonDisabled: {
        opacity: 0.5,
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default MovieDetailsScreen;