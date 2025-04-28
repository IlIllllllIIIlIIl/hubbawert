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
let searchWait;
let currentSearch = '';
document.getElementById("search").addEventListener("keyup", function() {
	if (currentSearch !== this.value) {
		currentSearch = this.value;
		search = this.value; // Update the global search variable
		clearTimeout(searchWait);
		searchWait = setTimeout(() => {
			filterResults();
			setTooltips(); // Ensure tooltips are reinitialized after filtering
		}, 500);
	}
});
document.getElementById("raritynav").addEventListener("click", event => {
	event.preventDefault();
	document.querySelector("#raritynav a[data-r='" + rarity + "']").classList.remove("active");
	event.target.classList.add("active");
	rarity = event.target.dataset.r;
	filterResults();
});
let appliedSorting = 0;
document.querySelector(".custom-select").addEventListener("change", event => {
	let itemArray = null;
	appliedSorting = event.target.value;
	if (event.target.value > 0) {
		itemArray = items;
		itemArray.sort(
			(a, b) => {
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
			}
		);
	}
	filterResults(itemArray);
});

function filterResults(sortedItems = null) {
	let i = 0;
	const container = document.querySelector(".rare");
	if (!container) return;
	
	// Clear existing content
	container.replaceChildren();
	
	// Get items to process, with fallbacks
	const itemsToProcess = sortedItems || items || [];
	
	// Track visible items for debugging
	const visibleItems = [];
	
	itemsToProcess.forEach(item => {
		if (!item) return; // Skip invalid items
		
		// Check category match
		const matchCategory = category > 0 && String(item[7]) !== String(category);
		
		// Check rarity match
		const matchRarity = rarity > 0 && String(item[1]) !== String(rarity);
		
		// Check search match with proper string handling
		const itemName = String(item[6] || '').toLowerCase();
		const searchTerm = String(search || '').toLowerCase();
		const matchSearch = (searchTerm === '' && i > maxItemsToShow && rarity == 0 && category == 0) ||
						   (searchTerm !== '' && !itemName.includes(searchTerm));
		
		// Check sorting helper
		const sortingHelper = (appliedSorting == 4 || appliedSorting == 5) && (!item[8] || item[8] < 1);
		// Show item if it passes all filters
		if (!(matchSearch || matchRarity || matchCategory || sortingHelper)) {
			i++;
			let itemToAdd = itemTemplate;
			try {
				for (let j = 0; j < itemReplace.length; j++) {
					itemToAdd = itemToAdd.replace(itemReplace[j], item[j] || '');
				}
				container.insertAdjacentHTML("beforeend", itemToAdd);
				visibleItems.push(item[6]); // Track visible item for debugging
			} catch (err) {
				console.warn('Failed to add item:', err);
			}
		}
	});
	
	// Log visible items count for debugging
	console.log(`Filtered items: ${visibleItems.length} visible`);
	if (window.pageYOffset > 240) {
		scrollTo(0, 230);
	}
	setTooltips();
}

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
let lastModal = 0;
async function itemModal(e) {
	e.preventDefault();
	const itemId = this.id;
	const iModal = document.querySelector('#details .modal-body');

	if (lastModal != itemId) {
		iModal.replaceChildren();
	}
	new bootstrap.Modal('#details').show();
	if (lastModal == itemId) {
		return false;
	}
	lastModal = itemId;

	iModal.innerHTML = itemModalTemplate;
	iModal.children[0].innerHTML = this.innerHTML;

	if (isEditor) {
		iModal.children[0].lastChild.insertAdjacentHTML('beforebegin', '<input class="edit" type="submit" value="✏️ Bearbeiten"><input class="delete" type="submit" value="🗑️ Löschen">');

		document.querySelector('#details .modal-body .edit').addEventListener("click", event => {
			if (event.target.value.includes('Bearbeiten')) {
				event.preventDefault();
				event.target.value = '💾 Speichern';
				event.target.style.color = '#3ab4e3';
				iModal.children[0].lastChild.insertAdjacentHTML('beforebegin', '<input class="editFile" type="file" name="file" accept="image/*">');

				const currentCategories = items.find(item => item[0] === this.id)?.[7]?.split(',') || [];

				const form = document.createElement('form');
				form.className = 'modal-body row';
				form.enctype = 'multipart/form-data';
				form.method = 'POST';
				form.innerHTML = document.querySelector('#details .modal-body').innerHTML;

				const categoryDiv = document.createElement('div');
				categoryDiv.style.cssText = 'border:1px solid #2c2e3c;padding:12px;margin:10px 0';
				categoryDiv.innerHTML = '<div style="display:flex;flex-direction:column">' +
					'<span class="mb-2">Kategorien:</span>' +
					'<div style="max-height:150px;overflow-y:auto;padding:10px;border:1px solid #2c2e3c;border-radius:4px">' +
					'<div class="d-flex flex-column" style="gap:8px">' +
					(document.querySelector('#insertModal .d-flex.flex-column')?.innerHTML || '') +
					'</div></div></div>';

				form.appendChild(categoryDiv);
				form.insertAdjacentHTML('beforeend', '<input type="hidden" name="oldName" value="' +
					document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText + '">');

				document.querySelector('#details .modal-content').innerHTML = '';
				document.querySelector('#details .modal-content').appendChild(form);

				currentCategories.forEach(catId => {
					const checkbox = document.querySelector(`input[name="categories[]"][value="${catId}"]`);
					if (checkbox) checkbox.checked = true;
				});

				makeEditable('#details .item > :nth-child(2)', 'price');
				makeEditable('#details .modal-body > div:nth-child(2) > :last-child', 'itemName');
				makeEditable('#details .modal-body > div:nth-child(3)', 'itemDesc', true);
			}
		});

		document.querySelector('#details .modal-body .delete').addEventListener("click", event => {
			if (confirm('Möchtest du diese Rarität wirklich löschen?')) {
				event.preventDefault();
				const form = document.createElement('form');
				form.method = 'POST';
				form.innerHTML = '<input type="hidden" name="delete" value="' + document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText + '">';
				document.body.appendChild(form);
				form.submit();
			}
		});
	}

	try {
		const response = await fetch("?i=" + itemId);
		if (!response.ok) {
			throw new Error(`Failed to fetch item details: ${response.status}`);
		}
		const json = await response.json();
		if (!json || !json.info) {
			throw new Error('Invalid response data');
		}
		iModal.children[1].innerHTML = '<div class="col">Umlauf</div>' +
		'<div class="col">' + this.querySelector('img').dataset.bsOriginalTitle + 'x</div>' +
		'<div class="w-100"></div>' +
		'<div class="col">Aufrufe</div>' +
		'<div class="col">' + json.info.views + '</div>' +
		'<div class="w-100"></div>' +
		'<div class="w-100"></div>' +
		'<div class="col"></div>' +
		'<div class="col">' + this.id + '</div>';
	iModal.children[2].innerText = json.info.longdesc;

	if (isAdmin) {
		let logsHtml = '<div class="text-center"><h3>Letzte 20 Preisänderungen</h3><table class="table table-dark"><thead><tr><th>Benutzer</th><th>Alter Preis</th><th>Datum</th></tr></thead><tbody>';
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
		iModal.children[4].innerHTML = '<h3 style="margin:0">Möbel Besitzer</h3><h4 style="margin:0">' + json.owners.length + '</h4><h5>(sortiert nach zuletzt online)</h5>';
		json.owners.forEach(owner => {
			let img = document.createElement('img');
			img.src = avatarImager + '?figure=' + owner.figure + '&head_direction=2';
			img.title = owner.username + ' ' + owner.c + 'x';
			img.loading = "lazy";
			iModal.children[4].appendChild(img);
			try {
				new bootstrap.Tooltip(img);
			} catch (tooltipErr) {
				console.warn('Failed to create tooltip:', tooltipErr);
			}
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
		try {
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
		} catch (chartErr) {
			console.warn('Failed to create chart:', chartErr);
			iModal.children[3].remove();
		}
	} else {
		iModal.children[3].remove();
	}
	} catch (error) {
		console.error('Error in itemModal:', error);
		iModal.innerHTML = '<div class="alert alert-danger">Failed to load item details. Please try again later.</div>';
	}
}

function dateFormat(timestamp) {
	return new Date(timestamp * 1000).toLocaleDateString();
}

function setTooltips() {
	document.querySelectorAll(".rarity").forEach(el => new bootstrap.Tooltip(el));
	document.querySelectorAll(".rare .item").forEach(item => {
		// Remove existing listener if any to prevent duplicates
		item.removeEventListener("click", itemModal);
		// Add new listener with bound context
		item.addEventListener("click", itemModal.bind(item));
	});
}
setTooltips();

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

	new bootstrap.Modal('#insertModal');
}