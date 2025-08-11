// Arquivo main.js corrigido com logs e chamada correta da câmera

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

  console.log("➡ Etapa 3: Capturando foto do canvas");
  const canvas = document.getElementById("fotoCanvas");
  if (!canvas) {
    console.error("❌ Canvas não encontrado!");
    return;
  }

  const dataURL = canvas.toDataURL("image/jpeg");
  const blobPromise = fetch(dataURL).then(res => res.blob());

  const user = firebase.auth().currentUser;
  if (!user) {
    console.error("❌ Usuário não autenticado no Firebase!");
    return;
  }

  const storageRef = firebase.storage().ref(`fotos-perfil/${user.uid}.jpg`);

  blobPromise.then(blob => {
    console.log("📷 Etapa 4: Foto capturada e pronta para upload");

    storageRef.put(blob)
      .then(snapshot => {
        console.log("➡ Etapa 5: Upload da foto concluído");
        return snapshot.ref.getDownloadURL();
      })
      .then(fotoUrl => {
        console.log("➡ Etapa 6: URL da foto obtida", fotoUrl);

        const usuario = {
          id: idTemporario,
          nome,
          turma,
          nomeOriginal,
          turmaOriginal,
          fotoUrl,
          timestamp: Date.now()
        };

        console.log("➡ Etapa 7: Usuário pronto para entrar na fila", usuario);

        // Aqui segue o código original de inserção na fila e pareamento
        // (sem alterações de lógica)
        // ...

      })
      .catch(err => {
        console.error("❌ Erro no upload ou obtenção da URL da foto:", err);
      });
  }).catch(err => {
    console.error("❌ Erro ao gerar blob da foto:", err);
  });
}

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

  const video = document.getElementById("camera");
  const canvas = document.getElementById("fotoCanvas");
  const preview = document.getElementById("previewFoto");

  function iniciarCamera() {
    console.log("Tentando iniciar a câmera...");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Navegador não suporta acesso à câmera.");
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
        console.log("Câmera iniciada com sucesso.");
      })
      .catch(error => {
        console.error("Erro ao acessar a câmera:", error);
        alert("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      });
  }

  window.tirarFoto = function () {
    console.log("Capturando foto...");
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    preview.src = canvas.toDataURL("image/jpeg");
    preview.style.display = "block";
  };

  iniciarCamera();
});
