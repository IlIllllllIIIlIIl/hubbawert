window.onscroll = () => {
	const small = window.innerWidth < 768;
	if(!small){
		if(window.scrollY > 250){
			document.querySelector(".sticky-top").style.borderBottomLeftRadius = "14px";
			document.querySelector(".sticky-top").style.borderBottomRightRadius = "14px";
		}else{
			document.querySelector(".sticky-top").style.borderBottomLeftRadius = "0px";
			document.querySelector(".sticky-top").style.borderBottomRightRadius = "0px";
		}
	}
};


let searchNameWait, searchName = "", searchCatWait, searchCat = "", itemNameWait, itemName = "";
document.getElementById("search").addEventListener("keyup", function(event){
	if (searchName !== this.value && this.value.length > 0) {
		searchName = this.value;
		clearTimeout(searchNameWait);
		searchNameWait = setTimeout(filterResults, 500);
	}
});
document.getElementById("catSearch").addEventListener("keyup", function(event){
	if (searchCat !== this.value && this.value.length > 0) {
		searchCat = this.value;
		clearTimeout(searchCatWait);
		searchCatWait = setTimeout(function () {
			fetch('?s=' + encodeURIComponent(searchCat), {
				headers: {
					'X-Requested-With': 'XMLHttpRequest'
				}
			})
				.then(response => response.json())
				.then(data => {
					const categoryList = document.getElementById('categoryList');
					categoryList.innerHTML = '';

					data.forEach(cat => {
						const catElement = document.createElement('div');
						catElement.className = 'col-md-6';
						catElement.innerHTML = `
                        <a href="${cat.url}" class="btn btn-dark btn-sm w-100 mb-2" role="button">
                            ${cat.image ? `<img src="${cat.image}" width="16" height="16" loading="lazy">&nbsp;` : ''}
                            ${cat.name}
                        </a>`;
						categoryList.appendChild(catElement);
					});
				})
		}, 500);
	}
});

document.getElementById("itemName").addEventListener("keyup", function() {
	if (itemName !== this.value && this.value.length > 0) {
		itemName = this.value;
		clearTimeout(itemNameWait);
		itemNameWait = setTimeout(function () {
			fetch('?itemName=' + encodeURIComponent(itemName), {
				headers: {
					'X-Requested-With': 'XMLHttpRequest'
				}
			})
				.then(response => response.json())
				.then(data => {
					const dataList = document.getElementById("internalItemName");
					dataList.innerHTML = '';

					data.forEach(function(option) {
						const optionElement = document.createElement("option");
						optionElement.value = option;
						dataList.appendChild(optionElement);
					});
				})
		}, 500);
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
	appliedSorting = parseInt(event.target.value);
	if(event.target.value > 0) {
		itemArray = items;
		itemArray.sort(
			(a, b) => {
				switch(appliedSorting) {
					case 1:
						return a[10] < b[10] ? 1 : -1;
					case 2:
						return a[9] < b[9] ? 1 : -1;
					case 3:
						return a[2] < b[2] ? 1 : -1;
					case 4:
						return a[2] > b[2] ? 1 : -1;
					case 5:
						return a[8] > b[8] ? 1 : -1;
					case 6:
						return a[8] < b[8] ? 1 : -1;
					case 7:
						return a[11] > b[11] ? 1 : -1;
					case 8:
						return a[11] < b[11] ? 1 : -1;
					case 9:
						return Math.random() - 0.5;
					default:
						return -1;
				}
			}
		);
	}
	filterResults(itemArray);
});
function filterResults(sortedItems = null) {
	if(appliedSorting > 9 || appliedSorting < 1) return;

	let i = 0;
	const container = document.querySelector(".rare");
	container.replaceChildren();

	const itemsToDisplay = sortedItems || items;

	itemsToDisplay.forEach(item => {
		if (i >= maxItemsToShow) return; // Immediately leaving when maxItems is reached - much more efficient than OG
		const matchCategory = category > 0 && item[7] !== category;
		const matchRarity = rarity > 0 && item[1] !== rarity;
		const matchSearchName = searchName !== "" && !item[6].toLowerCase().includes(searchName.toLowerCase());
		const sortingHelper = [2,5,6].includes(appliedSorting) && item[4] === 'Unbekannt';

		if (!(matchRarity || matchCategory || matchSearchName || sortingHelper)) {
			let itemToAdd = itemTemplate;

			itemReplace.forEach((replace, index) => {
				itemToAdd = itemToAdd.replace(replace, item[index]);
			});

			container.insertAdjacentHTML("beforeend", itemToAdd);
			i++;
		}
	});

	if (window.scrollY  > 240)
		scrollTo(0, 230);

	setTooltips();
}
function makeEditable(selector, name, useFirstChild = false){
	let element = document.querySelector(selector);

	if (!element) {
		console.error(`Element with selector ${selector} not found.`);
		return;
	}

	let input = document.createElement('input');

	input.type = 'text';
	input.value = element.innerText.trim();
	input.required = true;

	if (name) {
		input.name = name;
	} else {
		console.warn('No name provided for input field.');
	}

	if (useFirstChild && element.firstChild) {
		element.firstChild.replaceWith(input);
	} else {
		element.replaceWith(input);
	}
}


let lastModalId, lastModal;
async function itemModal(e){
	new bootstrap.Modal('#details').show();

	const itemId = this.id;
	const iModal = (lastModalId === itemId) ? lastModal : document.querySelector('#details .modal-body');

	if (lastModalId === itemId) return false;


	lastModalId = itemId;
	lastModal = iModal;

	iModal.innerHTML = itemModalTemplate;
	iModal.children[0].innerHTML = this.innerHTML;
	if(isEditor){
		iModal.children[0].lastChild.insertAdjacentHTML('beforebegin', '<input class="edit" type="submit" value="✏️ Bearbeiten">');
		document.querySelector('#details .modal-body .edit').addEventListener("click", event => {
			if(event.target.value.includes('Bearbeiten')){
				event.preventDefault();
				event.target.value = '💾 Speichern';
				event.target.style.color = '#3ab4e3';
				iModal.children[0].lastChild.insertAdjacentHTML('beforebegin', '<input class="editFile" type="file" name="file" accept="image/*" >');
				document.querySelector('#details .modal-content').innerHTML = `<form class="modal-body row" enctype="multipart/form-data" method="POST" action="">${document.querySelector('#details .modal-body').innerHTML}
				<input type="hidden" name="oldName" value="${document.querySelector('#details .modal-body > div:nth-child(2) > :last-child').innerText}">
				</form>`;
				makeEditable('#details .item > :nth-child(2)', 'price');
				makeEditable('#details .modal-body > div:nth-child(2) > :last-child', 'itemName');
				makeEditable('#details .modal-body > div:nth-child(3)', 'itemDesc', true);
			}
		});
	}

	const response = await fetch("?i="+this.id, {
		headers: {
			'X-Requested-With': 'XMLHttpRequest'
		}
	});

	if(!response.ok){
		console.error('item detail request failed');
	}

	const json = await response.json();

	var replace = `
	<div class="col">Umlauf</div>
	<div class="col">${this.querySelector('img').dataset.bsOriginalTitle}x</div>
	<div class="w-100"></div>
	<div class="col">Aufrufe</div>
	<div class="col">${json.info.views}</div>
	<div class="w-100"></div>`;

	if(json.info.timestamp_release !== 0) {
		const date = new Date(json.info.timestamp_release * 1000);
		const options = {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		};
		const germanDate = date.toLocaleDateString('de-DE', options);

		replace += `<div class="col">Release</div>
		<div class="col">${germanDate}</div>
		<div class="w-100"></div>`;
	}

	replace += `<div class="col">Item Name</div>
	<div class="col">${this.id}</div>`;

	iModal.children[1].innerHTML = replace;

	iModal.children[2].innerText = json.info.longdesc != null ? json.info.longdesc: " ";

	if(json.owners.length >= 1) {
		iModal.children[4].innerHTML = '<h3 style="margin:0">Möbel Besitzer</h3><h4 style="margin:0">'+json.owners.length+'</h4><h5>(sortiert nach zuletzt online)</h5>';
		json.owners.forEach(owner => {
			let img = document.createElement('img');
			img.src = avatarImager+'?figure='+owner.figure+'&head_direction=2';
			img.title = owner.username + ' ' + owner.c + 'x';
			img.loading = "lazy";
			iModal.children[4].appendChild(img);
			new bootstrap.Tooltip(img);
		});
	} else {
		iModal.children[4].remove();
	}

	if(json.changes.length >= 1) {
		iModal.children[3].innerHTML = '<h3>Preisentwicklung</h3><canvas id="chart"></canvas>';
		let labels = [json.info.timestamp_release === 0 ? 'Release' : dateFormat(json.info.timestamp_release)], points = [];
		let previousTimestamp = -1;
		json.changes.forEach(change => {
			points.push(change.old_price);
			if(previousTimestamp > -1){
				labels.push(dateFormat(change.timestamp));
			}
			previousTimestamp = change.timestamp;
		});
		points.push(json.info.price < 0 ? 0: json.info.price);
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
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								if(context.parsed.y === 0) {
									return 'Unbekannt';
								} else {
									const fullnumber = Intl.NumberFormat('de-DE').format(context.parsed.y);
									const shortnumber = Intl.NumberFormat('de-DE', {
										notation: "compact",
										maximumFractionDigits: 1
									}).format(context.parsed.y);

									return shortnumber + " (" + fullnumber + ")";
								}
							}
						}
					}
				},
				locale: 'de-DE'
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
	document.querySelectorAll(".rare .item").forEach(item => {
		item.addEventListener("click", itemModal);
	});
}
setTooltips();
/*
function catHandler(event){
	event.preventDefault();
	const href = this.getAttribute("href");
	history.pushState(null, null, href);

}
document.querySelectorAll(".cats a").forEach(cat => {
	cat.addEventListener("click", catHandler);
});*/