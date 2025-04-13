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
    ]];
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
$rarity = isset($_GET['r']) ? intval($_GET['r']) : 0;
$category = isset($_GET['c']) ? intval($_GET['c']) : 0;
$maxItemsToShow = 500; // (will show this +1) limit for shitty browsers like chrome
$cachePath = $core->path.'/_inc/.cache/wert/index.cache';

// admin section
$isEditor = isset($u_details['id']) && isset($allowedPeople[$u_details['id']]) ? 1 : 0;
$isAdmin = $isEditor && $allowedPeople[$u_details['id']] === 'admin' ? 1 : 0;

$cssappendix .= '<style>
/* Your original CSS here from lines 44-204 */
</style>';

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

if($isEditor) {
    $filedir = $core->path.'/_dat/serve/img/wert/furni';
    $maxSizeBytes = 5242880;
    $error = '';
    
    if($_SERVER['REQUEST_METHOD'] == 'POST'){
        $allowedExts = array('png', 'jpg', 'jpeg', 'gif');
        $allowedMime = array('image/png', 'image/jpeg', 'image/pjpeg', 'image/gif');
        // Your POST handling code here from lines 255-325
    }

    $pagecontent .= '<form enctype="multipart/form-data" method="POST" class="row box" style="border:1px solid #376d9d">
        <div class="col-md-3">
            <input type="hidden" name="MAX_FILE_SIZE" value="'.$maxSizeBytes.'">
            <input class="form-control" type="file" name="file" accept="image/*" required>
        </div>
        <div class="col-md-3">
            <input class="form-control" name="itemName" type="text" placeholder="item_name (z.B. dragonpillar*4)" autocomplete="off" required>
        </div>
        <div class="col-md-4">
            <input class="form-control" name="itemDesc" type="text" placeholder="Beschreibung" autocomplete="off" required>
        </div>
        <div class="col-md-2">
            <input class="form-control" type="submit" value="Einfügen">
        </div>
    </form>';
}

$pagecontent .= '<div class="row rare justify-content-between">';

// Cache handling code and item display logic here from lines 343-402

$pagecontent .= '</div></div>';

// Modal templates and JavaScript initialization
$pagecontent .= '<!-- Your modal templates from lines 403-440 -->';

$jsappendix .= '<script src="_dat/serve/js/popper.min.js"></script>
<script src="_dat/serve/js/chart.umd.js"></script>
<script>
const items = '.json_encode($itemArray).';
const maxItemsToShow = '.$maxItemsToShow.';
const itemTemplate = \''.$itemTemplate.'\';
const itemModalTemplate = \''.$itemModalTemplate.'\';
const itemReplace = '.json_encode($itemReplace).';
const avatarImager = \''.$core->avatarImager.'\';
const isEditor = '.$isEditor.';
const isAdmin = '.$isAdmin.';'.
($isEditor ? '
const maxSizeBytes = '.$maxSizeBytes.';' : '').'
let rarity = '.$rarity.';
let category = '.$category.';
let search = document.getElementById("search").value;
'.file_get_contents(__DIR__.'/wert.js').'</script>';