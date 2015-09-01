package EDDIE

// various helper functions
object Helpers {
  // given a bunch of objects, convert to strings and separate by single-spaces
  def prettyPrint(args:Any*) = args.map(_.toString()).mkString(" ")

  def DEBUG = true
  def dprintln(s:String) = if (DEBUG) println(s)
}
