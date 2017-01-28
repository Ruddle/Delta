package stgy

import core.user_import.{Observable, Observer}
import core.{HostPool, Provider}

import scala.util.Random


class IdGiver(val id: String,val x: Double, val y :Double) extends Observable {}
class StgyProvider(hostPool: HostPool[StgyHost]) extends Provider[StgyClientView](hostPool) {


  var rand = new Random()



  override def OnConnect(id: String, obs: Observer) = {

    var a = Random.nextDouble()*math.Pi*2
    def sin(angle: Double, phase : Double) : Int = (123.0+122.0*math.sin(angle + phase)).toInt
    var color= Array( sin(a,0), sin(a, math.Pi/3) , sin(a , 2*math.Pi/3))

    val randx = 200+rand.nextInt(2600)
    val randy = 200+rand.nextInt(2600)
    val numberOfStartUnit = 4
    val sqrt = math.sqrt(numberOfStartUnit).toInt
    val swordman = 0 until numberOfStartUnit map { i =>  new Swordman(randx + 40*(i%sqrt) , randy + 40*(i/sqrt), Random.alphanumeric.take(10).mkString, id, color)    }
    val bowmen = 0 until numberOfStartUnit map { i => new Bowman(randx + 40*(i%sqrt) , randy + 40*(i/sqrt), Random.alphanumeric.take(10).mkString, id, color) }
    val flag = new Flag( randx, randy, Random.alphanumeric.take(10).mkString, id, color)
    val com = new Commander(randx, randy, Random.alphanumeric.take(10).mkString, id, color)
    val spawned : List[Unity] = com::bowmen.toList :::swordman.toList //flag::

    spawned foreach {
      b =>
        hostPool.getHyperHost(b.x, b.y).call( i => i.addUnity(b)  )
        b.sub(obs)
    }


    //tell the client view what is the client id, this is a hack

    var idGiver = new IdGiver(id,randx,randy)
    idGiver.sub(obs)
    idGiver.notifyClientViews

  }

  override def OnDisconnect(id: String, obs: Observer) = {
    obs.onDisconnect()
  }
}
