// Setup category selection
function setupCategorySelection(item) {
    console.log('Setting up category selection for item:', {
        id: item.id,
        currentCategories: item.dataset.categories
    });

    const categoryDiv = document.querySelector('#details .modal-body > div:nth-child(1)');
    if (!categoryDiv) {
        console.error('Category div not found');
        throw new Error('Category container element not found');
    }

    const categoriesSelect = document.createElement('select');
    categoriesSelect.name = 'categories[]';
    categoriesSelect.multiple = true;
    categoriesSelect.className = 'form-control mt-2';

    try {
        console.log('Setting categories HTML');
        if (typeof categoriesHtml === 'undefined') {
            console.warn('categoriesHtml is not defined, using empty options');
            categoriesSelect.innerHTML = '<option value="">Keine Kategorien verfügbar</option>';
        } else {
            categoriesSelect.innerHTML = categoriesHtml;
        }

        const currentCategories = item.dataset.categories ? item.dataset.categories.split(',') : [];
        console.log('Current categories:', currentCategories);

        Array.from(categoriesSelect.options).forEach(option => {
            if (currentCategories.includes(option.value)) {
                option.selected = true;
                console.log('Pre-selecting category:', option.value);
            }
        });

        categoryDiv.appendChild(categoriesSelect);
        console.log('Category selection setup complete');
    } catch (error) {
        console.error('Error in category setup:', error);
        throw new Error('Failed to setup category selection: ' + error.message);
    }
}

// Initialize tooltips and click handlers
function setTooltips() {
    console.log('Setting up tooltips and click handlers');
    document.querySelectorAll(".rarity").forEach(el => new bootstrap.Tooltip(el));
    document.querySelectorAll(".rare .item").forEach(item => {
        console.log('Adding click handler to item:', {
            id: item.id,
            classes: item.className,
            dataset: item.dataset
        });
        item.addEventListener("click", itemModal);
    });
}

// Scroll handling
window.onscroll = () => {
    const small = window.innerWidth < 768;
    if (!small) {
        if (window.pageYOffset > 250) {
            document.querySelector(".sticky-top").style.borderBottomLeftRadius = "14px";
            document.querySelector(".sticky-top").style.borderBottomRightRadius = "14px";
        } else {
            document.querySelector(".sticky-top").style.borderBottomLeftRadius = "0px";
            document.querySelector(".sticky-top").style.borderBottomRightRadius = "0px";
        }
    }
};

// Search functionality
let searchWait;
document.getElementById("search").addEventListener("keyup", function() {
    if (search != this.value) {
        search = this.value;
        clearTimeout(searchWait);
        searchWait = setTimeout(filterResults, 500);
    }
});

// Rarity navigation
document.getElementById("raritynav").addEventListener("click", event => {
    event.preventDefault();
    document.querySelector("#raritynav a[data-r='" + rarity + "']").classList.remove("active");
    event.target.classList.add("active");
    rarity = event.target.dataset.r;
    filterResults();
});

// Sorting functionality
let appliedSorting = 0;
document.querySelector(".custom-select").addEventListener("change", event => {
    let itemArray = null;
    appliedSorting = event.target.value;
    if (event.target.value > 0) {
        itemArray = items;
        itemArray.sort((a, b) => {
            switch (event.target.value) {
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
        });
    }
    filterResults(itemArray);
});

// Filter results
function filterResults(sortedItems = null) {
    let i = 0;
    const container = document.querySelector(".rare");
    container.replaceChildren();
    (sortedItems || items).forEach(item => {
        const matchCategory = (category > 0 && item[7] != category);
        const matchRarity = (rarity > 0 && item[1] != rarity);
        const matchSearch = (search == "" && i > maxItemsToShow && rarity == 0 && category == 0) || (search !== "" && !item[6].toLowerCase().includes(search.toLowerCase()));
        const sortingHelper = ((appliedSorting == 4 || appliedSorting == 5) && item[8] < 1); /* < 1 skip unknown prices in price sorting */
        if (!(matchSearch || matchRarity || matchCategory || sortingHelper)) {
            i++;
            let itemToAdd = itemTemplate;
            for (let j = 0; j < itemReplace.length; j++) {
                itemToAdd = itemToAdd.replace(itemReplace[j], item[j]);
            }
            container.insertAdjacentHTML("beforeend", itemToAdd);
        }
    });
    if (window.pageYOffset > 240) {
        scrollTo(0, 230);
    }
    setTooltips();
}

// Make elements editable
function makeEditable(selector, name, f = false) {
    let element = document.querySelector(selector);
    let input = document.createElement('input');
    input.type = 'text';
    input.value = element.innerText;
    input.required = '';
    input.name = name;
    if (f) {
        element = element.firstChild;
    }
    element.replaceWith(input);
}

// Format dates
function dateFormat(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString();
}

// Modal handling
let lastModal = 0;
async function itemModal(event) {
    try {
        console.log('itemModal called with:', {
            id: this.id,
            target: event.target,
            dataset: this.dataset,
            itemElement: this
        });
        
        const detailsModal = document.querySelector('#details');
        const iModal = detailsModal?.querySelector('.modal-body');
        
        console.log('Modal elements found:', {
            detailsModal: !!detailsModal,
            modalBody: !!iModal
        });
        
        if (!detailsModal || !iModal) {
            throw new Error('Modal elements not found in DOM');
        }
        
        if (lastModal != this.id) {
            console.log('Clearing modal content (new item)');
            iModal.replaceChildren();
        }
        
        try {
            console.log('Initializing bootstrap modal');
            let modalInstance = bootstrap.Modal.getInstance(detailsModal);
            
            if (!modalInstance) {
                console.log('Creating new modal instance');
                modalInstance = new bootstrap.Modal(detailsModal);
            } else {
                console.log('Using existing modal instance');
            }
            
            modalInstance.show();
            console.log('Modal shown successfully');
        } catch (modalError) {
            console.error('Bootstrap modal error:', modalError);
            throw new Error('Modal initialization failed: ' + modalError.message);
        }
        
        
        if (lastModal == this.id) {
            console.log('Same item clicked again, returning early');
            return false;
        }
        lastModal = this.id;

        console.log('Setting up modal content with template');
        try {
            if (typeof itemModalTemplate === 'undefined') {
                console.error('itemModalTemplate is not defined');
                throw new Error('Modal template is missing');
            }
            console.log('Template content:', itemModalTemplate);
            iModal.innerHTML = itemModalTemplate;
            console.log('Template set successfully');

            if (!iModal.children[0]) {
                console.error('First child element is missing after template set');
                throw new Error('Invalid modal template structure');
            }

            console.log('Setting item HTML for', this.id);
            iModal.children[0].innerHTML = this.innerHTML;
            console.log('Item HTML set successfully');
        } catch (templateError) {
            console.error('Error setting template:', {
                error: templateError,
                template: itemModalTemplate,
                modalElement: iModal
            });
            throw new Error('Failed to set modal content: ' + templateError.message);
        }

        if (isEditor) {
            console.log('Editor mode: adding edit/delete buttons');
            iModal.children[0].lastChild.insertAdjacentHTML('beforebegin', '<input class="edit" type="submit" value="✏️ Bearbeiten"><input class="delete" type="submit" value="🗑️ Löschen">');
            const editButton = document.querySelector('#details .modal-body .edit');
            console.log('Edit button found:', !!editButton);
            editButton.addEventListener("click", event => {
                if (event.target.value.includes('Bearbeiten')) {
                    event.preventDefault();
                    event.target.value = '💾 Speichern';
                    event.target.style.color = '#3ab4e3';
                    iModal.children[0].lastChild.insertAdjacentHTML('beforebegin', '<input class="editFile" type="file" name="file" accept="image/*">');
                    document.querySelector('#details .modal-content').innerHTML = `<form class="modal-body row" enctype="multipart/form-data" method="POST">${document.querySelector('#details .modal-body').innerHTML}
                    <input type="hidden" name="oldName" value="${document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText}">
                    <input type="hidden" name="current_categories" value="${this.dataset.categories || ''}">
                    </form>`;
                    makeEditable('#details .item > :nth-child(2)', 'price');
                    makeEditable('#details .modal-body > div:nth-child(2) > :last-child', 'itemName');
                    makeEditable('#details .modal-body > div:nth-child(3)', 'itemDesc', true);
                    
                    try {
                        console.log('Setting up category selection');
                        setupCategorySelection(this);
                        console.log('Category selection setup complete');
                        
                        // Add event listener for category changes
                        const categorySelect = document.querySelector('#details select[name="categories[]"]');
                        if (categorySelect) {
                            categorySelect.addEventListener('change', function() {
                                console.log('Categories changed:', {
                                    selected: Array.from(this.selectedOptions).map(opt => opt.value)
                                });
                            });
                        } else {
                            console.warn('Category select element not found after setup');
                        }
                    } catch (categoryError) {
                        console.error('Error setting up categories:', categoryError);
                        // Don't throw here - allow form to work even if categories fail
                    }
                }
            });
            const deleteButton = document.querySelector('#details .modal-body .delete');
            console.log('Delete button found:', !!deleteButton);
            deleteButton.addEventListener("click", event => {
                event.preventDefault();
                if (confirm('Möchtest du diese Rarität wirklich löschen?')) {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.innerHTML = `<input type="hidden" name="delete" value="${document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText}">`;
                    document.body.appendChild(form);
                    form.submit();
                }
            });
        }

        console.log('Fetching item details for ID:', this.id);
        const response = await fetch("?i=" + this.id);
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`Item detail request failed: ${response.status} ${response.statusText}`);
        }
        console.log('Response received, parsing JSON');
        const json = await response.json();
        console.log('Item details:', json);
        console.log('Setting modal content for item details');
        iModal.children[1].innerHTML = `
        <div class="col">Umlauf</div>
        <div class="col">${this.querySelector('img').dataset.bsOriginalTitle}x</div>
        <div class="w-100"></div>
        <div class="col">Aufrufe</div>
        <div class="col">${json.info.views}</div>
        <div class="w-100"></div>
        <div class="col">Kategorie</div>
        <div class="col">${this.dataset.categories ? this.dataset.categories.split(',').join(', ') : '--'}</div>
        <div class="w-100"></div>
        <div class="col"></div>
        <div class="col">${this.id}</div>`;
        iModal.children[2].innerText = json.info.longdesc;

        if (isAdmin) {
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
            iModal.children[4].innerHTML = '<h3 style="margin:0">Möbel Besitzer</h3><h4 style="margin:0">' + json.owners.length + '</h4><h5>(sortiert nach zuletzt online)</h5>';
            json.owners.forEach(owner => {
                let img = document.createElement('img');
                img.src = avatarImager + '?figure=' + owner.figure + '&head_direction=2';
                img.title = owner.username + ' ' + owner.c + 'x';
                img.loading = "lazy";
                iModal.children[4].appendChild(img);
                new bootstrap.Tooltip(img);
            });
        }

        if (json.changes.length > 1) {
            iModal.children[3].innerHTML = '<h3>Preisentwicklung</h3><canvas id="chart"></canvas>';
            let labels = [json.info.timestamp_release == 0 ? 'Release' : dateFormat(json.info.timestamp_release)],
                points = [];
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
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } else {
            iModal.children[3].remove();
        }
    } catch (error) {
        console.error('Error in itemModal:', error);
        alert('Es ist ein Fehler aufgetreten beim Öffnen des Modals: ' + error.message);
    }
}

// Initialize insert modal form validation
if (isEditor) {
    const insertModalForm = document.querySelector('#insertModal form');
    if (insertModalForm) {
        insertModalForm.addEventListener('submit', function(e) {
            if (!this.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Log form data before submission
            const formData = new FormData(this);
            console.log('Submitting form with data:', {
                categories: formData.getAll('categories[]'),
                oldName: formData.get('oldName'),
                currentCategories: formData.get('current_categories')
            });
            
            this.classList.add('was-validated');
        });
    }
}

// Initialize Bootstrap modals and tooltips
new bootstrap.Modal('#insertModal');
setTooltips();