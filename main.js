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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ID aleatório temporário para diferenciar acessos, mesmo com nome repetido
const idTemporario = Math.random().toString(36).substring(2) + Date.now();
console.log("ID Temporário:", idTemporario);

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
    id: idTemporario,
    nome,
    turma,
    nomeOriginal,
    turmaOriginal,
    timestamp: Date.now()
  };

  const filaRef = db.ref("fila");
  const salasRef = db.ref("salas");

  salasRef.once("value").then((salasSnapshot) => {
    const salas = salasSnapshot.val();
    let jaEstaEmSala = false;

    if (salas) {
      Object.values(salas).forEach(sala => {
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

    filaRef.once("value").then(snapshot => {
      const fila = snapshot.val();

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
        const novaSala = {
          usuario1: {
            id: candidato.id,
            nome: candidato.nome,
            turma: candidato.turma,
            nomeOriginal: candidato.nomeOriginal || candidato.nome,
            turmaOriginal: candidato.turmaOriginal || candidato.turma,
            timestamp: candidato.timestamp
          },
          usuario2: {
            id: usuario.id,
            nome: usuario.nome,
            turma: usuario.turma,
            nomeOriginal: usuario.nomeOriginal,
            turmaOriginal: usuario.turmaOriginal,
            timestamp: Date.now()
          },
          timestamp: Date.now()
        };

        db.ref("salas").push(novaSala);
        filaRef.child(candidato.idFirebase).remove();

        alert("Você foi pareado com " + (candidato.nomeOriginal || candidato.nome) + "!");

        // Remove a si mesmo da fila caso ainda esteja
        filaRef.once("value").then(snapshot => {
          const filaAtual = snapshot.val();
          if (filaAtual) {
            const meuId = Object.entries(filaAtual).find(([id, dados]) =>
              dados.id === idTemporario
            )?.[0];

            if (meuId) {
              filaRef.child(meuId).remove();
            }
          }
        });

      } else {
        const meuId = filaRef.push().key;
        filaRef.child(meuId).set(usuario).then(() => {
          alert("Você entrou na fila! Aguardando pareamento...");

          let foiPareado = false;

          const listener = salasRef.on("child_added", snapshot => {
            if (foiPareado) return;

            const sala = snapshot.val();
            const u1 = sala.usuario1;
            const u2 = sala.usuario2;

            if (u1?.id === idTemporario || u2?.id === idTemporario) {
              foiPareado = true;
              salasRef.off("child_added", listener);
              filaRef.child(meuId).remove();

              const parceiro = u1.id === idTemporario ? u2 : u1;
              alert("Você foi pareado com " + (parceiro.nomeOriginal || parceiro.nome) + "!");
            }
          });
        });
      }
    });
  });
}

window.entrarNaFila = entrarNaFila;
