let itemNameWait,
    itemName = "";
let feedbacks = [];
const fileInput = document.querySelector('input[type="file"]'),
    alert = document.querySelector('.row.box.alert'),
    imgElement = document.getElementById('furniImage'),
    button = document.getElementById("addButton"),
    imagePathElement = document.getElementById("imagePath");

document.getElementById("itemName").addEventListener("keyup", function (e) {
    if(itemName !== this.value && this.value.length > 0) {
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

                    data.forEach(function (option) {
                        const optionElement = document.createElement("option");
                        optionElement.value = option['item_name'];
                        dataList.appendChild(optionElement);
                    });

                    responsive_feedback("Item Name wurde nicht gefunden.", data.length === 0 ? 1:2)


                    if (data.length === 1) {
                        /*Future work needs to be done here*/
                    }

                })
                .catch((error) => console.error('Error: ', error))
        }, 500);
    }
});

document.getElementById("itemPrice").addEventListener("keyup", function (e) {
    let inputValue = e.target.value.trim();

    const rawNumberRegex = /^\d+$/;
    const usAbbreviationRegex = /^\d+[kKmMbB]$/;
    const dottedNumberRegex = /^(\d{1,3})(\.\d{3})*$/;

    responsive_feedback('Der angegebener Wert Format ist nicht erlaubt. Erlaubte Formate: 1M, 1.000.000 oder 1000000.',
        !(rawNumberRegex.test(inputValue) || usAbbreviationRegex.test(inputValue) || dottedNumberRegex.test(inputValue)) ? 1:2)
});

fileInput.addEventListener('change', function (event) {
    if(fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;

            img.onload = function () {
                const maxWidth = 250;
                const maxHeight = 250;
                const text = 'Bild kann nicht größer als '+maxWidth+'x'+maxHeight+' sein.';

                if (img.width > maxWidth || img.height > maxHeight) {
                    responsive_feedback(text, 1)
                    fileInput.value = '';
                    imgElement.src = '';
                } else {
                    responsive_feedback(text, 2)
                    imgElement.src = e.target.result;
                }
            };
        };

        reader.readAsDataURL(fileInput.files[0]);
    }
});

document.getElementById("addItem").addEventListener("click", () => new bootstrap.Modal(document.getElementById('addItem')).show());

document.getElementById('addItemForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addItem'));
    const form = event.target;
    const formData = new FormData(form);

    const startTime = Date.now();

    fetch('?admin=add', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if(data['server_success'] === true) {
                filterResults(data['items']);
                if(modal !== null)
                    modal.hide();
                /*Note -- We have to wait out the fading animation*/
                let endTime = Date.now();
                let remainingTime = Math.max(Date.now() - endTime - startTime, 500);
                setTimeout(() => modal.hide(), remainingTime);
            } else {
                writeAlerts(data['errors'])
                if(data['image'] != null) {
                    imgElement.src='_dat/serve/img/wert/furni/'+data['image'];
                    imagePathElement.value=data['image'];
                    fileInput.removeAttribute('required');
                }
            }
        })
        .catch(error => console.error('Error: ', error));
});


function responsive_feedback(err, type) {
    if(type === 1)
        if(!feedbacks.includes(err))
            feedbacks.push(err);
    else if(type === 2)
        if(feedbacks.includes(err))
            feedbacks = feedbacks.filter(item => item !== err);


    if(feedbacks.length > 0) {
        button.setAttribute('disabled', '');
        writeAlerts(feedbacks)
    } else {
        button.removeAttribute('disabled');
        alert.style.display = 'none';
    }
}

function writeAlerts(errors) {
    alert.innerHTML = '';
    alert.innerHTML += '<span>Warnung ('+errors.length+'):</span><br>';
    let i = 1;
    errors.forEach(err => {
        alert.innerHTML += '<span>('+i+') ' + err + '</span><br>';
        i++;
    });
    alert.style.display = 'block';
}