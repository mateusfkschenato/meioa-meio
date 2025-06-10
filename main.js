// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAzRbmT3ImY25mKsNLOAh7xBWku7ph7gzM",
  authDomain: "meioa-meio.firebaseapp.com",
  databaseURL: "https://meioa-meio-default-rtdb.firebaseio.com",
  projectId: "meioa-meio",
  storageBucket: "meioa-meio.firebasestorage.app",
  messagingSenderId: "38003308982",
  appId: "1:38003308982:web:86baa0f86f5e534621e917"
};


// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

firebase.auth().signInAnonymously().then(() => {
  console.log("Conectado anonimamente");
});

// Função chamada quando o botão é clicado
function entrarNaFila() {
  const nome = document.getElementById("nome").value;
  const turma = document.getElementById("turma").value;
  
  if (nome === "" || turma === "") {
    alert("Preencha seu nome e sua turma.");
    return;
  }

  const usuario = {
    nome: nome,
    turma: turma,
    timestamp: Date.now()
  };
// Referência da fila
  const filaRef = db.ref("fila");

  filaRef.once("value").then(snapshot => {
    const fila = snapshot.val();
    const ids = fila ? Object.keys(fila) : [];

    // Se tiver alguém esperando, fazer pareamento
    if (ids.length > 0) {
      const outroId = ids[0];
      const outroUsuario = fila[outroId];

      // Criar uma sala para os dois
      const novaSalaRef = db.ref("salas").push();
      novaSalaRef.set({
        usuario1: outroUsuario,
        usuario2: usuario,
        timestamp: Date.now()
      });

      // Remover ambos da fila
      filaRef.child(outroId).remove();

      alert("Você foi pareado com " + outroUsuario.nome + "!");

    } else {
      // Ninguém esperando: adiciona à fila
      const novoId = filaRef.push().key;
      filaRef.child(novoId).set(usuario)
  .then(() => {
    alert("Você entrou na fila! Aguardando pareamento...");

    // Fica escutando as salas para ver se esse usuário foi pareado
    db.ref("salas").on("child_added", (snapshot) => {
      const sala = snapshot.val();
      if (
        (sala.usuario1 && sala.usuario1.nome === nome && sala.usuario1.turma === turma) ||
        (sala.usuario2 && sala.usuario2.nome === nome && sala.usuario2.turma === turma)
      ) {
        alert("Você foi pareado com " + (sala.usuario1.nome === nome ? sala.usuario2.nome : sala.usuario1.nome) + "!");
        // Opcional: parar de escutar depois que foi pareado
        db.ref("salas").off();
      }
    });
  })
  .catch((error) => {
    console.error("Erro ao entrar na fila:", error);
  });