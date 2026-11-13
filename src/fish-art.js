// Native field-guide plates. All paths use the same 240 × 150 composition.
const MoonwaterPlates=(()=>{
 const plates={
  minnow:{
   body:'M50 86 C68 69 87 53 125 48 C153 44 181 46 203 58 Q209 61 201 66 C177 84 149 95 119 98 Q78 101 53 93Z',
   tail:'M55 83 Q35 82 17 62 Q15 77 26 88 Q16 101 14 115 Q39 109 57 93Z',
   fins:['M92 60 Q104 31 122 23 Q122 39 133 49Z','M88 96 Q77 113 69 114 L73 96Z','M133 86 Q128 106 109 112 Q116 97 118 88Z'],
   stripe:'M56 89 Q108 80 151 66 Q174 59 194 59',gill:'M165 53 Q159 68 170 77',eye:[187,58],
   palette:['#254956','#66aaa9','#e4eee0','#a6bfbd','#426976'],fin:'#98c5c2',ink:'#234851'
  },
  trout:{
   body:'M46 83 C75 66 98 42 140 39 Q171 35 198 46 L209 55 Q200 61 201 64 C179 74 173 85 146 93 Q99 111 52 94Z',
   tail:'M56 81 Q31 78 17 62 Q18 80 25 90 L14 111 Q34 110 57 94Z',
   fins:['M91 60 Q98 35 111 26 Q125 25 136 40Z','M67 77 L67 63 Q76 59 80 66Z','M81 97 Q73 115 64 116 L65 97Z','M142 83 Q137 104 119 111 Q124 96 124 87Z'],
   stripe:'M54 88 Q101 85 144 67 Q171 57 191 55',gill:'M167 43 Q155 61 170 76',eye:[187,50],
   palette:['#364842','#84988a','#f0d6b4','#e6a39a','#944f69'],fin:'#a69376',ink:'#3a4a47',marks:'spots'
  },
  carp:{
   body:'M50 85 Q71 53 99 42 Q132 26 157 37 Q181 42 193 57 Q206 58 204 66 L197 70 Q183 91 157 100 Q97 121 53 97Z',
   tail:'M58 83 Q29 84 16 60 Q16 84 26 94 Q18 109 16 124 Q41 117 61 95Z',
   fins:['M84 55 Q94 30 118 16 Q134 23 146 34 Q114 38 84 60Z','M76 99 Q68 119 60 118 L64 97Z','M147 85 Q141 113 120 120 Q119 104 127 89Z'],
   stripe:'M59 91 Q101 89 138 73 Q158 65 177 65',gill:'M164 44 Q151 62 166 84',eye:[183,57],
   palette:['#1b4c4a','#549f79','#e6ce89','#f0ca78','#558969'],fin:'#d4ac63',ink:'#285449',marks:'scales'
  },
  sailfish:{
   body:'M45 90 Q83 72 124 62 Q155 52 177 54 L194 57 L226 44 Q223 49 193 65 Q175 67 157 80 Q122 100 54 98Z',
   tail:'M57 87 Q37 79 21 48 Q20 72 33 91 Q22 103 12 124 Q36 114 58 98Z',
   fins:['M66 82 Q82 43 122 24 Q144 14 160 19 Q156 28 159 35 Q157 46 168 54 Q125 55 66 82Z','M115 88 Q92 113 75 120 Q89 97 92 92Z','M159 73 Q145 109 119 119 Q132 99 132 84Z'],
   stripe:'M54 92 Q105 80 149 69 Q167 61 186 61',gill:'M165 56 Q159 66 170 72',eye:[180,59],
   palette:['#242e63','#4077a7','#c5e8df','#99d9d7','#446687'],fin:'#527db7',ink:'#263f5e',marks:'sail'
  }
 };
 function illustration(c,fish,fill,fin,dark,light,variant){
  const kind=fish.form;
  function path(d,color=fill,line=dark,width=1.9){
   const p=new Path2D(d);if(color){c.fillStyle=color;c.fill(p)}
   if(line){c.strokeStyle=line;c.lineWidth=width;c.stroke(p)}
  }
  function dot(x,y,r,color){c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fillStyle=color;c.fill()}
  function eye(x,y,r=4){dot(x,y,r+.9,'#f4dbab');dot(x,y,r,dark);dot(x+1,y-1,r*.29,'#fff9db')}
  function wave(x,y,n,length,amplitude,width,color){
   for(let i=0;i<n;i++){
    const dx=(i-(n-1)/2)*6, sway=(i%2?1:-1)*amplitude;
    path('M'+(x+dx)+' '+y+' q'+sway+' '+(length*.34)+' '+(dx*.3)+' '+(length*.6)+' t'+(sway*.5)+' '+(length*.4),null,color,width);
   }
  }
  function radial(n,outer,inner,x,y,squash=1,round=false){
   const pts=Array.from({length:n*2},(_,i)=>{const a=i*Math.PI/n-1.57,r=i%2?inner:outer;return [x+Math.cos(a)*r,y+Math.sin(a)*r*squash]});
   let d='M'+pts[0].join(' ');for(let i=1;i<=pts.length;i++){const p=pts[i%pts.length],q=pts[(i+1)%pts.length];d+=round?' Q'+p.join(' ')+' '+[(p[0]+q[0])/2,(p[1]+q[1])/2].join(' '):' L'+p.join(' ')}return d+'Z';
  }
  switch(kind){
   case 'ray':case 'manta':
    path('M111 83 Q67 109 37 120 Q24 126 14 118 Q31 124 44 113 L99 77Z',fin);
    path(kind==='manta'?'M53 30 Q100 44 135 51 Q163 46 169 36 Q177 49 166 61 Q182 71 189 58 Q187 74 169 76 Q159 98 163 125 Q128 113 106 92 Q73 86 53 30Z':'M51 47 Q86 43 119 46 Q146 37 167 53 Q184 67 178 73 Q158 76 145 101 Q132 125 115 117 Q91 101 72 77 Q58 65 51 47Z');
    path('M67 48 Q116 64 142 60 M116 86 Q132 96 148 103',null,light,2);eye(151,58,2.6);break;
   case 'shark':
    path('M50 86 Q31 70 24 42 Q20 71 29 88 L14 109 Q37 104 55 95Z',fin);
    path('M44 85 Q71 71 100 63 L111 30 Q124 39 131 54 Q164 41 191 56 L212 64 Q198 65 189 71 L199 73 Q160 98 123 94 L94 114 L101 92 Q72 100 46 94Z');
    path('M132 85 L110 111 Q135 107 153 85Z',fin);path('M156 60 l-4 11 M161 60 l-4 10 M166 61 l-4 9',null,dark,1.6);eye(181,60,2.7);break;
   case 'eel':
    path('M20 100 Q38 108 58 77 Q83 44 108 67 Q128 89 145 67 Q165 41 192 47 Q210 50 213 59 Q202 71 187 66 Q169 66 158 84 Q132 118 102 88 Q85 68 72 82 Q47 119 20 100Z');
    path('M26 101 Q45 110 64 79 Q84 52 107 76 Q132 100 152 75',null,light,2.4);eye(195,54,3);break;
   case 'horse':
    path('M108 91 Q81 63 94 45 L105 37 L102 24 L114 31 L119 17 L128 29 Q151 31 150 50 L175 57 L172 67 L144 64 Q143 73 133 76 Q128 85 139 95 Q155 122 127 131 Q105 137 101 119 Q98 106 108 106 Q119 104 120 114 Q113 110 111 116 Q116 127 128 118 Q138 106 120 99Z');
    path('M97 55 Q78 49 74 55 L87 77 L102 82Z',fin);path('M107 63 Q109 84 129 96',null,light,3);eye(136,44);break;
   case 'puffer':case 'angler':case 'butterfly':
    path('M63 67 L35 45 Q31 70 35 98 L65 83Z',fin);
    if(kind==='puffer')path('M65 68 Q66 43 89 38 L94 27 L101 35 L111 24 L119 32 Q164 29 181 61 L193 67 L183 74 Q181 101 154 111 L152 120 L139 113 Q90 124 69 94 L56 98Z');
    if(kind==='butterfly')path('M54 76 Q84 56 100 29 Q122 13 158 11 Q143 35 169 48 Q181 59 192 68 L182 73 Q168 99 156 124 Q124 111 97 102 Q63 99 54 76Z');
    if(kind==='angler'){
     path('M59 78 Q64 48 90 45 L96 30 L111 40 Q146 35 171 52 L193 61 L174 73 L192 78 Q175 111 125 108 Q80 113 59 85Z');
     path('M147 47 Q153 7 177 17 Q190 20 187 30',null,dark,3);dot(187,30,6,'#fce99c');
    }
    if(kind==='butterfly')for(let i=0;i<3;i++)path('M'+(96+i*18)+' '+(51-i*4)+' q-16 28 -4 45',null,i===1?light:dark,4.5);
    if(kind==='puffer')for(let i=0;i<16;i++)dot(83+(i*27%65),49+(i*17%41),1.8,light);
    path('M127 72 Q108 69 102 83 Q115 89 130 77Z',fin);eye(162,58);break;
   case 'crab':case 'lobster':case 'shrimp':
    for(let i=0;i<4;i++){
     path('M'+(83+i*13)+' 82 q-19 13 -22 29 M'+(99+i*12)+' 83 q11 13 12 24',null,dark,3);
    }
    if(kind==='crab'){
     path('M89 78 Q64 72 54 51 M148 77 Q171 70 181 54',null,dark,7);
     path('M60 56 Q38 61 33 43 L44 30 L46 43 L59 40 L60 27 Q79 43 60 56Z',fin);
     path('M172 58 Q157 40 173 27 L177 41 L191 35 L196 22 Q210 48 183 58Z',fin);
     path('M74 79 L83 60 Q118 45 153 59 L166 76 L156 88 Q124 105 86 91Z');eye(98,58,3);eye(143,57,3);
    }else{
     path('M54 91 Q49 72 35 65 L40 79 L25 76 L42 91 L27 96 Q40 102 56 99Z',fin);
     path('M48 91 Q90 99 113 64 Q132 44 163 49 L193 52 L179 62 Q172 87 145 88 Q123 88 112 98 Q73 116 48 98Z');
     for(let i=0;i<5;i++)path('M'+(58+i*11)+' '+(95-i*2)+' q7 4 7 9',null,dark,1.7);
     path('M164 54 Q193 30 219 38 M167 54 Q190 23 206 23',null,dark,1.5);
     if(kind==='lobster'){path('M128 80 Q155 108 181 96 L194 79 L179 90 L176 78 Q160 82 159 94Z',fin)}eye(167,52,3);
    }break;
   case 'octopus':case 'squid':case 'jelly':
    if(kind==='jelly'){
     wave(113,74,9,43,9,2.3,fin);wave(115,76,4,49,12,4,light);
     path('M64 73 Q66 31 104 24 Q148 14 168 63 L174 76 Q165 89 156 76 Q146 88 137 77 Q124 90 114 78 Q103 90 92 78 Q81 85 72 77Z');
     path('M81 61 Q91 37 112 32',null,light,3);
    }else{
     for(let i=0;i<(kind==='octopus'?8:9);i++){
      const x=91+i*6,dx=(i-3.5)*10,y=110+(i%3)*7;
      const d='M'+x+' 74 Q'+(x+dx/3)+' 109 '+(x+dx)+' '+y+' q'+(dx/3)+' 0 '+(dx/3)+' -9';
      path(d,null,dark,kind==='octopus'?7:4);path(d,null,fin,kind==='octopus'?4:2);
     }
     path(kind==='octopus'?'M86 76 Q65 53 86 35 Q105 15 135 29 Q164 39 151 69 L139 86 Q111 93 86 76Z':'M91 78 Q81 57 107 32 L119 13 Q142 31 148 62 L156 74 L141 76 Q117 95 91 78Z');
     eye(129,66,3.6);eye(142,65,2.8);
    }break;
   case 'star':
    path(radial([5,6,8][variant%3],58,21,120,73,.88));for(let i=0;i<12;i++)dot(120+Math.cos(i*.53)*15,73+Math.sin(i*.53)*11,2,light);break;
   case 'shell':
    path('M110 112 Q76 97 60 67 Q55 55 66 53 Q67 38 80 42 Q85 26 99 34 Q111 16 126 31 Q142 21 151 36 Q167 29 172 45 Q187 46 180 61 Q174 87 136 111 L142 119 L101 119Z');
    for(let i=0;i<9;i++){const a=3.55+i*.29;path('M121 108 Q'+(121+Math.cos(a)*27)+' 78 '+(121+Math.cos(a)*55)+' '+(70+Math.sin(a)*39),null,light,2)}break;
   case 'turtle':
    path('M133 62 Q154 34 168 32 Q175 44 152 64 M95 93 Q82 118 67 121 Q64 111 76 92 M145 77 Q159 101 142 115 Q127 109 126 87Z',fin);
    path('M147 62 Q163 40 182 45 Q196 48 198 57 Q194 69 171 67 L153 81Z',fin);
    path('M58 86 Q72 45 117 39 Q143 38 159 60 Q153 83 119 98 Q88 108 58 92 L43 97Z');
    path('M74 82 L92 59 L114 53 L135 59 L137 73 L114 85 L95 84Z M92 59 L83 52 M114 53 L118 39 M137 73 L150 76 M114 85 L114 97 M95 84 L83 98',null,light,2);eye(182,51,2.9);break;
   case 'slug':case 'anemone':case 'urchin':
    if(kind==='slug'){
     path('M40 100 Q74 92 86 76 Q112 58 149 66 L163 45 Q167 40 166 51 L164 64 L179 48 Q185 44 181 54 L174 71 Q198 77 199 87 Q177 99 149 92 Q109 111 63 107Z');
     for(let i=0;i<7;i++)path('M'+(80+i*9)+' '+(84-i*2)+' q-9 -16 1 -25 q1 12 6 19Z',fin);
     eye(177,77,2.4);
    }else if(kind==='urchin'){
     path(radial(34,52,29,123,76,.84),fin);path('M88 80 Q86 47 120 43 Q152 39 158 70 Q165 101 132 109 Q99 115 88 80Z');
     for(let i=0;i<16;i++)dot(103+(i*19%39),59+(i*11%31),2,light);
    }else{
     for(let i=0;i<18;i++){const a=3.45+i*.145,x=119+Math.cos(a)*54,y=78+Math.sin(a)*49;path('M'+(91+i*3.2)+' 92 Q'+(x+Math.sin(i)*12)+' 65 '+x+' '+y,null,i%2?fin:dark,4);dot(x,y,3,light)}
     path('M90 83 Q116 93 147 82 L141 107 Q120 119 96 108Z');
    }break;
   case 'whale':
    path('M63 78 Q46 78 40 68 Q28 45 17 46 Q15 65 30 77 Q12 79 11 90 Q32 94 47 86 L67 95Z',fin);
    path('M48 79 Q80 83 98 65 Q118 45 151 43 Q183 41 202 60 Q218 87 188 98 Q150 116 118 98 Q93 90 64 94 L48 89Z');
    path('M140 83 Q129 107 107 113 Q108 100 119 86Z',fin);path('M175 79 Q191 81 202 75',null,dark,1.6);eye(178,68,3);break;
  }
  switch(fish.id){
   case 'aurora-narwhal':path('M194 57 L231 30 L199 62Z','#eee1b6');break;
   case 'pearlspot-whale-shark':
    for(let i=0;i<29;i++)dot(78+(i*23%85),67+(i*13%15),1.6,light);break;
   case 'copper-hammerhead':
    path('M177 54 L171 45 Q175 39 182 45 L200 64 Q207 69 202 75 L191 71Z',fin);eye(176,45,2);break;
   case 'saffron-hermit-crab':
    path('M80 77 Q55 69 67 48 Q73 31 93 32 Q114 33 118 53 L113 72Z',fin);
    path('M106 63 Q116 42 97 40 Q77 39 78 56 Q78 67 89 64 Q98 60 92 53',null,dark,2);break;
   case 'rose-chambered-nautilus':case 'glass-paper-nautilus':
    path('M80 86 Q57 64 75 39 Q97 16 126 37 Q144 52 139 73 Q135 96 111 98Z',fin);
    path('M121 87 Q142 67 127 48 Q108 25 87 42 Q73 57 85 72 Q95 85 111 74 Q121 62 112 54',null,dark,2);break;
   case 'jade-dahlia-anemone':case 'blush-bead-anemone':
    for(let i=0;i<12;i++)dot(94+i*4,66+(i*11%17),2.5,light);break;
   case 'spotted-eagle-ray':case 'porcelain-spotted-ray':
    for(let i=0;i<21;i++)dot(98+(i*13%43),59+(i*7%23),1.7,light);break;
   case 'candystripe-cleaner-shrimp':case 'tangerine-clownfish':
    for(let i=0;i<3;i++)path('M'+(96+20*i)+' '+(73-7*i)+' q-4 9 3 17',null,'#fff2d4',4);break;
   case 'dusk-dumbo-octopus':
    path('M90 45 Q64 21 66 45 Q68 59 87 60 M147 45 Q172 21 168 47 Q163 56 149 60',fin);break;
  }
 }

 const inks=[
  ['#305e68','#77b5b4','#e5ede1','#e1ca83'],['#6a4656','#cc8790','#ffe3bd','#e8bf82'],
  ['#315c50','#79ac83','#e5e5ba','#d4b674'],['#3c4b73','#7395c0','#ccdce7','#c9b3d3'],
  ['#76502f','#cb9258','#fae2b9','#d5b569'],['#554878','#a58bc1','#e4dbec','#a8c3d5'],
  ['#713e36','#d47252','#f3cba2','#efac6c'],['#305571','#6399bc','#e0e5e1','#b2c4d7']
 ];
 function draw(canvas,fish){
  const id=fish.form,c=canvas.getContext('2d');
  if(!c)return;
  const w=canvas.width,h=canvas.height;
  c.setTransform(w/240,0,0,h/150,0,0);c.clearRect(0,0,240,150);
  c.lineJoin='round';c.lineCap='round';
  const variant=Array.from(fish.id).reduce((n,ch)=>(Math.imul(n,31)+ch.charCodeAt(0))>>>0,1);
  const pigment=inks[variant%inks.length];
  const palette= pigment.map((color,index)=>index!==1?color:'hsl('+((variant>>>8)%360)+' 35% 60%)');
  const tilt=((variant>>>14)%9-4)*Math.PI/180;
  c.translate(120,75);c.rotate(tilt);c.translate(-120,-75);
  if(!plates[id]){
   const grad=c.createLinearGradient(100,24,135,117);grad.addColorStop(0,palette[1]);grad.addColorStop(.48,palette[1]);grad.addColorStop(1,palette[2]);
   illustration(c,fish,grad,palette[3],palette[0],palette[2],variant);return;
  }
  const a={...plates[id]};
  if(!['silver-minnow','moonfin-trout','jade-carp','star-sailfish'].includes(fish.id)){
   a.palette=[palette[0],palette[1],palette[2],palette[3],palette[0]];a.fin=palette[3];a.ink=palette[0];
  }
  function paint(path,fill,stroke=a.ink,width=1.4){
   const p=new Path2D(path);if(fill){c.fillStyle=fill;c.fill(p)}
   if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}
  }
  const fin=c.createLinearGradient(90,25,120,110);
  fin.addColorStop(0,a.fin);fin.addColorStop(.65,a.palette[1]);fin.addColorStop(1,a.fin);
  paint(a.tail,fin);
  for(const f of a.fins.slice(0,-1))paint(f,fin);
  if(a.marks==='sail'){
   c.save();c.clip(new Path2D(a.fins[0]));
   for(let i=0;i<11;i++)paint('M'+(63+i*7)+' 83 Q'+(65+i*8)+' 52 '+(77+i*9)+' 16',null,i%2?'#87bfc1':'#344774',1.7);
   c.restore();
  }
  const g=c.createLinearGradient(112,34,124,102);
  for(const [i,color] of a.palette.slice(0,3).entries())g.addColorStop([0,.48,1][i],color);
  paint(a.body,g);
  c.save();c.clip(new Path2D(a.body));c.globalAlpha=.72;
  paint(a.stripe,null,a.palette[4],id==='trout'?7:3);
  c.globalAlpha=.72;
  if(a.marks==='spots'){
   for(let i=0;i<34;i++){const x=62+(i*29%102),y=43+(i*13%32);c.beginPath();c.ellipse(x,y,1.9,1.25,-.27,0,Math.PI*2);c.fillStyle=i%4?a.ink:'#dc8c83';c.fill()}
  }else if(a.marks==='scales'){
   for(let y=45;y<98;y+=9)for(let x=62+(y%2)*4;x<155;x+=10)paint('M'+x+' '+y+' q7 1 4 7',null,'#d7ce8f',1.15);
  }else if(a.marks==='sail'){
   for(let i=0;i<9;i++)paint('M'+(80+i*8)+' '+(75-i*2)+' l8 12',null,'#a3d2e1',2);
  }else{
   paint('M54 93 Q109 89 152 73',null,'#f7f1cf',1.5);
  }
  c.restore();
  paint(a.fins.at(-1),fin);
  paint(a.gill,null,a.ink,1.5);
  const [x,y]=a.eye;
  for(const [dx,dy,r,color] of [[0,0,4.4,'#dac689'],[0,0,2.8,'#182d37'],[.8,-.85,.95,'#fffde6']]){
   c.beginPath();c.arc(x+dx,y+dy,r,0,Math.PI*2);c.fillStyle=color;c.fill();
  }
  if(id==='carp')paint('M199 69 q6 6 9 -1 M197 71 q3 10 8 8',null,a.ink,1.3);
 }
 return {draw};
})();
