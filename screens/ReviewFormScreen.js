import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

const ReviewFormScreen = ({ route, navigation }) => {
    const { movieId, movieTitle, existingReview } = route.params;
    const { userToken } = useContext(AuthContext);

    const [rating, setRating] = useState(existingReview ? existingReview.rating : 0);
    const [reviewText, setReviewText] = useState(existingReview ? existingReview.reviewText : '');
    const [tags, setTags] = useState(existingReview && existingReview.tags ? existingReview.tags.join(', ') : '');
    const [isSpoiler, setIsSpoiler] = useState(existingReview ? existingReview.isSpoiler : false);
    const [isLoading, setIsLoading] = useState(false);

    const [starHoverRating, setStarHoverRating] = useState(rating);

    useEffect(() => {
        navigation.setOptions({
            title: existingReview ? `Editando Crítica: ${movieTitle}` : `Avaliar: ${movieTitle}`,
        });
    }, [navigation, movieTitle, existingReview]);

    const aoPressionarEstrela = (selectedRating) => {
        setRating(selectedRating);
        setStarHoverRating(selectedRating);
    };

    const renderizarEstrelas = () => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => aoPressionarEstrela(i)} onLongPress={() => aoPressionarEstrela(i - 0.5)} delayLongPress={200}>
                    <MaterialCommunityIcons
                        name={i <= starHoverRating ? (i <= rating && rating - i >= -0.49 && rating -i < 0 ? 'star-half-full': 'star') : 'star-outline'}
                        size={36}
                        color={i <= starHoverRating ? '#FFD700' : '#a0a3a8'}
                        style={styles.star}
                    />
                </TouchableOpacity>
            );
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };
    
    const submeterAvaliacao = async () => {
        if (!userToken) {
            Alert.alert("Erro", "Você precisa estar logado para enviar uma crítica.");
            return;
        }
        if (rating === 0) {
            Alert.alert("Nota Obrigatória", "Por favor, selecione uma nota para o filme.");
            return;
        }

        setIsLoading(true);
        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        const reviewData = {
            rating,
            reviewText,
            tags: tagsArray,
            isSpoiler
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/${movieId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify(reviewData)
            });

            const responseData = await response.json();

            if (response.ok) {
                Alert.alert("Sucesso", responseData.message || "Crítica enviada com sucesso!");
                navigation.goBack();
            } else {
                Alert.alert("Erro ao Enviar", responseData.message || "Não foi possível enviar sua crítica.");
            }
        } catch (error) {
            Alert.alert("Erro de Rede", "Não foi possível conectar ao servidor. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <View style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={styles.header.backgroundColor} />
             <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
                    <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{existingReview ? `Editando Crítica` : `Avaliar Filme`}</Text>
                 <View style={{width: 26}} />
            </View>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.movieTitleText}>{movieTitle}</Text>

                <Text style={styles.label}>Sua Nota:</Text>
                {renderizarEstrelas()}
                <Text style={styles.ratingValueText}>{rating > 0 ? `${rating} de 5 estrelas` : "Toque nas estrelas para avaliar"}</Text>


                <Text style={styles.label}>Sua Crítica (Opcional):</Text>
                <TextInput
                    style={styles.textInputCritica}
                    multiline
                    placeholder="Escreva seus pensamentos sobre o filme..."
                    placeholderTextColor="#7A7A7A"
                    value={reviewText}
                    onChangeText={setReviewText}
                    editable={!isLoading}
                />

                <Text style={styles.label}>Tags (Opcional, separadas por vírgula):</Text>
                <TextInput
                    style={styles.textInputTags}
                    placeholder="Ex: Clássico, Reviravolta, Emocionante"
                    placeholderTextColor="#7A7A7A"
                    value={tags}
                    onChangeText={setTags}
                    editable={!isLoading}
                />

                <View style={styles.switchContainer}>
                    <Text style={styles.labelSwitch}>Marcar como Spoiler?</Text>
                    <Switch
                        trackColor={{ false: "#3A3F4B", true: "#FF7A59" }}
                        thumbColor={isSpoiler ? "#FFFFFF" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={setIsSpoiler}
                        value={isSpoiler}
                        disabled={isLoading}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={submeterAvaliacao}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>{existingReview ? "Atualizar Crítica" : "Salvar Crítica"}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#10141E',
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
    backButtonHeader: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        maxWidth: '80%',
    },
    container: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: 20,
    },
    movieTitleText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        color: '#E0E0E0',
        marginBottom: 8,
        marginTop: 15,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 5,
    },
    star: {
        marginHorizontal: 5,
    },
    ratingValueText: {
        textAlign: 'center',
        color: '#A0A3A8',
        fontSize: 13,
        marginBottom: 20,
    },
    textInputCritica: {
        backgroundColor: '#1B202D',
        color: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#3A3F4B',
        marginBottom: 20,
    },
    textInputTags: {
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
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    labelSwitch: {
        fontSize: 16,
        color: '#E0E0E0',
    },
    submitButton: {
        backgroundColor: '#FF7A59',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
});

export default ReviewFormScreen;