sourceDirectory in Compile <<= baseDirectory(_ / "src//backend//")
sourceDirectory in Test <<= baseDirectory(_ / "src//backend//")

scalacOptions += "-feature"

libraryDependencies += "com.googlecode.kiama" %% "kiama" % "1.8.0"
