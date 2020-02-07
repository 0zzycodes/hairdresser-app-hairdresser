import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCPzs-bJaj-8hwVga6XRuOteDpK1k8U1R4",
  authDomain: "haird-hairdresser.firebaseapp.com",
  databaseURL: "https://haird-hairdresser.firebaseio.com",
  projectId: "haird-hairdresser",
  storageBucket: "haird-hairdresser.appspot.com",
  messagingSenderId: "995750541899",
  appId: "1:995750541899:web:cb361cf2cebd3752042bce",
  measurementId: "G-SK7LXCLH6W"
};


firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const createUserProfileDocument = async (userAuth, additionalData) => {
  if (!userAuth) return;
  const userRef = firestore.doc(`users/${userAuth.uid}`);
  const snapShot = await userRef.get();
  if (!snapShot.exists) {
    const { displayName, email } = userAuth;
    const joined = new Date();
    try {
      await userRef.set({
        displayName,
        email,
        joined,
        ...additionalData
      });
    } catch (error) {
      console.log('Error creating user');
    }
  }
  return userRef;
};
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = () => auth.signInWithPopup(provider);

export default firebase;
