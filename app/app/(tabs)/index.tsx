import React, { useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableHighlight, TouchableOpacity, View } from 'react-native';

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={{ textAlign: 'center', color: 'black', fontSize: 55, fontWeight: 'bold' }}>
          SpaT
        </Text>

        <TouchableHighlight
          style={styles.infoButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ paddingHorizontal: 12, paddingVertical: 8 }}>Info</Text>
        </TouchableHighlight>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Blank popup content - put any UI here */}
            <Text style={{ marginBottom: 12 }}>This app serves as a tool for predicting when a traffic light while change lights to better prepare people while driving.</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* side panel toggle button - always visible on the left edge */}
      <TouchableOpacity
        style={styles.mainMenuButton}
        onPress={() => setSidebarOpen(prev => !prev)}
        accessibilityLabel={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <Text style={{ color: 'white', padding: 8, fontWeight: 'bold' }}>{sidebarOpen ? '×' : '≡'}</Text>
      </TouchableOpacity>

      {/* overlay and sidebar - only render when open */}
      {sidebarOpen && (
        <>
          <TouchableOpacity style={styles.overlay} onPress={() => setSidebarOpen(false)} />
          <View style={styles.sideBarOpen}>
            <View style={styles.sideBarElementContainer}>
              <Text style={styles.sideBarElement}>North</Text>
              <Text style={styles.sideBarElement}>South</Text>
              <Text style={styles.sideBarElement}>East</Text>
              <Text style={styles.sideBarElement}>West</Text>
            </View>
          </View>
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'column',
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

  header: {
    backgroundColor: 'red',
    width: deviceWidth,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
  },

  infoButton: {
    borderRadius: 15,
    backgroundColor: 'white',
    position: 'absolute',
    right: 15,
    top: 20,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },

  sideBar: {
    height: deviceHeight,
    width: 50,
    backgroundColor: 'red',
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    zIndex: 900,
  },

  sideBarOpen: {
    height: deviceHeight,
    width: 100,
    backgroundColor: 'red',
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'flex-start',
    paddingLeft: 12,
    paddingTop: 40,
    zIndex: 1000,
  },

  mainMenuButton: {
    borderRadius: 15,
    backgroundColor: 'black',
    position: 'absolute',
    left: 15,
    top: 20,
    zIndex: 1100,
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 950,
  },

  sideBarElement: {
    color: 'black',
    fontSize: 18, 
    fontWeight: 'bold',
    paddingTop: 20,
    textAlign: 'center',
  },

  sideBarElementContainer: {
    marginTop: (deviceHeight / 6),
  }
});
