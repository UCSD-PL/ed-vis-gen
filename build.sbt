// sourceDirectory in Compile <<= baseDirectory(_ / "src//backend//")
// sourceDirectory in Test <<= baseDirectory(_ / "src//backend//")

// suppress sbt output when running
logLevel in run := Level.Warn

scalacOptions += "-feature"
scalacOptions += "-deprecation"
scalacOptions += "-language:experimental.macros"

// javaOptions += "-XX:+UnlockCommercialFeatures"
// javaOptions += "-XX:+FlightRecorder"
