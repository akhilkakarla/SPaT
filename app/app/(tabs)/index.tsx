import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style = {styles.container}>
      <Text style = {styles.hello}>
        Hello World
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hello: {
    fontSize: 20,
    textAlign: 'center',
  },
});
