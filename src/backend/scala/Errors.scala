package EDDIE.errors

object Incomplete extends RuntimeException {
  override def getMessage = "incomplete implementation"
}
