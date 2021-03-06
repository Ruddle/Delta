package demo

import core.observerPattern.Observer
import core.provider.Provider
import core.spatial.Zone
import play.api.libs.json.{JsArray, Json}

import scala.util.Random

class DemoProvider extends Provider[DemoClientView]{

  frequency = 60

  override def hostsStringToZone(s: String): Option[Zone] = {
    val json = Json.parse(s).asInstanceOf[JsArray].value
    val x = json(0).as[Int]
    val y = json(1).as[Int]
    Option(new SquareZone(x,y,0,0))
  }

  override def OnConnect(id: String, obs: Observer): Unit = {}

  override def OnDisconnect(id: String, obs: Observer): Unit = {}
}
