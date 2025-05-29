// Importando hooks e componentes necessários do React e React Native
import React, { useContext, useState, useEffect, useCallback } from 'react';
// Componentes nativos para construir a interface
import {
    View, // Container de layout
    Text, // Exibir textos
    TouchableOpacity, // Botões clicáveis
    StyleSheet, // Estilização
    SafeAreaView, // Garante que o conteúdo fique seguro nas bordas da tela
    StatusBar, // Configura a barra de status do celular
    Platform, // Detecta o sistema operacional
    Alert, // Exibe alertas
    ScrollView, // Permite rolagem de conteúdo
    ActivityIndicator, // Indicador de carregamento
    Image // (não usado aqui) para imagens
} from 'react-native';

// Importando ícones do pacote MaterialCommunityIcons
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Importando o contexto de autenticação
import { AuthContext } from '../AuthContext';

// Biblioteca para decodificar tokens JWT
import { jwtDecode } from 'jwt-decode';

// Hook que executa uma função quando a tela ganha foco
import { useFocusEffect } from '@react-navigation/native';

// URL base da API
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

// Componente para exibir um placeholder de filme favorito
const FavoriteMoviePlaceholder = () => (
    <View style={styles.favMovieItem}>
        <View style={styles.favMoviePosterPlaceholder}>
            <MaterialCommunityIcons name="movie-roll" size={24} color="#7A7A7A" />
        </View>
    </View>
);

// Componente principal da tela de perfil
const ProfileScreen = ({ navigation }) => {
    // Pegando funções do contexto de autenticação
    const { userToken, signOut } = useContext(AuthContext);

    // Estado para armazenar o email do usuário
    const [userEmail, setUserEmail] = useState('');

    // Estado que indica se os dados estatísticos ainda estão carregando
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    // Estado para armazenar estatísticas do usuário (quantidade de listas e avaliações)
    const [stats, setStats] = useState({
        lists: 0,
        reviews: 0,
    });

    // Função que busca os dados do perfil do usuário
    const buscarDadosDoPerfil = useCallback(async () => {
        if (userToken) { // Se o usuário estiver logado
            try {
                // Decodifica o token JWT para pegar informações do usuário
                const decodedToken = jwtDecode(userToken);
                setUserEmail(decodedToken.email || 'Email não encontrado'); // Atualiza o email 
                const currentUserId = decodedToken.userId; // ID do usuário

                if (!currentUserId) { // Se não tiver ID, encerra a função
                    setIsLoadingStats(false);
                    setStats({ lists: 0, reviews: 0 });
                    return;
                }
                setIsLoadingStats(true); // Começa a carregar as estatísticas

                // Faz requisição para buscar as listas do usuário
                const listsResponse = await fetch(`${API_BASE_URL}/api/lists`, {
                    headers: { 'Authorization': `Bearer ${userToken}` },
                });
                let listsCount = 0;
                if (listsResponse.ok) { // Se a resposta for positiva
                    const listsData = await listsResponse.json();
                    listsCount = listsData.length; // Conta quantas listas o usuário tem
                } else {
                    console.error("Erro ao buscar listas:", await listsResponse.text());
                }

                // Faz requisição para buscar a quantidade de avaliações do usuário
                const reviewsCountResponse = await fetch(`${API_BASE_URL}/api/reviews/user/${currentUserId}/count`, {
                    headers: { 'Authorization': `Bearer ${userToken}` },
                });
                let reviewsCountValue = 0;
                if (reviewsCountResponse.ok) {
                    const reviewsCountData = await reviewsCountResponse.json();
                    reviewsCountValue = reviewsCountData.count; // Pega a quantidade de avaliações
                } else {
                    console.error("Erro ao buscar contagem de reviews:", await reviewsCountResponse.text());
                }

                // Atualiza o estado com as estatísticas
                setStats({ lists: listsCount, reviews: reviewsCountValue });
            } catch (e) {
                console.error("Erro ao decodificar token ou buscar dados do perfil:", e);
                setUserEmail('Erro ao carregar email');
                setStats({ lists: 0, reviews: 0 });
            } finally {
                setIsLoadingStats(false); // Finaliza o carregamento
            }
        } else {
            // Se não estiver logado, limpa os dados
            setUserEmail('');
            setStats({ lists: 0, reviews: 0 });
            setIsLoadingStats(false);
        }
    }, [userToken]); // Depende do token

    // Sempre que a tela ganha foco, busca os dados do perfil
    useFocusEffect(
        useCallback(() => {
            buscarDadosDoPerfil();
            return () => {}; // Função de limpeza (não faz nada)
        }, [buscarDadosDoPerfil])
    );

    // Função chamada ao clicar em "Sair"
    const aoSair = async () => {
        Alert.alert(
            "Sair", "Tem certeza que deseja sair da sua conta?",
            [
                { text: "Cancelar", style: "cancel" }, // Opção de cancelar
                { text: "Sair", onPress: async () => { await signOut(); }, style: "destructive" } // Opção de sair
            ]
        );
    };

    // Lista de opções do perfil
    const profileOptions = [
        {
            title: 'Minhas Listas', // Nome da opção
            icon: 'format-list-bulleted', // Ícone
            action: () => navigation.navigate('ListsStack', { screen: 'MyLists' }), // Ação ao clicar
            count: stats.lists // Quantidade de listas
        },
        {
            title: 'Minhas Avaliações',
            icon: 'star-outline',
            action: () => Alert.alert("Em Breve", "Visualização das suas avaliações."),
            count: stats.reviews
        },
        {
            title: 'Watchlist (Quero Ver)',
            icon: 'bookmark-multiple-outline',
            action: () => Alert.alert("Em Breve", "Sua lista de filmes para assistir."),
        },
        {
            title: 'Configurações',
            icon: 'cog-outline',
            action: () => Alert.alert("Em Breve", "Configurações da conta e do app.")
        },
    ];

    // Função que renderiza a parte de estatísticas (listas e avaliações)
    const renderizarConteudoDasEstatisticas = () => {
        if (isLoadingStats && (stats.lists === 0 && stats.reviews === 0)) {
            return <ActivityIndicator size="small" color="#FF7A59" style={{ marginVertical: 10 }}/>; // Se estiver carregando, mostra o indicador
        }
        return (
            <>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.lists}</Text>
                    <Text style={styles.statLabel}>Listas</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.reviews}</Text>
                    <Text style={styles.statLabel}>Avaliações</Text>
                </View>
            </>
        );
    };

    // O que será exibido na tela
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={styles.header.backgroundColor} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{userEmail || 'Meu Perfil'}</Text>
            </View>
            <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
                <View style={styles.profileHeaderContainer}>
                    <View style={styles.avatarContainer}>
                        <MaterialCommunityIcons name="account-circle" size={90} color="#4A4E5A" />
                    </View>
                    <Text style={styles.userNameText}>{userEmail}</Text>
                </View>

                <View style={styles.statsContainer}>
                    {renderizarConteudoDasEstatisticas()}
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Filmes Favoritos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
                        <FavoriteMoviePlaceholder />
                        <FavoriteMoviePlaceholder />
                        <FavoriteMoviePlaceholder />
                        <FavoriteMoviePlaceholder />
                        <TouchableOpacity style={styles.seeAllButton} onPress={() => Alert.alert("Em Breve", "Ver todos os filmes favoritos.")}>
                            <MaterialCommunityIcons name="arrow-right-circle-outline" size={30} color="#FF7A59" />
                            <Text style={styles.seeAllText}>Ver Todos</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Atividade Recente</Text>
                    <View style={styles.activityPlaceholder}>
                        <MaterialCommunityIcons name="history" size={24} color="#7A7A7A" style={{marginRight: 8}}/>
                        <Text style={styles.activityTextPlaceholder}>Nenhuma atividade recente para mostrar ou funcionalidade em breve.</Text>
                    </View>
                </View>

                <View style={styles.optionsContainer}>
                    {profileOptions.map((option, index) => (
                        <TouchableOpacity key={index} style={styles.optionButton} onPress={option.action}>
                            <MaterialCommunityIcons name={option.icon} size={24} color="#FF7A59" style={styles.optionIcon} />
                            <Text style={styles.optionText}>{option.title}</Text>
                            {(!isLoadingStats || option.count > 0) && typeof option.count === 'number' && (
                                <Text style={styles.optionCount}>{option.count}</Text>
                            )}
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#7A7A7A" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={[styles.optionButton, styles.logoutButton]} onPress={aoSair}>
                    <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" style={styles.optionIcon} />
                    <Text style={[styles.optionText, styles.logoutButtonText]}>Sair</Text>
                </TouchableOpacity>

                <Text style={styles.appVersion}>Versão do App: 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#10141E' },
    header: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
        paddingBottom: 15, backgroundColor: '#181D2A', borderBottomWidth: 1, borderBottomColor: '#22283C',
    },
    headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
    scrollView: { flex: 1 },
    profileHeaderContainer: {
        alignItems: 'center', paddingVertical: 25, backgroundColor: '#141822',
        borderBottomWidth: 1, borderBottomColor: '#22283C', marginBottom: 15,
    },
    avatarContainer: {
        width: 100, height: 100, borderRadius: 50, backgroundColor: '#2C3244',
        justifyContent: 'center', alignItems: 'center', marginBottom: 15,
        borderWidth: 2, borderColor: '#FF7A59'
    },
    userNameText: { fontSize: 20, fontWeight: 'bold', color: '#E0E0E0' },
    statsContainer: {
        flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#181D2A',
        paddingVertical: 15, borderRadius: 8, marginHorizontal: 15, marginBottom: 20, minHeight: 60,
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
    statLabel: { fontSize: 12, color: '#A0A3A8', marginTop: 3 },
    statSeparator: { width: 1, backgroundColor: '#3A3F4B', height: '70%', alignSelf: 'center' },

    sectionContainer: {
        marginHorizontal: 15,
        marginBottom: 25,
        backgroundColor: '#181D2A',
        borderRadius: 8,
        paddingVertical: 15,
        paddingHorizontal:10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
        paddingHorizontal: 5,
    },
    horizontalScrollContent: {
        paddingRight: 10,
    },
    favMovieItem: {
        width: 90,
        marginRight: 10,
        alignItems: 'center',
    },
    favMoviePosterPlaceholder: {
        width: 90,
        height: 135,
        backgroundColor: '#2C3244',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    favMovieTitlePlaceholder: {
        color: '#A0A3A8',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    seeAllButton: {
        width: 90,
        height: 135,
        backgroundColor: '#22283C',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    seeAllText: {
        color: '#FF7A59',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 5,
        textAlign: 'center',
    },
    activityPlaceholder: {
        backgroundColor: '#1B202D',
        padding: 15,
        borderRadius: 6,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginHorizontal:5,
    },
    activityTextPlaceholder: {
        fontSize: 14,
        color: '#A0A3A8',
        fontStyle: 'italic',
        textAlign: 'center',
        flexShrink: 1,
    },

    optionsContainer: { marginHorizontal: 15, marginTop: 5 },
    optionButton: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B202D',
        paddingVertical: 16, paddingHorizontal: 15, borderRadius: 8, marginBottom: 10,
    },
    optionIcon: { marginRight: 15 },
    optionText: { flex: 1, fontSize: 16, color: '#E0E0E0' },
    optionCount: { fontSize: 15, color: '#A0A3A8', marginRight: 10 },
    logoutButton: {
        backgroundColor: '#FF6347', borderColor: '#FF6347',
        marginHorizontal: 15, marginTop: 15,
    },
    logoutButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
    appVersion: { textAlign: 'center', color: '#7A7A7A', fontSize: 12, paddingVertical: 20 }
});

export default ProfileScreen;