// ==========================
// 🧠 ENTIDADE PRINCIPAL: Tarefa
// ==========================
class Tarefa {
  constructor(titulo, prioridade) {
    this.id = Date.now();
    this.titulo = titulo;
    this.prioridade = prioridade;
    this.concluida = false;
  }
}

// ==========================
// 🔧 VARIÁVEIS E SELETORES
// ==========================
const form = document.getElementById("taskForm");
const input = document.getElementById("taskTitle");
const select = document.getElementById("taskPriority");
const list = document.getElementById("taskList");
const loader = document.getElementById("loader");
const feedback = document.getElementById("feedback");

// Array principal (lista de tarefas)
let tarefas = [];

// ==========================
// 🌐 FETCH (REQUISIÇÃO ASSÍNCRONA)
// ==========================
function carregarTarefasIniciais() {
  loader.classList.remove("hidden");
  fetch("./tarefas.json") // arquivo local
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar tarefas");
      return res.json();
    })
    .then(dados => {
      tarefas = dados.map(t => new Tarefa(t.titulo, t.prioridade));
      salvarLocalStorage();
      renderizarTarefas();
    })
    .catch(err => mostrarFeedback(err.message, true))
    .finally(() => loader.classList.add("hidden"));
}

// ==========================
// 💾 LOCAL STORAGE
// ==========================
function salvarLocalStorage() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

function carregarLocalStorage() {
  const dados = localStorage.getItem("tarefas");
  if (dados) tarefas = JSON.parse(dados);
}

// ==========================
// 🧩 RENDERIZAÇÃO DOM
// ==========================
function renderizarTarefas() {
  list.innerHTML = "";

  if (tarefas.length === 0) {
    list.innerHTML = "<p>Nenhuma tarefa adicionada ainda.</p>";
    return;
  }

  // Exemplo de uso de map() para gerar HTML
  tarefas.map(tarefa => {
    const div = document.createElement("div");
    div.className = `task ${tarefa.concluida ? "done" : ""}`;

    div.innerHTML = `
      <span>${tarefa.titulo} (${tarefa.prioridade})</span>
      <div>
        <button onclick="alternarStatus(${tarefa.id})">✔</button>
        <button onclick="removerTarefa(${tarefa.id})">🗑</button>
      </div>
    `;
    list.appendChild(div);
  });
}

// ==========================
// ➕ ADICIONAR TAREFA
// ==========================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const titulo = input.value.trim();
  const prioridade = select.value;

  if (!titulo) {
    mostrarFeedback("Digite um título válido.", true);
    return;
  }

  const nova = new Tarefa(titulo, prioridade);
  tarefas.push(nova);
  salvarLocalStorage();
  renderizarTarefas();
  form.reset();
  mostrarFeedback("Tarefa adicionada com sucesso!");
});

// ==========================
// ✅ MARCAR COMO CONCLUÍDA
// ==========================
function alternarStatus(id) {
  // Exemplo de uso do find()
  const tarefa = tarefas.find(t => t.id === id);
  if (tarefa) tarefa.concluida = !tarefa.concluida;
  salvarLocalStorage();
  renderizarTarefas();
}

// ==========================
// ❌ REMOVER TAREFA
// ==========================
function removerTarefa(id) {
  // Exemplo de uso de filter()
  tarefas = tarefas.filter(t => t.id !== id);
  salvarLocalStorage();
  renderizarTarefas();
  mostrarFeedback("Tarefa removida.");
}

// ==========================
// 🧭 FEEDBACK VISUAL
// ==========================
function mostrarFeedback(msg, erro = false) {
  feedback.textContent = msg;
  feedback.style.color = erro ? "red" : "green";
  setTimeout(() => (feedback.textContent = ""), 3000);
}

// ==========================
// 🚀 INICIALIZAÇÃO
// ==========================
(async function init() {
  try {
    carregarLocalStorage();
    if (tarefas.length === 0) {
      await carregarTarefasIniciais();
    } else {
      renderizarTarefas();
    }
  } catch (e) {
    mostrarFeedback("Erro ao inicializar o app.", true);
    console.error(e);
  }
})();
