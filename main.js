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

function entrarNaFila() {
  const nomeOriginal = document.getElementById("nome").value.trim();
  const turmaOriginal = document.getElementById("turma").value.trim();

  const nome = nomeOriginal.toLowerCase();
  const turma = turmaOriginal.toLowerCase();

  if (!nome || !turma) {
    alert("Preencha seu nome e sua turma.");
    return;
  }

  const usuario = {
    nome,
    turma,
    nomeOriginal,
    turmaOriginal,
    timestamp: Date.now()
  };

  const filaRef = db.ref("fila");
  const salasRef = db.ref("salas");

  // Verificar se o usuário já está em alguma sala
  salasRef.once("value").then((salasSnapshot) => {
    const salas = salasSnapshot.val();
    let jaEstaEmSala = false;

    if (salas) {
      Object.values(salas).forEach(sala => {
        const u1 = sala.usuario1;
        const u2 = sala.usuario2;

        if (
          (u1?.nome === nome && u1?.turma === turma) ||
          (u2?.nome === nome && u2?.turma === turma)
        ) {
          jaEstaEmSala = true;
        }
      });
    }

    if (jaEstaEmSala) {
      alert("Você já está pareado com alguém!");
      return;
    }

    filaRef.once("value").then(snapshot => {
      const fila = snapshot.val();

      // Montar fila ordenada por ordem de chegada (timestamp)
      const filaArray = fila
        ? Object.entries(fila)
            .map(([id, dados]) => ({ id, ...dados }))
            .sort((a, b) => a.timestamp - b.timestamp)
        : [];

      // Filtrar usuários diferentes de mim e que não estão em sala
      const candidato = filaArray.find(u =>
        (u.nome !== nome || u.turma !== turma) &&
        !(salas && Object.values(salas).some(sala =>
          (sala.usuario1?.nome === u.nome && sala.usuario1?.turma === u.turma) ||
          (sala.usuario2?.nome === u.nome && sala.usuario2?.turma === u.turma)
        ))
      );

      if (candidato) {
        // Encontrou alguém válido para parear
        const novaSala = {
          usuario1: {
            nome: candidato.nome,
            turma: candidato.turma,
            nomeOriginal: candidato.nomeOriginal || candidato.nome,
            turmaOriginal: candidato.turmaOriginal || candidato.turma,
            timestamp: candidato.timestamp
          },
          usuario2: usuario,
          timestamp: Date.now()
        };

        db.ref("salas").push(novaSala);
        filaRef.child(candidato.id).remove();
        alert("Você foi pareado com " + (candidato.nomeOriginal || candidato.nome) + "!");
      } else {
        // Ninguém na fila: adiciona e escuta
        const meuId = filaRef.push().key;
        filaRef.child(meuId).set(usuario).then(() => {
          alert("Você entrou na fila! Aguardando pareamento...");

          let foiPareado = false;

          const listener = salasRef.on("child_added", snapshot => {
            if (foiPareado) return;

            const sala = snapshot.val();
            const u1 = sala.usuario1;
            const u2 = sala.usuario2;

            if (
              (u1?.nome === nome && u1?.turma === turma) ||
              (u2?.nome === nome && u2?.turma === turma)
            ) {
              foiPareado = true;
              salasRef.off("child_added", listener);
              filaRef.child(meuId).remove();

              const parceiro = u1.nome === nome ? u2 : u1;
              alert("Você foi pareado com " + (parceiro.nomeOriginal || parceiro.nome) + "!");
            }
          });
        });
      }
    });
  });
}

// Disponibiliza a função globalmente
window.entrarNaFila = entrarNaFila;
