package EDDIE.errors

object Incomplete extends RuntimeException {
  override def getMessage = "incomplete implementation"
}

object Usage extends RuntimeException {
  override def getMessage = "bad arguments"
}
