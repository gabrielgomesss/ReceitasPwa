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

function trimText(text) {
  return String(text || "").replace(/^\s+|\s+$/g, "");
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function loadRecipes() {
  recipesList.innerHTML = "Carregando receitas...";

  db.collection("recipes")
    .get()
    .then(function(snapshot) {
      recipes = [];

      snapshot.forEach(function(doc) {
        var data = doc.data();
        data.id = doc.id;
        recipes.push(data);
      });

      recipes.sort(function(a, b) {
        var titleA = String(a.title || "").toLowerCase();
        var titleB = String(b.title || "").toLowerCase();

        if (titleA < titleB) return -1;
        if (titleA > titleB) return 1;
        return 0;
      });

      renderRecipes();
    })
    .catch(function(error) {
      recipesList.innerHTML = "Erro ao carregar receitas.";
      alert("Erro ao carregar receitas: " + error.message);
    });
}

function renderRecipes() {
  var search = String(searchInput.value || "").toLowerCase();
  var filtered = [];

  for (var i = 0; i < recipes.length; i++) {
    var recipe = recipes[i];

    var title = String(recipe.title || "").toLowerCase();
    var ingredients = String(recipe.ingredients || "").toLowerCase();
    var preparation = String(recipe.preparation || "").toLowerCase();

    if (
      title.indexOf(search) !== -1 ||
      ingredients.indexOf(search) !== -1 ||
      preparation.indexOf(search) !== -1
    ) {
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
    loadMoreBtn.className = "load-more-btn";
    loadMoreBtn.innerHTML = "Carregar mais receitas";

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

  var preview = String(recipe.ingredients || "");

  if (preview.length > 100) {
    preview = preview.substring(0, 100) + "...";
  }

  card.innerHTML =
    "<h3>" + escapeHtml(recipe.title || "Sem título") + "</h3>" +
    "<p>" + escapeHtml(preview) + "</p>" +
    "<button type='button'>Ver Receita</button>";

  card.getElementsByTagName("button")[0].onclick = function() {
    openRecipe(recipe);
  };

  recipesList.appendChild(card);
}

function saveRecipe() {
  var title = trimText(titleInput.value);
  var ingredients = trimText(ingredientsInput.value);
  var preparation = trimText(preparationInput.value);

  if (!title || !ingredients) {
    alert("Preencha pelo menos o nome e os ingredientes.");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = "Salvando...";

  db.collection("recipes")
    .add({
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
  modal.className = modal.className.replace(/\bhidden\b/g, "");
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

  addClass(modalTitle, "hidden");
  addClass(modalIngredients, "hidden");
  addClass(modalPreparation, "hidden");

  addClass(editBtn, "hidden");
  addClass(deleteBtn, "hidden");

  removeClass(editArea, "hidden");
}

function saveEditedRecipe() {
  if (!selectedRecipe) return;

  var newTitle = trimText(editTitle.value);
  var newIngredients = trimText(editIngredients.value);
  var newPreparation = trimText(editPreparation.value);

  if (!newTitle || !newIngredients) {
    alert("Preencha pelo menos o nome e os ingredientes.");
    return;
  }

  saveEditBtn.disabled = true;
  saveEditBtn.innerHTML = "Salvando...";

  db.collection("recipes")
    .doc(selectedRecipe.id)
    .update({
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
      alert("Erro ao atualizar receita: " + error.message);
    })
    .then(function() {
      saveEditBtn.disabled = false;
      saveEditBtn.innerHTML = "Salvar Alterações";
    });
}

function closeEditMode() {
  addClass(editArea, "hidden");

  removeClass(modalTitle, "hidden");
  removeClass(modalIngredients, "hidden");
  removeClass(modalPreparation, "hidden");

  removeClass(editBtn, "hidden");
  removeClass(deleteBtn, "hidden");
}

function deleteRecipe() {
  if (!selectedRecipe) return;
  if (!askPassword()) return;

  if (!confirm("Tem certeza que deseja excluir esta receita?")) {
    return;
  }

  db.collection("recipes")
    .doc(selectedRecipe.id)
    .delete()
    .then(function() {
      alert("Receita excluída com sucesso!");
      addClass(modal, "hidden");
      loadRecipes();
    })
    .catch(function(error) {
      alert("Erro ao excluir receita: " + error.message);
    });
}

function addClass(element, className) {
  if (!element) return;

  if (element.className.indexOf(className) === -1) {
    element.className += " " + className;
  }
}

function removeClass(element, className) {
  if (!element) return;

  var regex = new RegExp("\\b" + className + "\\b", "g");
  element.className = element.className.replace(regex, "");
}

saveBtn.onclick = saveRecipe;

searchInput.onkeyup = function() {
  visibleCount = 10;
  renderRecipes();
};

closeModal.onclick = function() {
  addClass(modal, "hidden");
};

editBtn.onclick = editRecipe;
deleteBtn.onclick = deleteRecipe;
saveEditBtn.onclick = saveEditedRecipe;
cancelEditBtn.onclick = closeEditMode;

loadRecipes();