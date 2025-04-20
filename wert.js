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
document.getElementById("search").addEventListener("keyup", function(event){
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
const sortingHelper = ((appliedSorting == 4 || appliedSorting == 5) && item[8] < 1); /* < 1 skip unknown prices in price sorting */
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
function makeEditable(selector, name, targetForm, f = false){
let element = document.querySelector(selector);
let input = document.createElement('input');
input.type = 'text';
input.value = element.innerText;
input.required = '';
input.name = name;

// Stil für das Input-Feld
input.style.width = '100%';
input.style.padding = '4px';
input.style.marginBottom = '8px';
input.style.background = '#2c2e3c';
input.style.border = '1px solid #3c3e4c';
input.style.borderRadius = '4px';
input.style.color = '#fff';

// Original-Element leicht ausgegraut
if(f){
    element = element.firstChild;
}
element.style.opacity = '0.5';

// Input zum Form hinzufügen
targetForm.appendChild(input);
}
let lastModal = 0;
async function itemModal() {
    console.log('Item clicked:', this.id);
    const iModal = document.querySelector('#details .modal-body');
    if (!iModal) {
        console.error('Modal body not found');
        return false;
    }

    if (lastModal != this.id) {
        iModal.replaceChildren();
    }
    new bootstrap.Modal('#details').show();
    if (lastModal == this.id) {
        return false;
    }
    lastModal = this.id;

    iModal.innerHTML = itemModalTemplate;
    iModal.children[0].innerHTML = this.innerHTML;

    const response = await fetch("?i=" + this.id);
    if (!response.ok) {
        console.error('item detail request failed');
        return;
    }
    const json = await response.json();

    // Editor-Buttons hinzufügen
    if (isEditor) {
        iModal.children[0].lastChild.insertAdjacentHTML('beforebegin',
            '<input class="edit" type="submit" value="✏️ Bearbeiten">' +
            '<input class="delete" type="submit" value="🗑️ Löschen">'
        );

        // Edit Button Handler
        document.querySelector('#details .modal-body .edit').addEventListener("click", event => {
            event.preventDefault();
            event.target.style.display = 'none';  // Original "Bearbeiten" Button ausblenden

            const currentCategories = items.find(item => item[0] === this.id)?.[7]?.split(',') || [];

            // Form für die editierbaren Felder erstellen
            const form = document.createElement('form');
            form.enctype = 'multipart/form-data';
            form.method = 'POST';
            form.style.cssText = 'padding: 15px; background: #1c1e2c; border-radius: 8px; margin: 15px 0;';

            // File Input und Submit Button Container
            const actionButtons = document.createElement('div');
            actionButtons.style.cssText = 'display: flex; gap: 10px; margin-top: 10px;';

            // File Input übernehmen/erstellen
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.name = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.cssText = 'flex: 1;';
            actionButtons.appendChild(fileInput);

            // Submit Button erstellen
            const submitButton = document.createElement('input');
            submitButton.type = 'submit';
            submitButton.value = '💾 Speichern';
            submitButton.style.cssText = 'background: #3ab4e3; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;';
            actionButtons.appendChild(submitButton);
            form.appendChild(actionButtons);

            // Hidden Input für den alten Namen
            const oldNameInput = document.createElement('input');
            oldNameInput.type = 'hidden';
            oldNameInput.name = 'oldName';
            oldNameInput.value = document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText;
            form.appendChild(oldNameInput);

            // Editierbare Felder erstellen
            makeEditable('#details .item > :nth-child(2)', 'price', form);
            makeEditable('#details .modal-body > div:nth-child(2) > :last-child', 'itemName', form);
            makeEditable('#details .modal-body > div:nth-child(3)', 'itemDesc', form, true);

            // Kategorie-Auswahl Container
            const categoryDiv = document.createElement('div');
            categoryDiv.style.cssText = 'border:1px solid #2c2e3c;padding:12px;margin:10px 0;';
            categoryDiv.innerHTML = '<div style="display:flex;flex-direction:column">' +
                '<span class="mb-2">Kategorien:</span>' +
                '<div style="max-height:150px;overflow-y:auto;padding:10px;border:1px solid #2c2e3c;border-radius:4px">' +
                '<div class="d-flex flex-column" style="gap:8px">' +
                (document.querySelector('#insertModal .d-flex.flex-column')?.innerHTML || '') +
                '</div></div></div>';
            form.appendChild(categoryDiv);

            // Kategorien auswählen
            currentCategories.forEach(catId => {
                const checkbox = document.querySelector(`input[name="categories[]"][value="${catId}"]`);
                if (checkbox) checkbox.checked = true;
            });

            // Form nach den Basis-Infos einfügen
            const modalBody = document.querySelector('#details .modal-body');
            modalBody.insertBefore(form, modalBody.children[3]);

            // Nach dem Editierbar-Machen die Tooltips neu initialisieren
            document.querySelectorAll('#details img[title]').forEach(img => {
                new bootstrap.Tooltip(img, {
                    container: 'body',
                    html: true
                });
            });
        });

        // Delete Button Handler
        document.querySelector('#details .modal-body .delete').addEventListener("click", event => {
            if (confirm('Möchtest du diese Rarität wirklich löschen?')) {
                event.preventDefault();
                const form = document.createElement('form');
                form.method = 'POST';
                form.innerHTML = '<input type="hidden" name="delete" value="' +
                    document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText + '">';
                document.body.appendChild(form);
                form.submit();
            }
        });
    }

    // Basis-Informationen setzen
    iModal.children[1].innerHTML = '<div class="col">Umlauf</div>' +
        '<div class="col">' + this.querySelector('img').dataset.bsOriginalTitle + 'x</div>' +
        '<div class="w-100"></div>' +
        '<div class="col">Aufrufe</div>' +
        '<div class="col">' + json.info.views + '</div>' +
        '<div class="w-100"></div>' +
        '<div class="col">Kategorie</div>' +
        '<div class="col">--</div>' +
        '<div class="w-100"></div>' +
        '<div class="col"></div>' +
        '<div class="col">' + this.id + '</div>';
    iModal.children[2].innerText = json.info.longdesc;

    // Admin oder Besitzer-Ansicht
    if (isAdmin) {
        let logsHtml = '<div class="text-center"><h3>Letzte 20 Preisänderungen</h3>' +
            '<table class="table table-dark"><thead><tr><th>Benutzer</th><th>Alter Preis</th><th>Datum</th></tr></thead><tbody>';
        json.changes.sort((a, b) => b.timestamp - a.timestamp);
        json.changes.forEach(log => {
            logsHtml += '<tr>' +
                '<td>' + log.username + '</td>' +
                '<td>' + log.old_price.toLocaleString() + '</td>' +
                '<td>' + dateFormat(log.timestamp) + '</td>' +
            '</tr>';
        });
        logsHtml += '</tbody></table></div>';
        iModal.children[4].innerHTML = logsHtml;
    } else {
        iModal.children[4].innerHTML = '<h3 style="margin:0">Möbel Besitzer</h3>' +
            '<h4 style="margin:0">' + json.owners.length + '</h4>' +
            '<h5>(sortiert nach zuletzt online)</h5>';
        json.owners.forEach(owner => {
            let img = document.createElement('img');
            img.src = avatarImager + '?figure=' + owner.figure + '&head_direction=2';
            img.title = owner.username + ' ' + owner.c + 'x';
            img.loading = "lazy";
            iModal.children[4].appendChild(img);
            new bootstrap.Tooltip(img, {
                container: 'body',
                html: true
            });
        });
    }

    // Preisentwicklung
    if (json.changes.length > 1) {
        iModal.children[3].innerHTML = '<h3>Preisentwicklung</h3><canvas id="chart"></canvas>';
        let labels = [json.info.timestamp_release == 0 ? 'Release' : dateFormat(json.info.timestamp_release)];
        let points = [];
        let previousTimestamp = -1;
        json.changes.forEach(change => {
            points.push(change.old_price);
            if (previousTimestamp > -1) {
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
    } else {
        iModal.children[3].remove();
    }
}
function dateFormat(timestamp){
return new Date(timestamp*1000).toLocaleDateString();
}
function setTooltips(){
    document.querySelectorAll(".rarity").forEach(el => new bootstrap.Tooltip(el));
}

// Use event delegation for item clicks
document.querySelector(".rare").addEventListener("click", event => {
    const item = event.target.closest(".item");
    if (item) {
        itemModal.call(item);
    }
});

setTooltips();

// Initialize insert modal form validation only if user has editor rights
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
    
    // Initialize Bootstrap modal once
    new bootstrap.Modal('#insertModal');
}