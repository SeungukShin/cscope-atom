# Cscope Packge for Atom

Integrates [cscope](http://cscope.sourceforge.net) into Atom.

![A screenshot of cscope-atom package](https://github.com/SeungukShin/cscope-atom/raw/master/screenshot.png)

## Commands

| Name                       | Description                                         | Shortcut   |
|----------------------------|-----------------------------------------------------|------------|
| `cscope-atom:build`        | builds a database of cscope.                        | `ctrl+. b` |
| `cscope-atom:symbol`       | finds this C symbol.                                | `ctrl+. s` |
| `cscope-atom:definition`   | finds this global definition.                       | `ctrl+. g` |
| `cscope-atom:callee`       | finds functions called by this function.            | `ctrl+. a` |
| `cscope-atom:caller`       | finds functions calling this function.              | `ctrl+. c` |
| `cscope-atom:text`         | finds this text string.                             | `ctrl+. t` |
| `cscope-atom:egrep`        | finds this egrep pattern.                           | `ctrl+. e` |
| `cscope-atom:file`         | finds this file.                                    | `ctrl+. f` |
| `cscope-atom:include`      | finds files including this file.                    | `ctrl+. i` |
| `cscope-atom:set`          | finds places where this symbol is assigned a value. | `ctrl+. n` |
| `cscope-atom:show-results` | shows a previous result.                            | `ctrl+. .` |
| `cscope-atom:pop`          | moves a cursor to a previous position.              | `ctrl+. o` |

## Configurations

| Name       | Description                                                              | Default    |
|------------|--------------------------------------------------------------------------|------------|
| cscope     | Cscope command                                                           | cscope     |
| buildArgs  | Arguments to build a cscope database.                                    | -RbU       |
| queryArgs  | Arguments to query a symbol.                                             | -RdL       |
| database   | A database filename for cscope.                                          | cscope.out |
| auto       | Generate a cscope database when open an workspace or store a file on it. | true       |
| extensions | Extensions to monitor their changes to update database.                  | c,h        |
| preview    | Preview the result of the query.                                         | true       |
