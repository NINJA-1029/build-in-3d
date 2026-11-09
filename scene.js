/* TF–30 flight model. All geometry, optical surfaces, and textures are generated locally. */
(() => {
  'use strict';
  const stage = document.getElementById('spacecraft-stage');
  let canvas = document.getElementById('satellite-canvas');
  const T = window.THREE;
  if (!stage || !canvas || !T) return;
  const TAU = Math.PI * 2;
  const vec = (x, y, z) => new T.Vector3(x, y, z);
  const scene = new T.Scene();
  const model = new T.Group();
  const assembly = new T.Group();
  scene.add(model);
  let seed = 703;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function paintTexture(width, height, draw) {
    const sheet = document.createElement('canvas');
    sheet.width = width;
    sheet.height = height;
    draw(sheet.getContext('2d'), width, height);
    const result = new T.CanvasTexture(sheet);
    result.colorSpace = T.SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }
  function coated(color, metalness, roughness, extra = {}) {
    return new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  }
  const alloy = coated(0xc5c9c6, .88, .27);
  const darkAlloy = coated(0x565957, .77, .32);
  const white = coated(0xe6e7dc, .45, .31);
  const black = coated(0x171c21, .53, .36);
  const gold = coated(0xe1a43c, .94, .27, { flatShading: true });
  const goldRail = coated(0xd5a047, .84, .31);
  const orange = coated(0xeb5c15, .46, .32);
  const glass = coated(0x152739, .81, .15);
  const glassTint = coated(0x314c64, .77, .19);
  const lensCoating = paintTexture(320,320,(ctx,w,h) => {
    const glassTone=ctx.createRadialGradient(w*.32,h*.27,0,w*.51,h*.49,w*.68);
    glassTone.addColorStop(0,'#486678'); glassTone.addColorStop(.32,'#152d3f');
    glassTone.addColorStop(.59,'#09131d'); glassTone.addColorStop(.81,'#233744');
    glassTone.addColorStop(1,'#394859'); ctx.fillStyle=glassTone; ctx.fillRect(0,0,w,h);
    ctx.save(); ctx.rotate(-.36); ctx.fillStyle='rgba(225,239,242,.15)';
    ctx.fillRect(-20,55,250,10);ctx.fillRect(-10,72,210,3);ctx.restore();
    ctx.strokeStyle='rgba(133,176,197,.40)';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(w/2,h/2,w*.425,Math.PI*.13,Math.PI*.7);ctx.stroke();
  });
  const lensSurface = new T.MeshBasicMaterial({map:lensCoating,toneMapped:false});

  const pvTexture = paintTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#909599';
    ctx.fillRect(0, 0, w, h);
    const cols = 6, rows = 10;
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = col * w / cols + 2, y = row * h / rows + 2;
        const cw = w / cols - 4, ch = h / rows - 4;
        const hue = 220 + random() * 10;
        const val = 18 + random() * 6;
        const grad = ctx.createLinearGradient(x, y, x + cw, y + ch);
        grad.addColorStop(0, 'hsl(' + hue + ', 58%, ' + (val + 8) + '%)');
        grad.addColorStop(1, 'hsl(' + hue + ', 67%, ' + val + '%)');
        ctx.fillStyle = grad;
        const cut = 7;
        ctx.beginPath();
        ctx.moveTo(x + cut, y); ctx.lineTo(x + cw - cut, y);
        ctx.lineTo(x + cw, y + cut); ctx.lineTo(x + cw, y + ch - cut);
        ctx.lineTo(x + cw - cut, y + ch); ctx.lineTo(x + cut, y + ch);
        ctx.lineTo(x, y + ch - cut); ctx.lineTo(x, y + cut);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(185,201,238,.39)';
        for (let i = 1; i <= 19; i++) ctx.fillRect(x + i * cw / 20, y + 3, 1, ch - 6);
        ctx.fillStyle = '#8995b9';
        ctx.fillRect(x + 2, y + ch * .52, cw - 4, 1.8);
        ctx.fillStyle = '#c5bcc7';
        ctx.fillRect(x + cw * .5, y + 1, 1.5, ch - 2);
      }
    }
  });
  const photovoltaic = coated(0xffffff, .44, .29, { map: pvTexture });
  photovoltaic.userData.softwareColor = 0x233b88;
  const backFinish = coated(0x34383e, .67, .42);
  const stamp = paintTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d9d9cb'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#192127'; ctx.font = 'bold 104px Arial';
    ctx.fillText('TF–30', 24, 121);
    ctx.fillRect(24, 141, 453, 5);
    ctx.font = '35px monospace'; ctx.fillText('ORBITAL SYSTEMS', 26, 195);
  });
  const label = coated(0xffffff, .23, .53, { map: stamp });

  function add(geometry, material, x = 0, y = 0, z = 0, parent = assembly) {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function box(x, y, z, w, h, d, mat, group = assembly) {
    return add(new T.BoxGeometry(w, h, d), mat, x, y, z, group);
  }
  function plate(x, y, z, w, h, mat, group = assembly) {
    return add(new T.PlaneGeometry(w, h), mat, x, y, z, group);
  }
  function rod(start, end, radius, mat, group = assembly, sides = 10, topRadius = radius) {
    const a = vec(...start), b = vec(...end), dir = b.clone().sub(a);
    const mesh = add(new T.CylinderGeometry(topRadius, radius, dir.length(), sides), mat, 0, 0, 0, group);
    mesh.position.copy(a.addScaledVector(dir, .5));
    mesh.quaternion.setFromUnitVectors(vec(0, 1, 0), dir.normalize());
    return mesh;
  }
  function zDrum(x, y, z, radius, depth, mat, sides = 48) {
    return rod([x,y,z - depth * .5], [x,y,z + depth * .5], radius, mat, assembly, sides);
  }
  function wire(points, radius, mat, group = assembly) {
    add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => vec(...p))), 16, radius, 6, false), mat, 0, 0, 0, group);
  }

  // Thermal blankets are individually tessellated. Alternating diagonals and folded
  // foil ridges catch the changing studio reflections as the visitor turns the craft.
  function blanket(width, height, center, euler) {
    const nx = Math.ceil(width * 19), ny = Math.ceil(height * 19);
    const verts = [];
    const grid = [];
    const ridges = Array.from({ length: 12 }, () => ({
      x: (random() - .5) * width, y: (random() - .5) * height, angle: random() * TAU
    }));
    for (let y = 0; y <= ny; y++) {
      for (let x = 0; x <= nx; x++) {
        const edge = x === 0 || x === nx || y === 0 || y === ny;
        const u = (x / nx - .5) * width + (edge ? 0 : (random() - .5) * .03);
        const v = (y / ny - .5) * height + (edge ? 0 : (random() - .5) * .03);
        let relief = .007 * random();
        ridges.forEach(r => {
          const dist = Math.abs((u - r.x) * Math.cos(r.angle) + (v - r.y) * Math.sin(r.angle));
          relief += .038 * Math.exp(-dist * 27);
        });
        grid.push([u, v, edge ? 0 : relief]);
      }
    }
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const i = y * (nx + 1) + x, j = i + nx + 1;
        const ids = random() < .5 ? [i,i+1,j+1,i,j+1,j] : [i,i+1,j,i+1,j+1,j];
        ids.forEach(v => verts.push(...grid[v]));
      }
    }
    const geom = new T.BufferGeometry();
    geom.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
    geom.computeVertexNormals();
    const mesh = add(geom, gold, ...center);
    mesh.rotation.set(...euler);
  }

  // Instrument body with a multilayer thermal blanket and an optical payload.
  box(0,0,0, 2.12,1.65,1.58,black);
  blanket(2.08,1.57,[0,0,.8],[0,0,0]);
  blanket(2.08,1.57,[0,0,-.8],[0,Math.PI,0]);
  blanket(1.55,1.57,[1.07,0,0],[0,Math.PI/2,0]);
  blanket(1.55,1.57,[-1.07,0,0],[0,-Math.PI/2,0]);
  blanket(2.08,1.55,[0,.83,0],[-Math.PI/2,0,0]);
  blanket(2.08,1.55,[0,-.83,0],[Math.PI/2,0,0]);
  for (const x of [-1.08,1.08]) {
    for (const y of [-.85,.85]) box(x,y,0,.1,.095,1.78,alloy);
    for (const z of [-.84,.84]) {
      box(x,0,z,.115,1.78,.095,alloy);
      for (const y of [-.85,.85]) {
        box(x,y,z,.17,.18,.15,darkAlloy);
        zDrum(x,y,z + Math.sign(z) * .077,.035,.017,alloy,8);
      }
    }
  }
  for (const y of [-.85,.85]) {
    for (const z of [-.84,.84]) box(0,y,z,2.23,.105,.09,alloy);
  }
  // Aperture block, machined retaining rings, and recessed layered optics.
  const opticX = -.21, opticY = -.02;
  zDrum(opticX,opticY,.91,.699,.18,black,12);
  zDrum(opticX,opticY,1.075,.657,.28,orange,48);
  for (const z of [.983,1.005,1.155,1.182]) zDrum(opticX,opticY,z,.666,.014,goldRail);
  for (let i = 0; i < 16; i++) {
    const a = i * TAU/16, x = opticX + Math.cos(a) * .651, y = opticY + Math.sin(a) * .651;
    const ridge = box(x,y,1.082,.031,.047,.114,orange);
    ridge.rotation.z = a;
  }
  zDrum(opticX,opticY,1.215,.624,.058,darkAlloy);
  zDrum(opticX,opticY,1.251,.554,.047,alloy);
  zDrum(opticX,opticY,1.283,.473,.047,black);
  zDrum(opticX,opticY,1.311,.377,.02,glassTint);
  zDrum(opticX,opticY,1.323,.314,.013,glass,60);
  add(new T.CircleGeometry(.307,64),lensSurface,opticX,opticY,1.332);
  for (let i = 0; i < 12; i++) {
    const a = i * TAU/12;
    zDrum(opticX+Math.cos(a)*.505,opticY+Math.sin(a)*.505,1.279,.02,.014,black,6);
  }
  // A compact engraved equipment ID, thermal louvers, and neatly clipped cable runs.
  box(.745,.37,.879,.47,.255,.064,black);
  plate(.745,.37,.915,.43,.216,label);
  box(.744,-.243,.886,.43,.48,.084,darkAlloy);
  for (let i = 0; i < 9; i++) box(.744,-.443 + i*.052,.943,.375,.02,.048,alloy);
  for (const s of [-1,1]) {
    box(s*1.105,-.27,-.03,.09,.58,1.24,black);
    for (let i=0; i<12; i++) box(s*1.174,-.255,-.573+i*.099,.12,.52,.034,darkAlloy);
    wire([[s*.83,-.68,.88],[s*.94,-.68,.91],[s*1.11,-.51,.6],[s*1.15,-.4,.44]],.027,black);
    for (const y of [.4,.49]) {
      wire([[s*1.13,y,-.65],[s*1.16,y,-.42],[s*1.16,y,.22],[s*1.18,y-.1,.45],[s*1.19,y-.16,.62]],.021,alloy);
      for (const z of [-.37,.17]) box(s*1.184,y,z,.031,.075,.066,darkAlloy);
    }
    for (const z of [-.55,.55]) {
      rod([s*1.1,.648,z],[s*1.143,.648,z],.086,goldRail,assembly,8);
      rod([s*1.144,.648,z],[s*1.153,.648,z],.035,black,assembly,8);
    }
  }
  for (const x of [-.8,.74]) {
    box(x,-.902,.04,.33,.11,.48,darkAlloy);
    rod([x,-.93,.04],[x,-1.1,.04],.105,black,assembly,16,.173);
  }
  for (let i=0; i<4; i++) box(-.68 + i*.36,.891,-.46,.23,.055,.33,black);

  // Hinged photovoltaic arrays. Raised frames remain visible at grazing angles.
  for (const side of [-1,1]) {
    rod([side*1.065,.17,-.18],[side*1.71,.17,-.18],.143,darkAlloy,assembly,16);
    for (let i=0; i<4; i++) {
      rod([side*(1.17+i*.108),.17,-.18],[side*(1.224+i*.108),.17,-.18],.176,i===1?orange:alloy,assembly,20);
    }
    for (let j=0; j<2; j++) {
      const wing = new T.Group();
      const w = 1.59, h = 1.76;
      wing.position.set(side*(2.41+j*1.653),.17,-.18);
      wing.rotation.set(-.32,side*.067,0);
      assembly.add(wing);
      box(0,0,0,w,h,.065,backFinish,wing);
      plate(0,0,.04,w-.075,h-.075,photovoltaic,wing);
      for (const sy of [-1,1]) box(0,sy*h*.5,.022,w+.017,.033,.082,alloy,wing);
      for (const sx of [-1,1]) box(sx*w*.5,0,.022,.033,h+.016,.082,alloy,wing);
      for (const sy of [-1,1]) {
        rod([-w*.48,sy*h*.44,-.062],[w*.48,-sy*h*.44,-.062],.018,alloy,wing,7);
        for (const sx of [-1,1]) box(sx*(w*.5-.035),sy*(h*.5-.032),.063,.075,.071,.026,darkAlloy,wing);
      }
      if (j === 0) {
        for (const y of [-.62,.62]) {
          box(side*(w*.5+.034),y,.008,.155,.117,.094,darkAlloy,wing);
          rod([side*(w*.5+.034),y-.096,.02],[side*(w*.5+.034),y+.096,.02],.038,goldRail,wing,10);
        }
      }
    }
  }

  // Parabolic communications dish with a metallic rear shell and tripod feed.
  rod([.16,.83,-.07],[.24,1.35,-.08],.135,alloy);
  const dish = new T.Group();
  dish.position.set(.24,1.28,-.08);
  dish.quaternion.setFromUnitVectors(vec(0,1,0),vec(-.10,.63,.82).normalize());
  assembly.add(dish);
  const radius = .85, depth = .255;
  function reflector(rad, depthOffset, mat, reverse) {
    const pts = Array.from({ length: 13 },(_,i) => {
      const t = (reverse ? 12-i : i)/12;
      return new T.Vector2(Math.max(.001,t*rad), depth*t*t+depthOffset);
    });
    return add(new T.LatheGeometry(pts,64), mat,0,0,0,dish);
  }
  reflector(radius,0,white,true);
  reflector(radius,-.047,alloy,false);
  const rim = add(new T.TorusGeometry(radius,.024,8,72),alloy,0,depth-.018,0,dish);
  rim.rotation.x = Math.PI/2;
  for (let i=0; i<8; i++) {
    const a = i*TAU/8, x = Math.cos(a), z = Math.sin(a);
    rod([x*.14,-.06,z*.14],[x*radius,depth-.057,z*radius],.013,darkAlloy,dish,6);
  }
  for (let i=0; i<3; i++) {
    const a = i*TAU/3+.31;
    rod([Math.cos(a)*.66,depth*.61,Math.sin(a)*.66],[0,.672,0],.015,darkAlloy,dish,8);
  }
  rod([0,.63,0],[0,.76,0],.061,alloy,dish,14);
  rod([0,.755,0],[0,.82,0],.046,goldRail,dish,14);
  // Offset telemetry antenna and a fine boom with two counterbalance elements.
  rod([-.83,.845,-.5],[-.96,1.44,-.52],.043,alloy);
  rod([-.96,1.44,-.52],[-1.08,1.99,-.54],.019,alloy);
  rod([-1.08,1.99,-.54],[-1.1,2.07,-.544],.026,orange);
  rod([.91,-.65,-.72],[1.31,-1.30,-1.31],.037,darkAlloy);
  rod([1.31,-1.30,-1.31],[1.6,-1.72,-1.7],.02,alloy);

  // Bake the static assembly into material batches to keep draw calls low on mobile.
  function batchMeshes() {
    assembly.updateMatrixWorld(true);
    const batches = new Map();
    assembly.traverse(mesh => {
      if (!mesh.isMesh) return;
      const source = mesh.geometry;
      const geom = source.index ? source.toNonIndexed() : source.clone();
      geom.applyMatrix4(mesh.matrixWorld);
      let data = batches.get(mesh.material);
      if (!data) {
        data = { position:[], normal:[], uv:[] };
        batches.set(mesh.material,data);
      }
      for (const key of ['position','normal','uv']) {
        const attr = geom.getAttribute(key);
        if (attr) {
          for (let i=0; i<attr.array.length; i++) data[key].push(attr.array[i]);
        } else if (key === 'uv') {
          for (let i=0; i<geom.getAttribute('position').count; i++) data.uv.push(0,0);
        }
      }
      geom.dispose();
      source.dispose();
    });
    for (const [material,data] of batches) {
      const geometry = new T.BufferGeometry();
      for (const key of ['position','normal','uv']) {
        geometry.setAttribute(key,new T.Float32BufferAttribute(data[key],key==='uv'?2:3));
      }
      const mesh = new T.Mesh(geometry,material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      model.add(mesh);
    }
  }
  batchMeshes();

  const camera = new T.OrthographicCamera(-5,5,3,-3,.1,80);
  camera.position.set(5.6,5.3,12.8);
  camera.lookAt(0,.08,0);
  const hemi = new T.HemisphereLight(0xfffaf1,0x777d83,1.2);
  scene.add(hemi);
  const key = new T.DirectionalLight(0xffeedb,2.05);
  key.position.set(-3,7,5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-6,right:6,top:4,bottom:-4,near:.1,far:24});
  key.shadow.normalBias = .016;
  key.shadow.bias = -.00025;
  scene.add(key);
  const rimLight = new T.DirectionalLight(0xdfeaff,2.1);
  rimLight.position.set(5,3,-4);
  scene.add(rimLight);

  // Large softbox cards and a dark studio floor give alloy and gold readable reflections.
  function studio(renderer) {
    const map = paintTexture(1024,512,(ctx,w,h) => {
      const sky = ctx.createLinearGradient(0,0,0,h);
      sky.addColorStop(0,'#fffaf2'); sky.addColorStop(.2,'#f0eee6');
      sky.addColorStop(.47,'#929993'); sky.addColorStop(.5,'#363d40');
      sky.addColorStop(.68,'#354049'); sky.addColorStop(1,'#a4a29a');
      ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#fffefa'; ctx.fillRect(35,65,192,160); ctx.fillRect(615,105,155,106);
      ctx.fillStyle='#24262a'; ctx.fillRect(274,122,112,148); ctx.fillRect(849,161,76,84);
      ctx.fillStyle='#ecf4ff'; ctx.fillRect(353,50,222,28); ctx.fillRect(922,76,59,138);
      ctx.fillStyle='#d4c9b6'; ctx.fillRect(121,326,284,70);
    });
    map.mapping = T.EquirectangularReflectionMapping;
    const generator = new T.PMREMGenerator(renderer);
    const env = generator.fromEquirectangular(map);
    scene.environment = env.texture;
    map.dispose(); generator.dispose();
    return env;
  }

  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer = null, software = null, environment = null;
  try {
    const context = canvas.getContext('webgl2',{ alpha:true, antialias:true, premultipliedAlpha:true })
      || canvas.getContext('webgl',{ alpha:true, antialias:true, premultipliedAlpha:true });
    if (context) {
      renderer = new T.WebGLRenderer({canvas,context,alpha:true,antialias:true});
      renderer.setClearColor(0xffffff,0);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      environment = studio(renderer);
    }
  } catch (_) { renderer = null; }
  if (!renderer) software = createSoftwareRenderer();
  stage.dataset.renderer = renderer ? 'webgl' : 'canvas';

  function createSoftwareRenderer() {
    // A software depth buffer keeps even the far side of a thin array properly
    // occluded. The GPU and CPU paths share geometry, UVs, and canvas textures.
    let ctx = canvas.getContext('2d', { alpha:true });
    if (!ctx) {
      const fresh=canvas.cloneNode(false);
      canvas.replaceWith(fresh);
      canvas=fresh;
      ctx=canvas.getContext('2d', {alpha:true});
    }
    const matrix=new T.Matrix4(), normalMatrix=new T.Matrix3();
    const normal=new T.Vector3(), point=new T.Vector3();
    const light=vec(-.34,.73,.59).normalize();
    const view=camera.position.clone().normalize();
    const halfway=view.clone().add(light).normalize();
    const batches=model.children.map(mesh=>{
      const geom=mesh.geometry, mat=mesh.material;
      let surface=null;
      if (mat.map) {
        const source=mat.map.image;
        const sampler=document.createElement('canvas');
        sampler.width=Math.min(240,source.width);
        sampler.height=Math.round(sampler.width*source.height/source.width);
        const samplerContext=sampler.getContext('2d');
        samplerContext.imageSmoothingQuality='high';
        samplerContext.drawImage(source,0,0,sampler.width,sampler.height);
        surface=samplerContext.getImageData(0,0,sampler.width,sampler.height);
      }
      const tint=mat.color.getHex();
      const pos=geom.attributes.position;
      const faceNormals=new Float32Array(pos.count);
      const cross=new T.Vector3(), a=new T.Vector3(), b=new T.Vector3();
      for (let i=0; i<pos.count; i+=3) {
        point.fromBufferAttribute(pos,i);
        a.fromBufferAttribute(pos,i+1).sub(point); b.fromBufferAttribute(pos,i+2).sub(point);
        cross.copy(a).cross(b).normalize().toArray(faceNormals,i);
      }
      return {pos:pos.array,faceNormals,uv:geom.attributes.uv.array,surface,
        rgb:[tint>>16,(tint>>8)&255,tint&255],metal:mat.metalness||0,
        smooth:!mat.flatShading, normals:geom.attributes.normal.array,
        unlit:!!mat.isMeshBasicMaterial};
    });
    let output=null, depth=null;
    const sx=new Float32Array(3),sy=new Float32Array(3),sz=new Float32Array(3);
    return function drawSoftware() {
      const w=canvas.width,h=canvas.height;
      if (!ctx || !w || !h) return;
      if (!output || output.width!==w || output.height!==h) {
        output=ctx.createImageData(w,h);
        depth=new Float32Array(w*h);
      }
      depth.fill(Infinity);
      const pixels=output.data;
      pixels.fill(0);
      model.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(model.matrixWorld);
      normalMatrix.getNormalMatrix(model.matrixWorld);
      const m=matrix.elements;
      for (const batch of batches) {
        const {pos,uv,rgb,surface,faceNormals,normals}=batch;
        for (let i=0; i<pos.length; i+=9) {
          const face=i/3;
          normal.fromArray(faceNormals,face).applyMatrix3(normalMatrix);
          if (normal.dot(view)<=0) continue;
          if (batch.smooth) normal.set(normals[i]+normals[i+3]+normals[i+6],
            normals[i+1]+normals[i+4]+normals[i+7],normals[i+2]+normals[i+5]+normals[i+8])
            .applyMatrix3(normalMatrix).normalize();
          const luma=batch.unlit?1:.54+Math.max(0,normal.dot(light))*.59;
          const gloss=batch.unlit?0:Math.pow(Math.max(0,normal.dot(halfway)),22)*batch.metal*71;
          for (let v=0; v<3; v++) {
            const n=i+v*3,x=pos[n],y=pos[n+1],z=pos[n+2];
            sx[v]=((x*m[0]+y*m[4]+z*m[8]+m[12])*.5+.5)*w;
            sy[v]=(.5-(x*m[1]+y*m[5]+z*m[9]+m[13])*.5)*h;
            sz[v]=x*m[2]+y*m[6]+z*m[10]+m[14];
          }
          const left=Math.max(0,Math.floor(Math.min(...sx))), right=Math.min(w-1,Math.ceil(Math.max(...sx)));
          const top=Math.max(0,Math.floor(Math.min(...sy))), bottom=Math.min(h-1,Math.ceil(Math.max(...sy)));
          const x1=sx[1]-sx[0],x2=sx[2]-sx[0],y1=sy[1]-sy[0],y2=sy[2]-sy[0];
          const area=x1*y2-y1*x2;
          if (Math.abs(area)<.0001) continue;
          const dxB=y2/area, dxC=-y1/area, texIndex=face*2;
          const r=rgb[0]*luma+gloss,g=rgb[1]*luma+gloss,b=rgb[2]*luma+gloss;
          for (let y=top; y<=bottom; y++) {
            const dy=y+.5-sy[0],dx=left+.5-sx[0];
            let wb=(dx*y2-dy*x2)/area, wc=(dy*x1-dx*y1)/area;
            for (let x=left; x<=right; x++,wb+=dxB,wc+=dxC) {
              const wa=1-wb-wc;
              if (wa<-.0001 || wb<-.0001 || wc<-.0001) continue;
              const d=wa*sz[0]+wb*sz[1]+wc*sz[2],index=y*w+x;
              if (d>=depth[index]) continue;
              depth[index]=d;
              const out=index*4;
              if (surface) {
                const u=wa*uv[texIndex]+wb*uv[texIndex+2]+wc*uv[texIndex+4];
                const v=wa*uv[texIndex+1]+wb*uv[texIndex+3]+wc*uv[texIndex+5];
                const tx=Math.min(surface.width-1,Math.max(0,Math.floor(u*surface.width)));
                const ty=Math.min(surface.height-1,Math.max(0,Math.floor((1-v)*surface.height)));
                const tex=(ty*surface.width+tx)*4;
                pixels[out]=surface.data[tex]*luma+gloss; pixels[out+1]=surface.data[tex+1]*luma+gloss;
                pixels[out+2]=surface.data[tex+2]*luma+gloss;
              } else {pixels[out]=r;pixels[out+1]=g;pixels[out+2]=b;}
              pixels[out+3]=255;
            }
          }
        }
      }
      ctx.putImageData(output,0,0);
    };
  }

  let width = 0, height = 0, handle = 0, visible = true;
  let yaw = 0, pitch = 0, targetYaw = 0, targetPitch = 0;
  let phase = 0, last = 0, scroll = 0, motionScroll = 0, manualPause = media.matches, dirty = true;
  let pointer = null, drag = false, startX = 0, startY = 0, initialYaw = 0, initialPitch = 0;
  const softwareIdle = !renderer;
  function wake() {
    dirty = true;
    if (!handle && visible && !document.hidden) handle=requestAnimationFrame(frame);
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;
    width=bounds.width; height=bounds.height;
    const aspect = width/height;
    const halfHeight = Math.max(2.55,4.90/aspect);
    Object.assign(camera,{left:-halfHeight*aspect,right:halfHeight*aspect,top:halfHeight,bottom:-halfHeight});
    camera.updateProjectionMatrix();
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,width<600?1.75:2));
      renderer.setSize(width,height,false);
    } else {
      const scale=Math.min(1,900/width);
      canvas.width=Math.round(width*scale); canvas.height=Math.round(height*scale);
    }
    wake();
  }
  function frame(now) {
    handle=0;
    if (!visible || document.hidden || !width) return;
    const delta = last ? Math.min((now-last)/1000,.06) : 0;
    last=now;
    const motion = !manualPause;
    const ease = !motion || softwareIdle ? 1 : 1-Math.exp(-delta*11);
    if (motion && !drag && !softwareIdle) phase += delta;
    yaw += (targetYaw-yaw)*ease;
    pitch += (targetPitch-pitch)*ease;
    const free = motion && !softwareIdle;
    model.rotation.order='ZXY';
    if (motion) motionScroll=scroll;
    model.rotation.set(.11+pitch+Math.sin(phase*.35)*.023,
      -.17+yaw+motionScroll*.34+Math.sin(phase*.25)*.075,
      .52+motionScroll*.10+Math.sin(phase*.29)*.016,'ZXY');
    model.position.y = -.035+Math.sin(phase*.52)*.035;
    if (renderer) {
      renderer.shadowMap.needsUpdate = dirty || drag;
      renderer.render(scene,camera);
    } else if (dirty) software();
    dirty=false;
    if (free || Math.abs(yaw-targetYaw)+Math.abs(pitch-targetPitch)>.001) handle=requestAnimationFrame(frame);
  }
  function updateScroll() {
    const rect=stage.getBoundingClientRect();
    scroll=Math.min(1, Math.max(0, -rect.top/Math.max(1,rect.height)));
    wake();
  }
  const clampPitch = v => Math.max(-1.05,Math.min(1.05,v));
  function step(direction) { targetYaw+=Math.sign(direction)*Math.PI/5; wake(); }
  function reset() { targetYaw=targetPitch=0; phase=0; wake(); }
  function setPaused(paused) { manualPause=Boolean(paused); wake(); }
  canvas.style.touchAction='pan-y';
  canvas.addEventListener('pointerdown',e=>{
    if (!e.isPrimary || e.button!==0) return;
    pointer=e.pointerId; startX=e.clientX; startY=e.clientY;
    initialYaw=targetYaw; initialPitch=targetPitch; drag=e.pointerType!=='touch';
    if (drag) {canvas.setPointerCapture(pointer); canvas.style.cursor='grabbing';}
  });
  canvas.addEventListener('pointermove',e=>{
    if (e.pointerId!==pointer) return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if (!drag) {
      if (Math.abs(dx)<7 || Math.abs(dx)<Math.abs(dy)*1.12) return;
      drag=true; canvas.setPointerCapture(pointer); canvas.style.cursor='grabbing';
    }
    targetYaw=initialYaw+dx*.011; targetPitch=clampPitch(initialPitch+dy*.008);
    wake();
  });
  function release(e) {
    if (pointer!==e.pointerId) return;
    if (canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
    pointer=null; drag=false; canvas.style.cursor=''; wake();
  }
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('keydown',e=>{
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)) return;
    e.preventDefault();
    if (e.key==='Home') reset();
    else if (e.key==='ArrowLeft' || e.key==='ArrowRight') step(e.key==='ArrowLeft'?-1:1);
    else { targetPitch=clampPitch(targetPitch+(e.key==='ArrowUp'?.22:-.22)); wake(); }
  });
  window.orbitSatellite={reset,step,setPaused};
  window.addEventListener('scroll',updateScroll,{passive:true});
  const visibility = new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if (visible) {last=0; wake();}
    else {cancelAnimationFrame(handle);handle=0;}
  });
  visibility.observe(stage);
  new ResizeObserver(resize).observe(canvas);
  media.addEventListener('change',e=>setPaused(e.matches));
  document.addEventListener('visibilitychange',()=>{if (!document.hidden) {last=0;wake();}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault(); visible=false; cancelAnimationFrame(handle); handle=0;});
  canvas.addEventListener('webglcontextrestored',()=>{
    if (environment) environment.dispose();
    environment=studio(renderer);
    renderer.shadowMap.needsUpdate=true; visible=true; resize();
  });
  resize();
  stage.dispatchEvent(new CustomEvent('orbit:ready',{bubbles:true,detail:{renderer:stage.dataset.renderer}}));
})();
