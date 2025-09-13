// import { initializeApp } from 'firebase/app';
// import {
//   getAuth,
//   GoogleAuthProvider,
//   setPersistence,
//   browserLocalPersistence,
// } from 'firebase/auth';

// const firebaseConfig = {
//   apiKey: "AIzaSyDoldzb2BWgQ8ShkUj2FXuCBGJGNHwv2pY",
//   authDomain: "flow-7cccb.firebaseapp.com",
//   projectId: "flow-7cccb",
//   storageBucket: "flow-7cccb.firebasestorage.app",
//   messagingSenderId: "640794708004",
//   appId: "1:640794708004:web:1b8262180f3df76ad770b1",
//   measurementId: "G-PDG793RFLM"
// };

// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const googleProvider = new GoogleAuthProvider();

// // Encourage account picker every time to avoid silent failures
// try {
//   googleProvider.setCustomParameters({ prompt: 'select_account' });
// } catch (_) {}

// // Keep user logged in across refreshes
// setPersistence(auth, browserLocalPersistence);