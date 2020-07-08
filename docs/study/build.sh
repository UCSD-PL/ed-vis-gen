#!/bin/sh

# usage: ./build.sh <prefix_of_faq_file>
# e.g. ./build.sh faq

pandoc -o $1.html -c faq.css $1.md 