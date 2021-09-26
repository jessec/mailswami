#!/bin/sh

cp -avr /opt/platform-server/public/* /var/www/html/site-mailswami/public/

cd /var/www/html/site-mailswami/
git add -A
git commit -m cc
git push --force
cd _site/
git add -A
git commit -m cc
git push --force
cd /var/www/html/site-mailswami/
