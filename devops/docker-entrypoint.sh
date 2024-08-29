#!/bin/sh

files="$(find '/tmp/app/' -name 'config.*.js' -type f -print)"

for file in $files
  do
    tmp=$(mktemp)
    envsubst < $file > $tmp
    mv -f $tmp $file
    echo ${file} is substituted
  done

exec nginx -g "daemon off;"
