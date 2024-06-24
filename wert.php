<?php
// Permissions
$allowedPeople = [4, 1100852, 6292, 895535, 662198, 273757, 22457];
$adminPeople = [4, 6292, 13757, 22457]; //BIFI2000, Wassereis, Wassereis, Bluesurfer
$devPeople = [4,22457]; //BIFI2000, Bluesurfer
$isAllowed = isset($u_details['id']) && in_array($u_details['id'], $allowedPeople) ? 1 : 0;
$isAdmin = isset($u_details['id']) && in_array($u_details['id'], $adminPeople) ? 1 : 0;
$isDev = isset($u_details['id']) && in_array($u_details['id'], $devPeople) ? 1 : 0;

// General Attributes
$pagetitle = 'Wert';
$cachePath = $core->path.'/_inc/.cache/wert/index.cache';
$uploadDir = $core->path . '/_dat/serve/img/wert/furni/';
$defaultImage = '_dat/serve/img/wert/not_found.png';
$maxItemsToShow = 50;
$isAjaxClient = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest';


// Functions
function pageNotFound(): void {
    exit(http_response_code(404));
}
function createNewCacheFile($c, $path): array {
    $rankPeople = $c->m->prepare('SELECT id FROM players WHERE rank > 6');
    $rankPeople->execute();
    $result = $rankPeople->fetchAll(PDO::FETCH_COLUMN);
    $rankPeople = 'AND user_id !=' . implode(' AND user_id !=', $result); // this is the most performance efficient way to skip rank people in umlauf count, it requires a tripleindex on base_item, gift_base_item and user_id
    $sql = 'SELECT r.id,f.public_name,r.longdesc,r.price,r.category,r.image,r.views,(SELECT ( (SELECT COUNT(id) FROM items WHERE base_item=f.id ' . $rankPeople . ') + (SELECT COUNT(id) FROM items WHERE gift_base_item=f.id AND base_item != gift_base_item ' . $rankPeople . ') ) ) as umlauf,r.item_name,c.timestamp,c.old_price FROM furniture_rare_details r LEFT JOIN furniture f ON(f.item_name = r.item_name) LEFT JOIN furniture_rare_changes c ON(r.id=c.furni_id AND c.id=(SELECT id FROM furniture_rare_changes AS ci WHERE ci.furni_id=r.id ORDER BY `timestamp` DESC LIMIT 1)) ORDER BY r.id DESC';
    $select = $c->m->prepare($sql);
    $select->execute();
    $items = $select->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents($path, json_encode($items));
    return $items;
}

function readCacheFile($c, $items): array {
    $array = [];

    foreach ($items as $itemId => $item) {
        if(!isset($item['public_name'])) {
            echo "Error not found: {$itemId}\n";
            continue;
        }

        /*
         * itemArray[]
         * (shown values)
         * 0: item_name
         * 1: level
         * 2: amount
         * 3: pricetag
         * 4: price
         * 5: image
         * 6: public_name
         * (raw values)
         * 7: category
         * 8: price
         * 9: time
         * 10: itemid
         * 11: views
         */

        $amount = $item['umlauf'];

        $level = match (true) {
            $amount > 50 => 1,
            $amount > 30 => 2,
            $amount > 15 => 3,
            $amount > 5 => 4,
            $amount > 0 => 5,
            default => 0
        };

        $array[] = [
            $item['item_name'],
            $level,
            $amount,
            $item['old_price'] < 1 ? '' : ' class="' . ($item['price'] >= $item['old_price'] ? 'up' : 'down') . '" title="vorher ' . number_format($item['old_price'], 0, ',', '.') . '"',
            $item['price'] > 0 ? number_format($item['price'], 0, ',', '.') : 'Unbekannt',
            filter_var($item['image'], FILTER_SANITIZE_URL),
            htmlspecialchars(str_replace('Habbo', $c->shortname, $item['public_name'])),
            $item['category'],
            $item['price'],
            $item['timestamp'],
            $itemId,
            $item['views']

        ];
    }
    return $array;
}



//Item API
if(isset($_GET['i'])) {
    /*if (!$isAjaxClient)
        pageNotFound();*/

    $response = [
        'info' =>
            [
                'views' => '0',
                'longdesc' => 'Es gab ein Fehler beim Laden dieses Rares. Versuche es erneut.',
            ],
        'changes' => [],
        'owners' => []
    ];

    // get details
    $sql = 'SELECT f.id, r.id AS rare_id, r.price, r.buyprice_credits, r.buyprice_activity_points, r.buyprice_vip_points, r.views, r.longdesc, r.timestamp_release, c.id AS category_id, c.name AS category_name, c.image AS category_image
    FROM 
        furniture_rare_details r 
    LEFT JOIN 
        furniture f ON r.item_name = f.item_name 
    LEFT JOIN 
        furniture_rare_categories c ON r.category = c.id
    WHERE r.item_name = ?';

    $select = $core->m->prepare($sql);
    $select->execute([$_GET['i']]);
    $details = $select->fetchAll(PDO::FETCH_ASSOC);

    header('Cache-Control: public, max-age=5, stale-if-error=28800');

    if (!empty($details)) {
        $response['info'] = $details[0];

        if(isset($u_details['id'])) {
            $viewCache = $core->path.'/_inc/.cache/wert/view.'.$u_details['id'].'.'.strtolower($_GET['i']).'.cache';
            if(!file_exists($viewCache) || time() - filemtime($viewCache) > 86400) {
                $update = $core->m->prepare('UPDATE furniture_rare_details SET views=views+1 WHERE item_name=?');
                if($update->execute([$_GET['i']]))
                    file_put_contents($viewCache, '');
            }
        }

        // get owners
        $select = $core->m->prepare('SELECT p.username,p.figure,COUNT(i.id) AS c FROM items i LEFT JOIN players p ON(p.id=i.user_id) WHERE (i.base_item=? OR (i.gift_base_item=? AND i.base_item != i.gift_base_item)) AND p.rank < 7 GROUP BY p.id ORDER BY p.last_online DESC');
        $select->execute([$response['info']['id'],$response['info']['id']]);
        $response['owners'] = $select->fetchAll(PDO::FETCH_ASSOC);

        // get price history
        $select = $core->m->prepare('SELECT old_price, `timestamp` FROM furniture_rare_changes WHERE furni_id=?');
        $select->execute([$response['info']['rare_id']]);
        $response['changes'] = $select->fetchAll(PDO::FETCH_ASSOC);
    }
    exit(json_encode($response));
}

//Catsearch API
if(isset($_GET['c'])) {
    if (!$isAjaxClient)
        pageNotFound();

    $search = filter_input(INPUT_GET, 'c', FILTER_UNSAFE_RAW);

    $sql = 'SELECT id, name, image
    FROM
        furniture_rare_categories
    WHERE
        name LIKE ?
    ORDER BY name ASC';

    $select = $core->m->prepare($sql);
    $select->execute(['%' . $search . '%']);

    $categories = [];
    while ($cat = $select->fetch(PDO::FETCH_ASSOC)) {
        $categories[] = [
            'id' => $cat['id'],
            'name' => htmlspecialchars($cat['name']),
            'image' => !empty($cat['image']) ? $core->url . '_dat/serve/img/wert/furni/' . filter_var($cat['image'], FILTER_SANITIZE_URL) : ''
        ];
    }
    header('Content-Type: application/json');
    exit(json_encode($categories));
}

//Furni API
if(isset($_GET['itemName']) && $isAllowed) {
    $search = filter_input(INPUT_GET, 'itemName', FILTER_UNSAFE_RAW);

    $sql = 'SELECT f.item_name, f.public_name, f.public_desc
    FROM 
        furniture f
    LEFT JOIN 
        furniture_rare_details d ON f.item_name = d.item_name
    WHERE 
        d.item_name IS NULL AND f.item_name LIKE ?
    ORDER BY 
        f.item_name ASC '.($_GET['itemName'] == '' ? '':'LIMIT 15');

    $select = $core->m->prepare( $sql);
    $select->execute(['%' . $search . '%']);

    $options = [];
    $options = $select->fetchAll(PDO::FETCH_ASSOC);
    header('Content-Type: application/json');
    exit(json_encode($options));
}

//Admin Tools
if(isset($_GET['admin']) && $_GET['admin'] == 'add' && $isAllowed) {
    header('Content-Type: application/json');
    // Notice @ Tobi - While this is not really necessary, I made this option, so you can disable upload as fast as possible if an exploit is being found or the server is overwhelmed.
    $uploadEnabled = true;

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $errors = array();
        $itemName = $_POST['itemName'] ?? null;
        $itemPrice = $_POST['itemPrice'] ?? null;
        $itemCategory = $_POST['itemCategory'] ?? null;
        $itemDesc = $_POST['itemDesc'] ?? null;
        $itemImage = null; //Have to check whether nullable is possible on test server
        $itemPath = $_POST['itemPath'] ?? null;

        //Handle itemNames
        if($itemName != null) {
            $sql = 'SELECT f.item_name, f.public_name, f.public_desc
                    FROM 
                        furniture f
                    LEFT JOIN 
                        furniture_rare_details d ON f.item_name = d.item_name
                    WHERE 
                        d.item_name IS NULL AND f.item_name = ?
                    ORDER BY 
                    f.item_name LIMIT 1';
            $select = $core->m->prepare($sql);
            $select->execute([$itemName]);
            $items = $select->fetchAll(PDO::FETCH_COLUMN);

            if(sizeof($items) != 1)
                $itemName = null;
        }

        //Handle itemPrices
        if($itemPrice != null) {
            $price = str_replace([',', '.'], '', $itemPrice);
            $multiplier = 1; // General multiplier
            $lastChar = strtoupper(substr($price, -1));

            if ($lastChar === 'K' || $lastChar === 'M' || $lastChar === 'B') {
                $price = substr($price, 0, -1);

                if (is_numeric($price)) {
                    if ($lastChar === 'K')
                        $multiplier = 1000;
                    elseif ($lastChar === 'M')
                        $multiplier = 1000000;
                    elseif ($lastChar === 'B')
                        $multiplier = 1000000000;
                } else
                    $itemPrice = null;
            } else
                if (!is_numeric($price))
                    $itemPrice = null;

            $itemPrice = (int)$price * $multiplier;
        } else
            $itemPrice = -1;

        //Handle itemCategories
        if($itemCategory != null) {
            if(is_numeric((int)$itemCategory)) {
                $sql = 'SELECT id
                    FROM 
                        furniture_rare_categories
                    WHERE 
                        id = ?
                    LIMIT 1';

                $select = $core->m->prepare($sql);
                $select->execute([$itemCategory]);
                $category = $select->fetchAll(PDO::FETCH_COLUMN);

                if(sizeof($category) != 1)
                    $itemCategory = null;
            }

        }

        // Handle itemImage
        if ($uploadEnabled) {
            if($itemPath == null) {
                if(isset($_FILES['file']) && $_FILES['file']['error'] == UPLOAD_ERR_OK) {
                    // Completely rewrote file upload approach (Testing server needed)
                    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    $maxFileSize = 5 * 1024 * 1024; // 5 MB (According to previous code)

                    //Prepare file data
                    $fileTmpPath = $_FILES['file']['tmp_name'];
                    $fileName = basename($_FILES['file']['name']);
                    $fileSize = $_FILES['file']['size'];
                    $fileType = mime_content_type($fileTmpPath);
                    $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);

                    if (in_array($fileType, $allowedTypes) && $fileSize <= $maxFileSize) {
                        $newFileName = hash_file('sha256', $fileTmpPath).'.'.$fileExtension;
                        // Just reroll on hash collision is a better approach then OG
                        while (file_exists($uploadDir.$newFileName))
                            $newFileName = hash('sha256', $newFileName.time().rand()).'.'.$fileExtension;

                        if (move_uploaded_file($fileTmpPath, $uploadDir . $newFileName)) {
                            $itemImage = $newFileName;
                            $itemPath = $newFileName;
                        } else
                            $errors[] = 'Interner Fehler: Konnte nicht hochgeladen werden!';
                    } else
                        $errors[] = 'Fehler: Dateityp ist fehlerhaft oder Datei ist zu groß.';
                }
            } else
                $itemImage = $itemPath;
        } else
            $itemImage = null;

        if($itemName == null)
            $errors[] = 'Item Name gibt es nicht in der Datenbank.';

        if($itemPrice == null)
            $errors[] = 'Wert entspricht nicht den legalen Formaten. Folgende Formate sind erlaubt: 1M, 1.000.000 und 1000000.';

        if($itemCategory == null)
            $errors[] = 'Kategorie gibt es nicht in der Datenbank.';


        // Handle Query
        if( $itemName != null &&
            $itemPrice != null && is_numeric($itemPrice) &&
            $itemCategory != null && is_numeric($itemCategory) &&
            $isAllowed) {

            $items = [];

            $insert = $core->m->prepare('INSERT INTO furniture_rare_details (item_name,longdesc,price,buyprice,timestamp_release,category,image) VALUES (?,?,?,?,?,?,?)');
            $data = [
                $itemName,
                $itemDesc,
                $itemPrice,
                1,
                time(),
                $itemCategory,
                ($itemImage == 'disabled') ? '' : $itemImage //Don't know yet if null is possible
            ];
            try {
                $insert->execute($data);

                @unlink($cachePath);
                $items = createNewCacheFile($core, $cachePath);
                exit(json_encode([
                    'server_success' => true,
                    'items' => readCacheFile($core, $items),
                ]));
            } catch (PDOException $e) {
                $string = 'Datenbank Fehler: Fehler <b>Code #' . $e->getCode() . '</b>';
                if (!$isDev)
                    $string .= '<br>' . $e->getMessage() . '<br>' . $e->getTraceAsString();
                else
                    $string .= '<br>Melde dich bei Bluesurfer (Discord ipandey) mit einem <b><u>Screenshot</u></b>.';

                $errors[] = $string;
            }

        }
        exit(json_encode([
            'server_success' => false,
            'errors' => $errors,
            'image' => $itemPath
        ]));

    }
    exit(json_encode([
        'server_success' => false
   ]));

}



$rarity = isset($_GET['r']) ? intval($_GET['r']) : 0;

$cssappendix .= '<style>
.box{
	margin:5px 0 !important;
	box-shadow: none !important;
}
.item{
	position:relative;
	background:no-repeat center url(_dat/serve/img/wert/rare_background.png);
	height:240px;
	display: flex;
	justify-content: center;
	align-items: center;
	padding:0 !important;
	outline:1px solid transparent;
	transition: outline 0.35s cubic-bezier(.23,1,.32,1)
}
.rare .item:hover, .rare .item:active{
	cursor:pointer;
	outline:1px solid #376d9d;
}
@media (min-width:668px) {
	.rare .col-md-4{
		padding:0 !important;
		width:calc(33% - 3px)
	}
}

.item > :last-child{
	position:absolute;
	bottom:14px;
	text-shadow:1px 1px 2px #000
}

.modal-body .item > :last-child{
	font-weight: bold;
	font-size: 16px;
}
.item > :nth-child(2){
	position:absolute;
	right:14px;
	top:14px;
}
.item > :nth-child(2)::after{
	position:relative;
	top:2px;
	left:3px;
	content:url(_dat/_th/sa/img/icons/credits.png)
}
.up{
	color: #71ff71;
}
.up::before {
	content: "➚ ";
}
.down{
	color: #ff191a;
}
.down::before {
	content: "➘ ";
}

.row.box{
	padding: 7px 3px !important
}
.btn{
	font-size: 15px;
	padding: 6px;
	line-height:24px
}
.col-md-3 .btn{
	border:var(--bs-border-width) solid var(--bs-border-color)
}
.custom-select{
	text-align:center
}
.container > div.row:nth-child(2) {
	margin-top: -11px !important;
	border-top-left-radius: 0 !important;
	border-top-right-radius: 0 !important;
}

img.rarity{
	position:absolute;
	left:14px;
	top:14px;
	width:55px;
	height:11px;
	content:url(_dat/serve/img/wert/wert_rarity.png);
	object-fit:none
}
img.rarity.l5 {
	object-position:-1px -53px
}
img.rarity.l4 {
	object-position:-1px -40px
}
img.rarity.l3 {
	object-position:-1px -27px
}
img.rarity.l2 {
	object-position:-1px -14px
}
img.rarity.l1 {
	object-position:-1px -1px
}
img.rarity.l0 {
	object-position:-1px -66px;
	top:10px;
	height:16px
}
.btn-group{
	white-space:nowrap;
}
.cats a{
	border: 1px solid var(--bs-border-color)
}
.cats a.selected{
	background-color:#424649;
}
.cats a > img{
	float:left
}

#details .modal-dialog{
	max-width:768px;
}
#details .modal-body > div:not(:first-child){
	border:1px solid #2c2e3c;
	padding:12px
}
#details .modal-body div:nth-child(2) > div:nth-child(3n+2){
	text-align:right
}
#details .modal-body div:nth-child(3){
	display:grid
}
#details .modal-body div:last-child > img{
	height: 54px;
	object-fit: none;
	width: 48px;
	object-position: -8px -12px;
}
#details .box{
	padding:0 !important
}
#details .modal-body .edit, #details .modal-body .editFile{
	position: absolute;
	bottom: 15px;
	right: 15px;
	cursor: pointer;
	background:none;
	border:0
}
#details .modal-body .edit{
	right: 15px;
}
#details .modal-body .editFile{
	left: 15px;
	max-width:200px
}
#details .modal-body .edit:hover{
	opacity:0.8
}
#details .modal-body .edit:active{
	opacity:0.6
}

.row.box.alert {
    background-color: darkred !important;
}
.row.box.alert span {
    text-align:center;
}
#addItem .modal-body > div:not(:nth-child(1)):not(:nth-child(2)):not(:nth-child(6)) {
    border: 1px solid #2c2e3c;
    padding: 12px;
}
#addItemButtom {
    margin-left: -10px;
    margin-top: 10px;
    margin-bottom: 10px;
    width: 103%;
}';
$cssappendix .= '</style>';


// Main page
$items = (file_exists($cachePath) && time() - filemtime($cachePath) <= 86400) ?
    json_decode(file_get_contents($cachePath), true) : createNewCacheFile($core, $cachePath);

$itemArray = readCacheFile($core, $items);

// Menu
$pagecontent .= '<div class="container">
<div class="row box sticky-top" style="border-bottom-left-radius:0;border-bottom-right-radius:0">
    <div class="col-md-3">
        <select class="custom-select form-control" name="sort" autocomplete="off">
            <option value="1" selected>🟢 Neu hinzugefügt</option>
            <option value="2">📈 Preisänderungen</option>
            <option value="3">↑ Seltenheit aufsteigend</option>
            <option value="4">↓ Seltenheit absteigend</option>
            <option value="5">➚ Preis aufsteigend</option>
            <option value="6">➘ Preis absteigend</option>
            <option value="7">🔼 Aufrufe aufsteigend</option>
            <option value="8">🔽 Aufrufe absteigend</option>
            <option value="9">🔀 Zufällig</option>
        </select>
    </div>
    <div class="col-md-6">
        <input class="form-control" id="search" name="search" type="text" placeholder="🔍 Möbel Suche ..." autocomplete="off">
    </div>
    <div class="col-md-3 btn-group">
        <button type="button" id="selectCategory" class="form-control btn btn-dark" data-bs-toggle="modal" data-bs-target="#categories">📚 Kategorie</button>
        <a href="javascript:void(0);" onclick="sortByCategory(\'reset\')" class="btn btn-dark" style="padding-top:6px; display:none;" id="toggleCategory">❌</a>
    </div>
</div>
<div class="row box">
    <div class="col-md-12 btn-group" role="group" id="raritynav">
        <a role="button" class="btn btn-dark active" data-r="0">Alle</a>
        <a role="button" class="btn btn-dark" data-r="1">Sehr häufig</a>
        <a role="button" class="btn btn-dark" data-r="2">Häufig</a>
        <a role="button" class="btn btn-dark" data-r="3">Ungewöhnlich</a>
        <a role="button" class="btn btn-dark" data-r="4">Selten</a>
        <a role="button" class="btn btn-dark" data-r="5">Sehr selten</a>
    </div>
</div>';

if($isAllowed)
    $pagecontent .= '<div class="col-md-12 btn-group alert-danger"><button type="button" id="addItemButtom" class="form-control btn btn-danger" data-bs-toggle="modal" data-bs-target="#addItem"> Rare hinzufügen </button></div>';


$pagecontent .= '<div class="row rare justify-content-between">';

//Show Frontpage
$itemTemplate = '<div class="col-md-4"><div class="box item" id="{id}"><img class="rarity l{level}" title="{amount}"><span{tag}>{price}</span><img src="_dat/serve/img/wert/furni/{image}" loading="lazy" alt="Konnte nicht geladen werden"><span>{name}</span></div></div>';
$itemReplace = ['{id}', '{level}', '{amount}', '{tag}', '{price}', '{image}', '{name}'];

$i = 0;
while ($i < $maxItemsToShow && $i < sizeof($itemArray)) {
    $itemValues = array_slice($itemArray[$i], 0, 7);

    $itemToAdd = $itemTemplate;
    foreach ($itemReplace as $index => $placeholder)
        $itemToAdd = str_replace($placeholder, $itemValues[$index], $itemToAdd);

    $pagecontent .= $itemToAdd;
    $i++;
}

$pagecontent .= '</div></div>';

//Item Modal
$itemModalTemplate = '<div class="col-md-12 item"></div><div class="col-md-6 row"></div><div class="col-md-6 text-center align-items-center"></div><div class="col-md-12 text-center"></div><div class="col-md-12 text-center"></div>';

$pagecontent .= '<div class="modal fade" id="details" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content box">
            <div class="modal-body row">
                <div class="col-md-12 item"></div>
                <div class="col-md-6 row"></div>
                <div class="col-md-6 text-center"></div>
                <div class="col-md-12 text-center"></div>
                <div class="w-100"></div>
                <div class="col-md-12 text-center"></div>
            </div>
        </div>
    </div>
</div>';

// Category Modal
$categoryModalTemplate = '<div class="modal fade" id="categories" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Kategorien</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
                <input class="form-control w-100 mb-2" name="catSearch" id="catSearch" type="text" placeholder="🔍 Kategorie suchen ..." autocomplete="off">
                <div class="cats">
                    <div class="row" id="categoryList">{categoryList}</div>
                </div>
            </div>
        </div>
    </div>
</div>';

//Populate Categories
$select = $core->m->prepare('SELECT id,name,image FROM furniture_rare_categories ORDER BY name ASC');
$select->execute();

$listcontent = '';
while ($cat = $select->fetch(PDO::FETCH_ASSOC))
    $listcontent .= '<div class="col-md-6"><a href="javascript:void(0);" id="categoryButton_'.$cat['id'].'" onclick="sortByCategory('.$cat['id'].')" class="btn btn-dark btn-sm w-100 mb-2" role="button">' . (!empty($cat['image']) ? '<img src="' . $core->url . '_dat/serve/img/wert/furni/' . filter_var($cat['image'], FILTER_SANITIZE_URL) . '" width="16" height="16" loading="lazy">&nbsp;' : '') . htmlspecialchars($cat['name']) . '</a></div>';

$pagecontent .= str_replace('{categoryList}', $listcontent, $categoryModalTemplate);


// Add item Modal
if($isAllowed) {
    $pagecontent .= '<div class="modal fade" id="addItem" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content box">
            <div class="modal-header">
                <h5 class="modal-title">Rare hinzufügen (BETA)</h5>
            </div>
            <form id="addItemForm">
                <div class="modal-body row">
                    <div class="row box alert" style="display:none; text-align:center"></div>
                    <div class="col-md-12 item">
                        <input type="hidden" name="imagePath" id="imagePath">
                        <img id="furniImage" style="bottom:0;position: relative;" loading="lazy" src="'.$defaultImage.'" alt="Konnte nicht geladen werden"><br>
                    </div>
                    <div class="col-md-12">
                        <input style="text-align:center; height: 39px;" class="form-control" type="file" name="file" accept="image/*" required>
                    </div>
               
                    <div class="col-md-7 row">
                        <!-- ItemName -->
                        <div class="col-md-4 align-self-center"><span>Item Name</span></div>
                        <div class="col-md-8">
                            <input list="internalItemName" id="itemName" class="form-control" name="itemName" type="text" placeholder="Item Name (z.B. dragonpillar*4)" autocomplete="off" required>
                            <datalist id="internalItemName"></datalist>
                        </div>
                        <!-- ItemPrice -->
                        <div class="col-md-4 align-self-center"><span>Wert</span></div>
                        <div class="col-md-8">
                            <input id="itemPrice" class="form-control" name="itemPrice" type="text" placeholder="Gebe den Wert des Rares ein." autocomplete="off">
                        </div>
                        <!-- ItemCategory -->
                        <div class="col-md-4 align-self-center"><span>Kategorie</span></div>
                        <div class="col-md-8">
                            <select name="itemCategory" class="form-control">
                                <option value="0">Keine Kategorie</option>';
                                //Populate Categories
                                $sql = 'SELECT c.id, c.name, COUNT(d.id) AS count
                                                        FROM furniture_rare_categories c
                                                        LEFT JOIN furniture_rare_details d ON c.id = d.category
                                                        GROUP BY c.id, c.name
                                                        ORDER BY c.name ASC';
                                $select = $core->m->prepare($sql);
                                $select->execute();
                                $options = $select->fetchAll(PDO::FETCH_ASSOC);

                                foreach ($options as $op)
                                    $pagecontent .= '<option value="'.$op['id'].'">'.$op['name'].'('.$op['count'].')</option>';

                            $pagecontent .= '</select>
                        </div>
                    </div>
                    <div class="col-md-5 row">
                        <span style="text-align: center">Beschreibung</span>
                        <textarea name="itemDesc" class="form-control" style="width: 100%; height: 100px; resize: none;" placeholder="Füge eine kurze Beschreibung hinzu."></textarea>
                    </div>
                    <div class="col-md-12">
                        <input class="form-control" type="submit" value="Einfügen" id="addButton">
                    </div>
                    <div class="col-md-12">Hier wird noch was tolles kommen (WIP)</div>
                </div>
            </form>
        </div>
    </div>
</div>';
}


$jsappendix .= '<script src="_dat/serve/js/popper.min.js"></script>
<script src="_dat/serve/js/chart.umd.js"></script>
<script>
let items = '.json_encode($itemArray).';
const maxItemsToShow = ' . $maxItemsToShow . ';
const itemTemplate = \'' . $itemTemplate . '\';
const itemModalTemplate = \'' . $itemModalTemplate . '\';
const itemReplace = ' . json_encode($itemReplace) . ';
const avatarImager = \'' . $core->avatarImager . '\';
const isEditor = ' . $isAllowed . ';
let rarity = ' . $rarity . ';
' .file_get_contents(__DIR__.'/wert.js');
if($isAllowed)
    $jsappendix .= file_get_contents(__DIR__.'/wert_admin.js');
$jsappendix .= '</script>';