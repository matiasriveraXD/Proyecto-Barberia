import { Tabs } from 'expo-router';
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* para los iconos de arriba en color blanco */}
      <StatusBar barStyle="light-content" backgroundColor="#0d1b2a" />
      
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, //  ocultar la barra de abajo como la tenías
        }}
      >
        <Tabs.Screen name="index" />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1b2a', // Color oscuro de fondo 
  },
});