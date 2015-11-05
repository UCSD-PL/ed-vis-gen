// sourceDirectory in Compile <<= baseDirectory(_ / "src//backend//")
// sourceDirectory in Test <<= baseDirectory(_ / "src//backend//")

// suppress sbt output when running
logLevel in run := Level.Warn

scalacOptions += "-feature"
scalacOptions += "-deprecation"
scalacOptions += "-language:experimental.macros"

// javaOptions += "-XX:+UnlockCommercialFeatures"
// javaOptions += "-XX:+FlightRecorder"

// javaOptions in (Compile,run) ++= (System.getenv("JREBEL_HOME") match {
//   case null => Seq("-Xmx2G")
//   case v    => println("added jrebel"); Seq("-Xmx2G", "-javaagent:" + v + "/jrebel.jar")
// })
