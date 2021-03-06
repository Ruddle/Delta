package stgy


import core.host.{Host, HostPool, HostRef}
import core.spatial.{Viewable, Zone}
import play.api.libs.json.Json
import stgy.StgyTypes.{ClientId, UnitId}

import scala.util.Random

class StgyHost(zone: SquareZone) extends Host(zone) {

  val HP = HostPool[StgyHost, StgyHostObserver]
  var elements = collection.mutable.Map[String, Element]()
  var rand = new Random()
  var targetFromOtherHost = collection.mutable.Map[SquareZone, collection.mutable.Map[String, Unity]]()
  var neighbours = List[HostRef[StgyHost]]()

  def flush() = {
    elements = collection.mutable.Map[UnitId, Element]()
  }

  def tick(): Unit = {
    val unitys = elements.filter(e => e._2.isInstanceOf[Unity]).values.asInstanceOf[Iterable[Unity]]
    val damagable = unitys collect { case d: Damagable => d }
    val bowmen = damagable collect { case e: Bowman => e }
    val coms = damagable collect { case e: Commander => e }
    val swordmen = damagable collect { case e: Swordman => e }
    var otherDamagable = List[Damagable]()
    targetFromOtherHost.values.map(x => x.values).foreach(x => otherDamagable ++= x.asInstanceOf[Iterable[Damagable]])
    val otherBowmen = otherDamagable collect { case e: Bowman => e }
    val extendedDamagable = damagable ++ otherDamagable
    val arrows = unitys collect { case e: Arrow => e }
    neighbours.foreach(h => h.call(_.receiveTarget(zone, damagable)))
    damagable.foreach(d => {
      HP.hostObserver.call(ho => ho.updatePosition(d.id,Vec(d.x,d.y)))
    })

    arrows foreach {
      a => {
        if (a.shouldDie) {
          kill(a)
        }
        else
          a.doMove
        val enemy = damagable filter { b => b.clientId != a.clientId }
        enemy.foreach(e => {
          //There is a shot unit
          if ((Vec(e.x, e.y) - Vec(a.x, a.y)).length < e.radius) {

            if (!e.isDead) {
              e.damage(0.201)
              kill(a)
              if (e.isDead) {
                gainxpAggreg(a.clientId, e.xpCost)
              }

            }
          }
        })
      }
    }


    damagable.foreach(u => if (u.isDead) kill(u))


    swordmen foreach { A => {
      A.step
      var closest: (Double, Damagable) = (Double.MaxValue, null)
      //bowmen.foreach(B => {
      damagable.foreach(B => {
        if (B.clientId != A.clientId && !B.isDead) {
          val distance = (Vec(A.x, A.y) - Vec(B.x, B.y)).length()
          if (distance < closest._1)
            closest = (distance, B)
        }
      })

      if (closest._2 != null && A.canShoot && A.canAttack(closest._2)) {
        val damage = A.attack(closest._2)
        closest._2.health -= damage
        if (closest._2.isDead) gainxpAggreg(A.clientId, closest._2.xpCost)
      }

    }
    }

    bowmen foreach { A => {
      A.step
      var closest: (Double, Damagable) = (Double.MaxValue, null)
      //bowmen.foreach(B => {
      extendedDamagable.foreach(B => {
        if (B.clientId != A.clientId) {
          val distance = (Vec(A.x, A.y) - Vec(B.x, B.y)).length()
          if (distance < closest._1)
            closest = (distance, B)
        }
      })
      if (A.canShoot && closest._1 < 350) {
        val arrow = A.shoot(closest._2)
        addUnity(arrow)
      }
      //   A.notifyClientViews
    }
    }

    coms foreach { A => {
      A.step
      var closest: (Double, Damagable) = (Double.MaxValue, null)
      //bowmen.foreach(B => {
      extendedDamagable.foreach(B => {
        if (B.clientId != A.clientId) {
          val distance = (Vec(A.x, A.y) - Vec(B.x, B.y)).length()
          if (distance < closest._1)
            closest = (distance, B)
        }
      })
      if (A.canShoot && closest._1 < 350) {
        val target = Vec(closest._2.x, closest._2.y)
        val arrows = A.shoot(target)
        arrows.foreach(addUnity(_))
      }
    }
    }

    elements foreach { elem => {
      val e = elem._2
      if (!zone.contains(e)) {
        HP.getHost(e).call(_.addUnity(e.asInstanceOf[Unity]))
        elements -= elem._1
      }
    }
    }
  }

  def kill(u : Unity)= {
    elements -= u.id
    HP.hostObserver.call( _.deleteUnity(u.id,u.clientId))
  }

  def addUnity(e: Unity) = {
    elements += e.id -> e
    e match {
      case e: MetaUnit =>         HP.hostObserver.call( _.addUnity(e.id,e.clientId,Vec(e.x,e.y),e.metaType))
      case _=>
    }

  }

  def receiveTarget(who: SquareZone, e: Iterable[Unity]) = {
    if (!targetFromOtherHost.contains(who))
      targetFromOtherHost += who -> collection.mutable.Map[String, Unity]()

    targetFromOtherHost(who).clear()
    e.foreach(b => {
      targetFromOtherHost(who)(b.id) = b
    })
  }


  def gainxpAggreg(clientId: ClientId, xp: Double) = {
    HP.hostObserver.call(h => h.gainxp(clientId, xp))
  }


  override def clientInput(idClient: ClientId, data: String): Unit = {

    //  println("received : " + data)
    val json = Json.parse(data)
    val id = (json \ "id").get.as[String]
    val x = (json \ "x").get.as[Double]
    val y = (json \ "y").get.as[Double]


    if (elements.contains(id)) {
      val bm = elements(id).asInstanceOf[Movable]
      bm.move = true
      bm.target = Vec(x, y)
    }
  }

  override def getViewableFromZone(id : ClientId , zone: Zone): Iterable[Viewable] = {
    elements.values
  }
}
