let itemNameWait, itemName = "";
let feedbacks = [];

document.getElementById("itemName").addEventListener("keyup", function (e) {
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
                    console.log(data)
                    data.forEach(function (option) {
                        const optionElement = document.createElement("option");
                        optionElement.value = option;
                        dataList.appendChild(optionElement);
                    });

                    responsive_feedback("Item Name wurde nicht gefunden.", data.length === 0 ? 1:2)

                    //Attempt Preview Image via API
                    if (data.length === 1) {
                        //Future work needs to be done here
                    }

                })
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

const fileInput = document.querySelector('input[type="file"]');
const imgElement = document.getElementById('test');

fileInput.addEventListener('change', function (event) {

    if (fileInput.files && fileInput.files[0]) {

        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;

            img.onload = function () {
                const maxWidth = 300;
                const maxHeight = 300;
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

function responsive_feedback(err, type) {
    const alert = document.querySelector('.row.box.alert');
    const button = document.getElementById("addButton");

    if (type === 1) {
        if (!feedbacks.includes(err)) feedbacks.push(err);
    } else if (type === 2) {
        if (feedbacks.includes(err)) feedbacks = feedbacks.filter(item => item !== err);
    }

    alert.innerHTML = '';
    if (feedbacks.length > 0) {
        button.setAttribute('disabled', '');
        alert.innerHTML += '<span>Warnung ('+feedbacks.length+'):</span><br>';
        feedbacks.forEach(err => {
            alert.innerHTML += '<span>' + err + '</span><br>';
        });
        alert.style.display = 'block';
    } else {
        button.removeAttribute('disabled');
        alert.style.display = 'none';
    }
}