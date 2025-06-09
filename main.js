const firebaseConfig = {
  apiKey: "AIzaSyAzRbmT3ImY25mKsNLOAh7xBWku7ph7gzM",
  authDomain: "meioa-meio.firebaseapp.com",
  databaseURL: "https://meioa-meio-default-rtdb.firebaseio.com",
  projectId: "meioa-meio",
  storageBucket: "meioa-meio.firebasestorage.app",
  messagingSenderId: "38003308982",
  appId: "1:38003308982:web:86baa0f86f5e534621e917"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

firebase.auth().signInAnonymously().then(() => {
  console.log("Conectado anonimamente");
});

function entrarNaFila() {
  const nome = document.getElementById("nome").value;
  const turma = document.getElementById("turma").value;
  
  const filaRef = db.ref("esperando");
  const novo = filaRef.push();
  novo.set({
    nome: nome,
    turma: turma
  });

  alert("Você entrou na fila!");
}
