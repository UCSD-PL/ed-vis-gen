import sbt._
import Keys._
import org.scalatra.sbt._
import org.scalatra.sbt.PluginKeys._
import com.mojolly.scalate.ScalatePlugin._
import ScalateKeys._
import fi.gekkio.sbtplugins.jrebel

object EddieBuild extends Build {
  val Organization = "com.github.jsarracino"
  val Name = "EDDIE"
  val Version = "0.1.0-SNAPSHOT"
  scalaVersion := "2.11.7"

  val ScalatraVersion = "2.4.0.RC1"
  scalacOptions += "-feature"
  scalacOptions += "-deprecation"
  scalacOptions += "-language:experimental.macros"



  lazy val project = Project (
    "scalatra-EDDIE",
    file("."),

    settings = Defaults.defaultSettings ++ ScalatraPlugin.scalatraWithJRebel ++ scalateSettings ++ Seq(
      organization := Organization,
      name := Name,
      version := Version,
      resolvers += "Sonatype OSS Snapshots" at "http://oss.sonatype.org/content/repositories/snapshots/",
      resolvers += Classpaths.typesafeReleases,
      resolvers += "Scalaz Bintray Repo" at "https://dl.bintray.com/pchiusano/maven/",
      resolvers += "Akka Repo" at "http://repo.akka.io/repository",
      libraryDependencies ++= Seq(
        "org.scalatra" %% "scalatra" % ScalatraVersion,
        "org.scalatra" %% "scalatra-scalate" % ScalatraVersion,
        "org.scalatra" %% "scalatra-specs2" % ScalatraVersion % "test",
        "ch.qos.logback" % "logback-classic" % "1.1.2" % "runtime",
        "org.eclipse.jetty" % "jetty-webapp" % "9.2.10.v20150310" % "container",
        "javax.servlet" % "javax.servlet-api" % "3.1.0" % "provided",
        "org.scalatra" %% "scalatra-json" % "2.3.0",
        "org.json4s"   %% "json4s-jackson" % "3.2.9",
        "com.googlecode.kiama" %% "kiama" % "1.8.0",
        "org.scalatest" % "scalatest_2.11" % "2.2.4" % "test",
        "org.scalacheck" %% "scalacheck" % "1.12.5" % "test"
      ),
      scalateTemplateConfig in Compile <<= (sourceDirectory in Compile){ base =>
        Seq(
          TemplateConfig(
            base / "webapp" / "WEB-INF" / "templates",
            Seq.empty,  /* default imports should be added here */
            Seq(
            ),  /* add extra bindings here */
            Some("templates")
          )
        )
      }

      //fork in (Compile,run) := true,
      // javaOptions in (Compile,run) ++= (System.getenv("JREBEL_HOME") match {
      //   case null => Seq("-Xmx2G")
      //   case v    => println("added jrebel"); Seq("-Xmx2G", "-javaagent:" + v + "/jrebel.jar")
      // })
    )  //++ Seq(jrebel.JRebelPlugin.jrebelSettings: _*)



  )
}
