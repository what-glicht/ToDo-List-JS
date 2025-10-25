// popup.js - feature-complete ToDo for Chrome extension popup
const STORAGE_KEY = "todoTasks";
let tasks = [];

function saveTasks() {
  const data = JSON.stringify(tasks);
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.set({ [STORAGE_KEY]: data }, () => {
      // optional callback
    });
  } else {
    localStorage.setItem(STORAGE_KEY, data);
  }
}

function loadTasks(callback) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      try {
        const raw = result[STORAGE_KEY];
        tasks = raw ? JSON.parse(raw) : [];
      } catch (e) {
        tasks = [];
      }
      callback && callback();
    });
  } else {
    const raw = localStorage.getItem(STORAGE_KEY);
    try {
      tasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
      tasks = [];
    }
    callback && callback();
  }
}

// DOM refs
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const taskList = document.getElementById("taskList");
const clearCompletedBtn = document.getElementById("clearCompleted");
const countSpan = document.getElementById("count");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const fileInput = document.getElementById("fileInput");

const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editTaskId = document.getElementById("editTaskId");
const editTaskInput = document.getElementById("editTaskInput");
const editTaskDate = document.getElementById("editTaskDate");
const editTaskPriority = document.getElementById("editTaskPriority");
const closeModal = document.getElementById("closeModal");

function openModal() {
  editModal.setAttribute("aria-hidden", "false");
}
function closeModalFn() {
  editModal.setAttribute("aria-hidden", "true");
}

function render() {
  taskList.innerHTML = "";
  if (!tasks.length) {
    const li = document.createElement("li");
    li.className = "task-item";
    li.textContent = "No tasks yet.";
    taskList.appendChild(li);
    updateCount();
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;

    const left = document.createElement("div");
    left.className = "task-left";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!task.completed;
    cb.addEventListener("change", () => toggleComplete(task.id));

    const span = document.createElement("span");
    span.className = "task-text" + (task.completed ? " completed" : "");
    span.textContent = task.text;

    // date and priority display
    const meta = document.createElement("div");
    meta.className = "meta";
    if (task.date) {
      const d = document.createElement("small");
      d.className = "date";
      try {
        d.textContent = new Date(task.date).toLocaleDateString();
      } catch (e) {
        d.textContent = task.date;
      }
      meta.appendChild(d);
    }
    if (task.priority) {
      const p = document.createElement("small");
      p.className = "priority";
      p.textContent = " " + "★".repeat(parseInt(task.priority, 10) || 1);
      meta.appendChild(p);
    }

    const textWrap = document.createElement("div");
    textWrap.appendChild(span);
    textWrap.appendChild(meta);

    left.appendChild(cb);
    left.appendChild(textWrap);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.title = "Edit";
    editBtn.innerHTML = "✏️";
    editBtn.addEventListener("click", () => openEdit(task.id));

    const delBtn = document.createElement("button");
    delBtn.title = "Delete";
    delBtn.className = "delete";
    delBtn.innerHTML = "🗑️";
    delBtn.addEventListener("click", () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
  updateCount();
}

function updateCount() {
  const pending = tasks.filter((t) => !t.completed).length;
  countSpan.textContent = `${pending} pending`;
}

function addTask(text, date, priority) {
  const newTask = {
    id: Date.now().toString(),
    text: text.trim(),
    date: date || "",
    priority: priority || "1",
    completed: false,
  };
  tasks.unshift(newTask);
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

function toggleComplete(id) {
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTasks();
  render();
}

function openEdit(id) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  editTaskId.value = t.id;
  editTaskInput.value = t.text;
  editTaskDate.value = t.date || "";
  editTaskPriority.value = t.priority || "1";
  openModal();
}

editForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = editTaskId.value;
  const text = editTaskInput.value.trim();
  const date = editTaskDate.value;
  const priority = editTaskPriority.value;
  if (!text) return alert("Task cannot be empty");
  tasks = tasks.map((t) => (t.id === id ? { ...t, text, date, priority } : t));
  saveTasks();
  closeModalFn();
  render();
});

closeModal.addEventListener("click", () => closeModalFn());

clearCompletedBtn.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
});

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  const date = taskDate.value;
  const priority = taskPriority.value;
  if (!text) return;
  addTask(text, date, priority);
  taskInput.value = "";
  taskDate.value = "";
  taskPriority.value = "1";
});

// Import / Export
exportBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const dataStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "todo-list-save.json";
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) return alert("Invalid file format");
      tasks = imported;
      saveTasks();
      render();
    } catch (err) {
      alert("Error importing: " + err);
    }
  };
  reader.readAsText(file);
  // clear input so same file can be chosen again
  fileInput.value = "";
});

// Initial load
loadTasks(render);

// Listen for storage changes so popup updates if sync changes elsewhere
if (
  typeof chrome !== "undefined" &&
  chrome.storage &&
  chrome.storage.onChanged
) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      try {
        tasks = JSON.parse(changes[STORAGE_KEY].newValue || "[]");
      } catch (e) {
        tasks = [];
      }
      render();
    }
  });
}
