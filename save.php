<?php
$filename = $_POST['filename'];
if($filename=="") $filename = "awkwords-settings.awkw";
Header('Content-Type: application/octet-stream');
Header('Content-Disposition: attachment; filename="'.$filename.'"');
echo "#awkwords version 1.2\n"; // [awkwords-version]

$sp_names = $_POST['sp_names']; 
$sp_contents = $_POST['sp_contents']; 

for($n=0; $n<=25; $n++) { // subpatterns
  // save every row that has anything filled
  if($sp_names[$n]!="" || $sp_contents[$n]!="") { 
    echo $sp_names[$n].":".$sp_contents[$n]."\n"; 
  }
}
echo "r:".$_POST['pattern']."\n"; // pattern
echo "n:".$_POST['numw']."\n"; // number of words to generate
if($_POST['nle']) echo "nle\n"; // new line each
if($_POST['filterdup']) echo "filterdup\n"; // filter duplicates
?>
