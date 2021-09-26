#!/bin/sh

cd /var/www/html/site-mailswami/ ; 
git add -A ; git commit -m cc; git push --force ; 
cd _site/ ; 
git add -A ; git commit -m cc; git push --force ; 
cd /var/www/html/site-mailswami/
