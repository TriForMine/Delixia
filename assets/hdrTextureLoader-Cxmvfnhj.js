import{an as p,ao as c}from"./index-hptb-8y6.js";class h{constructor(){this.supportCascades=!1}loadCubeData(){throw".hdr not supported in Cube."}loadData(s,e,l){const r=new Uint8Array(s.buffer,s.byteOffset,s.byteLength),t=p(r),n=c(r,t),i=t.width*t.height,o=new Float32Array(i*4);for(let a=0;a<i;a+=1)o[a*4]=n[a*3],o[a*4+1]=n[a*3+1],o[a*4+2]=n[a*3+2],o[a*4+3]=1;l(t.width,t.height,e.generateMipMaps,!1,()=>{const a=e.getEngine();e.type=1,e.format=5,e._gammaSpace=!1,a._uploadDataToTextureDirectly(e,o)})}}export{h as _HDRTextureLoader};
