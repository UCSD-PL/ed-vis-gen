package EDDIE

object Helpers {
  def prettyPrint(args:Any*) = args.map(_.toString()).mkString(" ")
}
