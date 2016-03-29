package EDDIE.backend.errors

object Incomplete extends RuntimeException {
  override def getMessage = "incomplete implementation"
}

object Usage extends RuntimeException {
  override def getMessage = "bad arguments"
}

object ParseError extends RuntimeException {
  override def getMessage = "illformed source program"
}

object IllformedProgram extends RuntimeException {
  override def getMessage = "error in source program"
}

object Inconceivable extends RuntimeException {
  override def getMessage = "dead code"
}

object InconsistentServerState extends RuntimeException {
  override def getMessage = "server state is inconsistent"
}

object BadFileFormat extends RuntimeException {
  override def getMessage = "unsupported input file"
}
