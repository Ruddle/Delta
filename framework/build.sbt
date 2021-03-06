name := "framework"

version := "1.0"

libraryDependencies ++= Seq(
  "com.typesafe.akka" % "akka-actor_2.12" % "2.4.17",
  "com.typesafe.akka" % "akka-http_2.12" % "10.0.4",
  "com.typesafe.play" %% "play-json" % "2.6.0-M3",
  "org.slf4j" % "slf4j-api" % "1.7.22",
  "org.slf4j" % "slf4j-simple" % "1.7.22",
  "io.spray" % "spray-http_2.11" % "1.3.4",
 "org.aspectj" % "aspectjweaver" % "1.8.10",
  "org.scala-js" %% "scalajs-dom_sjs0.6" % "0.9.1",
  "me.chrons" % "boopickle_2.11" % "1.2.5"

)
enablePlugins(ScalaJSPlugin)
