const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* ================= IMAGE & MASK ================= */
let img = new Image();
let brushSize = document.getElementById("brushSize").value;

const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d");

/* ================= STATE ================= */
let brush = { x: 0, y: 0, radius: brushSize };
let strokes = [];
let currentStroke = null;
let dragging = false;
let brushLocked = false;

const loadingDiv = document.getElementById("loading");

/* ================= HELPERS ================= */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  let x, y;

  if (e.touches) {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  } else {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }

  return {
    x: clamp(x, 0, canvas.width),
    y: clamp(y, 0, canvas.height)
  };
}

/* ================= BRUSH SIZE ================= */
document.getElementById("brushSize").oninput = e => {
  brushSize = e.target.value;
  brush.radius = brushSize;
};

/* ================= LOAD IMAGE ================= */
document.getElementById("upload").onchange = e => {
  const reader = new FileReader();
  reader.onload = () => {
    img.src = reader.result;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      maskCanvas.width = img.width;
      maskCanvas.height = img.height;

      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      draw();
    };
  };
  reader.readAsDataURL(e.target.files[0]);
};

/* ================= DRAW ================= */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < maskData.data.length; i += 4) {
    if (maskData.data[i] === 255) {
      imageData.data[i] = 255;
      imageData.data[i + 1] = 0;
      imageData.data[i + 2] = 0;
      imageData.data[i + 3] = 120;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  if (!brushLocked) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(brush.x, brush.y, brush.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/* ================= PAINT ================= */
function paintMask(x, y) {
  maskCtx.fillStyle = "white";
  maskCtx.beginPath();
  maskCtx.arc(x, y, brush.radius, 0, Math.PI * 2);
  maskCtx.fill();
}

/* ================= EVENTS ================= */
canvas.onmousedown = canvas.ontouchstart = e => {
  if (brushLocked) return;
  e.preventDefault();

  const pos = getPos(e);
  dragging = true;
  brush.x = pos.x;
  brush.y = pos.y;

  currentStroke = [];
  currentStroke.push({ x: pos.x, y: pos.y, r: brush.radius });

  paintMask(pos.x, pos.y);
  draw();
};

canvas.onmousemove = canvas.ontouchmove = e => {
  if (!dragging || brushLocked) return;
  e.preventDefault();

  const pos = getPos(e);
  brush.x = pos.x;
  brush.y = pos.y;

  currentStroke.push({ x: pos.x, y: pos.y, r: brush.radius });
  paintMask(pos.x, pos.y);
  draw();
};

canvas.onmouseup = canvas.ontouchend = () => {
  if (dragging && currentStroke) strokes.push(currentStroke);
  dragging = false;
  currentStroke = null;
  draw();
};

/* ================= UNDO ================= */
function undo() {
  if (!strokes.length) return;

  strokes.pop();
  maskCtx.fillStyle = "black";
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

  for (const stroke of strokes) {
    for (const s of stroke) {
      maskCtx.fillStyle = "white";
      maskCtx.beginPath();
      maskCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      maskCtx.fill();
    }
  }
  draw();
}

/* ================= LOCK ================= */
function toggleLock() {
  brushLocked = !brushLocked;
  document.getElementById("lockBtn").innerText =
    brushLocked ? "Unlock Brush" : "Lock Brush";
}

/* ================= SEND ================= */
function send() {
  loadingDiv.style.display = "block";

  canvas.toBlob(imageBlob => {
    maskCanvas.toBlob(maskBlob => {
      const form = new FormData();
      form.append("image", imageBlob, "image.png");
      form.append("mask", maskBlob, "mask.png");

      fetch("/clean", { method: "POST", body: form })
        .then(r => r.blob())
        .then(b => {
          const img2 = new Image();
          img2.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img2, 0, 0);
            loadingDiv.style.display = "none";
          };
          img2.src = URL.createObjectURL(b);
        })
        .catch(() => {
          loadingDiv.style.display = "none";
          alert("Cleaning failed");
        });
    }, "image/png");
  }, "image/png");
}

/* ================= DOWNLOAD ================= */
function download() {
  const a = document.createElement("a");
  a.download = "cleaned_image.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
}
