import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Switch,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';

const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

const CreateListScreen = ({ route, navigation }) => {
    const { userToken } = useContext(AuthContext);
    
    const listToEdit = route.params?.listToEdit;
    const isEditMode = !!listToEdit;

    const [listName, setListName] = useState(isEditMode ? listToEdit.name : '');
    const [description, setDescription] = useState(isEditMode ? listToEdit.description || '' : '');
    const [isPublic, setIsPublic] = useState(isEditMode ? listToEdit.isPublic : false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            title: isEditMode ? 'Editar Lista' : 'Criar Nova Lista',
        });
    }, [isEditMode, navigation]);

    const submeterLista = async () => {
        if (!listName.trim()) {
            Alert.alert("Nome Obrigatório", "Por favor, insira um nome para a sua lista.");
            return;
        }
        if (!userToken) {
            Alert.alert("Erro", "Você precisa estar logado para esta ação.");
            return;
        }

        setIsLoading(true);
        
        const listData = {
            name: listName.trim(),
            description: description.trim(),
            isPublic
        };

        const endpoint = isEditMode ? `${API_BASE_URL}/api/lists/${listToEdit._id}` : `${API_BASE_URL}/api/lists`;
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify(listData)
            });

            const responseData = await response.json();

            if (response.ok) {
                Alert.alert("Sucesso", isEditMode ? `Lista "${responseData.name}" atualizada!` : `Lista "${responseData.name}" criada!`);
                navigation.goBack();
            } else {
                Alert.alert(isEditMode ? "Erro ao Atualizar" : "Erro ao Criar", responseData.message || "Não foi possível completar a operação.");
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
                <Text style={styles.headerTitle}>{isEditMode ? 'Editar Lista' : 'Criar Nova Lista'}</Text>
                <View style={{width: 26}} />
            </View>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.label}>Nome da Lista:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Filmes para Chorar"
                    placeholderTextColor="#7A7A7A"
                    value={listName}
                    onChangeText={setListName}
                    maxLength={100}
                    editable={!isLoading}
                />

                <Text style={styles.label}>Descrição (Opcional):</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    placeholder="Uma breve descrição sobre esta lista..."
                    placeholderTextColor="#7A7A7A"
                    value={description}
                    onChangeText={setDescription}
                    maxLength={500}
                    editable={!isLoading}
                />

                <View style={styles.switchRow}>
                    <Text style={styles.labelSwitch}>Tornar esta lista pública?</Text>
                    <Switch
                        trackColor={{ false: "#3A3F4B", true: "#FF7A59" }}
                        thumbColor={isPublic ? "#FFFFFF" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={setIsPublic}
                        value={isPublic}
                        disabled={isLoading}
                    />
                </View>
                <Text style={styles.publicInfoText}>
                    Listas públicas poderão ser vistas por outros usuários no futuro.
                </Text>


                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={submeterLista}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>{isEditMode ? 'Salvar Alterações' : 'Criar Lista'}</Text>
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        color: '#E0E0E0',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
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
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 15,
    },
    labelSwitch: {
        fontSize: 16,
        color: '#E0E0E0',
        flexShrink: 1,
        marginRight: 10,
    },
    publicInfoText: {
        fontSize: 12,
        color: '#7A7A7A',
        marginBottom: 30,
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

export default CreateListScreen;