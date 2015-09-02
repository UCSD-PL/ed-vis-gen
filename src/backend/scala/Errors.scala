package EDDIE.errors

object Incomplete extends RuntimeException {
  override def getMessage = "incomplete implementation"
}

object Usage extends RuntimeException {
  override def getMessage = "bad arguments"
}

object IllformedProgram extends RuntimeException {
  override def getMessage = "error in source program"
}
