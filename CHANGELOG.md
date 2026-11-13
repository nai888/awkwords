# Changelog

All notable changes to this project will be documented in this file.

The format of this changelog is based on [Keep a Changelog](https://keepachangelog.com) and this project, starting with version 1.3.0, adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased](https://github.com/nai888/awkwords/compare/v1.3.0...HEAD)

## [v1.3.0](https://github.com/nai888/awkwords/compare/v1.2...v1.3.0)

### Added v1.3.0

- Warnings and errors are shown live as you type.
- The current settings/state are saved in localStorage.
- Current settings can be shared via a link.
- Syntax highlighting in pattern and subpattern fields.
- Generated output can be immediately copied to the clipboard or downloaded to a `.txt` file.
- Added theming (system/light/dark).
- Word generation delegates to a Web Worker for large runs.
- A keyboard shortcut (Ctrl/Cmd + Enter) triggers word generation.
- The app can be installed as an offline progressive web app (PWA).

### Changed v1.3.0

- The entire project was rebuilt from scratch using Vue 3 and Vite instead of PHP. The specific changes are too numerous to list. A few improvements are listed below.
- Weights higher than 128 are clamped with a note.
- Escaping can now produce literal quotes via `""`.
- Word cap raised from 9,999 to 1,000,000.
- Massively large numbers for the maximum number of words stat will be accurate by using the `bigInt` type.
- Changing the setting for "New line each" updates the results immediately, rather than waiting until the next word generation.
- Updated icon and branding.

## [v1.2](https://github.com/nai888/awkwords/compare/v1.1...v1.2) - 2010-04-05

### Added v1.2

- added input validation: checking for dependency cycles, brackets not matching, multiple subpatterns assigned to one letter, capital A-Z without a subpattern assigned, proper handling of file loading errors

### Changed v1.2

- some code refactoring
- default file extension changed to `.awkw` to not confuse Awkwords files with AWK scripts
- the shell and thus the files changed encoding from cp1250 to utf-8; old files are automatically converted; this fixes problems with some characters that earlier versions had
- what was called "shortcuts" is now called "subpatterns" (for clarity; essentially they are the same as the pattern, only named with letters and included in the pattern)

### Fixed v1.2

- various adjustments and fixes in the interface (aka the "shell"); changed from XHTML to HTML 4.01 Transitional
- fixed 2 bugs in choose() - last fragment empty; skipping option weights in nested fragments

## v1.1

### Added v1.1

- empty fragments made possible: `[a/]` will generate either _a_ or nothing  
  (correction: this didn't actually work in 1.1. Empty options were recognized, but there was a bug so that an empty option being last was ignored: `[/a]` would work correctly but `[a/]` would _always_ generate _a_. This was fixed in v1.2. Also, they are empty _options_, not fragments)
- quotes escape any special characters in between: `"esCap*ed/t]eXt"`
- added weighting
- added pattern filtering

### Changed v1.1

- spaces are ignored (if not between quotes)

### Fixed v1.1

- interface fixes: HTML entities don't cause problems; 'Select all' works in IE; length limit removed from shortcuts; remembering name of loaded filex

## v1.0

The first official release after the long-used previous unnumbered version.

### Added v1.0

- added filter duplicates option
- extended the help page

### Changed v1.0

- improved the interface

### Fixed v1.0

- fixed escaping in the fields so that there should be no problem with quotes anywhere
- minor fix: with 'new line each', each line contains just the word, not followed by a space
