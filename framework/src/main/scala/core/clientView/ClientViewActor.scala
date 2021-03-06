package core.clientView
import java.io.ByteArrayOutputStream
import java.util.Base64
import java.util.zip.GZIPOutputStream

import akka.actor.{Actor, ActorRef}
import core.CoreMessage._
import core.host.{Host, HostObserver, HostPool}
import core.observerPattern.Notify
import core.spatial.Zone



import scala.collection.mutable


class ClientViewActor[ClientViewImpl <: ClientView](client: ActorRef,clientView : ClientViewImpl) extends Actor {

  var nextbuffer: Int = 0
  var buffers: mutable.HashMap[Int, (Int, List[Any])] = collection.mutable.HashMap[Int, (Int, List[Any])]()

  override def receive: Receive = {
    case x: Notify => {
      clientView.onNotify(x.any)
    }
    // udapte the area tha must be seen by the client
    case UpdateClient => {
      zoneToMessage(clientView.dataToViewZone())
      nextbuffer = nextbuffer + 1
      buffers -= nextbuffer - 4
    }
    // call the function inside the clientViewActor
    case x:Call[ClientViewImpl]  => {
      x.func(clientView)
    }
    // update the list that contains data if the data received is recent enough, and then transform it into a message and finally
    // compress it before sending it to the client
    case x: AnyParts => {
      // println("Any part : destination : "+x.buffer + " content : " + worker.fromListToClientMsg(x.anys))
      var num = x.buffer
      if (nextbuffer - num <= 2) {
        buffers(num) = (buffers(num)._1 - 1, buffers(num)._2 ::: x.anys)

        if (buffers(num)._1 == 0) {
          //println("Total parts : " + worker.fromListToClientMsg(buffers(num)._2))
          //      println("Buffer size:"+ buffers.values.size)
          val toDeflate = clientView.fromListToClientMsg(buffers(num)._2)
          toDeflate match {
            case Right(bytebuffer)=> {
              client ! PlayersUpdateRaw(bytebuffer)

            }
            case Left(string) => {
              val arrOutputStream = new ByteArrayOutputStream()
              val zipOutputStream = new GZIPOutputStream(arrOutputStream)
              zipOutputStream.write(string.getBytes)
              zipOutputStream.close()
              client ! PlayersUpdate(Base64.getEncoder.encodeToString(arrOutputStream.toByteArray))
            }

          }

        }
      }
      else {
        // println("WARNING : Message too old from host to ClientView, delay : " + (nextbuffer - num)  )
      }
    }
  }

  // USER JOB


  def zoneToMessage(zone: Zone): Unit = {
    var hostInsideZones = HostPool[Host, HostObserver[_]].hosts.filter { case (z, hr) => z.intersect(zone) }.values
    buffers += nextbuffer -> (hostInsideZones.size, List[Any]())
    val nextbufferCopy = nextbuffer
    hostInsideZones.foreach({
      _.call(
        inside => {
          val res = inside.getViewableFromZone(clientView.id, zone).toList
          self ! AnyParts(nextbufferCopy, res)
        })
    })
  }
}
