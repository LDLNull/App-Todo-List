
class Tarefa {
  constructor(titulo, prioridade, dueDate = null) {
    this.id = Date.now();
    this.titulo = titulo;
    this.prioridade = prioridade;
    this.dueDate = dueDate; // ISO string or null
    this.concluida = false;
    this.notified = false; // whether notification for due date was already sent
  }
} 

// ==========================
//  VARIÁVEIS E SELETORES
// ==========================
const form = document.getElementById("taskForm");
const input = document.getElementById("taskTitle");
const select = document.getElementById("taskPriority");
const list = document.getElementById("taskList");
const loader = document.getElementById("loader");
const feedback = document.getElementById("feedback");

let tarefas = [];

function carregarTarefasIniciais() {
  loader.classList.remove("hidden");
  fetch("./tarefas.json") // arquivo local
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar tarefas");
      return res.json();
    })
    .then(dados => {
      tarefas = dados.map(t => {
        const nt = new Tarefa(t.titulo, t.prioridade, t.dueDate || null);
        nt.notified = t.notified || false;
        return nt;
      });
      salvarLocalStorage();
      renderizarTarefas();
    })
    .catch(err => mostrarFeedback(err.message, true))
    .finally(() => loader.classList.add("hidden"));
}

// ==========================
// LOCAL STORAGE
// ==========================
function salvarLocalStorage() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

function carregarLocalStorage() {
  const dados = localStorage.getItem("tarefas");
  if (dados) tarefas = JSON.parse(dados);
}

// ==========================
// RENDERIZAÇÃO DOM
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
    const prioClass = `prio-${tarefa.prioridade}`; // e.g., prio-alta
    // stable id for ordering
    div.dataset.id = tarefa.id;
    div.className = `task glass ${prioClass} ${tarefa.concluida ? "done" : ""}`;

    div.innerHTML = `
      <span>${tarefa.titulo} <span class="prio-badge">${tarefa.prioridade}</span></span>
      <div>
        <button aria-label="Marcar como concluída" onclick="alternarStatus(${tarefa.id})">✔</button>
        <button aria-label="Remover tarefa" onclick="removerTarefa(${tarefa.id})">🗑</button>
      </div>
    `;
    list.appendChild(div);
  });
}

// ==========================
// ADICIONAR TAREFA
// ==========================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const titulo = input.value.trim();
  const prioridade = select.value;
  const dueDate = document.getElementById("taskDue") ? document.getElementById("taskDue").value || null : null;

  if (!titulo) {
    mostrarFeedback("Digite um título válido.", true);
    return;
  }

  const nova = new Tarefa(titulo, prioridade, dueDate);
  tarefas.push(nova);
  salvarLocalStorage();
  renderizarTarefas();
  form.reset();
  mostrarFeedback("Tarefa adicionada com sucesso!");
});

// ==========================
// MARCAR COMO CONCLUÍDA
// ==========================
function alternarStatus(id) {
  // Exemplo de uso do find()
  const tarefa = tarefas.find(t => t.id === id);
  if (tarefa) tarefa.concluida = !tarefa.concluida;
  salvarLocalStorage();
  renderizarTarefas();
}

// ==========================
// REMOVER TAREFA
// ==========================
function removerTarefa(id) {
  // Exemplo de uso de filter()
  tarefas = tarefas.filter(t => t.id !== id);
  salvarLocalStorage();
  renderizarTarefas();
  mostrarFeedback("Tarefa removida.");
}

// ==========================
// FEEDBACK VISUAL
// ==========================
function mostrarFeedback(msg, erro = false) {
  feedback.textContent = msg;
  feedback.classList.remove("success", "error");
  feedback.classList.add(erro ? "error" : "success");
  setTimeout(() => {
    feedback.textContent = "";
    feedback.classList.remove("success", "error");
  }, 3000);
}

/* Notifications: permission request, scheduler, and display */
function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        mostrarFeedback('Notificações ativadas.');
      }
    });
  }
}

function showDueNotification(tarefa) {
  const title = `Lembrete: ${tarefa.titulo}`;
  const when = tarefa.dueDate ? new Date(tarefa.dueDate).toLocaleString() : '';
  const body = `Prioridade: ${tarefa.prioridade}${when ? ' • ' + when : ''}`;
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, tag: String(tarefa.id) });
    } catch (e) {
      mostrarFeedback(`${tarefa.titulo} — ${body}`);
    }
  } else {
    // fallback to in-app feedback
    mostrarFeedback(`${tarefa.titulo} — ${when}`, false);
  }
}

/* Start periodic checker for due tasks (runs while app is open) */
function startDueChecker(intervalMs = 30000) {
  if (window._dueCheckerInterval) clearInterval(window._dueCheckerInterval);
  function check() {
    const now = new Date();
    let changed = false;
    tarefas.forEach(t => {
      if (t.dueDate && !t.notified && !t.concluida) {
        const due = new Date(t.dueDate);
        if (due <= now) {
          showDueNotification(t);
          t.notified = true;
          changed = true;
        }
      }
    });
    if (changed) {
      salvarLocalStorage();
      renderizarTarefas();
    }
  }
  check();
  window._dueCheckerInterval = setInterval(check, intervalMs);
} 

// ==========================
// INICIALIZAÇÃO
// ==========================
(async function init() {
  try { 
    carregarLocalStorage();
    if (tarefas.length !== 0) {
      await renderizarTarefas();
    } else {
      carregarTarefasIniciais();
    }

    // initialize Sortable for task reordering (touch + mouse)
    if (typeof Sortable !== 'undefined') {
      new Sortable(list, {
        animation: 150,
        direction: 'horizontal',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: () => {
          const ids = Array.from(list.querySelectorAll('.task')).map(n => Number(n.dataset.id));
          tarefas = ids.map(id => tarefas.find(t => t.id === id));
          salvarLocalStorage();
          renderizarTarefas();
        }
      });
    }

    // request permission (if needed) and start the in-page checker
    try { requestNotificationPermission(); } catch (e) { /* ignore */ }
    startDueChecker();

  } catch (e) {
    mostrarFeedback("Erro ao inicializar o app.", true);
    console.error(e);
  }
})();
