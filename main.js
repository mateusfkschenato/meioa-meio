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
    // 🟢 Padronizar nome e turma
    const nome = document.getElementById("nome").value.trim().toLowerCase();
    const turma = document.getElementById("turma").value.trim().toLowerCase();

    if (!nome || !turma) {
      alert("Preencha seu nome e sua turma.");
      return;
    }

    const usuario = {
      nome,
      turma,
      timestamp: Date.now()
    };

    const filaRef = db.ref("fila");

    filaRef.once("value").then(snapshot => {
      const fila = snapshot.val();
      const filaArray = fila
        ? Object.entries(fila)
            .map(([id, dados]) => ({ id, ...dados }))
            .sort((a, b) => a.timestamp - b.timestamp)
        : [];

      // 🟢 Evitar parear consigo mesmo
      const outroUsuario = filaArray.find(u => u.nome !== nome || u.turma !== turma);

      if (outroUsuario) {
        const outroId = outroUsuario.id;

        const novaSalaRef = db.ref("salas").push();
        novaSalaRef.set({
          usuario1: {
            nome: outroUsuario.nome,
            turma: outroUsuario.turma,
            timestamp: outroUsuario.timestamp
          },
          usuario2: usuario,
          timestamp: Date.now()
        });

        filaRef.child(outroId).remove();

        alert("Você foi pareado com " + outroUsuario.nome + "!");
      } else {
        const novoId = filaRef.push().key;
        filaRef.child(novoId).set(usuario)
          .then(() => {
            alert("Você entrou na fila! Aguardando pareamento...");

            // 🟢 Evitar múltiplos alerts
            const salasRef = db.ref("salas");
            let foiPareado = false;

            const listener = salasRef.on("child_added", (snapshot) => {
              if (foiPareado) return;

              const sala = snapshot.val();
              const ehUsuario = (
                (sala.usuario1?.nome === nome && sala.usuario1?.turma === turma) ||
                (sala.usuario2?.nome === nome && sala.usuario2?.turma === turma)
              );

              if (ehUsuario) {
                foiPareado = true;
                salasRef.off("child_added", listener);
                const parceiro = sala.usuario1.nome === nome ? sala.usuario2 : sala.usuario1;
                alert("Você foi pareado com " + parceiro.nome + "!");
              }
            });
          })
          .catch((error) => {
            console.error("Erro ao entrar na fila:", error);
          });
      }
    });
  }

  // Exporta a função para ser chamada pelo botão
  window.entrarNaFila = entrarNaFila;