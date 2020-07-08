EDDIE: User-Guided Synthesis of Interactive Diagrams
=============

This is the implementation of our CHI '17 paper, [User-Guided Synthesis of Interactive Diagrams][eddie-paper]. Our tool is a GUI for assembling interactive
physics diagrams. 

# Dependencies
EDDIE is a JavaScript/TypeScript project and uses `npm`, `tsc`, `browserify` and `rsync`. 
To get other dependencies, run `npm run-script initialize`.

# Building and Running
To build the tool, run `npm run-script build`. The output is in `target/webapp/html/index.html` and you can open this in a web browser.

[eddie-paper]: http://goto.ucsd.edu/~john/EDDIE/papers/eddie-chi17.pdf
