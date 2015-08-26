sourceDirectory in Compile <<= baseDirectory(_ / "src//backend//")
sourceDirectory in Test <<= baseDirectory(_ / "src//backend//")

scalacOptions += "-feature"
