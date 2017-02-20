package demo

import core.Delta
import core.host.HostPool
import core.observerPattern.Observable

class Ball(val client : String, position : Vec) extends Vec(position) with Observable {
  var speed = Vec()
  var radius = 5.0
  def collision(other : Ball): Boolean = (other - this).length() < radius + other.radius
  def eat(other: Ball )=    radius+= math.sqrt(other.radius)
  def addSpeed = {
    x+= speed.x
    y+= speed.y
    notifyClientViews
  }
}


object Demo extends App{
  val HP = HostPool[DemoHost, DemoHostObserver]
  val delta = new Delta[DemoHost, DemoProvider, DemoHostObserver]()
  delta.numberOfClient=100

  val hosts = for(x <- 0 to 5; y <- 0 to 5) yield {
    val zone= new SquareZone(x*600,y*600,600,600)
    new DemoHost(zone)
  }

  val hostObserver = new DemoHostObserver
  delta.launch(hosts, hostObserver)
  HP.hosts.values.foreach( hr =>  delta.setHostInterval(hr,16, h=> h.tick) )
}