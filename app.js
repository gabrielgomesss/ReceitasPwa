import { firebaseConfig, ADMIN_PASSWORD } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const titleInput = document.getElementById("title");
const ingredientsInput = document.getElementById("ingredients");
const preparationInput = document.getElementById("preparation");
const saveBtn = document.getElementById("saveBtn");
const recipesList = document.getElementById("recipesList");
const searchInput = document.getElementById("search");

const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const modalIngredients = document.getElementById("modalIngredients");
const modalPreparation = document.getElementById("modalPreparation");
const editBtn = document.getElementById("editBtn");
const deleteBtn = document.getElementById("deleteBtn");
const editArea = document.getElementById("editArea");
const editTitle = document.getElementById("editTitle");
const editIngredients = document.getElementById("editIngredients");
const editPreparation = document.getElementById("editPreparation");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let recipes = [];
let selectedRecipe = null;
let visibleCount = 10;

async function loadRecipes() {
  try {
    recipesList.innerHTML = "Carregando receitas...";

    const q = query(collection(db, "recipes"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    recipes = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    renderRecipes();

  } catch (error) {
    console.error("Erro ao carregar receitas:", error);
    recipesList.innerHTML = "Erro ao carregar receitas.";
    alert("Erro ao carregar receitas: " + error.message);
  }
}



function renderRecipes() {
  const search = searchInput.value.toLowerCase();

  const filtered = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(search)
  );

  const visibleRecipes = filtered.slice(0, visibleCount);

  recipesList.innerHTML = "";

  if (filtered.length === 0) {
    recipesList.innerHTML = "<p>Nenhuma receita encontrada.</p>";
    return;
  }

  visibleRecipes.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    card.innerHTML = `
      <h3>${recipe.title}</h3>
      <p>${recipe.ingredients.substring(0, 100)}...</p>
      <button>Ver Receita</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      openRecipe(recipe);
    });

    recipesList.appendChild(card);
  });

  if (filtered.length > visibleCount) {
    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.textContent = "Carregar mais receitas";
    loadMoreBtn.className = "load-more-btn";

    loadMoreBtn.addEventListener("click", () => {
      visibleCount += 10;
      renderRecipes();
    });

    recipesList.appendChild(loadMoreBtn);
  }
}
async function saveRecipe() {
  try {
    const title = titleInput.value.trim();
    const ingredients = ingredientsInput.value.trim();
    const preparation = preparationInput.value.trim();

    if (!title || !ingredients || !preparation) {
      alert("Preencha todos os campos.");
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Salvando...";

    await addDoc(collection(db, "recipes"), {
      title,
      ingredients,
      preparation,
      createdAt: serverTimestamp()
    });

    titleInput.value = "";
    ingredientsInput.value = "";
    preparationInput.value = "";

    alert("Receita salva com sucesso!");

    await loadRecipes();

  } catch (error) {
    console.error("Erro ao salvar receita:", error);
    alert("Erro ao salvar receita: " + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar Receita";
  }
}
function openRecipe(recipe) {
  selectedRecipe = recipe;

  modalTitle.textContent = recipe.title;
  modalIngredients.textContent = recipe.ingredients;
  modalPreparation.textContent = recipe.preparation;

  modal.classList.remove("hidden");
}

function askPassword() {
  const password = prompt("Digite a senha para continuar:");

  if (password !== ADMIN_PASSWORD) {
    alert("Senha incorreta.");
    return false;
  }

  return true;
}

function editRecipe() {
  if (!selectedRecipe) return;
  if (!askPassword()) return;

  editTitle.value = selectedRecipe.title;
  editIngredients.value = selectedRecipe.ingredients;
  editPreparation.value = selectedRecipe.preparation;

  modalTitle.classList.add("hidden");
  modalIngredients.classList.add("hidden");
  modalPreparation.classList.add("hidden");

  editBtn.classList.add("hidden");
  deleteBtn.classList.add("hidden");

  editArea.classList.remove("hidden");
}

async function saveEditedRecipe() {
  if (!selectedRecipe) return;

  const newTitle = editTitle.value.trim();
  const newIngredients = editIngredients.value.trim();
  const newPreparation = editPreparation.value.trim();

  // if (!newTitle || !newIngredients || !newPreparation) {
  //   alert("Preencha todos os campos.");
  //   return;
  // }

  try {
    saveEditBtn.disabled = true;
    saveEditBtn.textContent = "Salvando...";

    const recipeRef = doc(db, "recipes", selectedRecipe.id);

    await updateDoc(recipeRef, {
      title: newTitle,
      ingredients: newIngredients,
      preparation: newPreparation
    });

    selectedRecipe.title = newTitle;
    selectedRecipe.ingredients = newIngredients;
    selectedRecipe.preparation = newPreparation;

    modalTitle.textContent = newTitle;
    modalIngredients.textContent = newIngredients;
    modalPreparation.textContent = newPreparation;

    closeEditMode();

    alert("Receita atualizada com sucesso!");

    renderRecipes();

  } catch (error) {
    console.error("Erro ao atualizar receita:", error);
    alert("Erro ao atualizar receita: " + error.message);
  } finally {
    saveEditBtn.disabled = false;
    saveEditBtn.textContent = "Salvar Alterações";
  }
}

function closeEditMode() {
  editArea.classList.add("hidden");

  modalTitle.classList.remove("hidden");
  modalIngredients.classList.remove("hidden");
  modalPreparation.classList.remove("hidden");

  editBtn.classList.remove("hidden");
  deleteBtn.classList.remove("hidden");
}

async function deleteRecipe() {
  if (!selectedRecipe) return;
  if (!askPassword()) return;

  const confirmDelete = confirm("Tem certeza que deseja excluir esta receita?");

  if (!confirmDelete) return;

  await deleteDoc(doc(db, "recipes", selectedRecipe.id));

  alert("Receita excluída com sucesso!");
  modal.classList.add("hidden");
  loadRecipes();
}

saveBtn.addEventListener("click", saveRecipe);
searchInput.addEventListener("input", () => {
  visibleCount = 10;
  renderRecipes();
});
closeModal.addEventListener("click", () => modal.classList.add("hidden"));
editBtn.addEventListener("click", editRecipe);
deleteBtn.addEventListener("click", deleteRecipe);
saveEditBtn.addEventListener("click", saveEditedRecipe);
cancelEditBtn.addEventListener("click", closeEditMode);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

loadRecipes();