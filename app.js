// === PARTIE SPÉCIFIQUE À "IDEES" ===
const buttonIdee = document.getElementById("plus-button");
const grayBox = document.querySelector(".gray-box");

if (buttonIdee && grayBox) {
    buttonIdee.addEventListener("click", () => {
        const newDiv = document.createElement("div");
        newDiv.classList.add("idee-box");
        grayBox.appendChild(newDiv);
    });
}

// === VARIABLES GLOBALES ===
let currentDay = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

// === GESTION DES JOURS DE LA SEMAINE ===
function setActiveDay(dayElement) {
    document.querySelectorAll('.weekday').forEach(el => el.classList.remove('active'));
    dayElement.classList.add('active');
    currentDay = dayElement.dataset.day;
}

function loadDay(day) {
    document.querySelectorAll(".gray-box").forEach((section) => {
        const sectionId = section.querySelector("h3").textContent.trim();
        const whiteBoxUl = section.querySelector(".white-box ul");
        whiteBoxUl.innerHTML = '';
        loadTasks(day, sectionId).forEach(task => {
            whiteBoxUl.appendChild(createTaskElement(task));
        });
    });
}

// === FONCTIONS DE GESTION DES TÂCHES ===
function saveTasks(day, sectionId, tasks) {
    localStorage.setItem(`${day}-${sectionId}`, JSON.stringify(tasks));
}

function loadTasks(day, sectionId) {
    const tasks = localStorage.getItem(`${day}-${sectionId}`);
    return tasks ? JSON.parse(tasks) : [];
}

function createTaskElement(taskData) { // Modifié pour accepter un objet
    const newLi = document.createElement("li");
    newLi.innerHTML = `
        <label class="container">
            <input type="checkbox" ${taskData.checked ? 'checked' : ''}>
            <svg viewBox="0 0 64 64">
                <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" 
                      class="path ${taskData.checked ? 'checked' : ''}"></path>
            </svg>
        </label>
        <p>${taskData.text}</p>
        <button class="trash-button"><i class="fa-solid fa-trash-can"></i></button>
    `;

    const checkbox = newLi.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
        const path = newLi.querySelector('.path');
        path.classList.toggle('checked', checkbox.checked);
        const parentSection = newLi.closest(".gray-box");
        if (parentSection) updateTasksInStorage(parentSection);
    });

    const trashButton = newLi.querySelector(".trash-button");
    trashButton.addEventListener("click", () => {
        const parentSection = newLi.closest(".gray-box");
        newLi.remove();
        if (parentSection) updateTasksInStorage(parentSection);
    });

    const taskTextElement = newLi.querySelector("p");
    taskTextElement.addEventListener("dblclick", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.value = taskTextElement.textContent;

        taskTextElement.replaceWith(input);
        input.focus();

        const saveText = () => {
            taskTextElement.textContent = input.value.trim() || "Nouvelle tâche ajoutée !";
            input.replaceWith(taskTextElement);
            const parentSection = newLi.closest(".gray-box");
            if (parentSection) updateTasksInStorage(parentSection);
        };

        input.addEventListener("keydown", (e) => e.key === "Enter" && saveText());
        input.addEventListener("blur", saveText);
    });

    if (taskData.subTasks && taskData.subTasks.length > 0) {
        const subTasksLi = document.createElement("li");
        subTasksLi.classList.add("sub-tasks");
        const cell = document.createElement("div");
        cell.classList.add("sub-tasks-cell");
        
        taskData.subTasks.forEach(subTask => {
            const newSubTask = createSubTaskElement(subTask);
            cell.appendChild(newSubTask);
        });

        subTasksLi.appendChild(cell);
        newLi.parentNode.insertBefore(subTasksLi, newLi.nextElementSibling);
    }

    return newLi;
}

function createSubTaskElement(subTaskData) {
    const newSubTask = document.createElement("div");
    newSubTask.classList.add("sub-item");
    newSubTask.innerHTML = `
        <!-- HTML existant pour les sous-tâches -->
    `;
    
    // Ajouter l'événement de suppression
    newSubTask.querySelector(".trash-button").addEventListener("click", () => {
        newSubTask.remove();
        // Supprimer le conteneur parent s'il est vide
        const subTasksContainer = newSubTask.closest('.sub-tasks');
        if (subTasksContainer && subTasksContainer.querySelectorAll('.sub-item').length === 0) {
            subTasksContainer.remove();
        }
        updateTasksInStorage(newSubTask.closest(".gray-box"));
    });

    return newSubTask;
}

function updateTasksInStorage(section) {
    const sectionId = section.querySelector("h3").textContent.trim();
    const tasks = Array.from(section.querySelectorAll(".white-box ul > li:not(.sub-tasks)"), (li) => {
        // Récupérer les sous-tâches du conteneur parent
        const subTasksContainer = li.nextElementSibling?.classList.contains('sub-tasks') 
            ? li.nextElementSibling 
            : null;
        
        const subTasks = subTasksContainer 
            ? Array.from(subTasksContainer.querySelectorAll('.sub-item'), subItem => ({
                text: subItem.querySelector('p').textContent,
                checked: subItem.querySelector('input').checked
            }))
            : [];

        return {
            text: li.querySelector('p').textContent,
            checked: li.querySelector('input').checked,
            subTasks: subTasks
        };
    });
    
    saveTasks(currentDay, sectionId, tasks);
}

// === SOUS-PARTIES DES ELEMENTS UL ===
document.querySelectorAll(".white-box ul").forEach(ul => {
    let pressTimer;

    ul.addEventListener("mousedown", (event) => {
        if (event.target.tagName === "P") {
            pressTimer = setTimeout(() => {
                categoryLi(event.target.parentElement);
            }, 500); // Appui long de 500ms
        }
    });

    ul.addEventListener("mouseup", () => clearTimeout(pressTimer));
    ul.addEventListener("mouseleave", () => clearTimeout(pressTimer));
});

document.querySelectorAll(".white-box ul").forEach(ul => {
    let pressTimer;

    ul.addEventListener("mousedown", (event) => {
        if (event.target.tagName === "P") {
            pressTimer = setTimeout(() => {
                addSubTaskToTable(event.target.parentElement);
            }, 600); // 500ms d'appui long
        }
    });

    ul.addEventListener("mouseup", () => clearTimeout(pressTimer));
    ul.addEventListener("mouseleave", () => clearTimeout(pressTimer));
});

function addSubTaskToTable(mainTaskLi) {
    let subTasksContainer = mainTaskLi.nextElementSibling;
    
    // Créer le conteneur s'il n'existe pas
    if (!subTasksContainer?.classList.contains('sub-tasks')) {
        subTasksContainer = document.createElement("li");
        subTasksContainer.classList.add("sub-tasks");
        const cell = document.createElement("div");
        cell.classList.add("sub-tasks-cell");
        subTasksContainer.appendChild(cell);
        mainTaskLi.parentNode.insertBefore(subTasksContainer, mainTaskLi.nextElementSibling);
    }

    // Créer la nouvelle sous-tâche
    const newSubTask = createSubTaskElement({
        text: "Nouvelle sous-tâche",
        checked: false
    });
    
    subTasksContainer.querySelector('.sub-tasks-cell').appendChild(newSubTask);
    updateTasksInStorage(mainTaskLi.closest(".gray-box"));
}

// === INITIALISATION ===
document.addEventListener("DOMContentLoaded", () => {
    // Trouver l'élément correspondant au jour actuel
    const todayElement = document.querySelector(`[data-day="${currentDay}"]`);
    
    // Activer le jour actuel
    if (todayElement) {
        setActiveDay(todayElement);
        loadDay(currentDay);
    } else {
        // Fallback au lundi si non trouvé
        const defaultDay = document.querySelector('[data-day="lundi"]');
        setActiveDay(defaultDay);
        loadDay('lundi');
    }
    
    // Gestion des clics sur les jours
    document.querySelectorAll('.weekday').forEach(dayElement => {
        dayElement.addEventListener('click', () => {
            // Sauvegarder les tâches du jour actuel
            document.querySelectorAll(".gray-box").forEach(section => {
                updateTasksInStorage(section);
            });
            
            // Charger le nouveau jour
            setActiveDay(dayElement);
            loadDay(currentDay);
        });
    });
});


// === GESTION DES BOUTONS "AJOUTER" === (modification pour l'état initial)
document.querySelectorAll(".add-button").forEach((button) => {
    button.addEventListener("click", () => {
        const parentSection = button.closest(".gray-box");
        const whiteBoxUl = parentSection.querySelector(".white-box ul");
        const newTask = createTaskElement({
            text: "Nouvelle tâche ajoutée !",
            checked: false
        });
        whiteBoxUl.appendChild(newTask);
        updateTasksInStorage(parentSection);
    });
});