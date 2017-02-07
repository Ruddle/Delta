
const canvas = document.getElementById("canvas")
if (!canvas) {
    alert("Impossible de récupérer le canvas")
}
const context = canvas.getContext("2d")
if (!context) {
    alert("Impossible de récupérer le context")
}
canvas.width = window.innerWidth
canvas.height = window.innerHeight


const worldSize = { x: 3000, y: 3000 }
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}
const background = new Image()
background.src = './texture/waterTex.png'

const cam = {}
module.exports.cam = () => cam


module.exports.draw = (frame, msElapsed, time, ping) => {

    let boats = []
    let cannonballs = []
    let obstacles = []
    let splashs = []
    let other = {}
    let currentPos = {}
    if ((frame) !== undefined) {
        boats = Object.keys(frame).filter(k => {
            return typeof (frame[k].type) !== undefined && frame[k].type == 'boat'
        }).map(k => frame[k])

        cannonballs = Object.keys(frame).filter(k => {
            return typeof (frame[k].type) !== undefined && frame[k].type == 'cannonball'
        }).map(k => frame[k])

        splashs = Object.keys(frame).filter(k => {
            return typeof (frame[k].type) !== undefined && frame[k].type == 'splash'
        }).map(k => frame[k])

        obstacles = Object.keys(frame).filter(k => {
            return typeof (frame[k].type) !== undefined && frame[k].type == 'obstacle'
        }).map(k => frame[k])



        if (frame['1'] != undefined)
            other = frame['1']

        if (frame['0'] !== undefined)
            currentPos = frame['0']
    }

    // clamp the camera position to the world bounds while centering the camera around the snake                    
    cam.x = parseInt(clamp(currentPos.x - canvas.width / 2, 0, worldSize.x - canvas.width))
    cam.y = parseInt(clamp(currentPos.y - canvas.height / 2, 0, worldSize.y - canvas.height))
    context.setTransform(1, 0, 0, 1, 0, 0)  // because the transform matrix is cumulative

    context.translate(-cam.x, -cam.y)
    const pattern = context.createPattern(background, 'repeat')
    context.beginPath()
    context.rect(cam.x, cam.y, canvas.width + cam.x, canvas.height + cam.y)
    context.fillStyle = pattern
    context.fill()

    drawObstacles(obstacles)
    drawboats(boats, canvasCacheboat)
    drawcannonballs(cannonballs, canvascannonballCache)
    drawSplashs(splashs)


    context.shadowBlur = 30
    context.shadowColor = "black"
    context.beginPath()
    context.fillStyle = "rgba(" + 150 + ", " + 150 + ", " + 150 + "," + 0.4 + ")"
    context.rect(0, 0, 350, 130)
    context.fill()
    context.shadowBlur = 0
    context.font = "bold 18px Courier New"
    context.fillStyle = "rgb(" + 0 + ", " + 0 + ", " + 0 + ")"
    if (other !== null)
        context.fillText("xp : " + other.xp + " used : " + other.usedXp, 10, 30)
    context.fillText("Ping : " + parseInt(ping * 10) / 10.0, 10, 80)
    context.fillText("Draw fps        : " + parseInt(10000.0 / msElapsed) / 10.0, 10, 105)

}


function roundRect(context, x, y, width, height, radius) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius }
    } else {
        let defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 }
        for (let side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side]
        }
    }
    context.beginPath()
    context.moveTo(x + radius.tl, y)
    context.lineTo(x + width - radius.tr, y)
    context.quadraticCurveTo(x + width, y, x + width, y + radius.tr)
    context.lineTo(x + width, y + height - radius.br)
    context.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height)
    context.lineTo(x + radius.bl, y + height)
    context.quadraticCurveTo(x, y + height, x, y + height - radius.bl)
    context.lineTo(x, y + radius.tl)
    context.quadraticCurveTo(x, y, x + radius.tl, y)
    context.closePath()

}


const createCacheboat = () => {
    const canvasCacheboat = document.createElement('canvas')
    canvasCacheboat.setAttribute('width', 80)
    canvasCacheboat.setAttribute('height', 80)
    const contextboat = canvasCacheboat.getContext('2d')
    contextboat.beginPath()
    contextboat.arc(40, 40, 20, 0, Math.PI * 2)
    contextboat.fillStyle = "rgba(" + 0 + ", " + 0 + ", " + 0 + ",0.5)"
    contextboat.shadowBlur = 30
    contextboat.shadowColor = "black"
    contextboat.fill()
    contextboat.shadowBlur = 20
    contextboat.fill()
    contextboat.shadowBlur = 5
    contextboat.fill()
    contextboat.shadowBlur = 3
    contextboat.fill()
    contextboat.shadowBlur = 2
    contextboat.fill()
    return canvasCacheboat
}


const createCachecannonball = () => {
    const canvascannonballCache = document.createElement('canvas')
    canvascannonballCache.setAttribute('width', 40)
    canvascannonballCache.setAttribute('height', 40)
    const contextcannonball = canvascannonballCache.getContext('2d')
    contextcannonball.beginPath()
    contextcannonball.arc(20, 20, 3, 0, Math.PI * 2)
    contextcannonball.fillStyle = "black"
    contextcannonball.fill()
    return canvascannonballCache
}


let timestamp = 0




const drawboats = (boats, canvasCacheboat) => {
    timestamp += 1


    for (const boat of boats) {
        //   context.drawImage(canvasCacheboat, boat.x - 40, boat.y - 40)


        const m = { x: parseFloat(boat.x), y: parseFloat(boat.y) }
        const u = { x: parseFloat(boat.ux), y: parseFloat(boat.uy) }
        const v = { x: -u.y, y: u.x }

        const length = 100.0 * Math.sqrt(parseFloat(boat.size))
        const width = length / 3.0

        // console.log(m,u,v,length,width )

        context.beginPath()
        context.moveTo(m.x + (-v.x * width / 2.0 + u.x * length / 2.0), m.y + (-v.y * width / 2.0 + u.y * length / 2.0))
        context.lineTo(m.x + (0 + u.x * length), m.y + (0 + u.y * length))
        context.lineTo(m.x + (v.x * width / 2.0 + u.x * length / 2.0), m.y + (v.y * width / 2.0 + u.y * length / 2.0))
        context.lineTo(m.x + (v.x * width / 2.0 - u.x * length / 2.0), m.y + (v.y * width / 2.0 - u.y * length / 2.0))
        context.lineTo(m.x + (v.x * width / 4.0 - u.x * length * 0.6), m.y + (v.y * width / 4.0 - u.y * length * 0.60))
        context.lineTo(m.x + (-v.x * width / 4.0 - u.x * length * 0.6), m.y + (-v.y * width / 4.0 - u.y * length * 0.60))
        context.lineTo(m.x + (-v.x * width / 2.0 - u.x * length / 2.0), m.y + (-v.y * width / 2.0 - u.y * length / 2.0))
        context.closePath()
        context.fillStyle = "rgb( 131,73,44)"
        context.fill()





        drawSail(1.5, length / 4, length / 10, 0.5, 0, m, u, v, width)
        drawSail(1.0, length / 5, length / 10, 0.5, -length / 3, m, u, v, width)
        drawSail(1.2, length / 4, length / 10, 0.5, length / 4, m, u, v, width)

        const flagSizeFactor = 2
        for (const flag of boat.targets) {
            const x = parseInt(flag.x)
            const y = parseInt(flag.y)
            context.beginPath()
            context.moveTo(x, y)
            context.lineTo(x, y - 20 * flagSizeFactor)
            context.lineTo(x + 9 * flagSizeFactor, y - 16 * flagSizeFactor)
            context.lineTo(x, y - 12 * flagSizeFactor)
            context.closePath()
            context.lineWidth = 3
            context.strokeStyle = "rgb(" + 0 + ", " + 0 + ", " + 0 + ")"
            context.stroke()
            context.fillStyle = "rgb(255,0,0)"
            context.fill()

        }

        let healthLeft = (boat.health[0] / (2 + boat.size * 0.50))
        let healthRight = (boat.health[1] / (2 + boat.size * 0.50))

        //healthBar
        context.beginPath()
        context.fillStyle = "rgba(" + 0 + ", " + 0 + ", " + 0 + "," + 1 + ")"
        context.rect(m.x - 25 - 30, m.y - 100, 50, 10)
        context.fill()
        context.closePath()
        context.beginPath()
        context.fillStyle = "rgba(" + 0 + ", " + 255 + ", " + 0 + "," + 1 + ")"
        context.rect(m.x - 25 - 30, m.y - 100, 50.0 * healthLeft, 10)
        context.fill()
        context.closePath()



        let rand = Math.random() * length / 5

        if (healthRight < 0.9) {
            addParticles(m, u, v, length / 3 + rand, width / 2)
        }
        if (healthRight < 0.5) {
            addParticles(m, u, v, -length / 3 + rand, width / 2)
        }

        context.beginPath()
        context.fillStyle = "rgba(" + 0 + ", " + 0 + ", " + 0 + "," + 1 + ")"
        context.rect(m.x - 25 + 30, m.y - 100, 50, 10)
        context.fill()
        context.closePath()
        context.beginPath()
        context.fillStyle = "rgba(" + 0 + ", " + 255 + ", " + 0 + "," + 1 + ")"
        context.rect(m.x - 25 + 30, m.y - 100, 50.0 * healthRight, 10)
        context.fill()
        context.closePath()

        if (healthLeft < 0.9) {

            addParticles(m, u, v, length / 3 - rand, -width / 2)
        }
        if (healthLeft < 0.5) {
            addParticles(m, u, v, -length / 3 - rand, -width / 2)
        }
    }
    updateParticles()
    drawFlammes()

}
let fireParticles = []
let smokeParticles = []

let lastTime = null,
    delta = 0


const addParticles = (m, u, v, offsetU, offsetV) => {

    function createFireParticle() {
        let p = {
            lifeSpan: getRandom(fireConfig.lifeSpan),
            alpha: getRandom(fireConfig.alpha),
            alphaDecay: getRandom(fireConfig.alphaDecay),
            colour: getColourFire(),
            x: m.x + offsetU * u.x + offsetV * v.x,
            y: m.y + offsetU * u.y + offsetV * v.y,
            radius: getRandom(fireConfig.radius),
            radiusDecay: getRandom(fireConfig.radiusDecay),
            direction: getRandom(fireConfig.direction),
            speed: getRandom(fireConfig.speed)
        }

        fireParticles.push(p)
    }

    function createSmokeParticle() {
        let p = {
            lifeSpan: getRandom(smokeConfig.lifeSpan),
            alpha: getRandom(smokeConfig.alpha),
            alphaDecay: getRandom(smokeConfig.alphaDecay),
            colour: getColourSmoke(),
            x: m.x + offsetU * u.x + offsetV * v.x,
            y: m.y + offsetU * u.y + offsetV * v.y - 5,
            radius: getRandom(smokeConfig.radius),
            radiusDecay: getRandom(smokeConfig.radiusDecay),
            direction: getRandom(smokeConfig.direction),
            speed: getRandom(smokeConfig.speed)
        }

        smokeParticles.push(p)
    }

    function getRandom(o) {
        return Math.random() * (o.max - o.min) + o.min
    }

    function getColourFire() {
        let red = parseInt(Math.random() * 125.0 + 125.0)
        let green = parseInt(Math.random() * 135)
        return "rgba(" + red + ", " + green + ", 5,0.5)"
    }
    function getColourSmoke() {
        let rand = Math.random() * 35.0
        let rands = parseInt(rand)
        return "rgba(" + rands + "," + rands + ", " + rands + ", 0.10" + ")"
    }

    if (fireParticles.length < fireConfig.maxParticles) {
        createFireParticle()
    }

    if (smokeParticles.length < smokeConfig.maxParticles) {
        createSmokeParticle()
    }

}


const updateParticles = () => {
    if (lastTime === null) lastTime = timestamp
    delta = timestamp - lastTime
    lastTime = timestamp


    let p
    for (var i = fireParticles.length - 1; i >= 0; i--) {

        p = fireParticles[i]

        p.lifeSpan -= delta
        if (p.lifeSpan <= 0) {
            fireParticles.splice(i, 1)
        }

        p.alpha -= p.alphaDecay * delta / 1000
        if (p.alpha <= 0) {
            fireParticles.splice(i, 1)
        }

        p.radius -= p.radiusDecay * delta / 1000
        if (p.radius <= 0) {
            fireParticles.splice(i, 1)
        }

        p.x += p.speed * Math.cos(p.direction) * delta / 1000
        p.y += p.speed * Math.sin(p.direction) * delta / 1000
    }

    for (var i = smokeParticles.length - 1; i >= 0; i--) {
        p = smokeParticles[i]

        p.lifeSpan -= delta
        if (0 >= p.lifeSpan) {
            smokeParticles.splice(i, 1)
        }

        p.alpha -= p.alphaDecay * delta / 1000
        if (p.alpha <= 0) {
            smokeParticles.splice(i, 1)
        }

        p.radius -= p.radiusDecay * delta / 1000
        if (p.radius <= 0) {
            smokeParticles.splice(i, 1)
        }

        p.x += p.speed * Math.cos(p.direction) * delta / 1000
        p.y += p.speed * Math.sin(p.direction) * delta / 1000
    }

}

const drawFlammes = () => {

    fireParticles.forEach(p => {
        context.fillStyle = p.colour
        context.beginPath()
        context.arc(p.x, p.y, p.radius, 0, 2 * Math.PI)
        context.fill()
        context.closePath()
    })

    smokeParticles.forEach(p => {
        context.fillStyle = p.colour
        context.beginPath()
        context.arc(p.x, p.y, p.radius, 0, 2 * Math.PI)
        context.fill()
        context.closePath()
    })
}



const drawSail = (span, frontCurve, backCurve, curveFactor, offsetPosition, m, u, v, width) => {
    context.beginPath()
    context.moveTo(offsetPosition * u.x + m.x + v.x * span * width, offsetPosition * u.y + m.y + v.y * span * width)
    context.bezierCurveTo(offsetPosition * u.x + m.x + v.x * span * width * curveFactor + u.x * backCurve, offsetPosition * u.y + m.y + v.y * span * width * curveFactor + u.y * backCurve,
        offsetPosition * u.x + m.x - v.x * span * width * curveFactor + u.x * backCurve, offsetPosition * u.y + m.y - v.y * span * width * curveFactor + u.y * backCurve,
        offsetPosition * u.x + m.x - v.x * span * width, offsetPosition * u.y + m.y - v.y * span * width)
    context.bezierCurveTo(offsetPosition * u.x + m.x - v.x * span * width * curveFactor + u.x * frontCurve, offsetPosition * u.y + m.y - v.y * span * width * curveFactor + u.y * frontCurve,
        offsetPosition * u.x + m.x + v.x * span * width * curveFactor + u.x * frontCurve, offsetPosition * u.y + m.y + v.y * span * width * curveFactor + u.y * frontCurve,
        offsetPosition * u.x + m.x + v.x * span * width, offsetPosition * u.y + m.y + v.y * span * width)
    context.fillStyle = "rgb(255,255,255)"
    context.fill()
}

const drawcannonballs = (cannonballs, canvascannonballCache) => {
    for (const cannonball of cannonballs) {
        context.drawImage(canvascannonballCache, cannonball.x - 20, cannonball.y - 20)
    }
}

const drawSplashs = (splashs) => {
    for (const splash of splashs) {
        console.log(splash)
        context.beginPath()
        context.rect(parseInt(splash.x), parseInt(splash.y) , 20 , 20)
       // context.arc(parseInt(splash.x), parseInt(splash.y), 20, 0, Math.Pi * 2.0)
        context.fillStyle = "rgb(0,5,0)"
        context.fill()
        context.closePath()
    }
}


const drawObstacles = (obstacles) => {
    for (const obstacle of obstacles) {
        context.beginPath()
        context.moveTo(obstacle.vertices[0].x, obstacle.vertices[0].y)
        for (const vertex of obstacle.vertices.slice(1))
            context.lineTo(vertex.x, vertex.y)
        context.fillStyle = "rgb(150,135,120)"
        context.fill()
        context.closePath()
    }
}

const fireConfig = {
    maxParticles: 1000,
    lifeSpan: {
        min: 10,
        max: 10
    },
    alpha: {
        min: 0.4,
        max: 0.6
    },
    alphaDecay: {
        min: 0.2,
        max: 0.5
    },
    radius: {
        min: 3,
        max: 12
    },
    radiusDecay: {
        min: 25,
        max: 50
    },
    direction: {
        min: -Math.PI / 2 - 0.3,
        max: -Math.PI / 2 + 0.3
    },
    speed: {
        min: 50,
        max: 200
    }
}

const smokeConfig = {
    maxParticles: 500,
    lifeSpan: {
        min: 5,
        max: 25
    },
    alpha: {
        min: 0.1,
        max: 0.15
    },
    alphaDecay: {
        min: 0,
        max: 0.5
    },
    radius: {
        min: 3,
        max: 12
    },
    radiusDecay: {
        min: 0,
        max: 5
    },
    direction: {
        min: -Math.PI / 2 - 0.6,
        max: -Math.PI / 2 + 0.6
    },
    speed: {
        min: 50,
        max: 100
    }
}



const canvasCacheboat = createCacheboat()
const canvascannonballCache = createCachecannonball()