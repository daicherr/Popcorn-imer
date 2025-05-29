// Importa React, hooks useState e useRef
import React, { useState, useRef } from 'react';
// Importa componentes e APIs do React Native
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
// Importa ícones da biblioteca MaterialCommunityIcons
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Define as rotas da barra de abas com seus ícones e nomes
const tabRoutes = [
    { routeName: 'HomeStack', iconInitial: 'home-variant-outline', iconFocused: 'home-variant', label: 'Início' },
    { routeName: 'SearchTab', iconInitial: 'magnify', iconFocused: 'magnify', label: 'Busca' },
    { routeName: 'ListsStack', iconInitial: 'format-list-bulleted-type', iconFocused: 'format-list-bulleted-square', label: 'Listas' },
    { routeName: 'ProfileTab', iconInitial: 'account-circle-outline', iconFocused: 'account-circle', label: 'Perfil' },
];

// Componente da barra de abas flutuante (FAB) personalizada
const CustomFabTabBar = ({ state, descriptors, navigation }) => {
    // Estado para controlar se o FAB está expandido ou não
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Ref para o valor da animação de rotação do FAB principal
    const fabRotateAnimation = useRef(new Animated.Value(0)).current;
    
    // Refs para os valores das animações dos botões de ação (um para cada rota)
    const actionButtonsAnimations = useRef(tabRoutes.map(() => new Animated.Value(0))).current;

    // Cores para os ícones ativos e inativos
    const activeColor = '#FF7A59';
    const iconColor = '#FFFFFF';

    // Função para alternar o estado de expansão do FAB
    const alternarExpansao = () => {
        const toValue = isExpanded ? 0 : 1; // Determina o valor final da animação (0 para fechar, 1 para abrir)
        setIsExpanded(!isExpanded); // Atualiza o estado de expansão

        // Animação de rotação para o FAB principal (efeito de mola)
        Animated.spring(fabRotateAnimation, {
            toValue: toValue, // Valor final
            friction: 7, // Atrito da mola
            tension: 70, // Tensão da mola
            useNativeDriver: true, // Usa o driver nativo para melhor performance
        }).start();

        // Cria um array de animações para os botões de ação (um para cada botão)
        const animations = actionButtonsAnimations.map(animValue => {
            return Animated.spring(animValue, {
                toValue: toValue,
                friction: 7,
                tension: 100,
                useNativeDriver: true,
            });
        });

        // Se estiver abrindo, executa as animações em sequência com um pequeno atraso (stagger)
        if (toValue === 1) {
            Animated.stagger(60, animations).start();
        } else { // Se estiver fechando, executa as animações em sequência reversa
            Animated.stagger(40, animations.reverse()).start();
        }
    };
    
    // Função que retorna o estilo animado para cada botão de ação
    const estiloBotaoAcao = (animValue, index) => ({
        // Opacidade animada (aparece gradualmente)
        opacity: animValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1]
        }),
        // Transformações animadas (posição Y e escala)
        transform: [
            {
                // Translação vertical (move para cima ao abrir)
                translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(index * 58 + 70)], // Calcula a posição Y final baseado no índice
                }),
            },
            {
                // Escala (aumenta de tamanho ao abrir)
                scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                }),
            }
        ],
    });

    return (
        // Container principal que envolve todos os botões (FAB e ações)
        <View style={styles.wrapper}>
            {/* Mapeia as rotas para criar os botões de ação animados */}
            {tabRoutes.map((routeInfo, index) => {
                // Encontra a rota atual no estado da navegação
                const currentRouteFromState = state.routes.find(r => r.name === routeInfo.routeName);
                if (!currentRouteFromState) return null; // Se a rota não existir no estado, não renderiza

                // Obtém as opções da rota (descritores)
                const { options } = descriptors[currentRouteFromState.key];
                // Verifica se a rota está focada (ativa)
                const isFocused = state.index === state.routes.findIndex(r => r.name === routeInfo.routeName);

                return (
                    // Container animado para cada botão de ação
                    <Animated.View
                        key={routeInfo.routeName}
                        style={[
                            styles.actionButtonContainer, // Estilo base do container do botão
                            estiloBotaoAcao(actionButtonsAnimations[index], index) // Estilo animado
                        ]}
                    >
                        {/* Botão de ação tocável */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                navigation.navigate(routeInfo.routeName); // Navega para a rota
                                alternarExpansao(); // Fecha o FAB expandido
                            }}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}} // Estado de acessibilidade
                            accessibilityLabel={options.tabBarAccessibilityLabel || routeInfo.label} // Rótulo de acessibilidade
                        >
                            {/* Ícone do botão de ação */}
                            <MaterialCommunityIcons
                                name={isFocused ? routeInfo.iconFocused : routeInfo.iconInitial} // Ícone diferente se estiver focado
                                size={26}
                                color={isFocused ? activeColor : iconColor} // Cor diferente se estiver focado
                            />
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}

            {/* Botão FAB principal (o botão de "mais") */}
            <TouchableOpacity
                style={styles.fab}
                onPress={alternarExpansao} // Alterna a expansão ao pressionar
                activeOpacity={0.8} // Opacidade ao pressionar
            >
                {/* View animada para o ícone dentro do FAB (rotação) */}
                <Animated.View style={{
                    transform: [{
                        rotate: fabRotateAnimation.interpolate({ // Rotação animada
                            inputRange: [0, 1],
                            outputRange: ['0deg', '135deg'] // Rotaciona de 0 para 135 graus
                        })
                    }]
                }}>
                    {/* Ícone do FAB principal (muda entre "mais" e "fechar") */}
                    <MaterialCommunityIcons name={isExpanded ? "close" : "plus-thick"} size={30} color="#FFFFFF" />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

// Define os estilos para os componentes
const styles = StyleSheet.create({
    wrapper: { // Estilo do container principal do FAB e seus botões de ação
        position: 'absolute', // Posicionamento absoluto
        bottom: Platform.OS === 'android' ? 25 : 35, // Distância da parte inferior (diferente para Android/iOS)
        right: 25, // Distância da direita
        alignItems: 'center', // Alinha os itens filhos ao centro (verticalmente para os botões de ação)
    },
    fab: { // Estilo do botão FAB principal
        backgroundColor: '#FF7A59', // Cor de fundo
        width: 60, // Largura
        height: 60, // Altura
        borderRadius: 30, // Bordas arredondadas (círculo)
        justifyContent: 'center', // Centraliza o conteúdo (ícone) verticalmente
        alignItems: 'center', // Centraliza o conteúdo (ícone) horizontalmente
        elevation: 8, // Sombra para Android
        shadowColor: '#000', // Cor da sombra para iOS
        shadowOffset: { width: 0, height: 4 }, // Deslocamento da sombra para iOS
        shadowOpacity: 0.3, // Opacidade da sombra para iOS
        shadowRadius: 4, // Raio da sombra para iOS
        zIndex: 10 // Garante que o FAB fique acima de outros elementos
    },
    actionButtonContainer: { // Estilo do container de cada botão de ação
        position: 'absolute', // Posicionamento absoluto (em relação ao wrapper)
    },
    actionButton: { // Estilo de cada botão de ação individual
        backgroundColor: '#2C2C3E', // Cor de fundo
        width: 48, // Largura
        height: 48, // Altura
        borderRadius: 24, // Bordas arredondadas (círculo)
        justifyContent: 'center', // Centraliza o conteúdo (ícone) verticalmente
        alignItems: 'center', // Centraliza o conteúdo (ícone) horizontalmente
        elevation: 6, // Sombra para Android
        shadowColor: '#000', // Cor da sombra para iOS
        shadowOffset: { width: 0, height: 2 }, // Deslocamento da sombra para iOS
        shadowOpacity: 0.2, // Opacidade da sombra para iOS
        shadowRadius: 2, // Raio da sombra para iOS
    },
});

export default CustomFabTabBar;