#!/bin/sh

files=(gravity_inst.txt	hooke_2_inst.txt	pendulum_inst.txt	planets_3body_inst.txt
hooke_1_inst.txt	hooke_par_inst.txt	planets_2body_inst.txt	planets_4body_inst.txt)


for i in ${files[@]}; do
  echo ${i}
  res="0"
  res=${res}"+$(echo ${i} | xargs awk '/WITH FREE\(/,/\);/' | wc -l | echo "$(cat -)-2" | bc)"

  res=${res}"+$(echo ${i} | xargs awk '/PHYSICS\(/,/\);/' | wc -l | echo "$(cat -)-2" | bc)"
  res=${res}"+$(echo ${i} | xargs awk '/ON RELEASE\(/,/\);/' | wc -l | echo "$(cat -)-2" | bc)"
  res=${res}"+$(echo ${i} | xargs awk '/CHARTS\(/,/\);/' | wc -l | echo "$(cat -)-2" | bc)"

  # echo ${res}
  echo ${res} | bc

  # ls *_inst.txt | xargs awk '/PHYSICS\(/,/\);/' | wc -l | echo "$(cat -)-8" | bc
  # ls *_inst.txt | xargs awk '/ON RELEASE\(/,/\);/' | wc -l | echo "$(cat -)-8" | bc
  # ls *_inst.txt | xargs awk '/CHARTS\(/,/\);/' | wc -l | echo "$(cat -)-8" | bc
done
