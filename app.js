var titleInput = document.getElementById("title");
var ingredientsInput = document.getElementById("ingredients");
var preparationInput = document.getElementById("preparation");
var saveBtn = document.getElementById("saveBtn");
var recipesList = document.getElementById("recipesList");
var searchInput = document.getElementById("search");

var modal = document.getElementById("modal");
var closeModal = document.getElementById("closeModal");
var modalTitle = document.getElementById("modalTitle");
var modalIngredients = document.getElementById("modalIngredients");
var modalPreparation = document.getElementById("modalPreparation");
var editBtn = document.getElementById("editBtn");
var deleteBtn = document.getElementById("deleteBtn");

var editArea = document.getElementById("editArea");
var editTitle = document.getElementById("editTitle");
var editIngredients = document.getElementById("editIngredients");
var editPreparation = document.getElementById("editPreparation");
var saveEditBtn = document.getElementById("saveEditBtn");
var cancelEditBtn = document.getElementById("cancelEditBtn");

var recipes = [];
var selectedRecipe = null;
var visibleCount = 10;

function loadRecipes() {
  recipesList.innerHTML = "Carregando receitas...";

  db.collection("recipes")
    .orderBy("createdAt", "desc")
    .get()
    .then(function(snapshot) {
      recipes = [];

      snapshot.forEach(function(doc) {
        var data = doc.data();
        data.id = doc.id;
        recipes.push(data);
      });

      renderRecipes();
    })
    .catch(function(error) {
      console.log("Erro ao carregar receitas:", error);
      recipesList.innerHTML = "Erro ao carregar receitas.";
      alert("Erro ao carregar receitas: " + error.message);
    });
}

function renderRecipes() {
  var search = searchInput.value.toLowerCase();
  var filtered = [];

  for (var i = 0; i < recipes.length; i++) {
    var recipe = recipes[i];
    var title = recipe.title ? recipe.title.toLowerCase() : "";
    var ingredients = recipe.ingredients ? recipe.ingredients.toLowerCase() : "";

    if (title.indexOf(search) !== -1 || ingredients.indexOf(search) !== -1) {
      filtered.push(recipe);
    }
  }

  recipesList.innerHTML = "";

  if (filtered.length === 0) {
    recipesList.innerHTML = "<p>Nenhuma receita encontrada.</p>";
    return;
  }

  var limit = Math.min(visibleCount, filtered.length);

  for (var j = 0; j < limit; j++) {
    createRecipeCard(filtered[j]);
  }

  if (filtered.length > visibleCount) {
    var loadMoreBtn = document.createElement("button");
    loadMoreBtn.innerHTML = "Carregar mais receitas";
    loadMoreBtn.className = "load-more-btn";

    loadMoreBtn.onclick = function() {
      visibleCount += 10;
      renderRecipes();
    };

    recipesList.appendChild(loadMoreBtn);
  }
}

function createRecipeCard(recipe) {
  var card = document.createElement("div");
  card.className = "recipe-card";

  var preview = recipe.ingredients || "";
  if (preview.length > 100) {
    preview = preview.substring(0, 100) + "...";
  }

  card.innerHTML =
    "<h3>" + escapeHtml(recipe.title || "Sem título") + "</h3>" +
    "<p>" + escapeHtml(preview) + "</p>" +
    "<button>Ver Receita</button>";

  card.getElementsByTagName("button")[0].onclick = function() {
    openRecipe(recipe);
  };

  recipesList.appendChild(card);
}

function saveRecipe() {
  var title = titleInput.value.replace(/^\s+|\s+$/g, "");
  var ingredients = ingredientsInput.value.replace(/^\s+|\s+$/g, "");
  var preparation = preparationInput.value.replace(/^\s+|\s+$/g, "");

  if (!title || !ingredients) {
    alert("Preencha pelo menos o nome e os ingredientes.");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = "Salvando...";

  db.collection("recipes").add({
    title: title,
    ingredients: ingredients,
    preparation: preparation,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(function() {
    titleInput.value = "";
    ingredientsInput.value = "";
    preparationInput.value = "";

    alert("Receita salva com sucesso!");
    loadRecipes();
  })
  .catch(function(error) {
    console.log("Erro ao salvar receita:", error);
    alert("Erro ao salvar receita: " + error.message);
  })
  .then(function() {
    saveBtn.disabled = false;
    saveBtn.innerHTML = "Salvar Receita";
  });
}

function openRecipe(recipe) {
  selectedRecipe = recipe;

  modalTitle.innerHTML = escapeHtml(recipe.title || "");
  modalIngredients.innerHTML = escapeHtml(recipe.ingredients || "");
  modalPreparation.innerHTML = escapeHtml(recipe.preparation || "");

  closeEditMode();
  modal.classList.remove("hidden");
}

function askPassword() {
  var password = prompt("Digite a senha para continuar:");

  if (password !== ADMIN_PASSWORD) {
    alert("Senha incorreta.");
    return false;
  }

  return true;
}

function editRecipe() {
  if (!selectedRecipe) return;
  if (!askPassword()) return;

  editTitle.value = selectedRecipe.title || "";
  editIngredients.value = selectedRecipe.ingredients || "";
  editPreparation.value = selectedRecipe.preparation || "";

  modalTitle.classList.add("hidden");
  modalIngredients.classList.add("hidden");
  modalPreparation.classList.add("hidden");

  editBtn.classList.add("hidden");
  deleteBtn.classList.add("hidden");

  editArea.classList.remove("hidden");
}

function saveEditedRecipe() {
  if (!selectedRecipe) return;

  var newTitle = editTitle.value.replace(/^\s+|\s+$/g, "");
  var newIngredients = editIngredients.value.replace(/^\s+|\s+$/g, "");
  var newPreparation = editPreparation.value.replace(/^\s+|\s+$/g, "");

  if (!newTitle || !newIngredients) {
    alert("Preencha pelo menos o nome e os ingredientes.");
    return;
  }

  saveEditBtn.disabled = true;
  saveEditBtn.innerHTML = "Salvando...";

  db.collection("recipes").doc(selectedRecipe.id).update({
    title: newTitle,
    ingredients: newIngredients,
    preparation: newPreparation
  })
  .then(function() {
    selectedRecipe.title = newTitle;
    selectedRecipe.ingredients = newIngredients;
    selectedRecipe.preparation = newPreparation;

    modalTitle.innerHTML = escapeHtml(newTitle);
    modalIngredients.innerHTML = escapeHtml(newIngredients);
    modalPreparation.innerHTML = escapeHtml(newPreparation);

    closeEditMode();
    renderRecipes();

    alert("Receita atualizada com sucesso!");
  })
  .catch(function(error) {
    console.log("Erro ao atualizar receita:", error);
    alert("Erro ao atualizar receita: " + error.message);
  })
  .then(function() {
    saveEditBtn.disabled = false;
    saveEditBtn.innerHTML = "Salvar Alterações";
  });
}

function closeEditMode() {
  editArea.classList.add("hidden");

  modalTitle.classList.remove("hidden");
  modalIngredients.classList.remove("hidden");
  modalPreparation.classList.remove("hidden");

  editBtn.classList.remove("hidden");
  deleteBtn.classList.remove("hidden");
}

function deleteRecipe() {
  if (!selectedRecipe) return;
  if (!askPassword()) return;

  var confirmDelete = confirm("Tem certeza que deseja excluir esta receita?");
  if (!confirmDelete) return;

  db.collection("recipes").doc(selectedRecipe.id).delete()
    .then(function() {
      alert("Receita excluída com sucesso!");
      modal.classList.add("hidden");
      loadRecipes();
    })
    .catch(function(error) {
      console.log("Erro ao excluir receita:", error);
      alert("Erro ao excluir receita: " + error.message);
    });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

saveBtn.onclick = saveRecipe;

searchInput.oninput = function() {
  visibleCount = 10;
  renderRecipes();
};

closeModal.onclick = function() {
  modal.classList.add("hidden");
};

editBtn.onclick = editRecipe;
deleteBtn.onclick = deleteRecipe;
saveEditBtn.onclick = saveEditedRecipe;
cancelEditBtn.onclick = closeEditMode;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

loadRecipes();