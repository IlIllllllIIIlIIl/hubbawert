let searchNameWait, searchName = "",
	searchCatWait, searchCat = "",
	appliedSorting = 0,
	category = 0;

let xmlheader = {
	headers: {
		'X-Requested-With': 'XMLHttpRequest'
	}
};

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


document.getElementById("search").addEventListener("keyup", function(event){
	appliedSorting = 0;
	if (searchName !== this.value) {
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
			fetch('?c=' + encodeURIComponent(searchCat), xmlheader)
				.then(response => response.json())
				.then(data => {
					const categoryList = document.getElementById('categoryList');
					categoryList.innerHTML = '';

					data.forEach(cat => {
						const catElement = document.createElement('div');
						catElement.className = 'col-md-6';

						catElement.innerHTML = `<a href="javascript:void(0);" 
							id="categoryButton_${cat.id}" 
						   	class="btn btn-dark btn-sm w-100 mb-2 ${category !== 0 && category === cat.id ? 'selected' : ''}" 
						   	onclick="sortByCategory(${cat.id})" role="button">
						   	${cat.image ? `<img src="${cat.image}" width="16" height="16" loading="lazy">&nbsp;` : ''}
						   	${cat.name}
						</a>`;
						categoryList.appendChild(catElement);
					});
				})
		}, 500);
	}
});


function sortByCategory(value) {
	const modal = bootstrap.Modal.getInstance(document.getElementById('categories'));
	const id = value === 'reset' ? 0 : parseInt(value);

	if (isNaN(id) || modal === null) return;

	const toggle = document.getElementById('toggleCategory');
	const button = document.getElementById('selectCategory');

	if (id !== 0) {
		toggle.style.display = 'block';
		button.style.paddingLeft = '34px';

		const newCategoryButton = document.getElementById('categoryButton_' + id);

		if (newCategoryButton)
			newCategoryButton.classList.toggle('selected');

		if (typeof category !== 'undefined' && category !== 0) {
			const oldCategoryButton = document.getElementById('categoryButton_' + category);

			if (oldCategoryButton)
				oldCategoryButton.classList.toggle('selected');
		}
	} else {
		toggle.style.display = 'none';
		button.style.paddingLeft = '0';

		if (typeof category !== 'undefined' && category !== 0) {
			const oldCategoryButton = document.getElementById('categoryButton_' + category);
			if (oldCategoryButton)
				oldCategoryButton.classList.toggle('selected');
		}
	}

	category = id;

	toggle.style.display = category !== 0 ? 'block' : 'none';
	button.style.paddingLeft = category !== 0 ? '34px' : '0';

	filterResults();
	modal.hide();
}

document.getElementById("raritynav").addEventListener("click", event => {
	event.preventDefault();
	document.querySelector("#raritynav a[data-r='"+rarity+"']").classList.remove("active");
	event.target.classList.add("active");
	rarity = event.target.dataset.r;
	filterResults();
});

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
	if(appliedSorting > 10 || appliedSorting < 0) return;
	console.log(category);

	let i = 0;
	const container = document.querySelector(".rare");
	container.replaceChildren();

	const itemsToDisplay = sortedItems || items;

	itemsToDisplay.forEach(item => {
		if (i >= maxItemsToShow) return;
		console.log(item[0]);
		console.log(item[7]);
		const matchCategory = category > 0 && item[7] !== category;
		console.log(category > 0);
		console.log(item[7] !== category);
		console.log('MatchCategory:'+matchCategory);
		const matchRarity = rarity > 0 && item[1] !== rarity;
		const matchSearchName = searchName !== "" && !item[6].toLowerCase().includes(searchName.toLowerCase());
		const sortingHelper = [2,5,6].includes(appliedSorting) && item[4] === 'Unbekannt';

		console.log('---');

		if (!(matchRarity || matchCategory || matchSearchName || sortingHelper)) {
			let itemToAdd = itemTemplate;
			console.log('added');
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
async function makeEditable(selector, name, useFirstChild = false, type = 1){
	let element = document.querySelector(selector);

	if (!element) {
		console.error(`Element with selector ${selector} not found.`);
		return;
	}

	let input;

	if (type === 1) {
		input = document.createElement('input');
		input.type = 'text';
		input.value = element.innerText.trim();
	} else if(type === 2){
		input = document.createElement('textarea');
		input.value = element.innerText.trim();
		input.style.width = '100%';
		input.style.height = '100%';
		input.style.resize = 'none';
	} else if(type === 3){
		input = document.createElement('select');
		let selected = element.innerText.trim();
		let options = [];

		await fetch('?s', {
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			}
		})
			.then(response => response.json())
			.then(data => {
				data.forEach(option => {
					options.push({value: option.id, text: option.name})
				})
			});

		options.forEach(option => {
			let optionElement = document.createElement('option');
			optionElement.value = option.value;
			optionElement.text = option.text;

			if(optionElement.text === selected) {
				optionElement.selected = true;
			}
			input.add(optionElement);
		});
	}


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
async function itemModal(){
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
				makeEditable('#details .modal-body > div:nth-child(2) > :nth-child(2)', 'category', false, 3);
				makeEditable('#details .modal-body > div:nth-child(2) > :last-child', 'itemName', true);
				makeEditable('#details .modal-body > div:nth-child(3)', 'itemDesc', true, 2);
			}
		});
	}

	await fetch('?i=' + this.id, xmlheader)
		.then(response => response.json())
		.then(data => {
			/*Box 1*/
			let replace = '';

			if(data.info.category_name !== null) {
				replace += `<div class="col">Kategorie</div>
				<div class="col"><img src="http://localhost/_dat/serve/img/wert/furni/${data.info.category_image}" width="16" height="16" loading="lazy">${data.info.category_name}</div>
				<div class="w-100"></div>`;
			}
			replace += `<div class="col">Umlauf</div>
			<div class="col">${this.querySelector('img').dataset.bsOriginalTitle}x</div>
			<div class="w-100"></div>`;

			if(data.info.timestamp_release !== 0 && data.info.timestamp_release !== null) {
				replace += `<div class="col">Veröffentlichung</div>
				<div class="col">${dateFormat(data.info.timestamp_release)}</div>
				<div class="w-100"></div>`;
			}

			replace += `<div class="col">Aufrufe</div>
			<div class="col">${data.info.views}</div>
			<div class="w-100"></div>
			<div class="col">Item Name</div>
			<div class="col">${this.id}</div>`;

			iModal.children[1].innerHTML = replace;

			/*Box 2*/
			iModal.children[2].innerText = data.info.longdesc != null ? data.info.longdesc: " ";

			/*Box 3*/
			if(data.owners.length >= 1) {
				iModal.children[4].innerHTML = '<h3 style="margin:0">Möbel Besitzer</h3><h4 style="margin:0">'+data.owners.length+'</h4><h5>(sortiert nach zuletzt online)</h5>';
				data.owners.forEach(owner => {
					let img = document.createElement('img');
					img.src = avatarImager+'?figure='+owner.figure+'&head_direction=2';
					img.title = owner.username + ' ' + owner.c + 'x';
					img.loading = "lazy";
					iModal.children[4].appendChild(img);
					new bootstrap.Tooltip(img);
				});
			} else {
				iModal.removeChild(iModal.lastElementChild);
			}

			/*Box 4*/
			if(data.changes.length >= 1) {
				iModal.children[3].innerHTML = '<h3>Preisentwicklung</h3><canvas id="chart"></canvas>';
				let labels = [(data.info.timestamp_release === 0 && data.info.timestamp_release !== null) ? dateFormat(data.info.timestamp_release) : 'Veröffentlicht'], points = [];
				let previousTimestamp = -1;

				data.changes.forEach(change => {
					points.push(change.old_price);
					if(previousTimestamp > -1){
						labels.push(dateFormat(change.timestamp));
					}
					previousTimestamp = change.timestamp;
				});

				points.push(data.info.price < 0 ? 0: data.info.price);
				labels.push(dateFormat(previousTimestamp));

				/*Chart.js*/
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
		}).catch((error) => {
			iModal.children[1].innerHTML = `<div class="col">Item Name</div><div class="col">${this.id}</div>`;

			iModal.children[2].innerText = 'Fehler';
			console.error('Item: '+this.id+' - Error: '+error);

			for (let i = 0; i < 2; i++) {
				if (iModal.lastElementChild) iModal.removeChild(iModal.lastElementChild);
			}
		});
}
function dateFormat(timestamp, options){
	return new Date(timestamp*1000).toLocaleDateString('de-DE', options);
}
function setTooltips(){
	document.querySelectorAll(".rarity").forEach(el =>
		new bootstrap.Tooltip(el)
	);
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