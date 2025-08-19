// Arquivo main.js SEM câmera/foto – focado apenas no pareamento

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAEoaH0UmiNrE4gIX6ca_6kjSB968I6OwQ",
  authDomain: "meioa-meio.firebaseapp.com",
  databaseURL: "https://meioa-meio-default-rtdb.firebaseio.com",
  projectId: "meioa-meio",
  storageBucket: "meioa-meio.appspot.com",
  messagingSenderId: "38003308982",
  appId: "1:38003308982:web:86baa0f86f5e534621e917"
};

firebase.initializeApp(firebaseConfig);

// Autenticação anônima
firebase.auth().signInAnonymously().catch((error) => {
  console.error("Erro ao autenticar anonimamente:", error);
});

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("Usuário autenticado anonimamente:", user.uid);
  }
});

const db = firebase.database();
const idTemporario = Math.random().toString(36).substring(2) + Date.now();
console.log("ID Temporário:", idTemporario);

// Função para entrar na fila
function entrarNaFila() {
  console.log("➡ Etapa 1: Início da função entrarNaFila()");

  const nomeOriginal = document.getElementById("nome").value.trim();
  const turmaOriginal = document.getElementById("turma").value.trim();
  console.log("➡ Etapa 2: Nome:", nomeOriginal, "| Turma:", turmaOriginal);

  const nome = nomeOriginal.toLowerCase();
  const turma = turmaOriginal.toLowerCase();

  if (!nome || !turma) {
    console.warn("❌ Nome ou turma vazios. Interrompendo.");
    alert("Preencha com seu nome e sua turma.");
    return;
  }

  // Usuário básico (sem foto)
  const usuario = {
    id: idTemporario,
    nome,
    turma,
    nomeOriginal,
    turmaOriginal,
    timestamp: Date.now()
  };

  console.log("➡ Usuário pronto para entrar na fila", usuario);

  const filaRef = db.ref("fila");
  const salasRef = db.ref("salas");
  const filaStatusRef = db.ref("filaStatus/" + idTemporario);

  filaRef.once("value").then((snapshot) => {
    const fila = snapshot.val();
    const jaNaFila = fila && Object.values(fila).some(u => u.id === idTemporario);

    if (jaNaFila) {
      alert("Você já está na fila. Aguarde o pareamento.");
      return;
    }

    salasRef.once("value").then((salasSnapshot) => {
      const salas = salasSnapshot.val();
      let jaEstaEmSala = false;

      if (salas) {
        Object.values(salas).forEach(sala => {
          if (sala.encerrado === true) return;
          const u1 = sala.usuario1;
          const u2 = sala.usuario2;
          if (u1?.id === idTemporario || u2?.id === idTemporario) {
            jaEstaEmSala = true;
          }
        });
      }

      if (jaEstaEmSala) {
        alert("Você já está pareado com alguém!");
        return;
      }

      const filaArray = fila
        ? Object.entries(fila)
            .map(([id, dados]) => ({ idFirebase: id, ...dados }))
            .sort((a, b) => a.timestamp - b.timestamp)
        : [];

      const candidato = filaArray.find(u =>
        u.id !== idTemporario &&
        !(salas && Object.values(salas).some(sala =>
          sala.usuario1?.id === u.id || sala.usuario2?.id === u.id
        ))
      );

      if (candidato) {
        console.log("✅ Pareamento encontrado:", candidato.nomeOriginal, candidato.turmaOriginal);
        const novaSala = {
          usuario1: candidato,
          usuario2: usuario,
          timestamp: Date.now()
        };

        const salaRef = db.ref("salas").push(novaSala);
        const salaId = salaRef.key;
        filaRef.child(candidato.idFirebase).remove();

        alert("Você foi pareado com " + candidato.nomeOriginal + ", da Turma " + candidato.turmaOriginal + "!");
        mostrarChat(salaId, candidato.nomeOriginal, candidato.turmaOriginal);

      } else {
        const meuId = filaRef.push().key;
        filaRef.child(meuId).set(usuario).then(() => {
          filaStatusRef.set({ conectado: true });
          filaStatusRef.onDisconnect().remove();
          filaRef.child(meuId).onDisconnect().remove();

          alert("Você entrou na fila! Aguardando alguém para dividir com você...");

          let foiPareado = false;

          const listener = salasRef.on("child_added", (snapshot) => {
            if (foiPareado) return;

            const sala = snapshot.val();
            const salaId = snapshot.key;
            const u1 = sala.usuario1;
            const u2 = sala.usuario2;

            if (u1?.id === idTemporario || u2?.id === idTemporario) {
              foiPareado = true;
              salasRef.off("child_added", listener);
              filaRef.child(meuId).remove();
              filaStatusRef.remove();

              const parceiro = u1.id === idTemporario ? u2 : u1;
              console.log("✅ Pareamento encontrado:", parceiro.nomeOriginal, parceiro.turmaOriginal);
              alert("Você foi pareado com " + parceiro.nomeOriginal + ", da Turma " + parceiro.turmaOriginal + "!");
              mostrarChat(salaId, parceiro.nomeOriginal, parceiro.turmaOriginal);
            }
          });
        });
      }
    });
  });
}

// Atalhos: Enter e botão
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("nome").addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      const nome = document.getElementById("nome").value.trim();
      const turma = document.getElementById("turma").value.trim();
      if (nome && turma) entrarNaFila();
    }
  });

  document.getElementById("turma").addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      const nome = document.getElementById("nome").value.trim();
      const turma = document.getElementById("turma").value.trim();
      if (nome && turma) entrarNaFila();
    }
  });

  document.getElementById("entrarBtn").addEventListener("click", entrarNaFila);
});
