let video;
let corners = [];
let draggingPoint = null;
let showPoints = true;
let canvas;

function setup() {
    // Creamos un canvas que se ajuste al contenedor
    let container = document.getElementById('canvas-container');
    canvas = createCanvas(container.offsetWidth - 40, container.offsetHeight - 40, WEBGL);
    canvas.parent('canvas-container');

    // Posiciones iniciales (proporcionales al centro)
    resetGeometry();

    // Eventos de UI
    document.getElementById('videoInput').addEventListener('change', handleFile);
    document.getElementById('togglePoints').onclick = () => showPoints = !showPoints;
    document.getElementById('resetPoints').onclick = resetGeometry;
    document.getElementById('fullscreenBtn').onclick = () => fullscreen(!fullscreen());
}

function resetGeometry() {
    corners = [
        { x: -250, y: -180 }, // Top-Left
        { x: 250, y: -180 },  // Top-Right
        { x: 250, y: 180 },   // Bottom-Right
        { x: -250, y: 180 }   // Bottom-Left
    ];
}

function handleFile(e) {
    let file = e.target.files[0];
    if (file) {
        let url = URL.createObjectURL(file);
        if (video) video.remove();
        video = createVideo(url, () => {
            video.loop();
            video.volume(0); // Silencio por defecto para evitar bloqueos del navegador
            video.hide();
        });
    }
}

function draw() {
    background(0);
    let op = document.getElementById('opacitySlider').value;

    if (video) {
        noStroke();
        texture(video);
        tint(255, op);
        
        // Mapeo de textura a las 4 esquinas
        beginShape();
        vertex(corners[0].x, corners[0].y, 0, 0);
        vertex(corners[1].x, corners[1].y, video.width, 0);
        vertex(corners[2].x, corners[2].y, video.width, video.height);
        vertex(corners[3].x, corners[3].y, 0, video.height);
        endShape(CLOSE);
    }

    if (showPoints) drawHandles();
}

function drawHandles() {
    for (let i = 0; i < corners.length; i++) {
        stroke(i === draggingPoint ? '#00ffcc' : '#ff0055');
        strokeWeight(12);
        point(corners[i].x, corners[i].y);
    }
}

function mousePressed() {
    let mx = mouseX - width / 2;
    let my = mouseY - height / 2;
    for (let i = 0; i < corners.length; i++) {
        if (dist(mx, my, corners[i].x, corners[i].y) < 20) {
            draggingPoint = i;
            break;
        }
    }
}

function mouseDragged() {
    if (draggingPoint !== null) {
        corners[draggingPoint].x = mouseX - width / 2;
        corners[draggingPoint].y = mouseY - height / 2;
    }
}

function mouseReleased() {
    draggingPoint = null;
}

function windowResized() {
    let container = document.getElementById('canvas-container');
    resizeCanvas(container.offsetWidth - 40, container.offsetHeight - 40);
}
