import { StyleSheet, Text, View } from 'react-native';


export default function HomeScreen() {
  return (
    <View style = {styles.container}>
      <View style = {styles.title}>
          <Text style = {styles.titleText}>
              SPaT Live API
          </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#071427',
    flex: 1,
  },

  titleContainer: {
    flexDirection: 'row',
  },

  title: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },

  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffff',
  },
});
