<?php
$select = $core->m->prepare('SELECT p.id, s.edit_rights FROM furniture_rare_staff s LEFT JOIN players p ON(p.username = s.username)');
$select->execute();
$staffData = $select->fetchAll(PDO::FETCH_ASSOC);
$allowedPeople = array_column($staffData, 'edit_rights', 'id');
if(isset($_GET['i'])){
	header('Cache-Control: public, max-age=5, stale-if-error=28800');
	$response = ['info' => [
			'views' => '?',
			'longdesc' => 'Ladefehler, Item nicht gefunden'
		]
	];
	// get details
	$select = $core->m->prepare('SELECT f.id,r.id AS rare_id,price,r.views,r.longdesc,timestamp_release FROM furniture_rare_details r LEFT JOIN furniture f ON(r.item_name = f.item_name) WHERE r.item_name=?');
	$select->execute([$_GET['i']]);
	$details = $select->fetchAll(PDO::FETCH_ASSOC);
	if(!empty($details)){
		$response['info'] = $details[0];
		// update view count if logged in user
		if(isset($u_details['id'])){
			$viewCache = $core->path.'/_inc/.cache/wert/view.'.$u_details['id'].'.'.strtolower($_GET['i']).'.cache';
			if(!file_exists($viewCache) || time() - filemtime($viewCache) > 86400){
				$update = $core->m->prepare('UPDATE furniture_rare_details SET views=views+1 WHERE item_name=?');
				if($update->execute([$_GET['i']])){
					file_put_contents($viewCache, '');
				}
			}
		}
		// get owners
		$select = $core->m->prepare('SELECT p.username,p.figure,COUNT(i.id) AS c FROM items i LEFT JOIN players p ON(p.id=i.user_id) WHERE (i.base_item=? OR (i.gift_base_item=? AND i.base_item != i.gift_base_item)) AND p.rank < 8 GROUP BY p.id ORDER BY p.last_online DESC');
		$select->execute([$response['info']['id'],$response['info']['id']]);
		$response['owners'] = $select->fetchAll(PDO::FETCH_ASSOC);
		// get price history
		$select = $core->m->prepare('SELECT c.old_price, c.timestamp, p.username FROM furniture_rare_changes c LEFT JOIN players p ON p.id = c.player_id WHERE c.furni_id=?');
		$select->execute([$response['info']['rare_id']]);
		$response['changes'] = $select->fetchAll(PDO::FETCH_ASSOC);
	}else{
		http_response_code(404);
	}
	exit(json_encode($response));
}
$pagetitle = 'Wert';
$cachePath = $core->path.'/_inc/.cache/wert/index.cache';
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
.cats .cat-wrapper {
gap: 0
}
.cats a {
border: 1px solid var(--bs-border-color)
}
.cats a > img {
float: left;
margin-right: 8px
}
.cats .cat-wrapper.has-edit a {
border-top-right-radius: 0;
border-bottom-right-radius: 0;
border-right: none
}
.cats .edit-btn {
cursor: pointer;
border-top-left-radius: 0;
border-bottom-left-radius: 0;
border: 1px solid var(--bs-border-color);
margin-left: -2px;
}
.cats .edit-btn:hover {
opacity: 1
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
#details .modal-body .edit, #details .modal-body .delete, #details .modal-body .editFile{
position: absolute;
	bottom: 15px;
	right: 15px;
	cursor: pointer;
	background:none;
	border:0
}
#details .modal-body .edit{
right: 105px;
}
#details .modal-body .delete{
right: 15px;
color: #e37373;
}
#details .modal-body .editFile{
	left: 15px;
	max-width:200px
}
#details .modal-body .edit:hover,
#details .modal-body .delete:hover{
opacity:0.8
}
#details .modal-body .edit:active,
#details .modal-body .delete:active{
opacity:0.6
}
#insertModal .modal-body.row {
    padding: 0;
}
#insertModal .modal-body:not(.row) {
    padding: 1rem;
}
</style>';
/*
seltenheit grade
bis 5 rot
bis 15 orange
bis 30 gelb
bis 50 hellgrün
ab 50 grün
*/
$rarity = isset($_GET['r']) ? intval($_GET['r']) : 0;
$category = isset($_GET['c']) ? intval($_GET['c']) : 0;
$pagecontent .= '<div class="container">
<div class="row box sticky-top" style="border-bottom-left-radius:0;border-bottom-right-radius:0">
	<div class="col-md-3">
		<select class="custom-select form-control" name="sort" autocomplete="off">
			<option value="1" selected>🟢 Neu hinzugefügt</option>
			<option value="2">📌 Preisänderungen</option>
			<option value="3">↑ Seltenheit aufsteigend</option>
			<option value="4">↓ Seltenheit absteigend</option>
			<option value="5">➚ Preis aufsteigend</option>
			<option value="6">➘ Preis absteigend</option>
			<option value="7">🔀 Zufällig</option>
		</select>
	</div>
	<div class="col-md-6">
		<input class="form-control" id="search" name="search" type="text" placeholder="🔍 Möbel Suche ..." autocomplete="off">
	</div>
	<div class="col-md-3 btn-group">
		<button type="button" class="form-control btn btn-dark" data-bs-toggle="modal" data-bs-target="#categories"'.($category?'style="padding-left:34px"':'').'>
			📚 Kategorie
		</button>
		'.($category?'<a href="'.$core->url.'wert" class="btn btn-dark" style="padding-top:6px">❌</a>':'').'
	</div>
</div>
<div class="row box">
	<div class="col btn-group" role="group" id="raritynav">
		<a role="button" class="btn btn-dark active" data-r="0">Alle</a>
		<a role="button" class="btn btn-dark" data-r="1">Sehr häufig</a>
		<a role="button" class="btn btn-dark" data-r="2">Häufig</a>
		<a role="button" class="btn btn-dark" data-r="3">Ungewöhnlich</a>
		<a role="button" class="btn btn-dark" data-r="4">Selten</a>
		<a role="button" class="btn btn-dark" data-r="5">Sehr selten</a>
	</div>
</div>';
// admin section
$isEditor = isset($u_details['id']) && isset($allowedPeople[$u_details['id']]) ? 1 : 0;
$isAdmin = $isEditor && $allowedPeople[$u_details['id']] === 'admin' ? 1 : 0;
if($isEditor){
	$filedir = $core->path.'/_dat/serve/img/wert/furni';
	$maxSizeBytes = 5242880;
	$error = '';
	if($_SERVER['REQUEST_METHOD'] == 'POST'){
	if(isset($_POST['action'])) {
	    if($_POST['action'] === 'add_category'){
	        if(empty($_POST['category_name'])) {
	            $error .= 'Kategorie Name ist erforderlich<br>';
	        } else {
	            $insert = $core->m->prepare('INSERT INTO furniture_rare_categories (name) VALUES (?)');
	            if($insert->execute([$_POST['category_name']])){
	                header('Location: '.$core->url.'wert');
	                exit;
	            } else {
	                $error .= 'Fehler beim Erstellen der Kategorie<br>';
	            }
	        }
	    }
	    else if($_POST['action'] === 'edit_category'){
	        if(empty($_POST['category_name'])) {
	            $error .= 'Kategorie Name ist erforderlich<br>';
	        } else {
	            $update = $core->m->prepare('UPDATE furniture_rare_categories SET name = ? WHERE id = ?');
	            if($update->execute([$_POST['category_name'], $_POST['category_id']])){
	                header('Location: '.$core->url.'wert');
	                exit;
	            } else {
	                $error .= 'Fehler beim Bearbeiten der Kategorie<br>';
	            }
	        }
	    }
	    else if($_POST['action'] === 'delete_category') {
	        $delete = $core->m->prepare('DELETE FROM furniture_rare_categories WHERE id = ?');
	        if($delete->execute([$_POST['category_id']])) {
	            // Reset category to 0 for items that used this category
	            $delete = $core->m->prepare('DELETE FROM furniture_rare_category_mappings WHERE category_id = ?');
	            $delete->execute([$_POST['category_id']]);
	            header('Location: '.$core->url.'wert');
	            exit;
	        } else {
	            $error .= 'Fehler beim Löschen der Kategorie<br>';
	        }
	    }
	    else if($_POST['action'] === 'edit_category'){
	        if(empty($_POST['category_name'])) {
	            $error .= 'Kategorie Name ist erforderlich<br>';
	        } else {
	            $update = $core->m->prepare('UPDATE furniture_rare_categories SET name = ? WHERE id = ?');
	            if($update->execute([$_POST['category_name'], $_POST['category_id']])){
	                header('Location: '.$core->url.'wert');
	                exit;
	            } else {
	                $error .= 'Fehler beim Bearbeiten der Kategorie<br>';
	            }
	        }
	    }
	}
	if(isset($_POST['delete'])){
	    $select = $core->m->prepare('SELECT id, image FROM furniture_rare_details WHERE item_name=?');
	    $select->execute([$_POST['delete']]);
	    $item = $select->fetch(PDO::FETCH_ASSOC);
	    if($item){
	        $deleteChanges = $core->m->prepare('DELETE FROM furniture_rare_changes WHERE furni_id=?');
	        $deleteChanges->execute([$item['id']]);
	        
	        @unlink($filedir.'/'.$item['image']);
	        $delete = $core->m->prepare('DELETE FROM furniture_rare_details WHERE item_name=?');
	        if($delete->execute([$_POST['delete']])){
	            @unlink($cachePath);
	            header('Location: '.$core->url.'wert');
	            exit;
	        }else{
	            $error .= 'Fehler beim Löschen des Möbels<br>';
	        }
	    }else{
	        $error .= 'Möbel nicht gefunden<br>';
	    }
	}
	$isEdit = isset($_POST['oldName']);
		$allowedExts = array('png', 'jpg', 'jpeg', 'gif');
		$allowedMime = array('image/png', 'image/jpeg', 'image/pjpeg', 'image/gif');
		if(!isset($_POST['itemName'])){
			$error .= 'item_name Feld war leer<br>';
		}
		if(!isset($_POST['itemDesc'])){
			$error .= 'Keine Beschreibung eingegeben<br>';
		}
		if(!isset($_FILES['file'])){
			$error .= 'Kein Bild ausgewählt<br>';
		}
		if(empty($error)){
			$imageHash = '';
			$ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
			if ((in_array($_FILES['file']['type'], $allowedMime))
			&& (in_array($ext, $allowedExts))
			&& (@getimagesize($_FILES['file']['tmp_name']) !== false)
			&& ($_FILES['file']['size'] <= $maxSizeBytes)){
				$hash = hash_file('sha256', $_FILES['file']['tmp_name']);
				$imageHash = $hash.'.'.$ext;
				$destination = $filedir.'/'.$imageHash;
				// don't allow overwriting on hash collision
				if(!file_exists($destination)){
					move_uploaded_file($_FILES['file']['tmp_name'], $destination);
				}
				if(!$isEdit){
					try {
						$_POST['price'] = str_replace([',','.'], '', $_POST['price']);
						$price = ((!isset($_POST['price']) || !is_numeric($_POST['price'])) ? 0 : intval($_POST['price']));
						$category = ((!isset($_POST['category']) || !is_numeric($_POST['category'])) ? 0 : intval($_POST['category']));
						$insert = $core->m->prepare('INSERT INTO furniture_rare_details (item_name,longdesc,image,price) VALUES (?,?,?,?)');
						if($insert->execute([$_POST['itemName'], $_POST['itemDesc'], $imageHash, $price])){
						    $furnitureId = $core->m->lastInsertId();
						    if(isset($_POST['categories']) && is_array($_POST['categories'])){
						        $insertCategory = $core->m->prepare('INSERT INTO furniture_rare_category_mappings (furniture_id, category_id) VALUES (?,?)');
						        foreach($_POST['categories'] as $categoryId) {
						            if(is_numeric($categoryId)) {
						                $insertCategory->execute([$furnitureId, intval($categoryId)]);
						            }
						        }
						    }
						}
					}catch(PDOException $err){
						$error .= 'Konnte nicht eingefügt werden: ';
						if($err->getCode() == 23000){
							$error .= 'item_name existiert nicht in der Möbel Datenbank. Es können nur existierende Möbel in die Preisliste eingetragen werden.';
						}else{
							$error .= 'err#'.$err->getCode().'::'.$err->getMessage();
						}
						$error .= '<br>';
					}
				}
			} elseif(!$isEdit) {
				$error .= 'Bild ist vermütlich nicht gültig.<br>';
			}
			if($isEdit){
				$select = $core->m->prepare('SELECT id,price,image FROM furniture_rare_details WHERE item_name=?');
				$select->execute([$_POST['oldName']]);
				$itemData = $select->fetchAll(PDO::FETCH_ASSOC)[0];
				$_POST['price'] = str_replace([',','.'], '', $_POST['price']);
				$price = ((!isset($_POST['price']) || !is_numeric($_POST['price'])) ? -1 : intval($_POST['price']));
				if(empty($imageHash)){
					$update = $core->m->prepare('UPDATE furniture_rare_details SET item_name=?, longdesc=?, price=? WHERE item_name=?');
					if($update->execute([$_POST['itemName'], $_POST['itemDesc'], $price, $_POST['oldName']])){
					    // Update categories
					    $delete = $core->m->prepare('DELETE FROM furniture_rare_category_mappings WHERE furniture_id=?');
					    $delete->execute([$itemData['id']]);
					    
					    if(isset($_POST['categories']) && is_array($_POST['categories'])){
					        $insertCategory = $core->m->prepare('INSERT INTO furniture_rare_category_mappings (furniture_id, category_id) VALUES (?,?)');
					        foreach($_POST['categories'] as $categoryId) {
					            if(is_numeric($categoryId)) {
					                $insertCategory->execute([$itemData['id'], intval($categoryId)]);
					            }
					        }
					    }
					}
				}else{
					$update = $core->m->prepare('UPDATE furniture_rare_details SET item_name=?, longdesc=?, price=?, image=? WHERE item_name=?');
					if($update->execute([$_POST['itemName'], $_POST['itemDesc'], $price, $imageHash, $_POST['oldName']])){
					    // Update categories
					    $delete = $core->m->prepare('DELETE FROM furniture_rare_category_mappings WHERE furniture_id=?');
					    $delete->execute([$itemData['id']]);
					    
					    if(!empty($_POST['category'])){
					        $insertCategory = $core->m->prepare('INSERT INTO furniture_rare_category_mappings (furniture_id, category_id) VALUES (?,?)');
					        $insertCategory->execute([$itemData['id'], $_POST['category']]);
					    }
					}
					@unlink($filedir.'/'.$itemData['image']);
				}
				if($price != $itemData['price']){
					$insert = $core->m->prepare('INSERT INTO furniture_rare_changes (player_id, furni_id, old_price, `timestamp`) VALUES (?,?,?,?)');
					$insert->execute([$u_details['id'], $itemData['id'], $itemData['price'], time()]);
				}
			}
		}
		if(empty($error)){
			@unlink($cachePath);
			header('Location: '.$core->url.'wert');
			exit;
		}else{
			$pagecontent .= '<div class="row box"><div class="col" style="color:#e37373">'.$error.'</div></div>';
		}
	}
	$pagecontent .= '<div class="row box" style="border:1px solid #376d9d">
	<div class="col-12">
	<button class="btn btn-primary w-100" type="button" data-bs-toggle="modal" data-bs-target="#insertModal">
	🎁 Neues Item einfügen
	</button>
	</div>
	</div>';
}

$pagecontent .= '<div class="row rare justify-content-between">';
// cache for 30 minutes
if(!file_exists($cachePath) || time() - filemtime($cachePath) > 1800){
	$rankPeople = $core->m->prepare('SELECT id FROM players WHERE rank > 7');
	$rankPeople->execute();
	$result = $rankPeople->fetchAll(PDO::FETCH_COLUMN);
	$rankPeople = 'AND user_id !='.implode(' AND user_id !=', $result); // this is the most performance efficient way to skip rank people in umlauf count, it requires a tripleindex on base_item, gift_base_item and user_id
	
	$select = $core->m->prepare('SELECT r.id,f.public_name,r.longdesc,r.price,r.buyprice,r.image,r.views,(SELECT GROUP_CONCAT(CAST(m.category_id AS CHAR)) FROM furniture_rare_category_mappings m WHERE m.furniture_id = r.id) as categories,(SELECT ( (SELECT COUNT(id) FROM items WHERE base_item=f.id '.$rankPeople.') + (SELECT COUNT(id) FROM items WHERE gift_base_item=f.id AND base_item != gift_base_item '.$rankPeople.') ) ) as umlauf,r.item_name,c.timestamp,c.old_price FROM furniture_rare_details r LEFT JOIN furniture f ON(f.item_name = r.item_name) LEFT JOIN furniture_rare_changes c ON(r.id=c.furni_id AND c.id=(SELECT id FROM furniture_rare_changes AS ci WHERE ci.furni_id=r.id ORDER BY `timestamp` DESC LIMIT 1)) ORDER BY r.id DESC');
	$select->execute();
	$items = array_map('current', $select->fetchAll(PDO::FETCH_GROUP|PDO::FETCH_ASSOC));
	file_put_contents($cachePath, json_encode($items));
}else{
	$items = json_decode(file_get_contents($cachePath), true);
}
$i = 0;
$itemArray = [];
$maxItemsToShow = 500; // (will show this +1) limit for shitty browsers like chrome

// Get categories for dropdown
$categoriesHtml = '<option value="0">Keine Kategorie</option>';
$select = $core->m->prepare('SELECT id, name FROM furniture_rare_categories ORDER BY name ASC');
$select->execute();
while ($cat = $select->fetch(PDO::FETCH_ASSOC)) {
    $categoriesHtml .= '<option value="'.$cat['id'].'">'.htmlspecialchars($cat['name']).'</option>';
}
$insertModalTemplate = '<div class="modal-body p-0">
<div class="modal-body p-0">
<div class="box item">
<img id="imagePreview" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:200px;max-height:200px;object-fit:contain;display:none">
</div>
<div style="border:1px solid #2c2e3c;padding:12px">
<input type="hidden" name="MAX_FILE_SIZE" value="'.$maxSizeBytes.'">
<script>
function loadPreviewImage(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const output = document.getElementById(\\\'imagePreview\\\');
        output.src = e.target.result;
        output.style.display = \\\'block\\\';
    };
    reader.readAsDataURL(event.target.files[0]);
}

function initCategoryButtons() {
    var buttons = document.querySelectorAll(\\\'input[name="categories[]"]\\\');
    buttons.forEach(function(btn) {
        btn.addEventListener(\\\'change\\\', function() {
            if(this.checked) {
                this.parentElement.classList.add(\\\'active\\\', \\\'btn-dark\\\');
                this.parentElement.classList.remove(\\\'btn-outline-dark\\\');
            } else {
                this.parentElement.classList.remove(\\\'active\\\', \\\'btn-dark\\\');
                this.parentElement.classList.add(\\\'btn-outline-dark\\\');
            }
        });
    });
}

setTimeout(initCategoryButtons, 100);
</script>
<input class="form-control" type="file" name="file" accept="image/*" required onchange="loadPreviewImage(event)">
</div>
<div class="d-flex">
<div class="w-50" style="border:1px solid #2c2e3c;padding:12px">
<div style="display:flex;align-items:center;margin-bottom:10px">
<span style="margin-right:10px;white-space:nowrap">Item Name:</span>
<input class="form-control" name="itemName" type="text" placeholder="z.B. dragonpillar*4" autocomplete="off" required style="width:150px;margin-left:auto">
</div>
<div style="display:flex;align-items:center;margin-bottom:10px">
<span style="margin-right:10px;white-space:nowrap">Wert:</span>
<input class="form-control" name="price" type="number" min="0" value="0" autocomplete="off" required style="width:150px;margin-left:auto">
</div>
<div style="display:flex;flex-direction:column">
<span style="margin-bottom:10px">Kategorien:</span>
<div style="display:flex;flex-wrap:wrap;gap:5px">';

$select = $core->m->prepare('SELECT id, name FROM furniture_rare_categories ORDER BY name ASC');
$select->execute();
$categoryButtons = '';
while ($cat = $select->fetch(PDO::FETCH_ASSOC)) {
    $categoryButtons .= '
    <label class="btn btn-outline-dark btn-sm" style="cursor:pointer">
        <input type="checkbox" name="categories[]" value="'.$cat['id'].'" style="display:none">
        '.htmlspecialchars($cat['name']).'
    </label>';
}
$insertModalTemplate .= $categoryButtons.'</div>
</div>
</div>
<div class="w-50" style="border:1px solid #2c2e3c;padding:12px;display:flex;flex-direction:column">
<span style="text-align:center;margin-bottom:10px">Beschreibung</span>
<input class="form-control" name="itemDesc" type="text" placeholder="Beschreibung" autocomplete="off" required style="flex:1">
</div>
</div>
</div>
<div class="modal-footer">
<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
<button type="submit" class="btn btn-primary">Einfügen</button>
</div>';
$itemModalTemplate = '<div class="col-md-12 item"></div><div class="col-md-6 row"></div><div class="col-md-6 text-center align-items-center"></div><div class="col-md-12 text-center"></div><div class="col-md-12 text-center"></div>';
$itemTemplate = '<div class="col-md-4"><div class="box item" id="{id}"><img class="rarity l{level}" title="{amount}"><span{tag}>{price}</span><img src="_dat/serve/img/wert/furni/{image}" loading="lazy"><span>{name}</span></div></div>';
$itemReplace = ['{id}', '{level}', '{amount}', '{tag}', '{price}', '{image}', '{name}'];
foreach ($items as $itemId => $item) {
    if(!isset($item['public_name'])){
        echo "error not found: {$itemId}\n";
        continue;
    }

    $amount = $item['umlauf'];

    $level = match(true) {
        $amount > 50 => 1,
        $amount > 30 => 2,
        $amount > 15 => 3,
        $amount > 5 => 4,
        $amount > 0 => 5,
        default => 0
    };

    if(!isset($item['old_price']) || $item['old_price'] < 1){
        $item['old_price'] = 0;
    }

    $itemData = [
        $item['item_name'],
        $level,
        $amount,
        $item['old_price'] < 1 ? '' : ' class="'.($item['price'] >= $item['old_price'] ? 'up' : 'down').'" title="vorher '.number_format($item['old_price']).'"', // priceTag
        ($item['price'] > 0 ? number_format($item['price']) : 'Unbekannt'),
        filter_var($item['image'], FILTER_SANITIZE_URL),
        htmlspecialchars(str_replace('Habbo', $core->shortname, $item['public_name']))
    ];

    // Check if we should show this item based on category
    $itemCategories = isset($item['categories']) ? explode(',', $item['categories'] ?? '') : [];
    if($i < $maxItemsToShow && ($category == 0 || in_array((string)$category, $itemCategories))){
        $pagecontent .= str_replace($itemReplace, $itemData, $itemTemplate);
        $i++;
    }

    array_push($itemData, isset($item['categories']) ? $item['categories'] : '', $item['price'], $item['timestamp'], $itemId);
    array_push($itemArray, $itemData);
}
$pagecontent .= '</div></div>';

// category modal
$pagecontent .= '<div class="modal fade" id="categories" tabindex="-1">
<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
		<div class="modal-content">
			<div class="modal-header">
			<h5 class="modal-title">Kategorien</h5>
			<div class="d-flex align-items-center gap-2">'.
			($isEditor ? '<button type="button" class="btn btn-success btn-sm px-2" data-bs-toggle="collapse" data-bs-target=".category-toggle">➕</button>' : '').
			'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
			</div>
			</div>
			<div class="modal-body">'.
			($isEditor ? '<div class="collapse category-toggle">
			    <form method="POST" class="mb-3">
			        <input type="hidden" name="action" value="add_category">
			        <div class="mb-3">
			            <label class="form-label">Kategorie Name</label>
			            <input type="text" name="category_name" class="form-control" required>
			        </div>
			        <div class="d-flex justify-content-between">
			            <button type="button" class="btn btn-secondary btn-sm px-2" data-bs-toggle="collapse" data-bs-target=".category-toggle">❌</button>
			            <button type="submit" class="btn btn-success btn-sm px-2">💾</button>
			        </div>
			    </form>
			</div>' : '').
			'
				<div class="cats collapse category-toggle show">
				<div class="row">';
					$select = $core->m->prepare('SELECT frc.id, frc.name, (
					    SELECT frd.image
					    FROM furniture_rare_details frd
					    WHERE frd.category = frc.id
					    ORDER BY RAND()
					    LIMIT 1
					) as image
					FROM furniture_rare_categories frc
					ORDER BY frc.name ASC');
					$select->execute();
					while ($cat = $select->fetch(PDO::FETCH_ASSOC)) {
						$pagecontent .= '<div class="col-md-6">
						<div class="d-flex cat-wrapper'.($isEditor ? ' has-edit' : '').' mb-2">
						    <a href="'.$core->url.'wert?c='.$cat['id'].'" class="btn btn-dark btn-sm flex-grow-1" role="button">'.(isset($cat['image']) && !empty($cat['image'])?'<img src="'.$core->url.'_dat/serve/img/wert/furni/'.filter_var($cat['image'], FILTER_SANITIZE_URL).'" width="16" height="16" loading="lazy">&nbsp;':'').htmlspecialchars($cat['name']).'</a>'.
						    ($isEditor ? '<button type="button" class="btn btn-dark btn-sm edit-btn px-2" data-bs-toggle="collapse" data-bs-target="#editCategory'.$cat['id'].'" title="Bearbeiten">✏️</button>' : '').
						'</div>'.
						($isEditor ? '<div class="collapse" id="editCategory'.$cat['id'].'">
						    <form method="POST" class="mb-3">
						        <input type="hidden" name="action" value="edit_category">
						        <input type="hidden" name="category_id" value="'.$cat['id'].'">
						        <div class="mb-3">
						            <label class="form-label">Kategorie Name</label>
						            <input type="text" name="category_name" class="form-control" value="'.htmlspecialchars($cat['name']).'" required>
						        </div>
						        <div class="d-flex justify-content-between align-items-center">
						            <button type="button" class="btn btn-danger btn-sm px-2" onclick="if(confirm(\'Möchtest du diese Kategorie wirklich löschen?\')) { this.form.action.value=\'delete_category\'; this.form.submit(); }">🗑️</button>
						            <div>
						                <button type="button" class="btn btn-secondary btn-sm px-2" data-bs-toggle="collapse" data-bs-target="#editCategory'.$cat['id'].'">❌</button>
						                <button type="submit" class="btn btn-success btn-sm px-2">💾</button>
						            </div>
						        </div>
						    </form>
						</div>' : '').
						'</div>';
					}
$pagecontent .= '</div>
				</div>
			</div>
		</div>
	</div>
</div>';
// item modal
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


// Append insert modal after details modal
$pagecontent .= '<div class="modal fade" id="insertModal" tabindex="-1">
<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
<form class="modal-content box needs-validation" enctype="multipart/form-data" method="POST" novalidate>
'.$insertModalTemplate.'
</form>
</div>
</div>';
$jsappendix .= '<script src="_dat/serve/js/popper.min.js"></script>
<script src="_dat/serve/js/chart.umd.js"></script>
<script>
const maxSizeBytes = '.$maxSizeBytes.';
const items = '.json_encode($itemArray).';
const maxItemsToShow = '.$maxItemsToShow.';
const itemTemplate = \''.$itemTemplate.'\';
const itemModalTemplate = \''.$itemModalTemplate.'\';
const insertModalTemplate = \''.$insertModalTemplate.'\';
const itemReplace = '.json_encode($itemReplace).';
const avatarImager = \''.$core->avatarImager.'\';
const isEditor = '.$isEditor.';
const isAdmin = '.$isAdmin.';
let rarity = '.$rarity.';
let category = '.$category.';
let search = document.getElementById("search").value;
'.file_get_contents(__DIR__.'/wert.js').'
</script>';
