import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Oculta por completo la barra molesta de abajo
      }}
    >
      {/* Dejamos únicamente la pantalla principal */}
      <Tabs.Screen name="index" />
    </Tabs>
  );
}