
Frequently Asked Questions (FAQ)
========

Where is the IRB consent form?
-------
You can find the IRB consent form at this link [here](http://goto.ucsd.edu/~john/EDDIE/forms/consent.pdf).

What am I doing?
-------
If you haven't already, please read the [IRB consent form](http://goto.ucsd.edu/~john/EDDIE/forms/consent.pdf). You're using [EDDIE] to replicate (to the best of your abilities, within the tool's limitations) these two PhET diagrams,
the [Pendulum Lab] and the [Spring Lab]. For the pendulum lab,
please implement a version with two pendulums. For the spring lab, please implement a version with two springs.

Before you start,
please describe each diagram using the provided worksheets.
While you're building the diagram, ensure your version is correct by interacting with both the generated diagram and the original PhET diagram.
Once you're done, raise your hand and call over Sorin Lerner and John Sarracino so that they can record your result.

What's the deal with the two windows?
-------
EDDIE is a graphical editor with two panes, the editor and the simulator. The editor is on the left and is used to build the diagram on the right. The simulator is on the right and is the perspective of the student. Your objective is to make the diagram on the right match the original PhET diagram.

What objects can I place?
-------
EDDIE has several primitive plain and physics objects -- circles, rectangles, and lines are primitive and do not have physical meaning. We also include springs and pendulums, which do have physical meaning.

How do I make objects?
-------
The way to create objects is to click the corresponding button. Physical objects are accessed through the drop-down menu labeled `Physics`.

![Tutorial of how to create objects.](http://goto.ucsd.edu/~john/EDDIE/vids/create_object.ogv)

How do I edit objects?
-------
You can translate most objects by left-clicking and dragging in the editor pane.
You can resize all objects by left-clicking the object and dragging on the corner of the object.
You can rotate lines and springs by left-clicking the object and dragging the
rotation knob above the object.

![Tutorial of how to edit objects.](http://goto.ucsd.edu/~john/EDDIE/vids/edit_object.ogv)

What happens if I mess up?
-------
If you make a mistake, you can either delete an object, undo your action, or redo your action.

To delete an object, first select it, then click the delete button.

To undo and redo, simply click the undo or redo buttons. This feature is rather buggy and undo sometimes needs to be clicked multiple times.

![Tutorial of how to remove objects.](http://goto.ucsd.edu/~john/EDDIE/vids/remove_undo.ogv)

How do I make the student's diagram interactive?
-------
The way to add drag points is to display the possible drag points for the diagram using the `Show Drag Points` button. Then, you can toggle drag points in the editor pane by left-clicking on them. Green drag points are present, while black drag points are not.

![Tutorial of how to add drag points to objects.](http://goto.ucsd.edu/~john/EDDIE/vids/drags.ogv)

How do I change a drag point's meaning?
-------
EDDIE makes an educated guess about what the drag point should mean in the simulation -- if this meaning is incorrect, you can change the meaning by right-clicking on the drag point in the editor pane.

After right-clicking, several preview meanings are demonstrated in an overlay -- you can change between previews using the `left` and `right` buttons, accept the current preview using the `accept` button, and cancel editing by closing the overlay.

![Tutorial of how to change drag points.](http://goto.ucsd.edu/~john/EDDIE/vids/drag_change.ogv)

How do I make objects connected in the diagram?
-------
EDDIE detects related objects using __alignment points__, which have the same location as drag points.  When two alignment points overlap, EDDIE groups together the parent objects. You can display the alignment points in the editor pane using the `Show Alignment Points` button.

For convenience, alignment points can be clicked to move objects such that the alignment points are at the same position. The yellow alignment point is the currently selected alignment point, and its parent object will translate as soon as another alignment point is clicked.

![Tutorial of how to use alignment points.](http://goto.ucsd.edu/~john/EDDIE/vids/alignments.ogv)

How do I make the spring move objects/How do springs work?
-------
EDDIE's springs work using alignment points as well, and one end of the spring is fixed and one end obeys physical laws. We can see if the spring is moving an object (and see the motion of the spring) by using the `start`, `stop`, and `reset` buttons.

The moving end of a spring is an alignment point and objects aligned to it will follow the spring's motion.

![Tutorial of how to make objects attach to springs.](http://goto.ucsd.edu/~john/EDDIE/vids/springs.ogv)

How do I make multiple objects attach to a spring?
-------
If an aligned group of objects is attached to the end of a spring, all objects obey the spring's motion.

![Tutorial of how to make multiple objects attach to springs.](http://goto.ucsd.edu/~john/EDDIE/vids/many_springs.ogv)

What if EDDIE doesn't have X?
-------
That's OK! Please make sure X is written down in your description worksheet and implement
a version faithful to the original diagram.

Is there a way to make a point be fixed i.e. not move?
-------
No, but that's a great idea!

Everything is broken! How do I fix it?
-------
If EDDIE gets hard to use due to bugs, you can refresh the page. Please *don't*
click 'Start Session' again!



[EDDIE]: goto.ucsd.edu:8081/target/html/
[Pendulum Lab]: https://phet.colorado.edu/sims/pendulum-lab/pendulum-lab_en.html
[Spring Lab]: https://phet.colorado.edu/sims/html/hookes-law/latest/hookes-law_en.html
