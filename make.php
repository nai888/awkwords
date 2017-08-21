<?php echo "<?xml version=\"1.0\" encoding=\"windows-1250\"?>\n"; ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<title>Awkwords - word generator</title>
<meta http-equiv="content-type" content="text/xml; charset=windows-1250" />
<meta http-equiv="content-language" content="en" />
<meta http-equiv="expires" content="Sun 26 Jun 2005 12:00:00 GMT" />
<link rel="stylesheet" href="default.css" type="text/css" media="all" />
<script language="JavaScript" type="text/javascript">
function addscrow(n) {
  var s = document.getElementById('sc_select'+n); s.onchange = "";
  var nrow = document.getElementById('sc_row'+(n+1)); nrow.style.display = 'block'; 
  var ns = document.getElementById('sc_select'+(n+1)); ns.onchange = function() { addscrow(n+1); } 
}
function loadsec() {
  document.getElementById('loadsec').style.display = 'block';
  document.getElementById('loadsecinvoker').style.visibility = 'hidden';
}
function select_all() {
  try {
    selection = window.getSelection();
    selection.removeAllRanges();
    range = document.createRange();
    range.selectNodeContents(document.getElementById('words'));
    selection.addRange(range);
  }
  catch(e) { // IE
    range = document.body.createTextRange();
    range.moveToElementText(document.getElementById('words'));
    range.select();
  }
}
function new_window(anchor) {
  if(window.open(anchor.href)) return false;
  else return true;
}
</script>
</head>
<body>
<div class="heading">
<h1 class="h_left">Awkwords - word generator</h1>
<div class="h_right">
<a id="help" href="help.html" onclick="return new_window(this)">Help</a>
</div>
<!-- web stats [nv.cz]
<div id="counter">
<script src="http://c1.navrcholu.cz/code?site=85435;t=lb14"
type="text/javascript"></script><noscript><div><a
href="http://navrcholu.cz/"><img
src="http://c1.navrcholu.cz/hit?site=85435;t=lb14;ref=;jss=0"
width="14" height="14" alt="NAVRCHOLU.cz"
style="border:none" /></a></div></noscript>
</div>
-->
v1.1 <!-- :: Awkwords version :: -->
<div class="clear">&nbsp;</div>
</div>


<!--<div class="right_links"><img src="help_ico.gif" style="vertical-align: middle" />
<span class="jslink" onclick="window.open('help.html', 'Awkwords_help', 'scrollbars=yes, toolbar=no, location=no, directories=no, status=no, menubar=no, width=650, height=350')">How to use</span>
</div>-->
<?php
if(IsSet($_FILES['file'])) { // load settings from the file
  $f = FOpen($_FILES['file']['tmp_name'], "r");
  $n = 0;
  while($r = FGetS($f, 255)) {
    if(SubStr($r, 0, 3)=="nle") $nle = true;
    if(SubStr($r, 0, 9)=="filterdup") $filterdup = true;
    if(EReg("^n:.*", $r)) $numw = (int) SubStr($r, 2, -1);
    if(EReg("^r:.*", $r)) $pattern = SubStr($r, 2, -1);
    if(EReg("^[[:upper:]]?:.*", $r)) {
      $pos = StrPos($r, ":"); 
      if($pos==0) $scn[$n] = ""; else $scn[$n] = $r[0]; 
      $scc[$n] = SubStr($r, $pos+1, -1); $n++;
    }
  }
  FClose($f);
}
?>
<form action="index.php" method="post">
<div id="scsec"><b>shortcuts:</b>  <?php
if(IsSet($_POST['scn'])) $scn = $_POST['scn'];
if(IsSet($_POST['scc'])) $scc = $_POST['scc'];
if(!IsSet($scn) && !IsSet($scc)) {
$scn[0] = "V"; $scc[0] = "a/i/u";
$scn[1] = "C"; $scc[1] = "p/t/k/s/m/n";
$scn[2] = "T"; $scc[2] = "p/t/k";
$scn[3] = "F"; $scc[3] = "s";
$scn[4] = "N"; $scc[4] = "m/n";
$scrlim = 5;
}
else $scrlim = scrlim($scn);

for($n=0; $n<=25; $n++) {
  echo "\n\n<div class=\"sc_row\" id=\"sc_row$n\""; 
	if ($n>$scrlim) echo " style=\"display: none\"";
	echo "><select style=\"width:4em\" name=\"scn[$n]\" id=\"sc_select$n\""; 
	if($n==$scrlim) echo " onchange=\"addscrow($n)\""; 
	echo ">";
  echo "<option value=\"\""; if($scn[$n]=="") echo " selected"; echo ">-</option>\n";
	$i = 0; $char = 'A';
  while($i<=25) {
    echo "<option value=\"$char\""; if($scn[$n]==$char) echo " selected"; echo ">$char</option>\n"; 
  	$i++; $char++;
  }
  echo "</select>";
  echo "<input name=\"scc[]\" type=\"text\" value=\"".htmlspecialchars($scc[$n])
  ."\" size=\"64\" id=\"sc_input$n\"></div>"; 
}
?> </div>
<div id="psec">
<?php if(!IsSet($pattern)) if(!IsSet($_POST['pattern'])) $pattern = "CV(CV)(N)"; else $pattern = $_POST['pattern']; ?>
<label for="pattern"><b>pattern:</b> </label><input name="pattern" id="pattern" type="text" 
value="<?php echo htmlspecialchars($pattern); ?>" maxlenght="200" size="64"></div>
<div id="gensec"><label for="numw">words: </label>
<?php 
if(!IsSet($numw)) {
  if($_POST['numw']>9999) $numw = 9999; else $numw = $_POST['numw']; 
  if(!IsSet($_POST['numw'])) $numw = 100;
}

echo '<input name="numw" id="numw" type="text" size="4" maxlength="4" value="' . $numw . '" />'; 

echo '<input name="nle" id="nle" class="checkbox" type="checkbox"'; 
if(IsSet($_POST['nle'])) $nle = $_POST['nle'];
if($nle) echo ' checked="checked"'; 
echo ' />'; echo "<label class=\"checkbox\" for=\"nle\">new line each</label>";

echo '<input name="filterdup" id="filterdup" class="checkbox" type="checkbox"'; 
if(IsSet($_POST['filterdup'])) $filterdup = $_POST['filterdup'];
if($filterdup) echo ' checked="checked"'; 
echo ' />'; echo "<label class=\"checkbox\" for=\"filterdup\">filter duplicates</label>";

?> 
<input name="submit" type="submit" value="Generate" style="margin-left: 30px" />
</div>
<div id="slsec">
<input name="submit" type="submit" value="Save..." />
<input type="button" id="loadsecinvoker" value="Open >" onclick="loadsec()" />
</div>
<input type="hidden" name="filename" value="<?php echo $_FILES['file']['name']; ?>" />
<div class="clear">&nbsp;</div>
</form>
<form id="loadsec" action="index.php" enctype="multipart/form-data" method="post">
<label for="file">file: </label><input name="file" id="file" type="file" />
<input name="submit" type="submit" value="Open" style="margin-left: 20px" />
</form>

<div id="wordsec">
<?php
$possibilities = render($pattern, $scn, $scc, 1);
if($exceeded_weight_limit) {
  echo "<div class=\"warning\">";
  echo "weight <i>".$exceeded_weight_limit."</i> is too high; reduced to the maximum weight <i>128</i>";
  echo "</div>";
}
?>
<input id="selectbutton" type="button" value="Select all" onclick="select_all()" />
<?php
/**
 * return the noun inflected for a specific number 
 */
function number_form($noun, $n) {
  if($n==1) return $noun;
  else { // plural 
    if(substr($noun, -1)=="y") return substr($noun, 0, -1)."ies";
    return $noun."s";
  }
}

if($pattern != "") {
  echo '<div id="words">';
  $ws = 0; // valid word counter
  $dups = 0; // duplicate counter
  $fabts = 0; // aborted rendering counter
  $start_time = array_sum(explode(' ',microtime()));
  for($i=1; $i<=$numw; $i++) {
    $word = render($pattern, $scn, $scc); // generate a word
    if($rendering_aborted) { $fabts++; $rendering_aborted = 0; }
    elseif(!$filterdup || !isset($generated_words[$word])) { 
      $ws++; $generated_words[$word] = true; 
      echo HTMLSpecialChars($word);
      if($nle) echo "<br />";
      else echo " ";
    }
    else $dups++;
  }
  $finish_time = array_sum(explode(' ',microtime()));
  echo "</div>";
  echo "<div id=\"stats\">";
  echo $ws." ".number_form("word", $ws); 
  if($dups || $fabts) {
    echo " (filtered out: ";
    if($dups) echo $dups." ".number_form("duplicate", $dups);
    if($dups && $fabts) echo ", ";
    if($fabts) echo $fabts." by pattern filters";
    echo ")";
  }
  echo " | generated in ".sprintf("%.3f", ($finish_time-$start_time))." seconds";
  echo " | possibilities with this pattern: " . $possibilities;
  echo "</div>";
}
?>
</div>

</body>
</html>
