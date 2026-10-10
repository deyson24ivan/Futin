interface Point {x: number; y: number}
interface MeshNode extends Point {dx: number; dy: number; vx: number; vy: number; pinned: boolean}
interface Shot extends Point {safe: boolean; started: number}
(() => {
  'use strict';
  const scene = document.querySelector<HTMLElement>('.goal-scene')!;
  if (!scene) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'penalty-render'; canvas.setAttribute('aria-hidden','true');
  scene.prepend(canvas);
  const athlete = document.createElement('img');
  athlete.src = 'assets/premium/penalty-athlete.png?v=10'; athlete.alt = ''; athlete.className = 'penalty-athlete';
  scene.append(athlete);
  const label = document.createElement('span');
  label.className = 'penalty-camera-label'; label.textContent = String('FUTIN ARENA · CÁMARA DE LANZAMIENTO');
  scene.append(label);
  const context = canvas.getContext('2d')!;
  if (!context) return;
  const ballTexture = new Image();
  ballTexture.src = 'assets/premium/football.png';
  ballTexture.addEventListener('load',()=>draw(shot ? performance.now() : 0));
  // These normalized coordinates are the painted penalty spot in the stadium.
  const penaltySpot = {x:500,y:505};
  const ballOrigin = {x:penaltySpot.x,y:penaltySpot.y-21};
  const width = 1000, height = 650, columns = 26, rows = 12;
  const mesh: MeshNode[] = [];
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      mesh.push({x:210+580*col/columns,y:99+220*row/rows,dx:0,dy:0,vx:0,vy:0,pinned:row===0 || row===rows || col===0 || col===columns});
    }
  }
  let shot: Shot | null = null; let frame = 0, previous = 0, impact = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const position = (node: MeshNode) => ({x:node.x+node.dx,y:node.y+node.dy});
  function line(a: Point,b: Point,color: string,thickness=1) {
    context.beginPath(); context.moveTo(a.x,a.y); context.lineTo(b.x,b.y);
    context.strokeStyle=color; context.lineWidth=thickness; context.stroke();
  }
  function stepNet(dt: number) {
    const force = mesh.map((node,index)=>{
      if (node.pinned) return [0,0];
      const neighbors = [mesh[index-1],mesh[index+1],mesh[index-columns-1],mesh[index+columns+1]];
      const ax = -65*node.dx-9*node.vx+neighbors.reduce((sum,n)=>sum+18*(n.dx-node.dx),0);
      const ay = -65*node.dy-9*node.vy+neighbors.reduce((sum,n)=>sum+18*(n.dy-node.dy),0);
      return [ax,ay];
    });
    mesh.forEach((node,index)=>{
      if (node.pinned) return;
      node.vx += force[index][0]*dt; node.vy += force[index][1]*dt;
      node.dx += node.vx*dt; node.dy += node.vy*dt;
    });
  }
  function drawNet() {
    context.fillStyle='rgba(5,17,24,.14)'; context.fillRect(210,99,580,220);
    for (let row=0;row<=rows;row++) {
      for (let col=0;col<=columns;col++) {
        const index=row*(columns+1)+col;
        if (col<columns) line(position(mesh[index]),position(mesh[index+1]),'rgba(218,241,233,.43)',.85);
        if (row<rows) line(position(mesh[index]),position(mesh[index+columns+1]),'rgba(218,241,233,.43)',.85);
      }
    }
    for (let y=91;y<325;y+=18) {
      line({x:190,y},{x:210,y:99+(y-91)*220/234},'#d4e9df66',.8);
      line({x:810,y},{x:790,y:99+(y-91)*220/234},'#d4e9df66',.8);
    }
    line({x:190,y:325},{x:810,y:325},'#e7fff830',2);
    context.shadowColor='#000b'; context.shadowBlur=9;
    line({x:190,y:325},{x:190,y:91},'#748f94',8);
    line({x:190,y:91},{x:810,y:91},'#748f94',8);
    line({x:810,y:91},{x:810,y:325},'#748f94',8);
    context.shadowBlur=0;
    line({x:188,y:325},{x:188,y:90},'#f4f9fa',4);
    line({x:188,y:89},{x:812,y:89},'#f4f9fa',4);
    line({x:812,y:90},{x:812,y:325},'#f4f9fa',4);
  }
  function ball(x: number,y: number,r: number,rotation: number) {
    context.save(); context.translate(x,y); context.rotate(rotation);
    if (ballTexture.complete && ballTexture.naturalWidth) {
      context.drawImage(ballTexture,-r/.97,-r/.97,r*2/.97,r*2/.97);
      context.restore(); return;
    }
    const gradient=context.createRadialGradient(-r*.3,-r*.4,r*.08,0,0,r);
    gradient.addColorStop(0,'#fff'); gradient.addColorStop(.65,'#e2e9eb'); gradient.addColorStop(1,'#7b8b9a');
    context.fillStyle=gradient; context.beginPath(); context.arc(0,0,r,0,Math.PI*2); context.fill();
    context.clip(); context.strokeStyle='#536574'; context.lineWidth=r*.055;
    for(let panel=0;panel<6;panel++) {
      const angle=panel*Math.PI/3,px=panel===0?0:Math.cos(angle)*r*.8,py=panel===0?0:Math.sin(angle)*r*.8;
      context.beginPath(); for(let corner=0;corner<5;corner++){const a=corner*Math.PI*2/5-.3;const cx=px+Math.cos(a)*r*.34,cy=py+Math.sin(a)*r*.34;if(corner===0)context.moveTo(cx,cy);else context.lineTo(cx,cy);}context.closePath();
      context.fillStyle=panel%2?'#26394f':'#0b1d30'; context.fill(); context.stroke();
    }
    context.restore();
  }
  function draw(time=0) {
    context.clearRect(0,0,width,height); drawNet();
    const elapsed=shot ? (time-shot.started)/1000 : 0;
    let x=ballOrigin.x,y=ballOrigin.y,r=21;
    if(shot) {
      const t=Math.min(1,elapsed/.82),e=1-(1-t)**1.5;
      x=ballOrigin.x+(shot.x-ballOrigin.x)*e; y=ballOrigin.y+(shot.y-ballOrigin.y)*e-95*Math.sin(t*Math.PI); r=21-13*e;
      if(elapsed>.82) {
        const after=elapsed-.82;
        y+=shot.safe ? 10*Math.sin(after*5)*Math.exp(-after*2) : Math.min(150,after*165);
        x+=shot.safe ? 6*Math.sin(after*7)*Math.exp(-after*3) : (shot.x<500?-1:1)*Math.min(60,after*70);
      }
      if(!reduced.matches && elapsed<.82) {
        context.strokeStyle='#ff8da088'; context.lineWidth=r*.4; context.lineCap='round';
        context.beginPath(); context.moveTo(x-(x-ballOrigin.x)*.13,y+(ballOrigin.y-y)*.13); context.lineTo(x,y); context.stroke();
      }
      if(elapsed>.82 && !impact) {
        impact=true;
        const currentShot = shot;
        if(currentShot.safe) mesh.forEach(node=>{if(!node.pinned){const falloff=Math.exp(-((node.x-currentShot.x)**2+(node.y-currentShot.y)**2)/9000);node.vx=(node.x-currentShot.x)*3*falloff;node.vy=210*falloff;}});
        scene.classList.toggle('shot-goal',shot.safe); scene.classList.toggle('shot-save',!shot.safe);
      }
      if(elapsed>.82 && elapsed<1.6 && !reduced.matches) {
        for(let i=0;i<18;i++){const a=i*2.4,d=(elapsed-.82)*95;context.fillStyle=shot.safe?'#63f4b5':'#ffac96';context.globalAlpha=Math.max(0,1-(elapsed-.82)/.8);context.fillRect(shot.x+Math.cos(a)*d,shot.y+Math.sin(a)*d,2.5,2.5);}context.globalAlpha=1;
      }
    }
    context.fillStyle='#00100d55'; context.beginPath(); context.ellipse(x,shot?Math.max(y+10,335):penaltySpot.y,r*1.1,r*.25,0,0,Math.PI*2);context.fill();
    if(!shot || elapsed<2) ball(x,y,r,elapsed*10);
  }
  function tick(time: number) {
    const dt=Math.min((time-previous)/1000 || .016,1/60); previous=time;
    stepNet(dt); draw(time);
    if(shot && time-shot.started<2400 && !document.hidden && !reduced.matches) frame=requestAnimationFrame(tick);
    else {frame=0;scene.classList.remove('is-kicking');}
  }
  function resize() {
    const dpr=Math.min(devicePixelRatio || 1,2),rect=scene.getBoundingClientRect();
    if(!rect.width)return;
    canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
    context.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);draw(shot?performance.now():0);
  }
  window.addEventListener('futin:penaltyshot',event=>{
    cancelAnimationFrame(frame);mesh.forEach(node=>{node.dx=node.dy=node.vx=node.vy=0;});impact=false;
    const {index,safe}=event.detail;
    shot={x:200+(index%5+.5)*120,y:91+(Math.floor(index/5)+.5)*117,safe,started:performance.now()};
    scene.classList.remove('shot-goal','shot-save');scene.classList.add('is-kicking');
    if(reduced.matches){draw(shot.started+900);scene.classList.remove('is-kicking');}else{previous=shot.started;frame=requestAnimationFrame(tick);}
  });
  window.addEventListener('futin:penaltyready',()=>{cancelAnimationFrame(frame);frame=0;shot=null;mesh.forEach(node=>{node.dx=node.dy=node.vx=node.vy=0;});scene.classList.remove('is-kicking','shot-goal','shot-save');resize();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else resize();});
  reduced.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;resize();});
  new ResizeObserver(resize).observe(scene);resize();
})();




export {};
