import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

export default function ReviewsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reviews</Text>
      <Text>No reviews yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
