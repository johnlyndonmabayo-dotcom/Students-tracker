const API = "/api/tasks";
const table = document.getElementById("taskTable");
const modal = document.getElementById("taskModal");
const form = document.getElementById("taskForm");
let tasks = [];
let editingId = null;

const el = id => document.getElementById(id);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const prettyStatus = value => value === "in-progress" ? "In Progress" : value.charAt(0).toUpperCase() + value.slice(1);

async function request(url, options = {}) {
  const response = await fetch(url, {headers: {"Content-Type":"application/json"}, ...options});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

async function loadTasks() {
  try {
    tasks = await request(API);
    render();
  } catch (error) {
    table.innerHTML = `<tr><td colspan="6" class="empty">${escapeHTML(error.message)}</td></tr>`;
  }
}

function render() {
  const search = el("searchInput").value.trim().toLowerCase();
  const status = el("statusFilter").value;
  const priority = el("priorityFilter").value;
  const filtered = tasks.filter(task =>
    (task.title.toLowerCase().includes(search) || task.subject.toLowerCase().includes(search)) &&
    (status === "all" || task.status === status) &&
    (priority === "all" || task.priority === priority)
  );
  const today = new Date().toISOString().slice(0,10);
  el("totalCount").textContent = tasks.length;
  el("pendingCount").textContent = tasks.filter(t => t.status !== "completed").length;
  el("completedCount").textContent = tasks.filter(t => t.status === "completed").length;
  el("todayCount").textContent = tasks.filter(t => t.due_date === today && t.status !== "completed").length;
  el("taskSummary").textContent = `Showing ${filtered.length} of ${tasks.length} tasks`;
  if (!filtered.length) {
    table.innerHTML = `<tr><td colspan="6" class="empty">${tasks.length ? "No tasks match your search." : "No tasks yet. Add your first task!"}</td></tr>`;
    return;
  }
  table.innerHTML = filtered.map(task => `<tr>
    <td>${escapeHTML(task.title)}</td><td>${escapeHTML(task.subject)}</td>
    <td>${new Date(task.due_date + "T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</td>
    <td><span class="priority ${escapeHTML(task.priority)}">${escapeHTML(task.priority)}</span></td>
    <td><span class="status ${escapeHTML(task.status)}">${prettyStatus(task.status)}</span></td>
    <td><div class="actions"><button class="action-btn" data-action="edit" data-id="${task.id}">Edit</button><button class="action-btn delete" data-action="delete" data-id="${task.id}">Delete</button></div></td>
  </tr>`).join("");
}

function openModal(task = null) {
  editingId = task ? task.id : null;
  el("modalTitle").textContent = task ? "Edit Task" : "Add New Task";
  el("taskTitle").value = task?.title || "";
  el("taskSubject").value = task?.subject || "";
  el("taskDue").value = task?.due_date || "";
  el("taskPriority").value = task?.priority || "Medium";
  el("taskStatus").value = task?.status || "pending";
  el("formError").textContent = "";
  modal.hidden = false;
  el("taskTitle").focus();
}
function closeModal(){ modal.hidden = true; form.reset(); editingId = null; }

async function saveTask(event) {
  event.preventDefault();
  const payload = {
    title: el("taskTitle").value.trim(),
    subject: el("taskSubject").value.trim(),
    due_date: el("taskDue").value,
    priority: el("taskPriority").value,
    status: el("taskStatus").value
  };
  try {
    const editing = editingId !== null;
    await request(editing ? `${API}/${editingId}` : API, {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    closeModal();
    await loadTasks();
  } catch (error) {
    el("formError").textContent = error.message;
  }
}

table.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const task = tasks.find(item => item.id === id);
  if (button.dataset.action === "edit") openModal(task);
  if (button.dataset.action === "delete" && confirm(`Delete "${task.title}"?`)) {
    try { await request(`${API}/${id}`, {method:"DELETE"}); await loadTasks(); }
    catch (error) { alert(error.message); }
  }
});

["addTaskTop","addTaskBtn"].forEach(id => el(id).addEventListener("click", () => openModal()));
["closeModal","cancelModal"].forEach(id => el(id).addEventListener("click", closeModal));
form.addEventListener("submit", saveTask);
["searchInput","statusFilter","priorityFilter"].forEach(id => el(id).addEventListener("input", render));
el("allTasksNav").addEventListener("click", () => { el("listTitle").textContent = "All Tasks"; el("allTasksNav").classList.add("active"); el("dashboardNav").classList.remove("active"); });
el("dashboardNav").addEventListener("click", () => { el("listTitle").textContent = "Your Tasks"; el("dashboardNav").classList.add("active"); el("allTasksNav").classList.remove("active"); });
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });

loadTasks();
