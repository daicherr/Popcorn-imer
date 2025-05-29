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
    Platform,
    Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const API_BASE_URL = 'https://popcorn-backend-snfn.onrender.com';

const ListsScreen = ({ navigation }) => {
    const { userToken } = useContext(AuthContext);
    const [lists, setLists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const buscarListasDoUsuario = useCallback(async () => {
        if (!userToken) {
            setLists([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/lists`, {
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
            setLists(data);
        } catch (err) {
            setError(err.message || 'Falha ao carregar suas listas.');
            setLists([]);
        } finally {
            setIsLoading(false);
        }
    }, [userToken]);

    useFocusEffect(
        useCallback(() => {
            const fetchDataOnFocus = async () => {
                await buscarListasDoUsuario();
            };
            fetchDataOnFocus();
        }, [buscarListasDoUsuario])
    );

    const ListItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.listItemContainer} 
            onPress={() => navigation.navigate('ListDetails', { listId: item._id, listName: item.name })}
        >
            <View style={styles.listItemTextContainer}>
                <Text style={styles.listItemName}>{item.name}</Text>
                {item.description && <Text style={styles.listItemDescription} numberOfLines={1}>{item.description}</Text>}
            </View>
            <View style={styles.listItemMetaContainer}>
                <Text style={styles.listItemMovieCount}>{item.movies?.length || 0} filmes</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#7A7A7A" />
            </View>
        </TouchableOpacity>
    );

    if (isLoading && lists.length === 0) {
        return (
            <SafeAreaView style={styles.safeAreaLoading}>
                <StatusBar barStyle="light-content" backgroundColor={styles.safeAreaLoading.backgroundColor} />
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
                <Text style={styles.headerTitle}>Minhas Listas</Text>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate('CreateList')}
                >
                    <MaterialCommunityIcons name="plus-circle-outline" size={28} color="#FF7A59" />
                </TouchableOpacity>
            </View>

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={buscarListasDoUsuario} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isLoading && !error && lists.length === 0 && (
                 <View style={styles.centeredMessageContainer}>
                    <MaterialCommunityIcons name="format-list-bulleted-type" size={60} color="#3A3F4B" />
                    <Text style={styles.emptyListText}>Você ainda não criou nenhuma lista.</Text>
                    <Text style={styles.emptyListSubText}>Toque no '+' para começar!</Text>
                </View>
            )}

            <FlatList
                data={lists}
                renderItem={ListItem}
                keyExtractor={item => item._id.toString()}
                contentContainerStyle={styles.listContentContainer}
                onRefresh={buscarListasDoUsuario}
                refreshing={isLoading}
            />
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
        justifyContent: 'space-between',
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
    addButton: {
        padding: 5,
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
    listContentContainer: {
        paddingVertical: 10,
    },
    listItemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1B202D',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#22283C',
        marginHorizontal: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    listItemTextContainer: {
        flex: 1,
    },
    listItemName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#E0E0E0',
    },
    listItemDescription: {
        fontSize: 13,
        color: '#A0A3A8',
        marginTop: 3,
    },
    listItemMetaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listItemMovieCount: {
        fontSize: 13,
        color: '#7A7A7A',
        marginRight: 5,
    },
    errorContainer: {
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
    }
});

export default ListsScreen;