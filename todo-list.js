document.addEventListener("DOMContentLoaded", () => {
  // Elementi del DOM
  const taskForm = document.getElementById("taskForm");
  const taskInput = document.getElementById("taskInput");
  const taskDate = document.getElementById("taskDate");
  const taskPriority = document.getElementById("taskPriority");
  const taskList = document.getElementById("taskList");
  const completedTaskList = document.getElementById("completedTaskList");

  // Elementi del menu "File" (import/export)
  const loadFileBtn = document.getElementById("loadFile");
  const saveFileBtn = document.getElementById("saveFile");

  // Chiave per Local Storage e array globale dei task
  const STORAGE_KEY = "todoTasks";
  let tasks = [];

  // ========= FUNZIONI DI STORAGE =========

  function saveTasksToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function loadTasksFromStorage() {
    const tasksJSON = localStorage.getItem(STORAGE_KEY);
    if (tasksJSON) {
      try {
        tasks = JSON.parse(tasksJSON);
      } catch (error) {
        console.error("Error parsing tasks:", error);
        tasks = [];
      }
    } else {
      tasks = [];
    }
  }

  // ========= FUNZIONI DI RENDER =========

  function renderTasks() {
    // Clear both lists
    taskList.innerHTML = "";
    completedTaskList.innerHTML = "";
    // Separate tasks into active and completed
    const activeTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);
    // Render active tasks
    if (activeTasks.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "list-group-item text-center";
      emptyLi.textContent = "No tasks yet.";
      taskList.appendChild(emptyLi);
    } else {
      activeTasks.forEach(task => {
        const li = createTaskElement(task);
        taskList.appendChild(li);
      });
    }
    
    // Render completed tasks
    if (completedTasks.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "list-group-item text-center";
      emptyLi.textContent = "No completed tasks yet.";
      completedTaskList.appendChild(emptyLi);
    } else {
      completedTasks.forEach(task => {
        const li = createTaskElement(task);
        completedTaskList.appendChild(li);
      });
    }
  }
  // Helper function to create a task element
  function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.dataset.id = task.id;
    // Contenitore informazioni del task
    const infoDiv = document.createElement("div");
    infoDiv.className = "task-info";

    // Testo della task
    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.text;
    if (task.completed) {
      textSpan.style.textDecoration = "line-through";
    }
    infoDiv.appendChild(textSpan);

    // Data, se presente
    if (task.date) {
      const dateSpan = document.createElement("span");
      dateSpan.className = "task-date";
      const formattedDate = new Date(task.date).toLocaleDateString();
      dateSpan.textContent = " (" + formattedDate + ")";
      infoDiv.appendChild(dateSpan);
    }

    // Priorità (mostrata come stelle)
    if (task.priority) {
      const prioritySpan = document.createElement("span");
      prioritySpan.className = "task-priority";
      prioritySpan.textContent = " " + "★".repeat(parseInt(task.priority, 10));
      infoDiv.appendChild(prioritySpan);
    }

    li.appendChild(infoDiv);

    // Contenitore per le azioni: Edit, Checkbox per completamento e Delete
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "task-actions";

    // Bottone Edit
    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-sm btn-secondary me-2";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      openEditModal(task);
    });
    actionsDiv.appendChild(editBtn);

    // Checkbox per completare il task
    const completeCheckbox = document.createElement("input");
    completeCheckbox.type = "checkbox";
    completeCheckbox.className = "form-check-input me-2";
    completeCheckbox.checked = task.completed;
    completeCheckbox.addEventListener("change", () => {
      toggleTaskCompletion(task.id);
    });
    actionsDiv.appendChild(completeCheckbox);

    // Bottone Delete
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-sm btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      removeTask(task.id);
    });
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(actionsDiv);
    return li;
  }

  // ========= FUNZIONI DI TASK =========

  // Aggiunge un nuovo task
  function addTask(text, date, priority) {
    const newTask = {
      id: Date.now().toString(),
      text: text,
      date: date || "",
      priority: priority || "1",
      completed: false
    };
    tasks.push(newTask);
    saveTasksToStorage();
    renderTasks();
  }

  // Rimuove un task dato il suo ID
  function removeTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasksToStorage();
    renderTasks();
  }

  // Alterna lo stato di completamento del task
  function toggleTaskCompletion(taskId) {
    tasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    saveTasksToStorage();
    renderTasks();
  }

  // ========= FUNZIONI DI MODIFICA (EDIT) =========

  // Inizializza il Modal di Edit (utilizzando il Bootstrap Modal)
  const editTaskModalElement = document.getElementById("editTaskModal");
  const editTaskModal = new bootstrap.Modal(editTaskModalElement, { backdrop: "static" });

  // Apre il modal di modifica, precompilando i campi
  function openEditModal(task) {
    document.getElementById("editTaskId").value = task.id;
    document.getElementById("editTaskInput").value = task.text;
    document.getElementById("editTaskDate").value = task.date;
    document.getElementById("editTaskPriority").value = task.priority;
    editTaskModal.show();
  }

  // Gestione del form di modifica (Edit Task Modal)
  const editTaskForm = document.getElementById("editTaskForm");
  editTaskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("editTaskId").value;
    const newText = document.getElementById("editTaskInput").value.trim();
    const newDate = document.getElementById("editTaskDate").value;
    const newPriority = document.getElementById("editTaskPriority").value;
    if (newText === "") {
      alert("Task description cannot be empty.");
      return;
    }
    tasks = tasks.map(task => {
      if (task.id === id) {
        return { ...task, text: newText, date: newDate, priority: newPriority };
      }
      return task;
    });
    saveTasksToStorage();
    renderTasks();
    editTaskModal.hide();
  });

  // ========= FUNZIONI DI IMPORT/EXPORT =========

  function exportTasksToFile() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "todo-list-save.json";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function importTasksFromFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTasks = JSON.parse(event.target.result);
        if (Array.isArray(importedTasks)) {
          tasks = importedTasks;
          saveTasksToStorage();
          renderTasks();
        } else {
          alert("Invalid file format.");
        }
      } catch (error) {
        alert("Error during import: " + error);
      }
    };
    reader.readAsText(file);
  }

  // ========= GESTIONE DEGLI EVENTI =========

  // Aggiunta di un nuovo task tramite form
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const dateValue = taskDate.value;
    const priorityValue = taskPriority.value;
    if (text !== "") {
      addTask(text, dateValue, priorityValue);
      taskInput.value = "";
      taskDate.value = "";
      taskPriority.value = "1";
    }
  });

  // Gestione del menu "File" per esportare i task
  saveFileBtn.addEventListener("click", (e) => {
    e.preventDefault();
    exportTasksToFile();
  });

  // Gestione del menu "File" per importare i task
  loadFileBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        importTasksFromFile(file);
      }
    });
    fileInput.click();
  });

  // ========= INIZIALIZZAZIONE =========

  loadTasksFromStorage();
  renderTasks();
});
