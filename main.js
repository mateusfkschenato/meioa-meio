
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

  window.nomeOriginalGlobal = nomeOriginal;

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

        const salaRef = db.ref("salas").push(novaSala);
        const salaId = salaRef.key;
        filaRef.child(candidato.idFirebase).remove();

        
  const statusEl = document.getElementById("pareadoStatus");
  statusEl.textContent = `🎉 Você foi pareado com ${parceiroNome} da turma ${parceiroTurma}!`;
  statusEl.style.display = "block";

  setTimeout(() => {
    statusEl.style.display = "none";
    mostrarChat(salaId, parceiroNome, parceiroTurma);
  }, 2000);

        mostrarChat(salaId, candidato.nomeOriginal, candidato.turmaOriginal);

      } else {
        const meuId = filaRef.push().key;
        filaRef.child(meuId).set(usuario).then(() => {
          filaStatusRef.set({ conectado: true });
          filaStatusRef.onDisconnect().remove();
          filaRef.child(meuId).onDisconnect().remove();

          alert("Você entrou na fila! Aguardando pareamento...");

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
              
  const statusEl = document.getElementById("pareadoStatus");
  statusEl.textContent = `🎉 Você foi pareado com ${parceiroNome} da turma ${parceiroTurma}!`;
  statusEl.style.display = "block";

  setTimeout(() => {
    statusEl.style.display = "none";
    mostrarChat(salaId, parceiroNome, parceiroTurma);
  }, 2000);

              mostrarChat(salaId, parceiro.nomeOriginal, parceiro.turmaOriginal);
            }
          });
        });
      }
    });
  });
}

function mostrarChat(salaId, parceiroNome, parceiroTurma) {
  document.getElementById("chatArea").style.display = "block";
  document.getElementById("mensagens").innerHTML = "";
  document.getElementById("chatTitulo").textContent = `Converse com ${parceiroNome}, da turma ${parceiroTurma}`;
  window.salaIdAtiva = salaId;

  const mensagensRef = db.ref("salas/" + salaId + "/mensagens");

  mensagensRef.on("child_added", (snapshot) => {
    const msg = snapshot.val();
    const hora = formatarHorarioBrasilia(msg.timestamp);

    const div = document.createElement("div");
    div.textContent = `${msg.autor} (${hora}): ${msg.texto}`;
    document.getElementById("mensagens").appendChild(div);
    document.getElementById("mensagens").scrollTop = document.getElementById("mensagens").scrollHeight;
  });

  const encerradoRef = db.ref("salas/" + salaId + "/encerrado");

  encerradoRef.once("value").then((snap) => {
    if (snap.val() !== true) {
      encerradoRef.on("value", (snap2) => {
        if (snap2.val() === true) {
          db.ref("salas/" + salaId + "/encerradoPor").once("value").then((motivoSnap) => {
            const motivo = motivoSnap.val();
            const mensagem = motivo === "desconectado"
              ? "Pareamento cancelado: foi perdida a conexão com o seu parceiro."
              : "Pareamento cancelado: o usuário saiu do chat.";
            alert(mensagem);
            sairDoChat(true);
          });
        }
      });
    }
  });

  const statusRef = db.ref("salas/" + salaId + "/status/" + idTemporario);
  statusRef.set({ conectado: true });
  statusRef.onDisconnect().remove();
  db.ref("salas/" + salaId + "/encerrado").onDisconnect().set(true);
  db.ref("salas/" + salaId + "/encerradoPor").onDisconnect().set("desconectado");
}

function formatarHorarioBrasilia(timestamp) {
  const date = new Date(timestamp);
  const horaUTC = date.getUTCHours();
  const horaBrasilia = (horaUTC - 3 + 24) % 24;
  const minuto = date.getUTCMinutes();

  const h = horaBrasilia.toString().padStart(2, '0');
  const m = minuto.toString().padStart(2, '0');

  return `${h}:${m}`;
}

function enviarMensagem() {
  const input = document.getElementById("msgInput");
  const texto = input.value.trim();
  if (!texto) return;

  db.ref("salas/" + window.salaIdAtiva + "/mensagens").push({
    texto,
    autor: window.nomeOriginalGlobal,
    timestamp: Date.now()
  });

  input.value = "";
}

function sairDoChat(silencioso = false) {
  if (!window.salaIdAtiva) return;

  const salaPath = "salas/" + window.salaIdAtiva;

  if (!silencioso) {
    const confirmar = confirm("Tem certeza que deseja sair do chat?");
    if (!confirmar) return;

    db.ref(salaPath).update({ encerrado: true });
    alert("Você saiu do chat.");
  }

  db.ref(salaPath + "/mensagens").off();
  db.ref(salaPath + "/encerrado").off();

  document.getElementById("chatArea").style.display = "none";
  window.salaIdAtiva = null;

  document.getElementById("nome").value = "";
  document.getElementById("turma").value = "";
  window.nomeOriginalGlobal = null;
}

window.entrarNaFila = entrarNaFila;
window.enviarMensagem = enviarMensagem;
window.sairDoChat = sairDoChat;

// ENTER ativa "entrar na fila"
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
// Garante que o clique no botão funcione corretamente
document.getElementById("entrarBtn").addEventListener("click", () => {
  entrarNaFila();
});
