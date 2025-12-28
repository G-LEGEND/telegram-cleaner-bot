const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let img = new Image();
let brushSize = document.getElementById("brushSize").value;
let strokes = [];
let currentStroke = null;
let dragging = false;
let locked = false;

const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d");
const loading = document.getElementById("loading");

document.getElementById("brushSize").oninput = e => brushSize = e.target.value;

document.getElementById("upload").onchange = e => {
  const r = new FileReader();
  r.onload = () => {
    img.src = r.result;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      maskCtx.fillStyle="black";
      maskCtx.fillRect(0,0,maskCanvas.width,maskCanvas.height);
      draw();
    };
  };
  r.readAsDataURL(e.target.files[0]);
};

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0);
  ctx.strokeStyle="red";
  ctx.lineWidth=2;
  if(!locked && lastPos){
    ctx.beginPath();
    ctx.arc(lastPos.x,lastPos.y,brushSize,0,Math.PI*2);
    ctx.stroke();
  }
}

let lastPos=null;
canvas.onmousedown = canvas.ontouchstart = e=>{
  if(locked) return;
  dragging=true;
  currentStroke=[];
  lastPos=getPos(e);
  paint(lastPos);
};

canvas.onmousemove = canvas.ontouchmove = e=>{
  if(!dragging || locked) return;
  lastPos=getPos(e);
  paint(lastPos);
};

canvas.onmouseup = canvas.ontouchend = ()=>{
  if(currentStroke) strokes.push(currentStroke);
  dragging=false;
};

function paint(p){
  currentStroke.push({...p,r:brushSize});
  maskCtx.fillStyle="white";
  maskCtx.beginPath();
  maskCtx.arc(p.x,p.y,brushSize,0,Math.PI*2);
  maskCtx.fill();
  draw();
}

function undo(){
  strokes.pop();
  maskCtx.fillStyle="black";
  maskCtx.fillRect(0,0,maskCanvas.width,maskCanvas.height);
  strokes.forEach(s=>s.forEach(p=>{
    maskCtx.fillStyle="white";
    maskCtx.beginPath();
    maskCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
    maskCtx.fill();
  }));
  draw();
}

function toggleLock(){
  locked=!locked;
  document.getElementById("lockBtn").innerText = locked?"Unlock Brush":"Lock Brush";
}

function send(){
  loading.style.display="block";
  canvas.toBlob(imgBlob=>{
    maskCanvas.toBlob(maskBlob=>{
      const f=new FormData();
      f.append("image",imgBlob);
      f.append("mask",maskBlob);
      fetch("/clean",{method:"POST",body:f})
      .then(r=>r.blob())
      .then(b=>{
        const u=URL.createObjectURL(b);
        img.onload=()=>{loading.style.display="none";draw();}
        img.src=u;
      });
    });
  });
}

function download(){
  const a=document.createElement("a");
  a.href=canvas.toDataURL("image/png");
  a.download="cleaned.png";
  a.click();
}

function getPos(e){
  const r=canvas.getBoundingClientRect();
  if(e.touches) e=e.touches[0];
  return {x:e.clientX-r.left,y:e.clientY-r.top};
}
