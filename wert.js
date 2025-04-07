// Global state
let search = '';
let rarity = 0;
let category = 0;
let items = [];
let maxItemsToShow = 50;
let itemTemplate = '';
let itemModalTemplate = '';
let itemReplace = [];
let isEditor = false;
let isAdmin = false;
let avatarImager = '';

// Bootstrap and Chart.js werden als externe Abhängigkeiten erwartet
/* global bootstrap, Chart */

window.onscroll = () => {
const small = window.innerWidth < 768;
if(!small){
if(window.pageYOffset > 250){
document.querySelector(".sticky-top").style.borderBottomLeftRadius = "14px";
document.querySelector(".sticky-top").style.borderBottomRightRadius = "14px";
}else{
document.querySelector(".sticky-top").style.borderBottomLeftRadius = "0px";
document.querySelector(".sticky-top").style.borderBottomRightRadius = "0px";
}
}
};

let searchWait;
document.getElementById("search").addEventListener("keyup", function() {
if (search != this.value) {
search = this.value;
clearTimeout(searchWait);
searchWait = setTimeout(filterResults, 500);
}
});

document.getElementById("raritynav").addEventListener("click", event => {
event.preventDefault();
document.querySelector("#raritynav a[data-r='"+rarity+"']").classList.remove("active");
event.target.classList.add("active");
rarity = event.target.dataset.r;
filterResults();
});

let appliedSorting = 0;
document.querySelector(".custom-select").addEventListener("change", event => {
let itemArray = null;
appliedSorting = event.target.value;
if(event.target.value > 0){
itemArray = items;
itemArray.sort(
(a, b) => {
switch(event.target.value){
case "1":
return a[10] < b[10] ? 1 : -1;
case "2":
return a[9] < b[9] ? 1 : -1;
case "3":
return a[2] < b[2] ? 1 : -1;
case "4":
return a[2] > b[2] ? 1 : -1;
case "5":
return a[8] > b[8] ? 1 : -1;
case "6":
return a[8] < b[8] ? 1 : -1;
case "7":
return Math.random() - 0.5;
}
}
);
}
filterResults(itemArray);
});

function filterResults(sortedItems = null){
let i = 0;
const container = document.querySelector(".rare");
container.replaceChildren();
(sortedItems || items).forEach(item => {
const matchCategory = (category > 0 && item[7] != category);
const matchRarity = (rarity > 0 && item[1] != rarity);
const matchSearch = (search == "" && i > maxItemsToShow && rarity == 0 && category == 0) || (search !== "" && !item[6].toLowerCase().includes(search.toLowerCase()));
const sortingHelper = ((appliedSorting == 4 || appliedSorting == 5) && item[8] < 1);
if(!(matchSearch || matchRarity || matchCategory || sortingHelper)){
i++;
let itemToAdd = itemTemplate;
for (let j = 0; j < itemReplace.length; j++) {
itemToAdd = itemToAdd.replace(itemReplace[j], item[j]);
}
container.insertAdjacentHTML("beforeend", itemToAdd);
}
});
if(window.pageYOffset > 240){
scrollTo(0, 230);
}
setTooltips();
}

// Modal State Management
const modalState = {
  currentItemId: null,
  isEditing: false,
  cleanup: null
};

function makeEditable(selector, name, f = false){
let element = document.querySelector(selector);
let input = document.createElement('input');
input.type = 'text';
input.value = element.innerText;
input.required = '';
input.name = name;
if(f){
element = element.firstChild;
}
element.replaceWith(input);
return input;
}

function cleanupModalHandlers() {
  if (modalState.cleanup) {
    modalState.cleanup();
    modalState.cleanup = null;
  }
}

async function itemModal() {
const iModal = document.querySelector('#details .modal-body');
const modalInstance = new bootstrap.Modal('#details');

// Wenn das gleiche Item nochmal geklickt wird und wir nicht im Bearbeitungsmodus sind
if(modalState.currentItemId === this.id && !modalState.isEditing) {
  return false;
}

// Cleanup vorheriger Event-Handler
cleanupModalHandlers();

// Reset Modal State wenn ein neues Item geöffnet wird
if(modalState.currentItemId !== this.id) {
  iModal.replaceChildren();
  modalState.currentItemId = this.id;
  modalState.isEditing = false;
}

modalInstance.show();

iModal.innerHTML = itemModalTemplate;
iModal.children[0].innerHTML = this.innerHTML;

if(isEditor) {
  const editButton = document.createElement('input');
  editButton.type = 'submit';
  editButton.className = 'edit';
  editButton.value = '✏️ Bearbeiten';

  const deleteButton = document.createElement('input');
  deleteButton.type = 'submit';
  deleteButton.className = 'delete';
  deleteButton.value = '🗑️ Löschen';

  iModal.children[0].lastChild.insertAdjacentElement('beforebegin', editButton);
  iModal.children[0].lastChild.insertAdjacentElement('beforebegin', deleteButton);

  // Edit Handler
  const handleEdit = async (event) => {
    if(!modalState.isEditing) {
      event.preventDefault();
      modalState.isEditing = true;
      event.target.value = '💾 Speichern';
      event.target.style.color = '#3ab4e3';

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.className = 'editFile';
      fileInput.name = 'file';
      fileInput.accept = 'image/*';
      iModal.children[0].lastChild.insertAdjacentElement('beforebegin', fileInput);

      // Form erstellen
      const form = document.createElement('form');
      form.className = 'modal-body row';
      form.enctype = 'multipart/form-data';
      form.method = 'POST';
      form.innerHTML = iModal.innerHTML;
      
      // Hidden input für den alten Namen
      const oldNameInput = document.createElement('input');
      oldNameInput.type = 'hidden';
      oldNameInput.name = 'oldName';
      oldNameInput.value = document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText;
      form.appendChild(oldNameInput);

      document.querySelector('#details .modal-content').replaceChildren(form);

      // Felder editierbar machen
      makeEditable('#details .item > :nth-child(2)', 'price');
      makeEditable('#details .modal-body > div:nth-child(2) > :last-child', 'itemName');
      makeEditable('#details .modal-body > div:nth-child(3)', 'itemDesc', true);
      makeEditable('#details .modal-body > div:nth-child(1) > div:nth-child(8)', 'category');

      // Form Submit Handler
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const formData = new FormData(form);
          const response = await fetch('?', {
            method: 'POST',
            body: formData
          });
          
          if(!response.ok) throw new Error('Speichern fehlgeschlagen');
          
          // Reset Modal State nach erfolgreichem Speichern
          modalState.isEditing = false;
          modalState.currentItemId = null;
          modalInstance.hide();
          
          // Seite neu laden um Änderungen zu zeigen
          window.location.reload();
        } catch(err) {
          console.error('Fehler beim Speichern:', err);
          alert('Fehler beim Speichern der Änderungen');
        }
      });
    }
  };

  // Delete Handler
  const handleDelete = async (event) => {
    if(confirm('Möchtest du diese Rarität wirklich löschen?')) {
      event.preventDefault();
      try {
        const formData = new FormData();
        formData.append('delete', document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText);
        
        const response = await fetch('?', {
          method: 'POST',
          body: formData
        });

        if(!response.ok) throw new Error('Löschen fehlgeschlagen');
        
        modalState.currentItemId = null;
        modalInstance.hide();
        window.location.reload();
      } catch(err) {
        console.error('Fehler beim Löschen:', err);
        alert('Fehler beim Löschen des Items');
      }
    }
  };

  editButton.addEventListener('click', handleEdit);
  deleteButton.addEventListener('click', handleDelete);

  // Cleanup-Funktion speichern
  modalState.cleanup = () => {
    editButton.removeEventListener('click', handleEdit);
    deleteButton.removeEventListener('click', handleDelete);
  };
}

const response = await fetch("?i="+this.id);
if(!response.ok){
console.error('item detail request failed');
return;
}

const json = await response.json();
iModal.children[1].innerHTML = `
<div class="col">Umlauf</div>
<div class="col">${this.querySelector('img').dataset.bsOriginalTitle}x</div>
<div class="w-100"></div>
<div class="col">Aufrufe</div>
<div class="col">${json.info.views}</div>
<div class="w-100"></div>
<div class="col">Kategorie</div>
<div class="col">${json.info.category || '--'}</div>
<div class="w-100"></div>
<div class="col"></div>
<div class="col">${this.id}</div>`;
iModal.children[2].innerText = json.info.longdesc;

if(isAdmin) {
    let logsHtml = '<div class="text-center"><h3>Letzte 20 Preisänderungen</h3><table class="table table-dark"><thead><tr><th>Benutzer</th><th>Alter Preis</th><th>Datum</th></tr></thead><tbody>';
    json.changes.sort((a, b) => b.timestamp - a.timestamp);
    json.changes.forEach(log => {
        logsHtml += `<tr>
            <td>${log.username}</td>
            <td>${log.old_price.toLocaleString()}</td>
            <td>${dateFormat(log.timestamp)}</td>
        </tr>`;
    });
    logsHtml += '</tbody></table></div>';
    iModal.children[4].innerHTML = logsHtml;
} else {
    iModal.children[4].innerHTML = '<h3 style="margin:0">Möbel Besitzer</h3><h4 style="margin:0">'+json.owners.length+'</h4><h5>(sortiert nach zuletzt online)</h5>';
    json.owners.forEach(owner => {
        let img = document.createElement('img');
        img.src = avatarImager+'?figure='+owner.figure+'&head_direction=2';
        img.title = owner.username + ' ' + owner.c + 'x';
        img.loading = "lazy";
        iModal.children[4].appendChild(img);
        new bootstrap.Tooltip(img);
    });
}

if(json.changes.length > 1){
iModal.children[3].innerHTML = '<h3>Preisentwicklung</h3><canvas id="chart"></canvas>';
let labels = [json.info.timestamp_release == 0 ? 'Release' : dateFormat(json.info.timestamp_release)], points = [];
let previousTimestamp = -1;
json.changes.forEach(change => {
points.push(change.old_price);
if(previousTimestamp > -1){
labels.push(dateFormat(change.timestamp));
}
previousTimestamp = change.timestamp;
});
points.push(json.info.price);
labels.push(dateFormat(previousTimestamp));
new Chart("chart", {
type: "line",
data: {
labels: labels,
datasets: [{
data: points,
borderColor: "#db9f21",
fill: false
}]
},
options: {
plugins: { legend: { display: false } }
}
});
}else{
iModal.children[3].remove();
}
}

function dateFormat(timestamp){
return new Date(timestamp*1000).toLocaleDateString();
}

function setTooltips(){
document.querySelectorAll(".rarity").forEach(el => new bootstrap.Tooltip(el));
document.querySelectorAll(".rare .item").forEach(item => {
item.addEventListener("click", itemModal);
});
}
setTooltips();

// Initialize insert modal form validation
if (isEditor) {
    const insertModalForm = document.querySelector('#insertModal form');
    if (insertModalForm) {
        insertModalForm.addEventListener('submit', function(e) {
            if (!this.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            this.classList.add('was-validated');
        });
    }
}

// Initialize Bootstrap modal once
new bootstrap.Modal('#insertModal');
