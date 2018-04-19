<?php
/******************************************************************************
 Awkwords - random word generator 

 Version: 1.2 
 (note: every other mention of current version number in the source files 
       is tagged on its line with this: [awkwords-version] )

 Author: Petr Mejzlík <petrmej@gmail.com>

 License:
 Everyone is allowed to freely use and distribute this software. It can be 
 incorporated into other software without any limitations. Modifying 
 the software and distributing a modified version is allowed as long 
 as the modified version is clearly marked distinct from the original one. 
 This license is GNU LGPL compatible.
 ******************************************************************************/
error_reporting(E_ALL & ~E_NOTICE); // vypisování všech chyb

require_once "core.php";

switch($_POST["submit"]) {
  case "Save...": require "./save.php"; break;
  default: require "./shell.php";
}

?>
