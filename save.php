<?php
$filename = $_POST['filename'];
if($filename=="") $filename = "awkwords-settings.awk";
Header('Content-Type: application/octet-stream');
Header('Content-Disposition: attachment; filename="'.$filename.'"');
$scn = $_POST['scn']; $scc = $_POST['scc'];
$scrlim = scrlim($scn);
for($n=0; $n<$scrlim; $n++) echo $scn[$n].":".$scc[$n]."\n"; // shortcuts
echo "r:".$_POST['pattern']."\n"; // pattern
echo "n:".$_POST['numw']."\n"; // number of words to generate
if($_POST['nle']) echo "nle\n"; // new line each
if($_POST['filterdup']) echo "filterdup\n"; // filter duplicates
?>
