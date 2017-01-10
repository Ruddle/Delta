var Draw = require('./draw')
var Mous = require('./mouse')
var Intr = require('./intersection')

var moveOrder = []
var getTranslatedMouse = (mouse) => {
    var cam = Draw.getCamera()
    var trans = {}
    trans.p1 = { x: mouse.p1.x * 1 + cam.x * 1, y: mouse.p1.y * 1 + cam.y * 1 }
    trans.p2 = { x: mouse.p2.x * 1 + cam.x * 1, y: mouse.p2.y * 1 + cam.y * 1 }
    return trans
}

Mous.onDragEnd((mouse) => {
    Draw.setSelectionSquare(null)
    selectedselectable = toBeSelected
})

Mous.onDrag((mouse) => {
    //  console.log("BEFORE : " + JSON.stringify(mouse, null, 1))
    toBeSelected = []
    mouse = getTranslatedMouse(mouse)
    //  console.log("AFTER : " + JSON.stringify(mouse, null, 1))
    Draw.setSelectionSquare(mouse)
    selectableVal.forEach(bowman => {
        if (bowman.mine && Intr.pointInsideSquare(bowman, mouse))
            toBeSelected.push(bowman.id)
    })
})

var moveSquareCompute = (mouse) => {
    var num = getSelected().length
    var x1 = mouse.p1.x
    var y1 = mouse.p1.y
    var x2 = mouse.p2.x
    var y2 = mouse.p2.y
    var vx = x2 - x1
    var vy = y2 - y1
    if (Math.abs(vx) > 30 || Math.abs(vy) > 30) {
        var vl = Math.sqrt(vx * vx + vy * vy)
        var numInWidth = (vl / 45)
        var numInLength = num / numInWidth
        vx /= vl; vy /= vl;
        var px = -vy
        var py = vx
        px *= 45
        py *= 45
        return { x1: x1, y1: y1, x2: x2, y2: y2, vx: vx * 45, vy: vy * 45, px: px, py: py, numW: numInWidth, numL: numInLength }
    }

    else {
        var square = {}
        var sqrt = Math.sqrt(num)
        square.numW = sqrt
        square.numL = sqrt
        square.x1 = x1 - square.numW * 45 / 2
        square.y1 = y1 - square.numL * 45 / 2
        square.x2 = x1 + square.numW * 45 / 2
        square.y2 = square.y1
        square.vx = 45
        square.vy = 0
        square.px = 0
        square.py = 45
        return square
    }

}

Mous.onDragRightEnd((mouse) => {
    const square = moveSquareCompute(getTranslatedMouse(mouse))

    let offX = 0
    let offY = 0
    getSelected().forEach(k => {
        const b = selectable[k]
        const hosts = []
        for (let j = -1; j <= 1; j++)
            for (let i = -1; i <= 1; i++) {
                hosts.push([b.x * 1.0 + 600 * i, b.y * 1.0 + 600 * j])
            }


        moveOrder.push(
            {
                hosts: hosts,
                data: JSON.stringify({
                    id: b.id,
                    x: parseInt(square.x1 + offX * square.vx + offY * square.px),
                    y: parseInt(square.y1 + offX * square.vy + offY * square.py)
                })
            }
        )
        offX += 1
        if (offX >= square.numW) {
            offX = 0
            offY += 1
        }
    })
    //selectedselectable go to position 
    Draw.setMoveSquare(null)
})

Mous.onDragRight((mouse) => {
    const square = moveSquareCompute(getTranslatedMouse(mouse))
    Draw.setMoveSquare(square)
})

Mous.onTrail((trail) => {
    Draw.setTrail(trail)
})


const linearInterp = (path, float_i) => {
    const first = path[Math.floor(float_i)]
    const last = path[Math.ceil(float_i)]
    const t = float_i - Math.floor(float_i)
    return { x: first.x * (1 - t) + last.x * t, y: first.y * (1 - t) + last.y * t }
}

Mous.onTrailEnd((trail) => {
    Draw.setTrail([])
    
    const trailSize = trail.length
    const selectedSize = getSelected().length
    console.log(selectedSize)
    var cam = Draw.getCamera()
    for (var i = 0; i < selectedSize; i++) {
        const b = selectable[getSelected()[i]]
        const pos = linearInterp(trail, parseFloat(i * trailSize) / parseFloat(selectedSize))
        pos.x += cam.x
        pos.y += cam.y
        moveOrder.push(
            {
                hosts: [[b.x * 1.0, b.y * 1.0]],
                data: JSON.stringify({
                    id: b.id,
                    x: parseInt(pos.x),
                    y: parseInt(pos.y)
                })
            }
        )
    }


})


document.addEventListener("contextmenu", function (e) {
    e.preventDefault()
});


let selectedselectable = []

const getSelected = () => {
    return selectedselectable.filter(id =>    selectable[id] != undefined)
}

let toBeSelected = []
let selectable = {}
let selectableVal = []

const loop = () => {
    setTimeout(loop, 16.666)

    const frame = frameInterp.getInterp()
    selectable = {}
    const selectableIds = Object.keys(frame).filter(k => { return frame[k].type == "bowman" || frame[k].type == "com" })
    selectableIds.forEach(k => { selectable[k] = frame[k] })
    selectableVal = Object.keys(selectable).map(key => selectable[key])
    Draw.setSelectedId(getSelected())


    // if (moveOrder.length == 0)
    //     toServer = JSON.stringify([{ hosts: [], data: "" }])
    if (moveOrder.length > 0) {
        var toServer
        var numToSend = 5
        if (moveOrder.length > numToSend) {
            toServer = JSON.stringify(moveOrder.slice(0, numToSend))
            moveOrder = moveOrder.slice(numToSend);
        }
        else {
            toServer = JSON.stringify(moveOrder)
            moveOrder = []
        }
        client.send(toServer)
    }

}

setTimeout(loop, 200)
var client = require('../providedCode')
client.launch()

setInterval(() => { client.getPing((ping) => Draw.setPing(ping)) }, 1000)

const frameInterp = require('./frameInterp')
Draw.setFrameGetter(frameInterp)

var zlib = require('zlib')
client.dataManipulation(dataZiped => {
    // console.log("Received Zipped :\n" + dataZiped)
    var data = zlib.gunzip(Buffer.from(dataZiped, 'base64'), (err, data) => {
        //   console.log("Received :\n" + data)
        data = JSON.parse(data)
        const newFrame = {}
        data.forEach(o => {
            if (typeof (o.id) !== undefined) {
                newFrame[o.id] = o
            }
        })
        frameInterp.addFrame(newFrame)

    })
})
