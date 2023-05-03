#!/bin/sh

cp -avr /opt/platform-server/public/* /var/www/html/site-mailswami/public/
cd /var/www/html/site-mailswami/ ; git add -A ;  git commit -m cc;  git push --force ; cp -avr /var/www/html/site-mailswami/_site/* /var/www/html/mailswami/ ; cd /var/www/html/mailswami/ ;  git add -A ;  git commit -m cc;  git push --force ;  

