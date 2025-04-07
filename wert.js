// Scroll handler
window.onscroll = () => {
    const small = window.innerWidth < 768;
    if(!small){
        if(window.pageYOffset > 250){
            document.querySelector(".sticky-top").style.borderBottomLeftRadius = "14px";
            document.querySelector(".sticky-top").style.borderBottomRightRadius = "14px";
        } else {
            document.querySelector(".sticky-top").style.borderBottomLeftRadius = "0px";
            document.querySelector(".sticky-top").style.borderBottomRightRadius = "0px";
        }
    }
};

// Search handler
let searchWait;
document.getElementById("search").addEventListener("keyup", function(event){
    if (search != this.value) {
        search = this.value;
        clearTimeout(searchWait);
        searchWait = setTimeout(filterResults, 500);
    }
});

// Rarity navigation handler
document.getElementById("raritynav").addEventListener("click", event => {
    event.preventDefault();
    document.querySelector("#raritynav a[data-r='"+rarity+"']").classList.remove("active");
    event.target.classList.add("active");
    rarity = event.target.dataset.r;
    filterResults();
});

// Sort handler
let appliedSorting = 0;
document.querySelector(".custom-select").addEventListener("change", event => {
    let itemArray = null;
    appliedSorting = event.target.value;
    if(event.target.value > 0){
        itemArray = items;
        itemArray.sort((a, b) => {
            switch(event.target.value){
                case "1": return a[10] < b[10] ? 1 : -1;
                case "2": return a[9] < b[9] ? 1 : -1;
                case "3": return a[2] < b[2] ? 1 : -1;
                case "4": return a[2] > b[2] ? 1 : -1;
                case "5": return a[8] > b[8] ? 1 : -1;
                case "6": return a[8] < b[8] ? 1 : -1;
                case "7": return Math.random() - 0.5;
            }
        });
    }
    filterResults(itemArray);
});

// Filter results
function filterResults(sortedItems = null){
    console.log('filterResults called');
    let i = 0;
    const container = document.querySelector(".rare");
    if (!container) {
        console.error('Container .rare not found');
        return;
    }
    
    console.log('Clearing container');
    container.replaceChildren();
    
    (sortedItems || items).forEach(item => {
        const matchCategory = (category > 0 && item[7] != category);
        const matchRarity = (rarity > 0 && item[1] != rarity);
        const matchSearch = (search == "" && i > maxItemsToShow && rarity == 0 && category == 0) || 
                          (search !== "" && !item[6].toLowerCase().includes(search.toLowerCase()));
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
    
    console.log('Updating tooltips and click handlers');
    setTooltips();
}

// Make element editable
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
}

// Modal state
let lastModal = 0;
let detailsModal = null;

// Initialize modal
const initModal = () => {
    console.log('Initializing modal');
    const detailsModalElement = document.querySelector('#details');
    if (!detailsModalElement) {
        console.error('Modal element #details not found');
        return;
    }

    try {
        // Clean up any existing modal
        const oldModal = bootstrap.Modal.getInstance(detailsModalElement);
        if (oldModal) {
            oldModal.dispose();
        }

        // Create new modal
        detailsModal = new bootstrap.Modal(detailsModalElement, {
            backdrop: true,
            keyboard: true
        });

        // Set up event listeners
        detailsModalElement.addEventListener('hidden.bs.modal', () => {
            console.log('Modal hidden');
            lastModal = 0;
        });

        console.log('Modal initialized successfully');
    } catch (error) {
        console.error('Error initializing modal:', error);
    }
};

// Initialize modal when DOM is ready
document.addEventListener('DOMContentLoaded', initModal);

// Get category names helper
function getCategoryNames(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) return '--';
    const categoryNames = [];
    const select = document.createElement('select');
    select.innerHTML = categoriesHtml;
    categoryIds.forEach(id => {
        const option = select.querySelector(`option[value="${id}"]`);
        if (option) {
            categoryNames.push(option.textContent);
        }
    });
    return categoryNames.join(', ') || '--';
}

// Item modal handler
async function itemModal(e) {
    try {
        e?.preventDefault();
        console.log('Item clicked:', this?.id);

        if (!detailsModal) {
            console.error('Modal not initialized');
            return;
        }

        const iModal = document.querySelector('#details .modal-body');
        if (!iModal) {
            console.error('Modal body not found');
            return;
        }

        if (lastModal != this.id) {
            console.log('New item, updating modal');
            iModal.replaceChildren();
            lastModal = this.id;

            iModal.innerHTML = itemModalTemplate;
            iModal.children[0].innerHTML = this.innerHTML;

            if (isEditor) {
                const editButtons = '<input class="edit" type="submit" value="✏️ Bearbeiten"><input class="delete" type="submit" value="🗑️ Löschen">';
                iModal.children[0].lastChild.insertAdjacentHTML('beforebegin', editButtons);

                setupEditHandler(iModal, this);
                setupDeleteHandler();
            }

            const response = await fetch("?i=" + this.id);
            if (!response.ok) {
                throw new Error('Failed to fetch item details');
            }

            const json = await response.json();
            const categoryNames = getCategoryNames(json.info.categories ? json.info.categories.split(',') : []);

            iModal.children[1].innerHTML = `
                <div class="col">Umlauf</div>
                <div class="col">${this.querySelector('img').dataset.bsOriginalTitle}x</div>
                <div class="w-100"></div>
                <div class="col">Aufrufe</div>
                <div class="col">${json.info.views}</div>
                <div class="w-100"></div>
                <div class="col">Kategorien</div>
                <div class="col">${categoryNames}</div>
                <div class="w-100"></div>
                <div class="col"></div>
                <div class="col">${this.id}</div>`;

            iModal.children[2].innerText = json.info.longdesc;

            setupAdminContent(json, iModal);
        }

        detailsModal.show();
    } catch (error) {
        console.error('Error in itemModal:', error);
    }
}

// Setup edit handler
function setupEditHandler(iModal, item) {
    document.querySelector('#details .modal-body .edit').addEventListener("click", event => {
        if (event.target.value.includes('Bearbeiten')) {
            event.preventDefault();
            event.target.value = '💾 Speichern';
            event.target.style.color = '#3ab4e3';

            const fileInput = '<input class="editFile" type="file" name="file" accept="image/*">';
            iModal.children[0].lastChild.insertAdjacentHTML('beforebegin', fileInput);

            const modalContent = document.querySelector('#details .modal-content');
            const currentBody = document.querySelector('#details .modal-body').innerHTML;
            
            modalContent.innerHTML = `
                <form class="modal-body row" enctype="multipart/form-data" method="POST">
                    ${currentBody}
                    <input type="hidden" name="oldName" value="${document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText}">
                    <input type="hidden" name="current_categories" value="${item.dataset.categories || ''}">
                </form>`;

            makeEditable('#details .item > :nth-child(2)', 'price');
            makeEditable('#details .modal-body > div:nth-child(2) > :last-child', 'itemName');
            makeEditable('#details .modal-body > div:nth-child(3)', 'itemDesc', true);

            setupCategorySelection(item);
        }
    });
}

// Setup delete handler
function setupDeleteHandler() {
    document.querySelector('#details .modal-body .delete').addEventListener("click", event => {
        if (confirm('Möchtest du diese Rarität wirklich löschen?')) {
            event.preventDefault();
            const form = document.createElement('form');
            form.method = 'POST';
            form.innerHTML = `<input type="hidden" name="delete" value="${document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText}">`;
            document.body.appendChild(form);
            form.submit();
        }
    });
}

// Setup category selection
function setupCategorySelection(item) {
    const categoryDiv = document.querySelector('#details .modal-body > div:nth-child(1)');
    const categoriesSelect = document.createElement('select');
    categoriesSelect.name = 'categories[]';
    categoriesSelect.multiple = true;
    categoriesSelect.className = 'form-control mt-2';
    categoriesSelect.innerHTML = categoriesHtml;

    const currentCategories = item.dataset.categories ? item.dataset.categories.split(',') : [];
    Array.from(categoriesSelect.options).forEach(option => {
        if (currentCategories.includes(option.value)) {
            option.selected = true;
        }
    });

    categoryDiv.appendChild(categoriesSelect);
}

// Setup admin content
function setupAdminContent(json, iModal) {
    if (isAdmin) {
        let logsHtml = `
            <div class="text-center">
                <h3>Letzte 20 Preisänderungen</h3>
                <table class="table table-dark">
                    <thead>
                        <tr>
                            <th>Benutzer</th>
                            <th>Alter Preis</th>
                            <th>Datum</th>
                        </tr>
                    </thead>
                    <tbody>`;

        json.changes.sort((a, b) => b.timestamp - a.timestamp);
        json.changes.forEach(log => {
            logsHtml += `
                <tr>
                    <td>${log.username}</td>
                    <td>${log.old_price.toLocaleString()}</td>
                    <td>${dateFormat(log.timestamp)}</td>
                </tr>`;
        });

        logsHtml += '</tbody></table></div>';
        iModal.children[4].innerHTML = logsHtml;
    } else {
        iModal.children[4].innerHTML = `
            <h3 style="margin:0">Möbel Besitzer</h3>
            <h4 style="margin:0">${json.owners.length}</h4>
            <h5>(sortiert nach zuletzt online)</h5>`;

        json.owners.forEach(owner => {
            const img = document.createElement('img');
            img.src = `${avatarImager}?figure=${owner.figure}&head_direction=2`;
            img.title = `${owner.username} ${owner.c}x`;
            img.loading = "lazy";
            iModal.children[4].appendChild(img);
            new bootstrap.Tooltip(img);
        });
    }

    setupPriceChart(json, iModal);
}

// Setup price chart
function setupPriceChart(json, iModal) {
    if (json.changes.length > 1) {
        iModal.children[3].innerHTML = '<h3>Preisentwicklung</h3><canvas id="chart"></canvas>';
        
        const labels = [json.info.timestamp_release == 0 ? 'Release' : dateFormat(json.info.timestamp_release)];
        const points = [];
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

// Date formatter
function dateFormat(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString();
}

// Setup tooltips and click handlers
function setTooltips() {
    try {
        console.log('Setting up tooltips and click handlers');
        document.querySelectorAll(".rarity").forEach(el => new bootstrap.Tooltip(el));
        
        const items = document.querySelectorAll(".rare .item");
        console.log('Found items:', items.length);
        
        items.forEach(item => {
            item.onclick = function(e) {
                e.preventDefault();
                itemModal.call(this, e);
            };
        });
    } catch (error) {
        console.error('Error in setTooltips:', error);
    }
}

// Initialize
setTooltips();

// Initialize insert modal form
if (isEditor && document.querySelector('#insertModal form')) {
    const form = document.querySelector('#insertModal form');
    form.addEventListener('submit', function(e) {
        if (!this.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.classList.add('was-validated');
    });
}

// Initialize insert modal
if (document.querySelector('#insertModal')) {
    const insertModal = new bootstrap.Modal('#insertModal');
    console.log('Insert modal initialized');
}
