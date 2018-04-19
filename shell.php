<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">

<html>
<head>
<title>Awkwords - word generator</title>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<meta http-equiv="content-language" content="en">
<meta name="description" content="An online random word generator, especially suited for making words for conlangs (constructed languages). Rendering the words is based on a freely editable pattern, which allows the user to easily configure the generator for various requirements.">
<meta http-equiv="expires" content="Sun 26 Jun 2005 12:00:00 GMT">
<link rel="stylesheet" href="shell.css" type="text/css" media="all">
<link rel="shortcut icon" href="awkwords-favicon.ico" type="image/ico">
<script language="JavaScript" type="text/javascript">
function addscrow(n) {
  var select = document.getElementById('sc_select'+n); select.onchange = "";
  var next_row = document.getElementById('sc_row'+(n+1)); next_row.style.display = ""; 
  var next_select = document.getElementById('sc_select'+(n+1)); next_select.onchange = function() { addscrow(n+1); } 
}
function show_loadsec() {
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
function check_openfile() {
  if(document.getElementById('file').value=="") {
    alert("Select the file you want to open.");
    return false;
  }
  else return true;
}
</script>
</head>
<body>
<div class="heading">
<h1 class="h_left">Awkwords - word generator</h1>
<div class="h_right">
<a id="help" href="help.html" onclick="return new_window(this)" 
title="information about this application and how to use it">Help</a>
</div>
<span title="version">1.2 <!-- [awkwords-version] --></span>
<div class="clear">&nbsp;</div>
</div>

<?php
// load defaults
if(!IsSet($numw)) {
  if($_POST['numw']>9999) $numw = 9999; else $numw = $_POST['numw']; 
  if(!IsSet($_POST['numw'])) $numw = 100;
}
if(IsSet($_POST['nle'])) $nle = true;
else $nle = false;
if(IsSet($_POST['filterdup'])) $filterdup = true;
else $filterdup = false;

if(IsSet($_POST['sp_names'])) $sp_names = $_POST['sp_names'];
if(IsSet($_POST['sp_contents'])) $sp_contents = $_POST['sp_contents'];
if(!IsSet($sp_names) && !IsSet($sp_contents)) {
  $sp_names[0] = "V"; $sp_contents[0] = "a/i/u";
  $sp_names[1] = "C"; $sp_contents[1] = "p/t/k/s/m/n";
  $sp_names[2] = "N"; $sp_contents[2] = "m/n";
}

// load file
if(isset($_FILES['file']) && $_POST['submit']=="Open") {
  if(load_file($_FILES['file']['tmp_name'], $v)) {  // file loaded successfully
    $sp_names = $v['spn'];
    $sp_contents = $v['spc'];
    $pattern = $v['pattern'];
    $numw = $v['numw'];
    $nle = $v['nle'];
    $filterdup = $v['filterdup'];
  }
  else {  // error
    echo '<div class="error">';
    echo 'Error loading file "'.$_FILES['file']['name'].'"';
    echo '</div>';
  }
}

$scrlim = scrlim($sp_names);  // adjust the number of revealed subpattern rows

?>
<form method="post" enctype="multipart/form-data">
<div id="spsec">
<table class="sptab">
<col><col width="100%">
<tr>
<th id="sp_label" colspan="2"><b>subpatterns:</b></th>
</tr>
<?php
for($n=0; $n<=25; $n++) {
  echo "\n\n<tr class=\"sc_row\" id=\"sc_row$n\""; 
  if($n>$scrlim) echo " style=\"display: none\"";
  echo ">";
  echo "<td class=\"spn\"><select name=\"sp_names[$n]\" id=\"sc_select$n\""; 
  if($n==$scrlim) echo " onchange=\"addscrow($n)\""; 
  echo ">";
  echo "<option value=\"\""; 
  if($sp_names[$n]=="") echo " selected"; 
  echo ">-</option>\n";
  $i = 0; $char = 'A';
  while($i<=25) {
    echo "<option value=\"$char\""; 
    if($sp_names[$n]==$char) echo " selected"; 
    echo ">$char</option>\n"; 
    $i++; $char++;
  }
  echo "</select></td>";
  echo "<td class=\"spc\"><input name=\"sp_contents[]\" type=\"text\" value=\"".htmlspecialchars($sp_contents[$n])
  ."\" size=\"64\" id=\"sc_input$n\"></td></tr>"; 
}
?>
</table></div>
<div id="psec">
<?php if(!IsSet($pattern)) if(!IsSet($_POST['pattern'])) $pattern = "CV(CV)(N)"; else $pattern = $_POST['pattern']; ?>
<label for="pattern"><b>pattern:</b> </label><input name="pattern" id="pattern" type="text" 
value="<?php echo htmlspecialchars($pattern); ?>" size="64"></div>
<div id="gensec"><label for="numw" title="number of words to generate">words: </label>
<?php 

echo '<input name="numw" id="numw" type="text" size="4" maxlength="4" value="' . $numw . '">'; 

echo '<input name="nle" id="nle" class="checkbox" type="checkbox"'; 
if($nle) echo ' checked="checked"'; 
echo '>'; 
echo '<label class="checkbox" for="nle" title="put each word on a separate line">new line each</label>';

echo '<input name="filterdup" id="filterdup" class="checkbox" type="checkbox"'; 
if($filterdup) echo ' checked="checked"'; 
echo '>'; 
echo '<label class="checkbox" for="filterdup"'
.' title="make the words different from each other">filter duplicates</label>';

?> 
<input name="submit" type="submit" value="Generate" title="generate the words!" style="margin-left: 30px">
</div>
<div id="slsec">
<input name="submit" type="submit" value="Save..." title="save these settings to your computer">
<input type="button" id="loadsecinvoker" value="Open >" title="load saved settings from your computer"
onclick="show_loadsec()">
</div>
<input type="hidden" name="filename" value="<?php echo $_FILES['file']['name']; ?>">
<div class="clear">&nbsp;</div>
<div id="loadsec">
<label for="file">file: </label><input name="file" id="file" type="file">
<input name="submit" id="openbutton" type="submit" value="Open" style="margin-left: 20px"
title="open the selected file" onclick="return check_openfile()">
</div>
</form>

<div id="outputsec">
<?php
/**
 * return the English word inflected for a specific number 
 * ($english word = singular form)
 */
function en_number_form($english_word, $n) {
  if($n==1) return $english_word;
  else { // plural 
    if($english_word=="is") return "are";
    if($english_word=="was") return "were";
    if($english_word=="has") return "have";
    if($english_word=="this") return "these";
    if($english_word=="does") return "do";
    if($english_word=="its") return "their";
    if(substr($english_word, -1)=="y") return substr($english_word, 0, -1)."ies";
    return $english_word."s";
  }
}

/**
 * perform checks and print error and warning messages based on them
 */
function validation_messages(&$spn, &$spc, &$pattern) {
  global $excd_weights;
  $r['msgc'] = 0;
  $r['errc'] = 0; 
  $r['warnc'] = 0;

  if(($sdep = self_dependent(dependencies($spn, $spc))) != "") {  // error: self-dependent subpatterns
    $r['msgc']++; $r['errc']++;
    echo "<div class=\"error\">";
    echo "error: cyclic dependency -- ".en_number_form("subpattern", strlen($sdep))." ";
    for($i=0; $i<strlen($sdep); $i++) {
      if($i>0) echo ", ";
      echo "<i>".$sdep[$i]."</i>";
    }
    echo " ".en_number_form("is", strlen($sdep))." in a cycle in the dependency graph";
    echo "</div>";
  }

  $check = check_input($spn, $spc, $pattern);
  if($check['multiple']!="") {  // warning: multiple subpatterns for some letters
    $r['msgc']++; $r['warnc']++;
    echo "<div class=\"warning\">";
    echo "warning: ".en_number_form("letter", strlen($check['multiple']))." ";
    for($i=0; $i<strlen($check['multiple']); $i++) {
      if($i>0) echo ", ";
      echo "<i>".$check['multiple'][$i]."</i>";
    }
    echo " ".en_number_form("has", strlen($check['multiple']))
    ." multiple subpatterns assigned; the last one is automatically used";
    echo "</div>";
  }
  if($check['undefined']!="") {  // warning: some capital A-Z letters that are not assigned subpatterns
    $r['msgc']++; $r['warnc']++;
    echo "<div class=\"warning\">";
    echo "warning: ".en_number_form("letter", strlen($check['undefined']))." ";
    for($i=0; $i<strlen($check['undefined']); $i++) {
      if($i>0) echo ", ";
      echo "<i>".$check['undefined'][$i]."</i>";
    }
    echo " ".en_number_form("has", strlen($check['undefined']))
    ." no ".en_number_form("subpattern", strlen($check['undefined']))." assigned."
    ."<br> To generate a capital letter, enclose it in the escape characters - the double"
    ." quotes (\"\"), like this: <i>\"L\"</i>";
    echo "</div>";
  }
  if(isset($check['unm_brackets'])) {  // warning: brackets not matching
    $r['msgc']++; $r['warnc']++;
    echo "<div class=\"warning\">";
    $n = 0;

    // count the number of buffers where unmatched brackets were found
    for($i=0; isset($check['unm_brackets'][$i]); $i++) 
      $n += count($check['unm_brackets'][$i]);

    $formatted_findings = '<ul class="unmwarnlist">';
    for($i=0; isset($check['unm_brackets'][$i]); $i++) {
      $formatted_findings .= "<li>";
      if($check['unm_i'][$i] == -1) {
        $content = $pattern;
        $formatted_findings .= "pattern: ";
      }
      else {
        $content = $spc[$check['unm_i'][$i]];
        $formatted_findings .= $spn[$check['unm_i'][$i]].": ";
      }

      // enclose all brackets found not matching in <b> tags
      $formatted_findings .= substr($content, 0, $check['unm_positions'][$i][0]); 
      for($posi=0; isset($check['unm_positions'][$i][$posi]); $posi++) {
        $cur_pos = $check['unm_positions'][$i][$posi];
        $formatted_findings .= "<b>".$content[$cur_pos]."</b>";
        if(isset($check['unm_positions'][$i][$posi+1])) { // flush until next position
          //echo " :C".$cur_pos.".L".($check['unm_positions'][$i][$posi+1] - ($cur_pos+1));
          $formatted_findings .= substr($content, $cur_pos+1, $check['unm_positions'][$i][$posi+1] - ($cur_pos+1));
        }
        else { // flush until end
          $formatted_findings .= substr($content, $cur_pos+1);
        }
      }

      $formatted_findings .= "</li>";
    }
    $formatted_findings .= '</ul>';

    echo "warning: ".en_number_form("this", $n)." ".en_number_form("bracket", $n)
    ." without ".en_number_form("its", $n)." matching "
    .en_number_form("counterpart", $n)." ".en_number_form("was", $n)." found: ";
    echo $formatted_findings;
    echo "</div>";
  }

  if($r['errc'] == 0) {  // no errors -> render the pattern to count maximum different words for the pattern
    $r['max_different_words'] = render($pattern, $spn, $spc, 1);
    if(isset($excd_weights)) {  // warning: reduced weights
      $r['msgc']++; $r['warnc']++;
      echo "<div class=\"warning\">";
      $i = 0;
      foreach($excd_weights as $w => $exc) {
        if($i) $weights_list .= ", ";
        $weights_list .= "<i>".$w."</i>";
        $i++;
      }
      echo "warning: ".en_number_form("weight", $i)." ".$weights_list." ".en_number_form("is", $i);
      echo " too high; reduced to the maximum weight <i>128</i>";
      echo "</div>";
    }
  }

  return $r;
}

if($_POST['submit']=="Generate" && $pattern!="") {  // generate words
  $v = validation_messages($sp_names, $sp_contents, $pattern);
  if($v['errc'] == 0) { 
    flush();
    echo '<input id="selectbutton" type="button" value="Select all" onclick="select_all()">';
    echo '<div id="words">';
    $ws = 0; // valid word counter
    $dups = 0; // duplicate counter
    $fabts = 0; // aborted rendering counter
    ob_start();
    $start_time = array_sum(explode(' ',microtime()));
    for($i=1; $i<=$numw; $i++) {
      $word = render($pattern, $sp_names, $sp_contents); // generate a word
      if($rendering_aborted) { $fabts++; $rendering_aborted = false; }
      elseif(!$filterdup || !isset($generated_words[$word])) { 
        $ws++; $generated_words[$word] = true; 
        echo htmlspecialchars($word);
        if($nle) echo "<br>";
        else echo " ";
      }
      else $dups++;
    }
    $finish_time = array_sum(explode(' ',microtime()));
    ob_end_flush();
    echo "</div>";
    echo "<div id=\"stats\">";
    echo $ws." ".en_number_form("word", $ws); 
    if($dups || $fabts) {
      echo " (filtered out: ";
      if($fabts) echo $fabts." by pattern filters";
      if($dups && $fabts) echo ", ";
      if($dups) echo $dups." ".en_number_form("duplicate", $dups);
      echo ")";
    }
    echo " | time: ".sprintf("%.3f", ($finish_time-$start_time))." seconds";
    echo " | max. different words: " . $v['max_different_words'];
    echo "</div>";
  }
}

?>
</div>

</body>
</html>
