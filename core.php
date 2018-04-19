<?php
function scrlim(&$spn) { // returns index of the row just after the last filled row 
  for($n=0; $n<=25; $n++) if($spn[$n]!="") $scrlim = $n+1;
  return $scrlim; 
}


$rendering_aborted = false;  // global variable indicating rendering abort by a pattern filter

/**
 * Recursively goes through the given pattern $string.
 * $c==0 (default) -- return the number all possible renderings
 * otherwise       -- return a randomly generated string
 */
function render($string, &$spn, &$spc, $c = 0) {
  global $rendering_aborted;
  if($c > 0){ // count all possible renderings
    $options = choose($string, 1); $no = 0; 
    for($p=0; IsSet($options[$p]); $p++) {
      $f = fragments($options[$p], $spn, $spc); $nf = 1;
      for($i=0; IsSet($f[$i][0]); $i++) {
        switch($f[$i][0][0]) {
        case '[': 
          $nf *= render(SubStr($f[$i][0], 1, -1), $spn, $spc, $c);
          break;
        case '(': 
          $nf *= 1 + render(SubStr($f[$i][0], 1, -1), $spn, $spc, $c);
        }
      }
      $no += $nf;
    }
    return $c*$no;
  }
  else{ // render
    $f = fragments(choose($string), $spn, $spc); 
    for($i=0; IsSet($f[$i][0]); $i++) {
      $fragr = "";
      switch($f[$i][0][0]) {
      case '[': 
        $fragr = render(SubStr($f[$i][0], 1, -1), $spn, $spc);
        break;
      case '(': 
        if(mt_rand(0, 1) == 1) $fragr = render(SubStr($f[$i][0], 1, -1), $spn, $spc);
        break;
      default: 
        $fragr = $f[$i][0];
      }
      for($filti=0; IsSet($f[$i][1+$filti]); $filti++) { // filters of the fragment
        if($fragr == $f[$i][1+$filti]) $rendering_aborted = true;
      }
      if($rendering_aborted) return false;
      $r .= $fragr;
    }
    $uncover_brackets = chr(1).chr(2);
    return strtr($r, $uncover_brackets, "[(");
  }
}
  

/**
 * Parses a list of slash-delimited options.
 * $c==0 (default) -- return one randomly selected of the options
 * $c>0            -- return all the options in an array
 */
function choose($string, $c = 0) { 
  global $excd_weights;
  $p = 0;  // position in the string
  $i = 0;  // index of the current option to be loaded
  $ti = 0;  // index of the beginning of the current target space to be filled
  $strlen = strlen($string);
  while($p < $strlen) {
    $options[$i] = ""; // loading the option begins
    $weight_str = "";  // no weight specified yet

    for($level=0; !(($level==0 && $string[$p]=='/') || $p==$strlen); $p++) { 
      // process the option's characters
      if($string[$p]=='"') { // escaped characters
        $options[$i] .= $string[$p]; $p++; 
        for($p; $p<$strlen; $p++) {
          $options[$i] .= $string[$p];
          if($string[$p]=='"') break;
        }
      }
      elseif($string[$p]=='*' && $level==0) { // weight specification
        $p++;
        for($p; $string[$p]>='0' && $string[$p]<= '9' && $p<$strlen; $p++)
          $weight_str .= $string[$p];
        $p--;
      }
      else {
          $options[$i] .= $string[$p];
          if($string[$p]=='[' || $string[$p]=='(') $level++;
          if($string[$p]==']' || $string[$p]==')') $level--;
      }
    }
    $i++;  // next option

    // adjust weight
    if($weight_str=="") $weight_str = "1";
    $weight = (int) $weight_str;
    if($weight < 1) $weight = 1;
    if($weight > 128) {  // weight too high
      $excd_weights[$weight] = true;
      $weight = 128;
    }

    // insert references to the option in the target array according to its weight
    $stop = $ti + $weight;
    for($ti; $ti<$stop; $ti++) $target[$ti] = &$options[$i-1]; // insert references into the target for choosing

    $p++;
  }
  /*echo "<br>--targetsize:".$ti;
  echo "<br>--target:"; print_r($options);
  echo "<br>--options:"; print_r($target);*/
  if($c > 0) return $options;  // list all options
  else return $target[mt_rand(0, $ti-1)];  // randomly choose one from the target array
}


/**
 * Divides $string containing a pattern into fragments it has on its top level.
 * The fragments (substrings) are returned in an array.
 */
function fragments($string, &$spn, &$spc){ 
  $strlen = strlen($string);
  $i = 0; $filti = 0;
  for($p=0; $p < $strlen; $p++) {
    if($string[$p]>='A' && $string[$p]<='Z') { // a shortcut letter
      $scrlim = scrlim($spn); $f[$i][0] = "";
      for($n=0; $n<$scrlim; $n++) if($spn[$n]==$string[$p]) $f[$i][0] = '['.$spc[$n].']'; 
      $i++; $filti = 0;
    }
    elseif($string[$p]=='^') { // a filter for currently open fragment
      $p++; $length = 0; $esc = false; // note: escaping works inside filters
      while(
        $esc || ( $string[$p+$length]!='[' && $string[$p+$length]!='('
        && !($string[$p+$length]>='A' && $string[$p+$length]<='Z') 
        && $string[$p+$length]!='^' && ($p+$length)<$strlen)
        ) { 
          if($string[$p+$length]=='"') $esc = 1-$esc; 
          $length++; 
        }
      if($length > 0) {
        $filter = fragments(substr($string, $p, $length), $p, $length);
        //echo "<br>$p $length substring: ".substr($string, $p, $length)."<br>";
        //echo "<br>$p $length filter: ".$filter[0][0]."<br>";
        //echo "::$i<br>";
        $f[$i-1][1+$filti] = $filter[0][0]; $filti++;
        $p = $p + $length;
        if($string[$p]=='^') $p--;
      }
    }
    else {
      if($string[$p]=='[' || $string[$p]=='(') { // brackets
        $level = -1; do {
          if($string[$p]=='[' || $string[$p]=='(') $level++;
          if($string[$p]==']' || $string[$p]==')') $level--;
          $f[$i][0] .= $string[$p]; $p++;
        } while($level>=0 && $p<$strlen); 
        $p--; $i++; $filti = 0;
      }
      else { // read characters
        for($p; $string[$p]!='[' && $string[$p]!='(' 
          && !($string[$p]>='A' && $string[$p]<='Z') 
          && $string[$p]!='^' && $p<$strlen; $p++) { 
            if($string[$p]=='"') { // escaping
              $p++; 
              if($string[$p]=='"') $f[$i][0] .= '"'; // "" -> insert single " in the fragment
              for($p; $string[$p]!='"' && $p<$strlen; $p++) { // read escaped characters
                switch($string[$p]) {
                  case '[': $f[$i][0] .= chr(1); break;  /* dummy characters for fragment-initial brackets */
                  case '(': $f[$i][0] .= chr(2); break;  /* to get around their detection in render()      */
                  default: $f[$i][0] .= $string[$p];
                }
              }
            }
            else if($string[$p]!=' ') $f[$i][0] .= $string[$p]; // note: spaces don't interrupt the fragment
        }
        $p--; 
        if(IsSet($f[$i][0])) { 
          $i++;        /* [space] in [fragment1][space][fragment2] would leave its fragment unset. */
          $filti = 0;  /* This test lets [fragment2] go right after [fragment1].                   */
        }
      }
    }
  }
  //echo "fragmented string: $string --> "; print_r($f); echo "<br>";
  return $f;
}

/**
 * Returns the table of dependencies: each row tells for a shortcut which shortcuts 
 * it requires to be rendered.
 */
function dependencies(&$spn, &$spc) {

  // rows A-Z, cols A-Z
  for($r=0; $r<=25; $r++) {
    for($s=0; $s<=25; $s++) $deptab[$r][$s] = 0;
  }

  $scrlim = scrlim($spn);
  for($i=0; $i<$scrlim; $i++) {
    if($spn[$i]>='A' && $spn[$i]<='Z') { 
      // examine shortcut
      $esc = 0;
      $strlen = strlen($spc[$i]);
      for($p=0; $p<$strlen; $p++) {  
        if($spc[$i][$p]>='A' && $spc[$i][$p]<='Z' && !$esc) {  // an A-Z letter
          for($n=0; $n<$scrlim; $n++) { 
            if($spn[$n]==$spc[$i][$p])  // it refers to a shortcut
              $deptab[ord($spn[$i])-ord('A')][ord($spn[$n])-ord('A')] = 1;
          }
        }
        elseif($spc[$i][$p]=='"') $esc = 1-$esc;  // toggle escaping
      }
    }
  }
  
  return $deptab;
}

/**
 * Returns the letters of shortcuts that are directly or indirectly required 
 * by themselves, i.e. they participate in a cycle in the dependency graph.
 */
function self_dependent($deptab) {
  // apply transitivity until all dependencies are displayed in $deptab
  do {
    $updated = false;

    for($r=0; $r<=25; $r++) {
      for($s=0; $s<=25; $s++) {
        if($deptab[$r][$s]) {
          $dr = $s;
          for($ds=0; $ds<=25; $ds++) 
            if($deptab[$dr][$ds] && !$deptab[$r][$ds]) {
              $deptab[$r][$ds] = 1;
              $updated = true;
            }
        }
      }
    }
  } while($updated);

  /*echo "--------------------------<br />";
  for($r=0; $r<=25; $r++) {
    for($s=0; $s<=25; $s++) echo '('.$deptab[$r][$s].')';
    echo '<br />';
  }*/

  // harvest the main diagonal of $deptab
  for($d=0; $d<=25; $d++) {
    if($deptab[$d][$d]) $sd_names .= chr(ord('A') + $d);
  }

  return $sd_names;
}


/**
 * Checks shortcut and main pattern for possible problems: 
 * - multiple shortcuts using the same letter
 * - capital A-Z letter used without being defined as a shortcut
 * - brackets not matching
 */
function check_input(&$spn, &$spc, &$pattern) {
  $r['multiple'] = "";
  $scrlim = scrlim($spn);
  for($i=0; $i<=25; $i++) $defined[$i] = false;
  for($i=0; $i<$scrlim; $i++) { 
    if($defined[ord($spn[$i])-ord('A')]) $r['multiple'] .= $spn[$i];
    $defined[ord($spn[$i])-ord('A')] = true;
  }

  $r['undefined'] = "";
  // look for capital A-Z letters in shortcuts
  for($i=0; $i<$scrlim; $i++) {
    if($spn[$i]>='A' && $spn[$i]<='Z') { 
      // examine shortcut
      $esc = 0;
      $strlen = strlen($spc[$i]);
      for($p=0; $p<$strlen; $p++) {  
        if($spc[$i][$p]>='A' && $spc[$i][$p]<='Z' && !$esc) {  // an A-Z letter
          $defined = false;
          for($n=0; $n<$scrlim; $n++) { 
            if($spn[$n]==$spc[$i][$p])  // it refers to a shortcut
              $defined = true;
          }
          if(!$defined) $r['undefined'] .= $spc[$i][$p];
        }
        elseif($spc[$i][$p]=='"') $esc = 1-$esc;  // toggle escaping
      }
    }
  }
  // look for capital A-Z letters in the main pattern
  $esc = 0;
  $strlen = strlen($pattern); 
  for($p=0; $p<$strlen; $p++) {  
    if($pattern[$p]>='A' && $pattern[$p]<='Z' && !$esc) {  // an A-Z letter
      $defined = false;
      for($n=0; $n<$scrlim; $n++) { 
        if($spn[$n]==$pattern[$p])  // it refers to a shortcut
          $defined = true;
      }
      if(!$defined) $r['undefined'] .= $pattern[$p];
    }
    elseif($pattern[$p]=='"') $esc = 1-$esc;  // toggle escaping
  }

  $fi = 0;  // Points to the free space for the next finding.
            // Indexes the $r['unm_brackets'] and $r['unm_positions'] arrays 
            //  - each finding is from one shortcut or the pattern
            //  - $r['unm_i'] contains for each finding the index of the shortcut it is from
            //  - for the pattern, $r['unm_i']==128
  $pattern_examined = false;
  for($i=-1; $i<$scrlim || !$pattern_examined; $i++) { 
    $examine = false;
    if($i == $scrlim) {  // time to examine the main pattern
      $buffer = $pattern;
      $bi = -1;
      $examine = true;
      $pattern_examined = true;
    }
    elseif($spn[$i]>='A' && $spn[$i]<='Z') {
      $buffer = $spc[$i];
      $bi = $i;
      $examine = true;
    }
    if($examine) {
      // examine buffer
      $strlen = strlen($buffer);
      $esc = 0;
      $si = 0; // pointing to the free place available on the stack
      for($p=0; $p<$strlen; $p++) {
        if(($buffer[$p]=='(' || $buffer[$p]=='[' 
         || $buffer[$p]==')' || $buffer[$p]==']') 
         && !$esc) {  // a bracket
          $stack[$si] = $buffer[$p];  // push the bracket
          $pos_stack[$si] = $p;  // push the bracket's position in the buffer
          if($si > 0) { 
            if(($stack[$si-1] == '(' && $stack[$si]==')')
            || ($stack[$si-1] == '[' && $stack[$si]==']')) $si = $si-2;  // closing the open bracket
          }
          $si++;
        }
        elseif($buffer[$p]=='"') $esc = 1-$esc;  // toggle escaping
      } 
      if($si) {  // unmatched brackets found
        for($n=0; $n<$si; $n++) $r['unm_brackets'][$fi][$n] = $stack[$n];  // copy stack of brackets
        for($n=0; $n<$si; $n++) $r['unm_positions'][$fi][$n] = $pos_stack[$n];  // copy stack of positions
        $r['unm_i'][$fi] = $bi;  // shortcut index for this finding
        $fi++;
      }
    }
  }

  return $r;
}

/**
 * Loads generator's settings from the file into $vars passed.
 */
function load_file($filename, &$vars) {
  $fh = FOpen($filename, "r");
  if(!$fh) 
    return false;
  else {
    $convert_old_cp = true;  // convert cp1250 (used prior to v1.2) to utf-8 (used from v1.2 on)
    $i = 0;
    while($r = fgets($fh, 255)) {
      if($r[0]=='#') { 
        if(preg_match("/^\#awkwords\s/", $r)) {  // generator information
          $convert_old_cp = false;  // info included -> version>=1.2
          preg_match_all("/[^\s]+/", $r, $matches);  // split to words
          for($wi=1; isset($matches[0][$wi]); $wi++) {  // get version
            if($matches[0][$wi-1] == "version") $vars['version'] = $matches[0][$wi];
          }
        }
        continue;  // comment in the file (ignored line)
      }

      if(substr($r, 0, 3)=="nle") $vars['nle'] = true;  // new line each
      if(substr($r, 0, 9)=="filterdup") $vars['filterdup'] = true;  // filter duplicates
      if(preg_match("/^n:.*/", $r)) $vars['numw'] = (int) substr($r, 2, -1);  // number of words to generate
      if(preg_match("/^r:.*/", $r)) $vars['pattern'] = substr($r, 2, -1);  // main pattern

      if(preg_match("/^[A-Z]?:.*/", $r)) {  // subpattern without any attributes on
        $pos = strpos($r, ":"); 
        if($pos==0) $vars['spn'][$i] = ""; else $vars['spn'][$i] = $r[0]; 
        $vars['spc'][$i] = substr($r, $pos+1, -1); $i++;
      }
    }
    fclose($fh);

    if($convert_old_cp) {  
      // not created by awkwords 1.2 or newer -> convert from cp1250 to utf-8
      // Also translate HTML entities - these were created for non-cp1250 characters.
      // Though formatting the output was problematic - flawed in original version one way,
      // in v1.1 the other way; utf-8 fixes this - no entities are needed.
      if(isset($vars['pattern'])) 
        $vars['pattern'] = html_entity_decode(iconv("cp1250", "utf-8", $vars['pattern']), 
          ENT_NOQUOTES, "utf-8");
      for($i=0; isset($vars['spc'][$i]); $i++)
        $vars['spc'][$i] = html_entity_decode(iconv("cp1250", "utf-8", $vars['spc'][$i]),
          ENT_NOQUOTES, "utf-8");
      $r['converted_old_cp'] = true;
    }

    // check for required data
    if(isset($vars['spn'])
    && isset($vars['spc'])
    && isset($vars['pattern'])
    && isset($vars['numw'])
    )
      return true;
    else
      return false;
  }
}

?>
