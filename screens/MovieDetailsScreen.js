// Importações de módulos e componentes necessários do React Native e outras bibliotecas
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ActivityIndicator, // Indicador de carregamento
    Dimensions, // Para obter dimensões da tela
    TouchableOpacity, // Componente para tornar views clicáveis
    Platform, // Para código específico da plataforma (iOS/Android)
    FlatList, // Lista otimizada para grandes volumes de dados
    Modal, // Componente para exibir conteúdo sobre a tela principal
    Pressable, // Componente para interações de toque mais granulares
    Alert // Para exibir alertas nativos
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Biblioteca de ícones
import { AuthContext } from '../AuthContext'; // Contexto de autenticação para obter dados do usuário
import { jwtDecode } from 'jwt-decode'; // Biblioteca para decodificar tokens JWT
import { useFocusEffect } from '@react-navigation/native'; // Hook para executar efeitos quando a tela está focada

// Obtém as dimensões da tela (largura e altura)
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// URL base da API para requisições ao backend
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

// Componente para renderizar um item individual de crítica/review
const ReviewItem = ({ item, currentUserId }) => {
    // Estado para controlar a visibilidade do conteúdo de spoiler
    const [showSpoilerContent, setShowSpoilerContent] = useState(false);
    // Verifica se o usuário atual é o autor da crítica
    const isUserAuthor = currentUserId === item.userId;

    // Função para alternar a visibilidade do conteúdo de spoiler
    const alternarSpoiler = () => {
        setShowSpoilerContent(!showSpoilerContent);
    };

    // Função para formatar a data da crítica
    const formatarData = (dateString) => {
        if (!dateString) return 'Data não disponível';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Função para renderizar as estrelas de avaliação para uma crítica específica
    const renderizarAvaliacaoEstrelasParaItem = (rating, starSize = 14, color = "#FFC0CB") => {
        const fullStars = Math.floor(rating); // Número de estrelas cheias
        const halfStar = rating % 1 >= 0.5; // Verifica se há meia estrela
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0); // Número de estrelas vazias
        let stars = [];
        // Adiciona estrelas cheias
        for (let i = 0; i < fullStars; i++) {
            stars.push(<MaterialCommunityIcons key={`full-item-${i}-${item._id}-review`} name="star" size={starSize} color={color} />);
        }
        // Adiciona meia estrela, se houver
        if (halfStar) {
            stars.push(<MaterialCommunityIcons key={`half-item-${item._id}-review`} name="star-half-full" size={starSize} color={color} />);
        }
        // Adiciona estrelas vazias
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<MaterialCommunityIcons key={`empty-item-${i}-${item._id}-review`} name="star-outline" size={starSize} color={color} />);
        }
        return <View style={{ flexDirection: 'row' }}>{stars}</View>; // Retorna a view com as estrelas
    };

    return (
        // Container principal do item da crítica
        <View style={styles.reviewItemContainer}>
            {/* Cabeçalho da crítica com email do usuário e estrelas */}
            <View style={styles.reviewHeader}>
                <Text style={styles.reviewUserEmail}>{item.userEmail || 'Usuário Anônimo'}</Text>
                {renderizarAvaliacaoEstrelasParaItem(item.rating)}
            </View>

            {/* Lógica para exibir aviso de spoiler ou o texto da crítica */}
            {item.isSpoiler && !isUserAuthor && !showSpoilerContent ? (
                // Botão para mostrar conteúdo com spoiler
                <TouchableOpacity onPress={alternarSpoiler} style={styles.spoilerWarningButton}>
                    <MaterialCommunityIcons name="alert-outline" size={16} color="#FFCC00" />
                    <Text style={styles.spoilerWarningText}>Esta crítica contém spoilers. Mostrar assim mesmo?</Text>
                </TouchableOpacity>
            ) : (
                // Texto da crítica (se houver)
                item.reviewText && <Text style={styles.reviewText}>{item.reviewText}</Text>
            )}

            {/* Rodapé da crítica com tags e data */}
            <View style={styles.reviewFooter}>
                {/* Container para tags, se existirem */}
                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagsContainerReview}>
                        {item.tags.map((tag, index) => (
                            <Text key={index} style={styles.tagReview}>{tag}</Text>
                        ))}
                    </View>
                )}
                {/* Data da crítica */}
                <Text style={styles.reviewDate}>{formatarData(item.createdAt)}</Text>
            </View>
        </View>
    );
};


// Componente principal da tela de detalhes do filme
const MovieDetailsScreen = ({ route, navigation }) => {
    // Parâmetros recebidos da navegação (ID e título do filme)
    const { movieId, movieTitle } = route.params;
    // Token do usuário obtido do contexto de autenticação
    const { userToken } = useContext(AuthContext);
    // Estado para armazenar o ID do usuário atual
    const [currentUserId, setCurrentUserId] = useState(null);

    // Estados para armazenar dados do filme, críticas, estatísticas, etc.
    const [movieDetails, setMovieDetails] = useState(null); // Detalhes do filme
    const [reviews, setReviews] = useState([]); // Lista de críticas
    const [movieStats, setMovieStats] = useState({ averageRating: 0, reviewCount: 0 }); // Estatísticas (média, contagem)
    const [isLoading, setIsLoading] = useState(true); // Indicador de carregamento da tela
    const [error, setError] = useState(null); // Mensagem de erro
    const [currentUserReview, setCurrentUserReview] = useState(null); // Crítica do usuário atual para este filme

    // Estados para o modal de adicionar filme a listas
    const [isListModalVisible, setIsListModalVisible] = useState(false); // Visibilidade do modal
    const [userListsForModal, setUserListsForModal] = useState([]); // Listas do usuário a serem exibidas no modal
    const [selectedListsInModal, setSelectedListsInModal] = useState({}); // Listas selecionadas no modal
    const [isLoadingListsModal, setIsLoadingListsModal] = useState(false); // Carregamento das listas no modal
    const [isSubmittingToList, setIsSubmittingToList] = useState(false); // Indicador de envio ao adicionar/remover de listas
    const [moviePresenceInUserLists, setMoviePresenceInUserLists] = useState({}); // Mapa da presença do filme nas listas do usuário

    // Efeito para decodificar o token do usuário e obter o ID do usuário
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
    }, [userToken]); // Executa quando o userToken muda

    // Função para verificar em quais listas do usuário o filme atual já está
    const verificarPresencaFilmeEmListas = useCallback(async () => {
        if (!userToken || !movieId) return { lists: [], presenceMap: {} }; // Retorna se não houver token ou ID do filme
        try {
            const response = await fetch(`${API_BASE_URL}/api/lists`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const listsData = await response.json();
            if (response.ok) {
                const presenceMap = {};
                // Mapeia cada lista para verificar se o filme está nela
                listsData.forEach(list => {
                    presenceMap[list._id] = list.movies.some(movie => movie.tmdbId === movieId.toString());
                });
                setMoviePresenceInUserLists(presenceMap); // Atualiza o estado da presença do filme
                return { lists: listsData, presenceMap };
            } else {
                 console.warn("Resposta não OK ao buscar listas:", listsData.message || response.status);
            }
        } catch (e) {
            console.warn("Falha ao verificar presença do filme nas listas:", e);
        }
        return { lists: [], presenceMap: {} }; // Retorno padrão em caso de falha
    }, [userToken, movieId]); // Dependências da função

    // Função para buscar todos os dados do filme (detalhes, críticas, estatísticas)
    const buscarTodosDadosFilme = useCallback(async () => {
        if (!movieId) { // Verifica se o ID do filme foi fornecido
            setError("ID do filme não fornecido.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true); // Inicia o carregamento
        setError(null); // Limpa erros anteriores
        try {
            // Promises para buscar dados em paralelo
            const detailsPromise = fetch(`${API_BASE_URL}/api/tmdb/movie/${movieId}`).then(res => res.text().then(text => {
                if (!res.ok) throw new Error(`Detalhes: ${res.status} - ${text}`); // Trata erro na resposta
                try { return JSON.parse(text); } catch (e) { throw new Error(`Detalhes (JSON parse error): ${e.message} - Response: ${text}`); } // Trata erro no parse do JSON
            }));
            const reviewsPromise = fetch(`${API_BASE_URL}/api/reviews/${movieId}`).then(res => res.text().then(text => {
                if (!res.ok) { console.warn(`Reviews: ${res.status} - ${text}`); return []; } // Trata erro, retorna array vazio
                try { return JSON.parse(text); } catch (e) { console.warn(`Reviews (JSON parse error): ${e.message} - Response: ${text}`); return []; } // Trata erro no parse, retorna array vazio
            }));
            const statsPromise = fetch(`${API_BASE_URL}/api/movies/${movieId}/stats`).then(res => res.text().then(text => {
                if (!res.ok) { console.warn(`Stats: ${res.status} - ${text}`); return { averageRating: 0, reviewCount: 0 }; } // Trata erro, retorna stats padrão
                try { return JSON.parse(text); } catch (e) { console.warn(`Stats (JSON parse error): ${e.message} - Response: ${text}`); return { averageRating: 0, reviewCount: 0 }; } // Trata erro no parse, retorna stats padrão
            }));

            // Verifica a presença do filme nas listas do usuário
            await verificarPresencaFilmeEmListas();

            // Aguarda a resolução de todas as promises
            const [detailsData, reviewsData, statsData] = await Promise.all([
                detailsPromise,
                reviewsPromise,
                statsPromise
            ]);

            // Atualiza os estados com os dados recebidos
            setMovieDetails(detailsData);
            setReviews(reviewsData);
            setMovieStats(statsData);

        } catch (err) {
            console.error("Erro em buscarTodosDadosFilme:", err);
            setError(err.message || 'Falha ao carregar dados do filme.');
        } finally {
            setIsLoading(false); // Finaliza o carregamento
        }
    }, [movieId, verificarPresencaFilmeEmListas]); // Dependências da função

    // Hook para executar `buscarTodosDadosFilme` quando a tela ganha foco
    useFocusEffect(
        useCallback(() => {
            buscarTodosDadosFilme();
        }, [buscarTodosDadosFilme])
    );

    // Efeito para encontrar a crítica do usuário atual entre as críticas carregadas
    useEffect(() => {
        if (currentUserId && reviews && reviews.length > 0) {
            const foundReview = reviews.find(review => review.userId === currentUserId);
            setCurrentUserReview(foundReview || null); // Define a crítica do usuário ou null se não encontrada
        } else if (!currentUserId || (reviews && reviews.length === 0)) {
            setCurrentUserReview(null); // Limpa se não houver usuário ou críticas
        }
    }, [reviews, currentUserId]); // Executa quando reviews ou currentUserId mudam

    // Função para abrir o modal de adicionar/remover filme de listas
    const abrirModalListas = async () => {
        if (!userToken) return; // Retorna se o usuário não estiver logado
        setIsLoadingListsModal(true); // Inicia carregamento das listas no modal
        setIsListModalVisible(true); // Torna o modal visível
        try {
            const { lists: data, presenceMap } = await verificarPresencaFilmeEmListas(); // Busca as listas e a presença do filme

            if (data && data.length >= 0) {
                setUserListsForModal(data); // Define as listas para o modal
                const currentSelections = {};
                // Define as seleções iniciais no modal com base na presença atual
                data.forEach(list => {
                    currentSelections[list._id] = presenceMap[list._id] || false;
                });
                setSelectedListsInModal(currentSelections); // Atualiza o estado das seleções
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
            setIsLoadingListsModal(false); // Finaliza o carregamento das listas no modal
        }
    };

    // Função para alternar a seleção de uma lista no modal
    const alternarSelecaoListaNoModal = (listId) => {
        setSelectedListsInModal(prev => ({ ...prev, [listId]: !prev[listId] }));
    };

    // Função para confirmar as alterações feitas no modal de listas
    const confirmarAdicionarFilmeAsListas = async () => {
        if (!movieDetails || !userToken) return; // Retorna se não houver detalhes do filme ou token

        const initialPresenceMap = { ...moviePresenceInUserLists }; // Guarda o estado inicial da presença

        // Filtra as listas que foram modificadas no modal
        const listsToModifyBasedOnModal = userListsForModal.filter(list =>
            selectedListsInModal[list._id] !== initialPresenceMap[list._id]
        );

        // Se nenhuma lista foi modificada, fecha o modal
        if (listsToModifyBasedOnModal.length === 0) {
            setIsListModalVisible(false);
            return;
        }

        setIsSubmittingToList(true); // Inicia o indicador de submissão
        let successMessages = []; // Array para mensagens de sucesso
        let errorMessages = []; // Array para mensagens de erro

        // Itera sobre as listas modificadas para adicionar ou remover o filme
        for (const list of listsToModifyBasedOnModal) {
            const shouldBeInList = selectedListsInModal[list._id]; // Define se o filme deve estar na lista
            let method, endpoint;

            // Define o método HTTP e o endpoint com base na ação (adicionar/remover)
            if (shouldBeInList) {
                method = 'POST'; // Adicionar filme
                endpoint = `${API_BASE_URL}/api/lists/${list._id}/movies`;
            } else {
                method = 'DELETE'; // Remover filme
                endpoint = `${API_BASE_URL}/api/lists/${list._id}/movies/${movieId}`;
            }

            try {
                // Define o corpo da requisição para POST
                const body = method === 'POST' ? JSON.stringify({
                    tmdbId: movieDetails.id.toString(),
                    title: movieDetails.title,
                    posterPath: movieDetails.poster_path
                }) : null;

                // Realiza a requisição para a API
                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: body
                });
                const data = await response.json();

                // Trata a resposta da API
                if (response.ok) {
                    successMessages.push(method === 'POST' ? `Adicionado a "${list.name}"` : `Removido de "${list.name}"`);
                } else {
                    errorMessages.push(`Falha em "${list.name}": ${data.message || 'Erro desconhecido'}`);
                }
            } catch (e) {
                errorMessages.push(`Erro de rede em "${list.name}": ${e.message}`);
            }
        }

        setIsSubmittingToList(false); // Finaliza o indicador de submissão
        setIsListModalVisible(false); // Fecha o modal

        // Atualiza a presença do filme nas listas após as modificações
        try {
            await verificarPresencaFilmeEmListas();
        } catch (e) {
            console.warn("Falha ao atualizar presença do filme nas listas após modificação:", e);
        }

        // Exibe alertas com base no resultado das operações
        if (successMessages.length > 0 && errorMessages.length === 0) {
            Alert.alert("Sucesso", successMessages.join('\n'));
        } else if (successMessages.length > 0 && errorMessages.length > 0) {
            Alert.alert("Concluído com Observações", `${successMessages.join('\n')}\n\nErros:\n${errorMessages.join('\n')}`);
        } else if (errorMessages.length > 0) {
            Alert.alert("Erro", errorMessages.join('\n'));
        }
    };

    // Função para formatar a duração do filme (runtime) em horas e minutos
    const formatarDuracao = (runtime) => {
        if (!runtime || runtime <= 0) return '';
        const hours = Math.floor(runtime / 60);
        const minutes = runtime % 60;
        return `${hours}h ${minutes}min`;
    };

    // Função para renderizar as estrelas de avaliação global do filme
    const renderizarAvaliacaoEstrelasGlobal = (rating, starSize = 16, color = "#FFD700") => {
        const fullStars = Math.floor(rating); // Número de estrelas cheias
        const halfStar = rating % 1 >= 0.5; // Verifica se há meia estrela
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0); // Número de estrelas vazias
        let stars = [];
        const baseKey = movieDetails ? movieDetails.id : 'global'; // Chave base para os ícones
        // Adiciona estrelas cheias
        for (let i = 0; i < fullStars; i++) {
            stars.push(<MaterialCommunityIcons key={`full-${baseKey}-${i}`} name="star" size={starSize} color={color} />);
        }
        // Adiciona meia estrela, se houver
        if (halfStar) {
            stars.push(<MaterialCommunityIcons key={`half-${baseKey}`} name="star-half-full" size={starSize} color={color} />);
        }
        // Adiciona estrelas vazias
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<MaterialCommunityIcons key={`empty-${baseKey}-${i}`} name="star-outline" size={starSize} color={color} />);
        }
        return <View style={{ flexDirection: 'row' }}>{stars}</View>; // Retorna a view com as estrelas
    };

    // Componente interno para renderizar o conteúdo principal dos detalhes do filme
    const MovieDetailsContent = () => {
        // Verifica se os detalhes do filme estão disponíveis
        if (!movieDetails) {
             if (isLoading && !error) return null; // Retorna nulo se estiver carregando e sem erro
             if (error) return <Text style={styles.errorTextInHeader}>{error.message || String(error)}</Text>; // Exibe erro se houver
             return <Text style={styles.errorTextInHeader}>Detalhes do filme não disponíveis.</Text>; // Mensagem padrão se não houver detalhes
        }
        // URL do pôster do filme
        const posterPath = movieDetails.poster_path
            ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
            : null;

        // Verifica se o filme está atualmente em alguma lista do usuário
        const isMovieCurrentlyInAnyList = Object.values(moviePresenceInUserLists).some(inList => inList);

        return (
            // Container do conteúdo (não rolável, pois está dentro de uma FlatList)
            <View style={styles.contentContainerNoScroll}>
                {/* Seção do cabeçalho com pôster e título */}
                <View style={styles.headerSection}>
                    {posterPath ? (
                        <Image source={{ uri: posterPath }} style={styles.posterImage} resizeMode="contain" />
                    ) : (
                        // Placeholder para o pôster caso não haja imagem
                        <View style={styles.posterPlaceholder}><MaterialCommunityIcons name="movie-open-outline" size={50} color="#7A7A7A" /></View>
                    )}
                    {/* Container do título e tagline */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.movieTitle}>{movieDetails.title}</Text>
                        {movieDetails.tagline && <Text style={styles.tagline}>{movieDetails.tagline}</Text>}
                    </View>
                </View>

                {/* Botão para adicionar/gerenciar listas, visível se o usuário estiver logado */}
                {userToken && movieDetails && (
                    <TouchableOpacity
                        style={[styles.addToListButton, isMovieCurrentlyInAnyList && styles.addToListButtonActive]} // Estilo dinâmico
                        onPress={abrirModalListas} // Abre o modal de listas
                    >
                        <MaterialCommunityIcons
                            name={isMovieCurrentlyInAnyList ? "playlist-check" : "playlist-plus"} // Ícone dinâmico
                            size={24}
                            color={isMovieCurrentlyInAnyList ? "#FFFFFF" : "#FF7A59"} />
                        <Text style={[styles.addToListButtonText, isMovieCurrentlyInAnyList && styles.addToListButtonTextActive]}>
                            {isMovieCurrentlyInAnyList ? "Gerenciar Listas" : "Adicionar à Lista"} {/* Texto dinâmico */}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Linha de informações: ano, duração, avaliação média */}
                <View style={styles.infoRow}>
                    <Text style={styles.infoText}>
                        {movieDetails.release_date ? movieDetails.release_date.substring(0, 4) : 'N/A'} {/* Ano de lançamento */}
                    </Text>
                    {/* Duração do filme, se disponível */}
                    {!!formatarDuracao(movieDetails.runtime) && (
                        <>
                            <Text style={styles.infoSeparator}>•</Text>
                            <Text style={styles.infoText}>{formatarDuracao(movieDetails.runtime)}</Text>
                        </>
                    )}
                    {/* Avaliação média e contagem de críticas, se houver */}
                    {movieStats.reviewCount > 0 && (
                        <>
                            <Text style={styles.infoSeparator}>•</Text>
                            <MaterialCommunityIcons name="star" size={14} color="#FFD700" style={{ marginRight: 4 }}/>
                            <Text style={styles.infoTextBold}>{movieStats.averageRating.toFixed(1)}</Text>
                            <Text style={styles.infoText}> ({movieStats.reviewCount} {movieStats.reviewCount === 1 ? 'avaliação' : 'avaliações'})</Text>
                        </>
                    )}
                </View>

                 {/* Gêneros do filme */}
                {movieDetails.genres && movieDetails.genres.length > 0 && (
                    <View style={styles.genresContainer}>
                        {movieDetails.genres.map(genre => (
                            <View key={genre.id} style={styles.genreTag}>
                                <Text style={styles.genreText}>{genre.name}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Seção da crítica do usuário atual, visível se logado */}
                {userToken && (
                    <View style={styles.userReviewSection}>
                        <Text style={styles.sectionTitle}>Sua Avaliação</Text>
                        {currentUserReview ? (
                            // Exibe a crítica existente do usuário
                            <View>
                                {renderizarAvaliacaoEstrelasGlobal(currentUserReview.rating, 20)}
                                {currentUserReview.reviewText && <Text style={styles.yourReviewText}>{currentUserReview.reviewText}</Text>}
                                {currentUserReview.tags && currentUserReview.tags.length > 0 && (
                                    <Text style={styles.yourReviewTags}>Tags: {currentUserReview.tags.join(', ')}</Text>
                                )}
                                {currentUserReview.isSpoiler && <Text style={styles.yourReviewSpoiler}>Marcado como spoiler</Text>}
                                {/* Botão para editar a crítica */}
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => navigation.navigate('ReviewForm', { // Navega para o formulário de crítica
                                        movieId,
                                        movieTitle: movieDetails.title,
                                        existingReview: currentUserReview // Passa a crítica existente
                                    })}
                                >
                                    <Text style={styles.actionButtonText}>Editar sua Crítica</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            // Botão para adicionar uma nova crítica
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('ReviewForm', { // Navega para o formulário de crítica
                                    movieId,
                                    movieTitle: movieDetails.title
                                })}
                            >
                                <Text style={styles.actionButtonText}>Avaliar e Escrever Crítica</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Seção da sinopse */}
                <Text style={styles.sectionTitle}>Sinopse</Text>
                <Text style={styles.overviewText}>
                    {movieDetails.overview || "Sinopse não disponível."}
                </Text>

                {/* Seção do elenco principal */}
                {movieDetails.credits && movieDetails.credits.cast && movieDetails.credits.cast.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Elenco Principal</Text>
                        {/* Mapeia os 6 primeiros atores do elenco */}
                        {movieDetails.credits.cast.slice(0, 6).map(actor => (
                            <Text key={actor.cast_id || actor.id} style={styles.actorText}>
                                {actor.name} <Text style={{color: '#888'}}>como {actor.character}</Text>
                            </Text>
                        ))}
                    </>
                )}

                 {/* Título da seção de críticas, exibe contagem se houver críticas */}
                 {(reviews && reviews.length > 0 || (isLoading && (!reviews || reviews.length === 0))) && (
                     <Text style={styles.sectionTitle}>Críticas {isLoading && (!reviews || reviews.length === 0) ? '' : `(${reviews.length})`}</Text>
                 )}
            </View>
        );
    };

    // Tela de carregamento enquanto os detalhes do filme não são carregados
    if (isLoading && !movieDetails) {
        return (
            <View style={styles.centeredMessageContainer}>
                <ActivityIndicator size="large" color="#FF7A59" />
                <Text style={styles.loadingText}>Carregando detalhes...</Text>
            </View>
        );
    }

    // Tela de erro se houver falha ao carregar e não houver detalhes do filme
    if (error && !movieDetails) {
        return (
            <View style={styles.centeredMessageContainer}>
                <Text style={styles.errorText}>{error.message || String(error)}</Text>
            </View>
        );
    }

    // URL da imagem de fundo (backdrop)
    const backdropPath = movieDetails?.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${movieDetails.backdrop_path}`
        : null;

    // Renderização principal da tela
    return (
        // Container seguro para a área da tela
        <View style={styles.safeArea}>
            {/* Imagem de fundo (backdrop) */}
            {backdropPath && (
                <Image source={{ uri: backdropPath }} style={styles.backdropImage} resizeMode="cover" />
            )}
            {/* Overlay sobre a imagem de fundo para escurecer */}
            <View style={styles.overlay} />
            {/* Botão de voltar */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* FlatList para exibir o conteúdo dos detalhes (cabeçalho) e a lista de críticas */}
            <FlatList
                data={reviews} // Dados para a lista (críticas)
                renderItem={({item}) => <ReviewItem item={item} currentUserId={currentUserId} /> } // Renderiza cada item da crítica
                keyExtractor={(item) => item._id ? item._id.toString() : `review-${Math.random()}`} // Chave única para cada item
                ListHeaderComponent={MovieDetailsContent} // Componente do cabeçalho (detalhes do filme)
                ListEmptyComponent={ // Componente exibido se a lista de críticas estiver vazia
                    !isLoading && movieDetails && reviews.length === 0 ? (
                        <View style={styles.emptyReviewContainer}>
                            <Text style={styles.noReviewsText}>Ainda não há críticas para este filme.</Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={styles.flatListContentContainer} // Estilo do container do conteúdo da FlatList
                style={styles.container} // Estilo da FlatList
                onRefresh={buscarTodosDadosFilme} // Função para atualizar (pull-to-refresh)
                refreshing={isLoading} // Indicador de atualização
            />

            {/* Modal para adicionar/remover filme de listas */}
            <Modal
                animationType="slide" // Tipo de animação do modal
                transparent={true} // Fundo transparente
                visible={isListModalVisible} // Visibilidade controlada pelo estado
                onRequestClose={() => setIsListModalVisible(false)} // Função ao fechar o modal (botão voltar do Android)
            >
                {/* Overlay clicável para fechar o modal */}
                <Pressable style={styles.modalOverlay} onPress={() => setIsListModalVisible(false)}>
                    {/* Container do modal (para evitar que o clique feche se for dentro dele) */}
                    <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Adicionar "{movieTitle}" a:</Text>

                        {/* Carregamento ou lista de listas do usuário */}
                        {isLoadingListsModal ? (
                            <ActivityIndicator size="small" color="#FF7A59" style={{marginVertical: 20}} />
                        ) : userListsForModal.length > 0 ? (
                            // FlatList para as listas do usuário
                            <FlatList
                                data={userListsForModal}
                                style={styles.modalFlatList}
                                keyExtractor={item => item._id.toString()}
                                renderItem={({ item }) => (
                                    // Item da lista clicável para selecionar/desselecionar
                                    <Pressable
                                        style={[styles.modalListItem, selectedListsInModal[item._id] && styles.modalListItemSelected]}
                                        onPress={() => alternarSelecaoListaNoModal(item._id)}
                                    >
                                        <Text style={styles.modalListItemText}>{item.name}</Text>
                                        {/* Ícone de checkbox */}
                                        <MaterialCommunityIcons
                                            name={selectedListsInModal[item._id] ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                                            size={24}
                                            color={selectedListsInModal[item._id] ? "#FF7A59" : "#7A7A7A"}
                                        />
                                    </Pressable>
                                )}
                            />
                        ) : (
                            // Mensagem se o usuário não tiver listas
                            <Text style={styles.modalNoListsText}>Você ainda não tem listas. Crie uma na aba "Listas"!</Text>
                        )}
                        {/* Botões de Cancelar e Confirmar no modal */}
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsListModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonConfirm, (isSubmittingToList || isLoadingListsModal || userListsForModal.length === 0) && styles.modalButtonDisabled]} // Estilo dinâmico para desabilitar
                                onPress={confirmarAdicionarFilmeAsListas}
                                disabled={isSubmittingToList || isLoadingListsModal || userListsForModal.length === 0} // Desabilita se estiver submetendo, carregando ou sem listas
                            >
                                {/* Exibe ActivityIndicator ou texto Confirmar */}
                                {isSubmittingToList ? <ActivityIndicator size="small" color="#FFFFFF"/> : <Text style={styles.modalButtonText}>Confirmar</Text> }
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

// Estilos do componente
const styles = StyleSheet.create({
    safeArea: { // Estilo para a área segura da tela
        flex: 1,
        backgroundColor: '#10141E', // Cor de fundo
        paddingTop: Platform.OS === 'android' ? 0 : 0, // Remove padding do StatusBar, pois o layout já considera
    },
    container: { // Container principal da FlatList
        flex: 1,
    },
    flatListContentContainer: { // Estilo para o conteúdo dentro da FlatList
        paddingBottom: 50, // Espaçamento inferior
    },
    centeredMessageContainer: { // Container para mensagens centralizadas (loading, erro)
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#10141E',
        paddingHorizontal: 20,
    },
    loadingText: { // Texto de carregamento
        marginTop: 10,
        color: '#FFFFFF',
        fontSize: 16,
    },
    errorText: { // Texto de erro geral
        color: '#FF7A59',
        fontSize: 16,
        textAlign: 'center',
    },
    errorTextInHeader: { // Texto de erro específico para o cabeçalho
        color: '#FF7A59',
        fontSize: 16,
        textAlign: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    backdropImage: { // Imagem de fundo (backdrop)
        width: '100%',
        height: screenHeight * 0.35, // Altura relativa à tela
        position: 'absolute', // Posicionamento absoluto
        top: 0,
    },
    overlay: { // Overlay sobre a imagem de fundo
        ...StyleSheet.absoluteFillObject, // Preenche o pai
        backgroundColor: 'rgba(16, 20, 30, 0.5)', // Cor semi-transparente
        height: screenHeight * 0.35, // Mesma altura do backdrop
        position: 'absolute',
        top: 0,
    },
    backButton: { // Botão de voltar
        position: 'absolute',
        top: Platform.OS === 'android' ? 15 : 55, // Posição ajustada para iOS e Android
        left: 15,
        zIndex: 10, // Para ficar sobre outros elementos
        backgroundColor: 'rgba(0,0,0,0.4)', // Fundo semi-transparente
        borderRadius: 20,
        padding: 6,
    },
    contentContainerNoScroll: { // Container do conteúdo principal (cabeçalho da FlatList)
        marginTop: screenHeight * 0.28, // Margem superior para posicionar abaixo do backdrop
        paddingHorizontal: 15,
        backgroundColor: '#10141E', // Cor de fundo
        borderTopLeftRadius: 25, // Bordas arredondadas no topo
        borderTopRightRadius: 25,
        paddingTop: 20, // Espaçamento interno superior
    },
    headerSection: { // Seção do cabeçalho com pôster e título
        flexDirection: 'row',
        alignItems: 'flex-end', // Alinha itens na parte inferior
        marginTop: -90, // Margem negativa para sobrepor o backdrop
        marginBottom: 15,
    },
    posterImage: { // Imagem do pôster
        width: screenWidth * 0.32, // Largura relativa
        height: (screenWidth * 0.32) * 1.5, // Altura proporcional (aspect ratio 2:3)
        borderRadius: 10,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#2a3045' // Cor da borda
    },
    posterPlaceholder: { // Placeholder do pôster
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
    titleContainer: { // Container do título e tagline
        flex: 1, // Ocupa o espaço restante
        alignSelf: 'flex-end', // Alinha-se ao final do container pai (headerSection)
        paddingBottom: 10,
    },
    movieTitle: { // Título do filme
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 3,
    },
    tagline: { // Tagline do filme
        fontSize: 13,
        fontStyle: 'italic',
        color: '#B0B3B8',
        marginBottom: 8,
    },
    addToListButton: { // Botão "Adicionar à Lista"
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#22283C',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignSelf: 'flex-start', // Alinha à esquerda
        marginBottom: 20,
        marginTop: 5,
    },
    addToListButtonActive: { // Estilo do botão quando o filme está em alguma lista
        backgroundColor: '#FF7A59',
    },
    addToListButtonText: { // Texto do botão "Adicionar à Lista"
        color: '#E0E0E0',
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 14,
    },
    addToListButtonTextActive: { // Estilo do texto do botão quando ativo
        color: '#FFFFFF',
    },
    infoRow: { // Linha de informações (ano, duração, avaliação)
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        flexWrap: 'wrap' // Permite quebra de linha se não couber
    },
    infoText: { // Texto de informação
        color: '#A0A3A8',
        fontSize: 13,
    },
    infoTextBold: { // Texto de informação em negrito
        color: '#E0E0E0',
        fontSize: 13,
        fontWeight: 'bold',
    },
    infoSeparator: { // Separador "•"
        color: '#777',
        marginHorizontal: 6,
        fontSize: 13,
    },
    genresContainer: { // Container dos gêneros
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    genreTag: { // Tag de gênero individual
        backgroundColor: '#22283C',
        borderRadius: 15,
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginRight: 6,
        marginBottom: 6,
    },
    genreText: { // Texto do gênero
        color: '#E0E0E0',
        fontSize: 11,
    },
    sectionTitle: { // Título de seção (Sinopse, Elenco, Críticas)
        fontSize: 19,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 20,
        marginBottom: 10,
        borderLeftWidth: 3, // Linha decorativa à esquerda
        borderLeftColor: '#FF7A59',
        paddingLeft: 8,
    },
    overviewText: { // Texto da sinopse
        fontSize: 14,
        color: '#CED1D6',
        lineHeight: 21, // Altura da linha
        marginBottom: 15,
    },
    actorText: { // Texto do ator/personagem
        fontSize: 13,
        color: '#B0B3B8',
        lineHeight: 19,
        marginBottom: 3,
    },
    reviewItemContainer: { // Container de um item de crítica
        backgroundColor: '#181C28',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        marginHorizontal: 15,
        borderWidth: 1,
        borderColor: '#22283C'
    },
    reviewHeader: { // Cabeçalho de um item de crítica
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    reviewUserEmail: { // Email do usuário na crítica
        color: '#E0E0E0',
        fontSize: 14,
        fontWeight: 'bold',
    },
    reviewText: { // Texto da crítica
        color: '#CED1D6',
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 6,
    },
    reviewDate: { // Data da crítica
        color: '#7A7A7A',
        fontSize: 11,
        textAlign: 'right',
        flex: 1, // Ocupa espaço para alinhar à direita
    },
    noReviewsText: { // Texto para quando não há críticas
        color: '#7A7A7A',
        textAlign: 'center',
        marginTop: 15,
        fontStyle: 'italic',
    },
    emptyReviewContainer: { // Container para a mensagem de "sem críticas"
        paddingHorizontal: 15,
        paddingVertical: 20,
    },
    userReviewSection: { // Seção da crítica do usuário atual
        marginTop: 20,
        marginBottom: 10,
        padding: 15,
        backgroundColor: '#181C28',
        borderRadius: 8,
    },
    actionButton: { // Botão de ação (Avaliar, Editar Crítica)
        backgroundColor: '#FF7A59',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    actionButtonText: { // Texto do botão de ação
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    yourReviewText: { // Texto da crítica do usuário
        color: '#CED1D6',
        fontSize: 14,
        marginTop: 8,
        marginBottom: 5,
        fontStyle: 'italic'
    },
    yourReviewTags: { // Tags da crítica do usuário
        color: '#A0A3A8',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 4,
    },
    yourReviewSpoiler: { // Aviso de spoiler na crítica do usuário
        color: '#FFCC00',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 4,
    },
    spoilerWarningButton: { // Botão de aviso de spoiler
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a38',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginVertical: 5,
    },
    spoilerWarningText: { // Texto do aviso de spoiler
        color: '#FFCC00',
        fontSize: 13,
        marginLeft: 8,
        flexShrink: 1, // Permite que o texto quebre a linha
    },
    reviewFooter: { // Rodapé do item da crítica (tags e data)
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    tagsContainerReview: { // Container das tags na crítica
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1, // Ocupa espaço, permitindo que a data alinhe à direita
        marginRight: 5,
    },
    tagReview: { // Tag individual na crítica
        backgroundColor: '#33374C',
        color: '#B0B3B8',
        fontSize: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 5,
        marginBottom: 5,
    },
    // Estilos do Modal
    modalOverlay: { // Overlay do modal (fundo escurecido)
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContainer: { // Container principal do modal
        width: '85%', // Largura
        maxHeight: '70%', // Altura máxima
        backgroundColor: '#1B202D', // Cor de fundo
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000', // Sombra (iOS)
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5, // Sombra (Android)
    },
    modalTitle: { // Título do modal
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 15,
        textAlign: 'center'
    },
    modalFlatList: { // FlatList dentro do modal
        maxHeight: screenHeight * 0.4, // Altura máxima para a lista de listas
    },
    modalListItem: { // Item individual da lista no modal
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#3A3F4B', // Separador
    },
    modalListItemSelected: { // Estilo (vazio) para item selecionado, pode ser usado para destacar
        // backgroundColor: '#2A2F3B', // Exemplo de destaque
    },
    modalListItemText: { // Texto do item da lista no modal
        fontSize: 16,
        color: '#E0E0E0',
        flex: 1, // Ocupa espaço
        marginRight: 10,
    },
    modalNoListsText: { // Texto para quando não há listas no modal
        fontSize: 15,
        color: '#A0A3A8',
        textAlign: 'center',
        marginVertical: 20,
    },
    modalButtonContainer: { // Container dos botões no modal
        flexDirection: 'row',
        justifyContent: 'space-around', // Espaçamento entre botões
        marginTop: 25,
    },
    modalButton: { // Estilo base do botão no modal
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 25,
        minWidth: 110, // Largura mínima
        alignItems: 'center',
    },
    modalButtonCancel: { // Botão de cancelar no modal
        backgroundColor: '#4A4E5A',
    },
    modalButtonConfirm: { // Botão de confirmar no modal
        backgroundColor: '#FF7A59',
    },
    modalButtonDisabled: { // Estilo para botão desabilitado no modal
        opacity: 0.5,
    },
    modalButtonText: { // Texto dos botões no modal
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default MovieDetailsScreen; // Exporta o componente