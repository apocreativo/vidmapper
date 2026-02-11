let layers = [];
let draggingPoint = null;
let draggingLayer = null;
let showPoints = true;

function setup() {
    let container = document.getElementById('canvas-container');
    let canvas = createCanvas(container.offsetWidth, container.offsetHeight, WEBGL);
    canvas.parent('canvas-container');

    document.getElementById('addLayerBtn').onclick = () => createLayer();
    document.getElementById('togglePoints').onclick = () => showPoints = !showPoints;
    document.getElementById('fullscreenBtn').onclick = () => fullscreen(!fullscreen());
    document.getElementById('clearAllBtn').onclick = clearProject;

    loadSavedData();
}

function createLayer(savedData = null) {
    let id = savedData ? savedData.id : Date.now();
    let newLayer = {
        id: id,
        video: null,
        opacity: savedData ? savedData.opacity : 255,
        blendMode: savedData ? savedData.blendMode : 'BLEND',
        corners: savedData ? savedData.corners : [
            { x: -150, y: -100 }, { x: 150, y: -100 },
            { x: 150, y: 100 }, { x: -150, y: 100 }
        ]
    };

    let card = document.createElement('div');
    card.className = 'layer-card';
    card.id = `card-${id}`;
    card.innerHTML = `
        <div class="layer-header">
            <h3>CAPA ID: ${id.toString().slice(-4)}</h3>
            <button class="delete-btn" onclick="removeLayer(${id})">ELIMINAR</button>
        </div>
        <div class="control-item">
            <input type="file" onchange="loadVideo(event, ${id})" accept="video/*">
        </div>
        <div class="control-item">
            <label>Mezcla:</label>
            <select onchange="updateParam(${id}, 'blendMode', this.value)">
                <option value="BLEND" ${newLayer.blendMode==='BLEND'?'selected':''}>Normal</option>
                <option value="SCREEN" ${newLayer.blendMode==='SCREEN'?'selected':''}>Screen</option>
                <option value="ADD" ${newLayer.blendMode==='ADD'?'selected':''}>Add</option>
                <option value="MULTIPLY" ${newLayer.blendMode==='MULTIPLY'?'selected':''}>Multiply</option>
            </select>
        </div>
        <div class="control-item">
            <label>Opacidad:</label>
            <input type="range" min="0" max="255" value="${newLayer.opacity}" oninput="updateParam(${id}, 'opacity', this.value)">
        </div>
    `;
    document.getElementById('layers-container').appendChild(card);
    layers.push(newLayer);
    saveToStorage();
}

function loadVideo(event, id) {
    let file = event.target.files[0];
    if (!file) return;
    let url = URL.createObjectURL(file);
    let layer = layers.find(l => l.id === id);
    if (layer.video) layer.video.remove();
    layer.video = createVideo(url, () => {
        layer.video.loop();
        layer.video.volume(0);
        layer.video.hide();
    });
}

function updateParam(id, param, value) {
    let layer = layers.find(l => l.id === id);
    layer[param] = value;
    saveToStorage();
}

function removeLayer(id) {
    layers = layers.filter(l => l.id !== id);
    document.getElementById(`card-${id}`).remove();
    saveToStorage();
}

function clearProject() {
    if(confirm("¿Seguro que quieres borrar todas las capas?")) {
        localStorage.removeItem('mapperData');
        location.reload();
    }
}

function saveToStorage() {
    // Guardamos solo los datos, no el objeto video
    const dataToSave = layers.map(l => ({
        id: l.id,
        opacity: l.opacity,
        blendMode: l.blendMode,
        corners: l.corners
    }));
    localStorage.setItem('mapperData', JSON.stringify(dataToSave));
}

function loadSavedData() {
    let saved = localStorage.getItem('mapperData');
    if (saved) {
        let parsed = JSON.parse(saved);
        parsed.forEach(data => createLayer(data));
    } else {
        createLayer(); // Crear una capa si está vacío
    }
}

function draw() {
    background(0);
    for (let l of layers) {
        push();
        if (l.blendMode === 'SCREEN') blendMode(SCREEN);
        else if (l.blendMode === 'ADD') blendMode(ADD);
        else if (l.blendMode === 'MULTIPLY') blendMode(MULTIPLY);
        else blendMode(BLEND);

        if (l.video) {
            noStroke();
            texture(l.video);
            tint(255, l.opacity);
            beginShape();
            vertex(l.corners[0].x, l.corners[0].y, 0, 0);
            vertex(l.corners[1].x, l.corners[1].y, l.video.width, 0);
            vertex(l.corners[2].x, l.corners[2].y, l.video.width, l.video.height);
            vertex(l.corners[3].x, l.corners[3].y, 0, l.video.height);
            endShape(CLOSE);
        }
        pop();
        if (showPoints) drawLayerHandles(l);
    }
}

function drawLayerHandles(l) {
    for (let i = 0; i < l.corners.length; i++) {
        stroke(draggingLayer === l && draggingPoint === i ? '#00ffcc' : '#ff0055');
        strokeWeight(10);
        point(l.corners[i].x, l.corners[i].y);
    }
}

function mousePressed() {
    let mx = mouseX - width / 2;
    let my = mouseY - height / 2;
    for (let i = layers.length - 1; i >= 0; i--) {
        let l = layers[i];
        for (let j = 0; j < l.corners.length; j++) {
            if (dist(mx, my, l.corners[j].x, l.corners[j].y) < 20) {
                draggingLayer = l;
                draggingPoint = j;
                return;
            }
        }
    }
}

function mouseDragged() {
    if (draggingLayer && draggingPoint !== null) {
        draggingLayer.corners[draggingPoint].x = mouseX - width / 2;
        draggingLayer.corners[draggingPoint].y = mouseY - height / 2;
        saveToStorage();
    }
}

function mouseReleased() {
    draggingLayer = null;
    draggingPoint = null;
}

function windowResized() {
    let container = document.getElementById('canvas-container');
    resizeCanvas(container.offsetWidth, container.offsetHeight);
}
