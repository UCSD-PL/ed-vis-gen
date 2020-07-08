#!/bin/sh

rsync -avh new/target/ goto:~/public_html/eddie/216/
scp docs/study/faq*.html goto:~/public_html/EDDIE/