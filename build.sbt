
logLevel in run := Level.Warn

scalaVersion := "2.11.7"

scalacOptions += "-feature"
scalacOptions += "-deprecation"
scalacOptions += "-language:experimental.macros"

jetty(port = 12000)
