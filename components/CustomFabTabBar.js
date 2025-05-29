import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const tabRoutes = [
    { routeName: 'HomeStack', iconInitial: 'home-variant-outline', iconFocused: 'home-variant', label: 'Início' },
    { routeName: 'SearchTab', iconInitial: 'magnify', iconFocused: 'magnify', label: 'Busca' },
    { routeName: 'ListsStack', iconInitial: 'format-list-bulleted-type', iconFocused: 'format-list-bulleted-square', label: 'Listas' },
    { routeName: 'ProfileTab', iconInitial: 'account-circle-outline', iconFocused: 'account-circle', label: 'Perfil' },
];

const CustomFabTabBar = ({ state, descriptors, navigation }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const fabRotateAnimation = useRef(new Animated.Value(0)).current;
    
    const actionButtonsAnimations = useRef(tabRoutes.map(() => new Animated.Value(0))).current;

    const activeColor = '#FF7A59';
    const iconColor = '#FFFFFF';

    const alternarExpansao = () => {
        const toValue = isExpanded ? 0 : 1;
        setIsExpanded(!isExpanded);

        Animated.spring(fabRotateAnimation, {
            toValue: toValue,
            friction: 7,
            tension: 70,
            useNativeDriver: true,
        }).start();

        const animations = actionButtonsAnimations.map(animValue => {
            return Animated.spring(animValue, {
                toValue: toValue,
                friction: 7,
                tension: 100,
                useNativeDriver: true,
            });
        });

        if (toValue === 1) {
            Animated.stagger(60, animations).start();
        } else {
            Animated.stagger(40, animations.reverse()).start();
        }
    };
    
    const estiloBotaoAcao = (animValue, index) => ({
        opacity: animValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1]
        }),
        transform: [
            {
                translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(index * 58 + 70)], 
                }),
            },
            {
                scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                }),
            }
        ],
    });

    return (
        <View style={styles.wrapper}>
            {tabRoutes.map((routeInfo, index) => {
                const currentRouteFromState = state.routes.find(r => r.name === routeInfo.routeName);
                if (!currentRouteFromState) return null;

                const { options } = descriptors[currentRouteFromState.key];
                const isFocused = state.index === state.routes.findIndex(r => r.name === routeInfo.routeName);

                return (
                    <Animated.View
                        key={routeInfo.routeName}
                        style={[
                            styles.actionButtonContainer,
                            estiloBotaoAcao(actionButtonsAnimations[index], index)
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                navigation.navigate(routeInfo.routeName);
                                alternarExpansao();
                            }}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel || routeInfo.label}
                        >
                            <MaterialCommunityIcons
                                name={isFocused ? routeInfo.iconFocused : routeInfo.iconInitial}
                                size={26}
                                color={isFocused ? activeColor : iconColor}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}

            <TouchableOpacity
                style={styles.fab}
                onPress={alternarExpansao}
                activeOpacity={0.8}
            >
                <Animated.View style={{
                    transform: [{
                        rotate: fabRotateAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '135deg']
                        })
                    }]
                }}>
                    <MaterialCommunityIcons name={isExpanded ? "close" : "plus-thick"} size={30} color="#FFFFFF" />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'android' ? 25 : 35,
        right: 25,
        alignItems: 'center',
    },
    fab: {
        backgroundColor: '#FF7A59',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 10 
    },
    actionButtonContainer: {
        position: 'absolute', 
    },
    actionButton: {
        backgroundColor: '#2C2C3E', 
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
});

export default CustomFabTabBar;