import { StyleSheet, Text, View } from 'react-native';


export default function HomeScreen() {
  return (
    <View style = {styles.title}>
        <Text style = {styles.titleText}>
            SPaT Live API
        </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  title: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
});
