// Importações de módulos e componentes necessários
import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TextInput, // Campo de entrada de texto
    TouchableOpacity, // Para botões clicáveis
    StyleSheet,
    ScrollView, // Permite rolagem do conteúdo
    Switch, // Componente de interruptor (liga/desliga)
    ActivityIndicator, // Indicador de carregamento
    Alert, // Para exibir alertas nativos
    Platform // Para verificações de OS (Android/iOS)
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Biblioteca de ícones
import { AuthContext } from '../AuthContext'; // Contexto de autenticação para obter o token do usuário
// jwt-decode não é usado diretamente aqui, mas foi importado no original. Pode ser resquício ou para uso futuro.

// URL base da API do backend
const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

// Componente do formulário de avaliação/crítica
const ReviewFormScreen = ({ route, navigation }) => {
    // Parâmetros recebidos da navegação: ID do filme, título e crítica existente (se houver)
    const { movieId, movieTitle, existingReview } = route.params;
    // Obtém o token do usuário do AuthContext
    const { userToken } = useContext(AuthContext);

    // Estados para os campos do formulário
    const [rating, setRating] = useState(existingReview ? existingReview.rating : 0); // Nota (0-5)
    const [reviewText, setReviewText] = useState(existingReview ? existingReview.reviewText : ''); // Texto da crítica
    const [tags, setTags] = useState(existingReview && existingReview.tags ? existingReview.tags.join(', ') : ''); // Tags (string separada por vírgulas)
    const [isSpoiler, setIsSpoiler] = useState(existingReview ? existingReview.isSpoiler : false); // Booleano para marcar como spoiler
    const [isLoading, setIsLoading] = useState(false); // Estado de carregamento (ao submeter)

    // Estado para controlar o visual das estrelas ao passar o dedo (ou ao clicar)
    const [starHoverRating, setStarHoverRating] = useState(rating);

    // Efeito para definir o título da tela dinamicamente (Editar ou Avaliar)
    useEffect(() => {
        navigation.setOptions({
            title: existingReview ? `Editando Crítica: ${movieTitle}` : `Avaliar: ${movieTitle}`,
        });
    }, [navigation, movieTitle, existingReview]); // Dependências: navigation, movieTitle, existingReview

    // Função chamada ao pressionar uma estrela para definir a nota
    const aoPressionarEstrela = (selectedRating) => {
        setRating(selectedRating); // Define a nota principal
        setStarHoverRating(selectedRating); // Atualiza o hover visual para a nota selecionada
    };

    // Função para renderizar os componentes de estrela para avaliação
    const renderizarEstrelas = () => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                // TouchableOpacity para cada estrela
                <TouchableOpacity key={i} onPress={() => aoPressionarEstrela(i)} onLongPress={() => aoPressionarEstrela(i - 0.5)} delayLongPress={200}>
                    <MaterialCommunityIcons
                        name={i <= starHoverRating ? (i <= rating && rating - i >= -0.49 && rating -i < 0 ? 'star-half-full': 'star') : 'star-outline'} // Lógica para estrela cheia, meia ou vazia
                        size={36} // Tamanho do ícone
                        color={i <= starHoverRating ? '#FFD700' : '#a0a3a8'} // Cor da estrela (dourada ou cinza)
                        style={styles.star}
                    />
                </TouchableOpacity>
            );
        }
        return <View style={styles.starsContainer}>{stars}</View>; // Retorna a view com todas as estrelas
    };

    // Função para submeter a avaliação/crítica
    const submeterAvaliacao = async () => {
        // Verifica se o usuário está logado
        if (!userToken) {
            Alert.alert("Erro", "Você precisa estar logado para enviar uma crítica.");
            return;
        }
        // Verifica se uma nota foi selecionada
        if (rating === 0) {
            Alert.alert("Nota Obrigatória", "Por favor, selecione uma nota para o filme.");
            return;
        }

        setIsLoading(true); // Inicia o indicador de carregamento
        // Converte a string de tags em um array, removendo espaços e tags vazias
        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        // Dados da crítica a serem enviados para a API
        const reviewData = {
            rating,
            reviewText,
            tags: tagsArray,
            isSpoiler
        };

        try {
            // Requisição POST para a API para salvar/atualizar a crítica
            // NOTA: O endpoint é o mesmo para criar e atualizar (o backend deve lidar com a lógica de upsert)
            const response = await fetch(`${API_BASE_URL}/api/reviews/${movieId}`, {
                method: 'POST', // Poderia ser PUT se a API distinguisse criação de atualização e `existingReview` fosse usado para tal.
                                // Como o endpoint é o mesmo, o backend provavelmente faz um "upsert" (cria se não existe, atualiza se existe).
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}` // Token de autorização
                },
                body: JSON.stringify(reviewData) // Corpo da requisição com os dados da crítica
            });

            const responseData = await response.json(); // Converte a resposta para JSON

            if (response.ok) { // Se a requisição foi bem-sucedida
                Alert.alert("Sucesso", responseData.message || "Crítica enviada com sucesso!");
                navigation.goBack(); // Volta para a tela anterior
            } else { // Se houve erro na resposta da API
                Alert.alert("Erro ao Enviar", responseData.message || "Não foi possível enviar sua crítica.");
            }
        } catch (error) { // Se houve erro na requisição (ex: rede)
            Alert.alert("Erro de Rede", "Não foi possível conectar ao servidor. Tente novamente.");
        } finally {
            setIsLoading(false); // Finaliza o indicador de carregamento
        }
    };


    return (
        // Container SafeArea para a tela
        <View style={styles.safeArea}>
             {/* Cabeçalho customizado da tela */}
             <View style={styles.header}>
                {/* Botão de voltar */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
                    <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                {/* Título da tela (nome do filme) */}
                <Text style={styles.headerTitle} numberOfLines={1}>{existingReview ? `Editando Crítica` : `Avaliar Filme`}</Text>
                 {/* View vazia para balancear o space-between do header */}
                 <View style={{width: 26}} />
            </View>
            {/* ScrollView para o conteúdo do formulário */}
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled" // Controla se o teclado deve ser dispensado ao tocar fora
            >
                {/* Título do filme que está sendo avaliado */}
                <Text style={styles.movieTitleText}>{movieTitle}</Text>

                {/* Rótulo para a seção de nota */}
                <Text style={styles.label}>Sua Nota:</Text>
                {/* Componente para renderizar as estrelas de avaliação */}
                {renderizarEstrelas()}
                {/* Texto exibindo a nota selecionada ou instrução */}
                <Text style={styles.ratingValueText}>{rating > 0 ? `${rating} de 5 estrelas` : "Toque nas estrelas para avaliar"}</Text>


                {/* Rótulo para o campo de texto da crítica */}
                <Text style={styles.label}>Sua Crítica (Opcional):</Text>
                <TextInput
                    style={styles.textInputCritica} // Estilo do campo de texto
                    multiline // Permite múltiplas linhas
                    placeholder="Escreva seus pensamentos sobre o filme..." // Texto de placeholder
                    placeholderTextColor="#7A7A7A" // Cor do placeholder
                    value={reviewText} // Valor do estado reviewText
                    onChangeText={setReviewText} // Função para atualizar o estado ao digitar
                    editable={!isLoading} // Campo editável apenas se não estiver carregando
                />

                {/* Rótulo para o campo de tags */}
                <Text style={styles.label}>Tags (Opcional, separadas por vírgula):</Text>
                <TextInput
                    style={styles.textInputTags} // Estilo do campo de texto
                    placeholder="Ex: Clássico, Reviravolta, Emocionante" // Texto de placeholder
                    placeholderTextColor="#7A7A7A" // Cor do placeholder
                    value={tags} // Valor do estado tags
                    onChangeText={setTags} // Função para atualizar o estado ao digitar
                    editable={!isLoading} // Campo editável apenas se não estiver carregando
                />

                {/* Container para o interruptor de Spoiler */}
                <View style={styles.switchContainer}>
                    <Text style={styles.labelSwitch}>Marcar como Spoiler?</Text>
                    <Switch
                        trackColor={{ false: "#3A3F4B", true: "#FF7A59" }} // Cores do "trilho" do switch
                        thumbColor={isSpoiler ? "#FFFFFF" : "#f4f3f4"} // Cor do "botão" do switch
                        ios_backgroundColor="#3e3e3e" // Cor de fundo para iOS
                        onValueChange={setIsSpoiler} // Função para atualizar o estado isSpoiler
                        value={isSpoiler} // Valor do estado isSpoiler
                        disabled={isLoading} // Switch desabilitado se estiver carregando
                    />
                </View>

                {/* Botão para submeter o formulário */}
                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} // Estilo dinâmico (desabilitado se carregando)
                    onPress={submeterAvaliacao} // Função chamada ao pressionar o botão
                    disabled={isLoading} // Botão desabilitado se estiver carregando
                >
                    {isLoading ? (
                        // Exibe ActivityIndicator se estiver carregando
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        // Texto do botão (dinâmico: Atualizar ou Salvar)
                        <Text style={styles.submitButtonText}>{existingReview ? "Atualizar Crítica" : "Salvar Crítica"}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

// Estilos do componente
const styles = StyleSheet.create({
    safeArea: { // Área segura da tela
        flex: 1,
        backgroundColor: '#10141E',
    },
    header: { // Cabeçalho customizado
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Espaça itens (botão, título, view vazia)
        paddingTop: Platform.OS === 'android' ? 30 : 50, // Padding superior ajustado por plataforma
        paddingBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#181D2A',
        borderBottomWidth: 1,
        borderBottomColor: '#22283C',
    },
    backButtonHeader: { // Botão de voltar no cabeçalho
        padding: 5, // Área de toque
    },
    headerTitle: { // Título no cabeçalho
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        maxWidth: '80%', // Para evitar que o título empurre o botão de voltar
    },
    container: { // Container principal da ScrollView
        flex: 1,
    },
    scrollContentContainer: { // Estilo do conteúdo dentro da ScrollView
        padding: 20, // Espaçamento interno
    },
    movieTitleText: { // Título do filme
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 25,
    },
    label: { // Rótulo dos campos do formulário
        fontSize: 16,
        color: '#E0E0E0',
        marginBottom: 8,
        marginTop: 15,
    },
    starsContainer: { // Container das estrelas de avaliação
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 5,
    },
    star: { // Estilo de cada estrela
        marginHorizontal: 5, // Espaçamento horizontal entre estrelas
    },
    ratingValueText: { // Texto que exibe a nota selecionada
        textAlign: 'center',
        color: '#A0A3A8',
        fontSize: 13,
        marginBottom: 20,
    },
    textInputCritica: { // Campo de texto para a crítica
        backgroundColor: '#1B202D',
        color: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        minHeight: 120, // Altura mínima
        textAlignVertical: 'top', // Alinha o texto no topo (para multiline)
        borderWidth: 1,
        borderColor: '#3A3F4B',
        marginBottom: 20,
    },
    textInputTags: { // Campo de texto para as tags
        backgroundColor: '#1B202D',
        color: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#3A3F4B',
        marginBottom: 20,
    },
    switchContainer: { // Container do interruptor de Spoiler
        flexDirection: 'row',
        justifyContent: 'space-between', // Alinha o texto à esquerda e o switch à direita
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 5,
        backgroundColor: '#1B202D',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3A3F4B',
    },
    labelSwitch: { // Rótulo do interruptor
        fontSize: 16,
        color: '#E0E0E0',
    },
    submitButton: { // Botão de submeter
        backgroundColor: '#FF7A59', // Cor de fundo
        paddingVertical: 15,
        borderRadius: 25, // Bordas arredondadas
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonDisabled: { // Estilo do botão quando desabilitado
        opacity: 0.6, // Reduz a opacidade
    },
    submitButtonText: { // Texto do botão de submeter
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
});

export default ReviewFormScreen; // Exporta o componente