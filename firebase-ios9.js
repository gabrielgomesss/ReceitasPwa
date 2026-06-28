var firebaseConfig = {
  apiKey: "AIzaSyChVQhFFFKZeVO65qEs8hdyhJ8k8MDg_gQ",
  authDomain: "pwa-receitas.firebaseapp.com",
  projectId: "pwa-receitas",
  storageBucket: "pwa-receitas.firebasestorage.app",
  messagingSenderId: "777442817493",
  appId: "1:777442817493:web:f8a685338885dcdb08395c"
};

var ADMIN_PASSWORD = "Receitas@";

firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();

try {
  db.settings({
    timestampsInSnapshots: true
  });
} catch (e) {}