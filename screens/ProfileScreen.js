// Importações de módulos e componentes necessários
import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity, // Para botões clicáveis
    StyleSheet,
    SafeAreaView, // Garante que o conteúdo não sobreponha barras de status, etc.
    Platform, // Para verificações de OS (Android/iOS)
    Alert, // Para exibir alertas nativos
    ScrollView, // Permite rolagem do conteúdo
    ActivityIndicator, // Indicador de carregamento
    Image // Para exibir imagens (não usado diretamente aqui, mas comum)
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Biblioteca de ícones
import { AuthContext } from '../AuthContext'; // Contexto de autenticação para dados do usuário e logout
import { jwtDecode } from 'jwt-decode'; // Para decodificar o token JWT e obter informações do usuário
import { useFocusEffect } from '@react-navigation/native'; // Hook para executar ações quando a tela ganha foco

// URL base da API do backend
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

// Componente placeholder para filmes favoritos (enquanto a funcionalidade não está completa)
const FavoriteMoviePlaceholder = () => (
    <View style={styles.favMovieItem}>
        <View style={styles.favMoviePosterPlaceholder}>
            {/* Ícone de rolo de filme como placeholder */}
            <MaterialCommunityIcons name="movie-roll" size={24} color="#7A7A7A" />
        </View>
    </View>
);


// Componente principal da tela de Perfil
const ProfileScreen = ({ navigation }) => {
    // Obtém o token do usuário e a função de signOut do AuthContext
    const { userToken, signOut } = useContext(AuthContext);
    // Estado para armazenar o email do usuário
    const [userEmail, setUserEmail] = useState('');
    // Estado para controlar o carregamento das estatísticas
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    // Estado para armazenar as estatísticas do usuário (contagem de listas e reviews)
    const [stats, setStats] = useState({
        lists: 0,
        reviews: 0,
    });

    // Função para buscar os dados do perfil do usuário (email, contagem de listas e reviews)
    const buscarDadosDoPerfil = useCallback(async () => {
        if (userToken) { // Verifica se existe um token de usuário
            try {
                const decodedToken = jwtDecode(userToken); // Decodifica o token
                setUserEmail(decodedToken.email || 'Email não encontrado'); // Define o email do usuário
                const currentUserId = decodedToken.userId; // Obtém o ID do usuário

                if (!currentUserId) { // Se não houver ID de usuário, para o carregamento
                    setIsLoadingStats(false);
                    setStats({ lists: 0, reviews: 0 });
                    return;
                }
                setIsLoadingStats(true); // Inicia o carregamento das estatísticas

                // Busca a contagem de listas do usuário
                const listsResponse = await fetch(`${API_BASE_URL}/api/lists`, {
                    headers: { 'Authorization': `Bearer ${userToken}` },
                });
                let listsCount = 0;
                if (listsResponse.ok) {
                    const listsData = await listsResponse.json();
                    listsCount = listsData.length; // Define a contagem de listas
                } else {
                    console.error("Erro ao buscar listas:", await listsResponse.text());
                }

                // Busca a contagem de reviews do usuário
                const reviewsCountResponse = await fetch(`${API_BASE_URL}/api/reviews/user/${currentUserId}/count`, {
                    headers: { 'Authorization': `Bearer ${userToken}` },
                });
                let reviewsCountValue = 0;
                if (reviewsCountResponse.ok) {
                    const reviewsCountData = await reviewsCountResponse.json();
                    reviewsCountValue = reviewsCountData.count; // Define a contagem de reviews
                } else {
                     console.error("Erro ao buscar contagem de reviews:", await reviewsCountResponse.text());
                }
                setStats({ lists: listsCount, reviews: reviewsCountValue }); // Atualiza o estado das estatísticas
            } catch (e) {
                console.error("Erro ao decodificar token ou buscar dados do perfil:", e);
                setUserEmail('Erro ao carregar email');
                setStats({ lists: 0, reviews: 0 }); // Define valores padrão em caso de erro
            } finally {
                setIsLoadingStats(false); // Finaliza o carregamento das estatísticas
            }
        } else { // Se não houver token, redefine os estados
            setUserEmail('');
            setStats({ lists: 0, reviews: 0 });
            setIsLoadingStats(false);
        }
    }, [userToken]); // Dependência: userToken

    // Hook para executar `buscarDadosDoPerfil` sempre que a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
            buscarDadosDoPerfil();
            return () => {}; // Função de limpeza opcional
        }, [buscarDadosDoPerfil])
    );

    // Função para lidar com o logout do usuário
    const aoSair = async () => {
        Alert.alert( // Exibe um alerta de confirmação
            "Sair", "Tem certeza que deseja sair da sua conta?",
            [
                { text: "Cancelar", style: "cancel" }, // Botão Cancelar
                { text: "Sair", onPress: async () => { await signOut(); }, style: "destructive" } // Botão Sair, executa signOut
            ]
        );
    };

    // Array de opções do perfil com título, ícone, ação e contagem (se aplicável)
    const profileOptions = [
        {
            title: 'Minhas Listas',
            icon: 'format-list-bulleted',
            action: () => navigation.navigate('ListsStack', { screen: 'MyLists' }), // Navega para a tela de listas
            count: stats.lists // Contagem de listas
        },
        {
            title: 'Minhas Avaliações',
            icon: 'star-outline',
            action: () => Alert.alert("Em Breve", "Visualização das suas avaliações."), // Funcionalidade futura
            count: stats.reviews // Contagem de avaliações
        },
        {
            title: 'Watchlist (Quero Ver)',
            icon: 'bookmark-multiple-outline',
            action: () => Alert.alert("Em Breve", "Sua lista de filmes para assistir."), // Funcionalidade futura
        },
        {
            title: 'Configurações',
            icon: 'cog-outline',
            action: () => Alert.alert("Em Breve", "Configurações da conta e do app.") // Funcionalidade futura
        },
    ];

    // Função para renderizar o conteúdo da seção de estatísticas (listas e avaliações)
    const renderizarConteudoDasEstatisticas = () => {
        // Mostra um indicador de carregamento se as estatísticas estiverem carregando e forem zero
        if (isLoadingStats && (stats.lists === 0 && stats.reviews === 0)) {
            return <ActivityIndicator size="small" color="#FF7A59" style={{ marginVertical: 10 }}/>;
        }
        // Exibe as estatísticas
        return (
            <>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.lists}</Text>
                    <Text style={styles.statLabel}>Listas</Text>
                </View>
                <View style={styles.statSeparator} /> {/* Separador visual */}
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.reviews}</Text>
                    <Text style={styles.statLabel}>Avaliações</Text>
                </View>
            </>
        );
    };

    return (
        // Container SafeArea para a tela
        <SafeAreaView style={styles.safeArea}>
            {/* Cabeçalho da tela com o email do usuário ou "Meu Perfil" */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{userEmail || 'Meu Perfil'}</Text>
            </View>
            {/* ScrollView para permitir rolagem do conteúdo do perfil */}
            <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
                {/* Container do cabeçalho do perfil com avatar e nome/email */}
                <View style={styles.profileHeaderContainer}>
                    <View style={styles.avatarContainer}>
                        {/* Ícone de avatar placeholder */}
                        <MaterialCommunityIcons name="account-circle" size={90} color="#4A4E5A" />
                    </View>
                    <Text style={styles.userNameText}>{userEmail}</Text>
                </View>

                {/* Container das estatísticas */}
                <View style={styles.statsContainer}>
                    {renderizarConteudoDasEstatisticas()}
                </View>

                {/* Seção de Filmes Favoritos (placeholder) */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Filmes Favoritos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
                        {/* Placeholders de filmes favoritos */}
                        <FavoriteMoviePlaceholder />
                        <FavoriteMoviePlaceholder />
                        <FavoriteMoviePlaceholder />
                        <FavoriteMoviePlaceholder />
                         {/* Botão "Ver Todos" (funcionalidade futura) */}
                         <TouchableOpacity style={styles.seeAllButton} onPress={() => Alert.alert("Em Breve", "Ver todos os filmes favoritos.")}>
                            <MaterialCommunityIcons name="arrow-right-circle-outline" size={30} color="#FF7A59" />
                            <Text style={styles.seeAllText}>Ver Todos</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Seção de Atividade Recente (placeholder) */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Atividade Recente</Text>
                    <View style={styles.activityPlaceholder}>
                        <MaterialCommunityIcons name="history" size={24} color="#7A7A7A" style={{marginRight: 8}}/>
                        <Text style={styles.activityTextPlaceholder}>Nenhuma atividade recente para mostrar ou funcionalidade em breve.</Text>
                    </View>
                </View>


                {/* Container das opções do perfil (Minhas Listas, Minhas Avaliações, etc.) */}
                <View style={styles.optionsContainer}>
                    {profileOptions.map((option, index) => (
                        // Botão para cada opção do perfil
                        <TouchableOpacity key={index} style={styles.optionButton} onPress={option.action}>
                            <MaterialCommunityIcons name={option.icon} size={24} color="#FF7A59" style={styles.optionIcon} />
                            <Text style={styles.optionText}>{option.title}</Text>
                            {/* Exibe a contagem se não estiver carregando ou se a contagem for maior que zero */}
                            {(!isLoadingStats || option.count > 0) && typeof option.count === 'number' && (
                                <Text style={styles.optionCount}>{option.count}</Text>
                            )}
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#7A7A7A" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Botão de Sair */}
                <TouchableOpacity style={[styles.optionButton, styles.logoutButton]} onPress={aoSair}>
                    <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" style={styles.optionIcon} />
                    <Text style={[styles.optionText, styles.logoutButtonText]}>Sair</Text>
                </TouchableOpacity>

                {/* Texto com a versão do aplicativo */}
                <Text style={styles.appVersion}>Versão do App: 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

// Estilos do componente
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#10141E' }, // Área segura com cor de fundo
    header: { // Cabeçalho da tela
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 30 : 50, // Padding superior ajustado por plataforma
        paddingBottom: 15, backgroundColor: '#181D2A', borderBottomWidth: 1, borderBottomColor: '#22283C',
    },
    headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' }, // Título do cabeçalho
    scrollView: { flex: 1 }, // ScrollView ocupa o espaço disponível
    profileHeaderContainer: { // Container do cabeçalho do perfil (avatar e nome)
        alignItems: 'center', paddingVertical: 25, backgroundColor: '#141822',
        borderBottomWidth: 1, borderBottomColor: '#22283C', marginBottom: 15,
    },
    avatarContainer: { // Container do avatar
        width: 100, height: 100, borderRadius: 50, backgroundColor: '#2C3244',
        justifyContent: 'center', alignItems: 'center', marginBottom: 15,
        borderWidth: 2, borderColor: '#FF7A59' // Borda do avatar
    },
    userNameText: { fontSize: 20, fontWeight: 'bold', color: '#E0E0E0' }, // Nome/email do usuário
    statsContainer: { // Container das estatísticas
        flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#181D2A',
        paddingVertical: 15, borderRadius: 8, marginHorizontal: 15, marginBottom: 20, minHeight: 60,
    },
    statItem: { alignItems: 'center' }, // Item individual de estatística
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' }, // Valor da estatística
    statLabel: { fontSize: 12, color: '#A0A3A8', marginTop: 3 }, // Rótulo da estatística
    statSeparator: { width: 1, backgroundColor: '#3A3F4B', height: '70%', alignSelf: 'center' }, // Separador visual

    sectionContainer: { // Container de seção (Filmes Favoritos, Atividade Recente)
        marginHorizontal: 15,
        marginBottom: 25,
        backgroundColor: '#181D2A',
        borderRadius: 8,
        paddingVertical: 15,
        paddingHorizontal:10,
    },
    sectionTitle: { // Título da seção
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    horizontalScrollContent: { // Conteúdo da ScrollView horizontal
        paddingRight: 10,
    },
    favMovieItem: { // Item de filme favorito (placeholder)
        width: 90,
        marginRight: 10,
        alignItems: 'center',
    },
    favMoviePosterPlaceholder: { // Placeholder do pôster do filme favorito
        width: 90,
        height: 135,
        backgroundColor: '#2C3244',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    favMovieTitlePlaceholder: { // Placeholder do título do filme favorito (não usado no código atual)
        color: '#A0A3A8',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    seeAllButton: { // Botão "Ver Todos" para filmes favoritos
        width: 90,
        height: 135,
        backgroundColor: '#22283C',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    seeAllText: { // Texto do botão "Ver Todos"
        color: '#FF7A59',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 5,
        textAlign: 'center',
    },
    activityPlaceholder: { // Placeholder da atividade recente
        backgroundColor: '#1B202D',
        padding: 15,
        borderRadius: 6,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginHorizontal:5,
    },
    activityTextPlaceholder: { // Texto do placeholder da atividade recente
        fontSize: 14,
        color: '#A0A3A8',
        fontStyle: 'italic',
        textAlign: 'center',
        flexShrink: 1, // Permite quebra de linha
    },

    optionsContainer: { marginHorizontal: 15, marginTop: 5 }, // Container das opções do perfil
    optionButton: { // Botão de opção individual
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B202D',
        paddingVertical: 16, paddingHorizontal: 15, borderRadius: 8, marginBottom: 10,
    },
    optionIcon: { marginRight: 15 }, // Ícone da opção
    optionText: { flex: 1, fontSize: 16, color: '#E0E0E0' }, // Texto da opção
    optionCount: { fontSize: 15, color: '#A0A3A8', marginRight: 10 }, // Contagem (para Listas/Avaliações)
    logoutButton: { // Botão de Sair
        backgroundColor: '#FF6347', borderColor: '#FF6347', // Cor de fundo e borda (vermelho)
        marginHorizontal: 15, marginTop: 15,
    },
    logoutButtonText: { color: '#FFFFFF', fontWeight: 'bold' }, // Texto do botão de Sair
    appVersion: { textAlign: 'center', color: '#7A7A7A', fontSize: 12, paddingVertical: 20 } // Texto da versão do app
});

export default ProfileScreen; // Exporta o componente