import React from 'react';
import { View, Text } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ff0000' }}>
      <Text style={{ color: '#fff', fontSize: 24 }}>Layout Funcionando!</Text>
    </View>
  );
}
