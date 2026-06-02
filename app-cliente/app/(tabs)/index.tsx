import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const [mostrarSplash, setMostrarSplash] = useState(true);
  const tintoOpacidad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación suave del logo
    Animated.timing(tintoOpacidad, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Muestra la presentación por 2.5 segundos y luego pasa a la web
    const timer = setTimeout(() => {
      setMostrarSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // 1. Pantalla de presentación (Se muestra al entrar)
  if (mostrarSplash) {
    return (
      <SafeAreaView style={styles.containerSplash}>
        <StatusBar barStyle="light-content" backgroundColor="#0a192f" />
        <Animated.View style={{ opacity: tintoOpacidad, alignItems: 'center' }}>
          <Text style={styles.logoIcon}>💈</Text>
          <Text style={styles.title}>ROSARIO STYLES</Text>
          <Text style={styles.subtitle}>Rosario de Lerma - Salta</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // 2. ¡Acá está la página web! Reemplaza todo tras los 2.5 segundos
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a192f" />
      <WebView 
        source={{ uri: 'https://gestion-barber-pelu.web.app/' }} 
        style={{ flex: 1, backgroundColor: '#0a192f' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#00f0ff" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerSplash: {
    flex: 1,
    backgroundColor: '#0a192f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  loadingArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a192f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    color: '#00f0ff',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8892b0',
  },
});