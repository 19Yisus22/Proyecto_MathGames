const state = { nodes: [], edges: [], nextNodeId:1, selected:null, edgeMode:false, deleteMode:false, dragMode:true, colorMode:true, pathMode:false, selectedForEdge:null, selectedPath:[] };
const COLORS=["#EF4444","#F59E0B","#10B981","#3B82F6","#8B5CF6","#06B6D4","#F472B6","#A3E635"];
const svg = document.getElementById('svg'); const status = document.getElementById('status'); const paletteDiv = document.getElementById('palette');

function setStatus(){ 
  let modes = [];
  if(state.dragMode) modes.push('Mover');
  if(state.colorMode) modes.push('Pintar');
  if(state.edgeMode) modes.push('Conectar');
  if(state.deleteMode) modes.push('Eliminar');
  if(state.pathMode) modes.push('Buscar Camino');
  status.textContent = modes.length ? 'Modo: ' + modes.join(' • ') : 'Listo';
}

document.getElementById('addNodeBtn').addEventListener('click', ()=>{ addNodeAt(svg.clientWidth/2, svg.clientHeight/2); render(); });

const edgeModeBtn = document.getElementById('edgeModeBtn');
edgeModeBtn.addEventListener('click', ()=>{ 
  state.edgeMode=!state.edgeMode; 
  edgeModeBtn.classList.toggle('active', state.edgeMode);
  edgeModeBtn.innerHTML = state.edgeMode ? '<i class="bi bi-bezier2-fill"></i> Modo: Conectando' : '<i class="bi bi-bezier2"></i> Conectar Puntos';
  setStatus(); 
});

const deleteModeBtn = document.getElementById('deleteModeBtn');
deleteModeBtn.addEventListener('click', ()=>{ 
  state.deleteMode=!state.deleteMode; 
  deleteModeBtn.classList.toggle('active', state.deleteMode);
  deleteModeBtn.innerHTML = state.deleteMode ? '<i class="bi bi-trash-fill"></i> Modo: Eliminando' : '<i class="bi bi-trash"></i> Eliminar';
  setStatus();
});

const dragModeBtn = document.getElementById('dragModeBtn');
dragModeBtn.addEventListener('click', ()=>{ 
  state.dragMode=!state.dragMode; 
  dragModeBtn.classList.toggle('active', state.dragMode);
  dragModeBtn.innerHTML = state.dragMode ? '<i class="bi bi-arrows-move"></i> Mover: Activo' : '<i class="bi bi-arrows-move"></i> Mover Puntos';
  setStatus(); 
});

const colorModeBtn = document.getElementById('colorModeBtn');
colorModeBtn.addEventListener('click', ()=>{ 
  state.colorMode=!state.colorMode; 
  colorModeBtn.classList.toggle('active', state.colorMode);
  colorModeBtn.innerHTML = state.colorMode ? '<i class="bi bi-palette-fill"></i> Pintar: Activo' : '<i class="bi bi-palette"></i> Pintar Puntos';
  setStatus(); 
});

document.getElementById('autoColorBtn').addEventListener('click', ()=>{ autoColor(); render(); showToast('Coloración automática aplicada','success'); });
document.getElementById('checkColorBtn').addEventListener('click', ()=>{ const bad=checkColoring(); if(!bad.length) showToast('¡Perfecto! Todos los puntos conectados tienen colores diferentes','success'); else showToast('Hay '+bad.length+' conexión(es) con el mismo color','danger'); render(); });
document.getElementById('clearBtn').addEventListener('click', ()=>{ if(confirm('¿Borrar todo el grafo?')){ state.nodes=[]; state.edges=[]; state.nextNodeId=1; render(); showToast('Grafo reiniciado','info'); } });

const pathModeBtn = document.getElementById('pathModeBtn');
pathModeBtn.addEventListener('click', ()=>{ 
  state.pathMode=!state.pathMode; 
  pathModeBtn.classList.toggle('active', state.pathMode);
  pathModeBtn.innerHTML = state.pathMode ? '<i class="bi bi-arrow-left-right"></i> Selecciona 2 puntos' : '<i class="bi bi-arrow-left-right"></i> Buscar Camino';
  if(!state.pathMode) state.selectedPath=[]; 
  render(); 
  setStatus();
});

document.getElementById('clearPathBtn').addEventListener('click', ()=>{ state.selectedPath=[]; render(); showToast('Camino borrado','info'); });

let currentPaletteColor = COLORS[0];
COLORS.forEach((c,i)=>{ 
  const d = document.createElement('div'); 
  d.className='color-dot'; 
  if(i===0) d.classList.add('active');
  d.style.background=c; 
  d.title='Color '+(i+1); 
  d.addEventListener('click', ()=>{ 
    document.querySelectorAll('.color-dot').forEach(x=>x.classList.remove('active'));
    d.classList.add('active');
    currentPaletteColor=c; 
  }); 
  paletteDiv.appendChild(d); 
});

function addNodeAt(x,y){ const node={id:state.nextNodeId++, x,y, color:null}; state.nodes.push(node); updateMetrics(); showToast('Punto '+node.id+' agregado','info'); }
function addEdge(u,v){ if(u===v) return; if(state.edges.some(e=> (e.u===u&&e.v===v)||(e.u===v&&e.v===u))) return; state.edges.push({id:'e'+(state.edges.length+1), u,v}); updateMetrics(); showToast('Conexión creada','success'); }
function removeNode(id){ state.edges = state.edges.filter(e=> e.u!==id && e.v!==id); state.nodes = state.nodes.filter(n=> n.id!==id); updateMetrics(); showToast('Punto eliminado','warning'); }
function removeEdgeBetween(u,v){ state.edges = state.edges.filter(e=> !( (e.u===u&&e.v===v) || (e.u===v&&e.v===u) )); updateMetrics(); }
function updateMetrics(){ 
  document.getElementById('nodeCount').textContent = state.nodes.length; 
  document.getElementById('edgeCount').textContent = state.edges.length; 
  document.getElementById('components').textContent = countComponents(); 
}
function countComponents(){ const adj=buildAdj(); const visited=new Set(); let c=0; for(const n of state.nodes){ if(!visited.has(n.id)){ c++; const q=[n.id]; visited.add(n.id); while(q.length){ const u=q.pop(); (adj[u]||[]).forEach(v=>{ if(!visited.has(v)){ visited.add(v); q.push(v); } }); } } } return c; }
function buildAdj(){ const adj={}; state.nodes.forEach(n=>adj[n.id]=[]); state.edges.forEach(e=>{ if(adj[e.u]) adj[e.u].push(e.v); if(adj[e.v]) adj[e.v].push(e.u); }); return adj; }

function render(){ 
  svg.innerHTML=''; 
  state.edges.forEach(e=>{ 
    const u=state.nodes.find(n=>n.id===e.u); 
    const v=state.nodes.find(n=>n.id===e.v); 
    if(!u||!v) return; 
    const line=document.createElementNS('http://www.w3.org/2000/svg','line'); 
    line.setAttribute('x1',u.x); 
    line.setAttribute('y1',u.y); 
    line.setAttribute('x2',v.x); 
    line.setAttribute('y2',v.y); 
    line.setAttribute('stroke-width',3); 
    line.setAttribute('stroke-linecap','round'); 
    line.setAttribute('stroke','#2b3947'); 
    if(u.color && v.color && u.color===v.color) line.setAttribute('stroke','#ff6b6b'); 
    svg.appendChild(line); 
  });
  
  if(state.selectedPath && state.selectedPath.length>1){ 
    for(let i=0;i<state.selectedPath.length-1;i++){ 
      const a=state.selectedPath[i], b=state.selectedPath[i+1]; 
      const u=state.nodes.find(n=>n.id===a); 
      const v=state.nodes.find(n=>n.id===b); 
      if(u&&v){ 
        const l=document.createElementNS('http://www.w3.org/2000/svg','line'); 
        l.setAttribute('x1',u.x); 
        l.setAttribute('y1',u.y); 
        l.setAttribute('x2',v.x); 
        l.setAttribute('y2',v.y); 
        l.setAttribute('stroke','#ffd166'); 
        l.setAttribute('stroke-width',6); 
        l.setAttribute('stroke-linecap','round'); 
        svg.appendChild(l); 
      } 
    } 
  }
  
  state.nodes.forEach(n=>{ 
    const g=document.createElementNS('http://www.w3.org/2000/svg','g'); 
    g.setAttribute('transform',`translate(${n.x},${n.y})`); 
    g.style.cursor='pointer'; 
    const shadow=document.createElementNS('http://www.w3.org/2000/svg','circle'); 
    shadow.setAttribute('r',20); 
    shadow.setAttribute('fill','#071426'); 
    shadow.setAttribute('stroke','rgba(255,255,255,0.02)'); 
    shadow.setAttribute('stroke-width',1); 
    g.appendChild(shadow); 
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle'); 
    c.setAttribute('r',18); 
    c.setAttribute('fill', n.color || '#0b1220'); 
    c.setAttribute('stroke', '#1f2937'); 
    c.setAttribute('stroke-width',2); 
    g.appendChild(c); 
    const t=document.createElementNS('http://www.w3.org/2000/svg','text'); 
    t.setAttribute('y',6); 
    t.setAttribute('text-anchor','middle'); 
    t.setAttribute('font-size',12); 
    t.setAttribute('class','node-label'); 
    t.textContent=n.id; 
    g.appendChild(t); 
    g.addEventListener('mousedown',(ev)=>{ ev.stopPropagation(); onNodeMouseDown(ev,n); }); 
    g.addEventListener('click',(ev)=>{ ev.stopPropagation(); onNodeClick(ev,n); }); 
    svg.appendChild(g); 
  }); 
  updateMetrics(); 
  setStatus(); 
}

let drag=null; 
function onNodeMouseDown(ev,node){ 
  if(!state.dragMode) return; 
  drag={node, ox:ev.clientX, oy:ev.clientY}; 
  window.addEventListener('mousemove', onMouseMove); 
  window.addEventListener('mouseup', onMouseUp); 
}
function onMouseMove(ev){ 
  if(!drag) return; 
  const dx=ev.clientX - drag.ox; 
  const dy=ev.clientY - drag.oy; 
  drag.ox = ev.clientX; 
  drag.oy = ev.clientY; 
  drag.node.x += dx; 
  drag.node.y += dy; 
  drag.node.x = Math.max(24, Math.min(svg.clientWidth-24, drag.node.x)); 
  drag.node.y = Math.max(24, Math.min(svg.clientHeight-24, drag.node.y)); 
  render(); 
}
function onMouseUp(){ 
  drag=null; 
  window.removeEventListener('mousemove', onMouseMove); 
  window.removeEventListener('mouseup', onMouseUp); 
}

svg.addEventListener('click',(ev)=>{ 
  const rect=svg.getBoundingClientRect(); 
  const x=ev.clientX-rect.left; 
  const y=ev.clientY-rect.top; 
  if(state.deleteMode) return; 
  const hit=hitTest(x,y); 
  if(state.edgeMode || ev.shiftKey){ 
    if(!hit){ 
      addNodeAt(x,y); 
      render(); 
    }
  } else { 
    if(!hit){ 
      addNodeAt(x,y); 
      render(); 
    } 
  } 
});

function hitTest(x,y){ 
  for(let i=state.nodes.length-1;i>=0;i--){ 
    const n=state.nodes[i]; 
    const dx=x-n.x; 
    const dy=y-n.y; 
    if(Math.sqrt(dx*dx+dy*dy)<=20) return n; 
  } 
  return null; 
}

function onNodeClick(ev,node){ 
  if(state.deleteMode){ 
    if(confirm('¿Eliminar punto '+node.id+'?')){ 
      removeNode(node.id); 
      render(); 
    } 
    return; 
  }
  
  if(state.pathMode){ 
    if(!state.selectedPath.length){ 
      state.selectedPath.push(node.id); 
      showToast('Punto inicial: '+node.id+'. Selecciona el destino','info');
    } else if(state.selectedPath.length===1){ 
      state.selectedPath.push(node.id); 
      const path=bfsPath(state.selectedPath[0], state.selectedPath[1]); 
      if(path){ 
        state.selectedPath = path; 
        showToast('Camino encontrado: '+path.length+' puntos','success');
      } else { 
        showToast('No hay camino entre los puntos '+state.selectedPath[0]+' y '+node.id,'warning'); 
        state.selectedPath=[]; 
      } 
      render(); 
    } 
    return; 
  }
  
  if(state.edgeMode){ 
    if(!state.selectedForEdge){ 
      state.selectedForEdge = node; 
      highlightTemp(node); 
      showToast('Punto '+node.id+' seleccionado. Click en otro punto para conectar','info');
    } else { 
      if(state.selectedForEdge.id===node.id){ 
        state.selectedForEdge=null; 
        render(); 
        return; 
      } 
      addEdge(state.selectedForEdge.id, node.id); 
      state.selectedForEdge=null; 
      render(); 
    } 
    return; 
  }
  
  if(state.colorMode){ 
    node.color = node.color === currentPaletteColor ? null : currentPaletteColor; 
    render(); 
    return; 
  }
  
  state.selected = node; 
  showToast('Punto '+node.id+' seleccionado','secondary'); 
}

function highlightTemp(node){ 
  render(); 
  const circ=document.createElementNS('http://www.w3.org/2000/svg','circle'); 
  circ.setAttribute('r',22); 
  circ.setAttribute('cx',node.x); 
  circ.setAttribute('cy',node.y); 
  circ.setAttribute('fill','none'); 
  circ.setAttribute('stroke','#f59e0b'); 
  circ.setAttribute('stroke-width',3); 
  svg.appendChild(circ); 
}

function checkColoring(){ 
  const bad=[]; 
  state.edges.forEach(e=>{ 
    const u=state.nodes.find(n=>n.id===e.u); 
    const v=state.nodes.find(n=>n.id===e.v); 
    if(u&&v&&u.color&&v.color&&u.color===v.color) bad.push(e); 
  }); 
  return bad; 
}

function autoColor(){ 
  const adj=buildAdj(); 
  const order = state.nodes.slice().sort((a,b)=> (adj[b.id]?.length||0) - (adj[a.id]?.length||0)); 
  order.forEach(n=> n.color=null); 
  order.forEach(n=>{ 
    const used=new Set(); 
    (adj[n.id]||[]).forEach(nbId=>{ 
      const nb=state.nodes.find(x=>x.id===nbId); 
      if(nb&&nb.color) used.add(nb.color); 
    }); 
    const color = COLORS.find(c=> !used.has(c)); 
    n.color = color || COLORS[0]; 
  }); 
}

function bfsPath(srcId, dstId){ 
  const adj=buildAdj(); 
  const q=[srcId]; 
  const prev={}; 
  const seen=new Set([srcId]); 
  while(q.length){ 
    const u=q.shift(); 
    if(u===dstId) break; 
    (adj[u]||[]).forEach(v=>{ 
      if(!seen.has(v)){ 
        seen.add(v); 
        prev[v]=u; 
        q.push(v); 
      } 
    }); 
  } 
  if(!prev[dstId] && srcId!==dstId) return null; 
  const path=[]; 
  let cur=dstId; 
  while(cur!==undefined){ 
    path.push(cur); 
    if(cur===srcId) break; 
    cur=prev[cur]; 
  } 
  return path.reverse(); 
}

function downloadJSON(){ 
  const data={nodes:state.nodes, edges:state.edges}; 
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); 
  const url=URL.createObjectURL(blob); 
  const a=document.createElement('a'); 
  a.href=url; 
  a.download='mi_grafo.json'; 
  a.click(); 
  URL.revokeObjectURL(url); 
  showToast('Grafo descargado','success');
}

document.getElementById('exportBtn').addEventListener('click', downloadJSON);
document.getElementById('importFile').addEventListener('change',(e)=>{ 
  const f=e.target.files[0]; 
  if(!f) return; 
  const reader=new FileReader(); 
  reader.onload=()=>{ 
    try{ 
      const obj=JSON.parse(reader.result); 
      if(!obj.nodes||!obj.edges) return showToast('Archivo no válido','danger'); 
      state.nodes = obj.nodes; 
      state.edges = obj.edges; 
      state.nextNodeId = (state.nodes.reduce((m,n)=>Math.max(m,n.id),0) || 0) + 1; 
      render(); 
      showToast('Grafo cargado correctamente','success');
    }catch(err){ 
      showToast('Error al cargar archivo','danger') 
    } 
  }; 
  reader.readAsText(f); 
});

const toastContainer = document.getElementById('toastContainer'); 
function showToast(message,type='info'){ 
  const t=document.createElement('div'); 
  t.className=`toast show align-items-center text-bg-${type==='danger'?'danger':type==='success'?'success':type==='warning'?'warning':'secondary'} border-0`; 
  t.innerHTML=`<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`; 
  toastContainer.appendChild(t); 
  setTimeout(()=>t.remove(),3000); 
}

(function initDemo(){ 
  addNodeAt(140,120); 
  addNodeAt(340,120); 
  addNodeAt(240,260); 
  addNodeAt(520,200); 
  addNodeAt(420,360); 
  addEdge(1,2); 
  addEdge(1,3); 
  addEdge(2,3); 
  addEdge(2,4); 
  addEdge(3,5); 
  render(); 
})();

svg.addEventListener('mousedown',(ev)=>{ if(ev.target===svg){ state.selectedForEdge=null; render(); } }); 
svg.addEventListener('contextmenu',(e)=>e.preventDefault());