import{q as h,ai as R,aj as v}from"./index-hptb-8y6.js";function D(){const e={cTFETC1:0,cTFETC2:1,cTFBC1:2,cTFBC3:3,cTFBC7:6,cTFPVRTC1_4_RGB:8,cTFPVRTC1_4_RGBA:9,cTFASTC_4x4:10,cTFRGB565:14};let o=null;onmessage=t=>{if(t.data.action==="init"){if(t.data.url)try{importScripts(t.data.url)}catch(n){postMessage({action:"error",error:n})}o||(o=BASIS({wasmBinary:t.data.wasmBinary})),o!==null&&o.then(n=>{BASIS=n,n.initializeBasis(),postMessage({action:"init"})})}else if(t.data.action==="transcode"){const n=t.data.config,a=t.data.imageData,d=new BASIS.BasisFile(a),i=l(d);let f=t.data.ignoreSupportedFormats?null:s(t.data.config,i),p=!1;f===null&&(p=!0,f=i.hasAlpha?e.cTFBC3:e.cTFBC1);let g=!0;d.startTranscoding()||(g=!1);const T=[];for(let m=0;m<i.images.length&&g;m++){const F=i.images[m];if(n.loadSingleImage===void 0||n.loadSingleImage===m){let L=F.levels.length;n.loadMipmapLevels===!1&&(L=1);for(let u=0;u<L;u++){const _=F.levels[u],U=r(d,m,u,f,p);if(!U){g=!1;break}_.transcodedPixels=U,T.push(_.transcodedPixels.buffer)}}}d.close(),d.delete(),p&&(f=-1),g?postMessage({action:"transcode",success:g,id:t.data.id,fileInfo:i,format:f},T):postMessage({action:"transcode",success:g,id:t.data.id})}};function s(t,n){let a=null;return t.supportedCompressionFormats&&(t.supportedCompressionFormats.astc?a=e.cTFASTC_4x4:t.supportedCompressionFormats.bc7?a=e.cTFBC7:t.supportedCompressionFormats.s3tc?a=n.hasAlpha?e.cTFBC3:e.cTFBC1:t.supportedCompressionFormats.pvrtc?a=n.hasAlpha?e.cTFPVRTC1_4_RGBA:e.cTFPVRTC1_4_RGB:t.supportedCompressionFormats.etc2?a=e.cTFETC2:t.supportedCompressionFormats.etc1?a=e.cTFETC1:a=e.cTFRGB565),a}function l(t){const n=t.getHasAlpha(),a=t.getNumImages(),d=[];for(let f=0;f<a;f++){const p={levels:[]},g=t.getNumLevels(f);for(let T=0;T<g;T++){const m={width:t.getImageWidth(f,T),height:t.getImageHeight(f,T)};p.levels.push(m)}d.push(p)}return{hasAlpha:n,images:d}}function r(t,n,a,d,i){const f=t.getImageTranscodedSizeInBytes(n,a,d);let p=new Uint8Array(f);if(!t.transcodeImage(p,n,a,d,1,0))return null;if(i){const g=t.getImageWidth(n,a)+3&-4,T=t.getImageHeight(n,a)+3&-4;p=c(p,0,g,T)}return p}function c(t,n,a,d){const i=new Uint16Array(4),f=new Uint16Array(a*d),p=a/4,g=d/4;for(let T=0;T<g;T++)for(let m=0;m<p;m++){const F=n+8*(T*p+m);i[0]=t[F]|t[F+1]<<8,i[1]=t[F+2]|t[F+3]<<8,i[2]=(2*(i[0]&31)+1*(i[1]&31))/3|(2*(i[0]&2016)+1*(i[1]&2016))/3&2016|(2*(i[0]&63488)+1*(i[1]&63488))/3&63488,i[3]=(2*(i[1]&31)+1*(i[0]&31))/3|(2*(i[1]&2016)+1*(i[0]&2016))/3&2016|(2*(i[1]&63488)+1*(i[0]&63488))/3&63488;for(let L=0;L<4;L++){const u=t[F+4+L];let _=(T*4+L)*a+m*4;f[_++]=i[u&3],f[_++]=i[u>>2&3],f[_++]=i[u>>4&3],f[_++]=i[u>>6&3]}}return f}}function W(e,o,s){return new Promise((l,r)=>{const c=t=>{t.data.action==="init"?(e.removeEventListener("message",c),l(e)):t.data.action==="error"&&r(t.data.error||"error initializing worker")};e.addEventListener("message",c),e.postMessage({action:"init",url:s?h.GetBabylonScriptURL(s):void 0,wasmBinary:o},[o])})}var C;(function(e){e[e.cTFETC1=0]="cTFETC1",e[e.cTFETC2=1]="cTFETC2",e[e.cTFBC1=2]="cTFBC1",e[e.cTFBC3=3]="cTFBC3",e[e.cTFBC4=4]="cTFBC4",e[e.cTFBC5=5]="cTFBC5",e[e.cTFBC7=6]="cTFBC7",e[e.cTFPVRTC1_4_RGB=8]="cTFPVRTC1_4_RGB",e[e.cTFPVRTC1_4_RGBA=9]="cTFPVRTC1_4_RGBA",e[e.cTFASTC_4x4=10]="cTFASTC_4x4",e[e.cTFATC_RGB=11]="cTFATC_RGB",e[e.cTFATC_RGBA_INTERPOLATED_ALPHA=12]="cTFATC_RGBA_INTERPOLATED_ALPHA",e[e.cTFRGBA32=13]="cTFRGBA32",e[e.cTFRGB565=14]="cTFRGB565",e[e.cTFBGR565=15]="cTFBGR565",e[e.cTFRGBA4444=16]="cTFRGBA4444",e[e.cTFFXT1_RGB=17]="cTFFXT1_RGB",e[e.cTFPVRTC2_4_RGB=18]="cTFPVRTC2_4_RGB",e[e.cTFPVRTC2_4_RGBA=19]="cTFPVRTC2_4_RGBA",e[e.cTFETC2_EAC_R11=20]="cTFETC2_EAC_R11",e[e.cTFETC2_EAC_RG11=21]="cTFETC2_EAC_RG11"})(C||(C={}));const b={JSModuleURL:`${h._DefaultCdnUrl}/basisTranscoder/1/basis_transcoder.js`,WasmModuleURL:`${h._DefaultCdnUrl}/basisTranscoder/1/basis_transcoder.wasm`},V=(e,o)=>{let s;switch(e){case C.cTFETC1:s=36196;break;case C.cTFBC1:s=33776;break;case C.cTFBC4:s=33779;break;case C.cTFASTC_4x4:s=37808;break;case C.cTFETC2:s=37496;break;case C.cTFBC7:s=36492;break}if(s===void 0)throw"The chosen Basis transcoder format is not currently supported";return s};let y=null,w=null,k=0;const H=!1,x=()=>(y||(y=new Promise((e,o)=>{w?e(w):h.LoadFileAsync(h.GetBabylonScriptURL(b.WasmModuleURL)).then(s=>{if(typeof URL!="function")return o("Basis transcoder requires an environment with a URL constructor");const l=URL.createObjectURL(new Blob([`(${D})()`],{type:"application/javascript"}));w=new Worker(l),W(w,s,b.JSModuleURL).then(e,o)}).catch(o)})),y),G=(e,o)=>{const s=e instanceof ArrayBuffer?new Uint8Array(e):e;return new Promise((l,r)=>{x().then(()=>{const c=k++,t=a=>{a.data.action==="transcode"&&a.data.id===c&&(w.removeEventListener("message",t),a.data.success?l(a.data):r("Transcode is not supported on this device"))};w.addEventListener("message",t);const n=new Uint8Array(s.byteLength);n.set(new Uint8Array(s.buffer,s.byteOffset,s.byteLength)),w.postMessage({action:"transcode",id:c,imageData:n,config:o,ignoreSupportedFormats:H},[n.buffer])},c=>{r(c)})})},E=(e,o)=>{var l,r;let s=(l=o._gl)==null?void 0:l.TEXTURE_2D;e.isCube&&(s=(r=o._gl)==null?void 0:r.TEXTURE_CUBE_MAP),o._bindTextureDirectly(s,e,!0)},P=(e,o)=>{const s=e.getEngine();for(let l=0;l<o.fileInfo.images.length;l++){const r=o.fileInfo.images[l].levels[0];if(e._invertVScale=e.invertY,o.format===-1||o.format===C.cTFRGB565)if(e.type=10,e.format=4,s._features.basisNeedsPOT&&(Math.log2(r.width)%1!==0||Math.log2(r.height)%1!==0)){const c=new R(s,2);e._invertVScale=e.invertY,c.type=10,c.format=4,c.width=r.width+3&-4,c.height=r.height+3&-4,E(c,s),s._uploadDataToTextureDirectly(c,new Uint16Array(r.transcodedPixels.buffer),l,0,4,!0),s._rescaleTexture(c,e,s.scenes[0],s._getInternalFormat(4),()=>{s._releaseTexture(c),E(e,s)})}else e._invertVScale=!e.invertY,e.width=r.width+3&-4,e.height=r.height+3&-4,e.samplingMode=2,E(e,s),s._uploadDataToTextureDirectly(e,new Uint16Array(r.transcodedPixels.buffer),l,0,4,!0);else{e.width=r.width,e.height=r.height,e.generateMipMaps=o.fileInfo.images[l].levels.length>1;const c=B.GetInternalFormatFromBasisFormat(o.format,s);e.format=c,E(e,s),o.fileInfo.images[l].levels.forEach((t,n)=>{s._uploadCompressedDataToTextureDirectly(e,c,t.width,t.height,t.transcodedPixels,l,n)}),s._features.basisNeedsPOT&&(Math.log2(e.width)%1!==0||Math.log2(e.height)%1!==0)&&(h.Warn("Loaded .basis texture width and height are not a power of two. Texture wrapping will be set to Texture.CLAMP_ADDRESSMODE as other modes are not supported with non power of two dimensions in webGL 1."),e._cachedWrapU=v.CLAMP_ADDRESSMODE,e._cachedWrapV=v.CLAMP_ADDRESSMODE)}}},B={JSModuleURL:b.JSModuleURL,WasmModuleURL:b.WasmModuleURL,GetInternalFormatFromBasisFormat:V,TranscodeAsync:G,LoadTextureFromTranscodeResult:P};Object.defineProperty(B,"JSModuleURL",{get:function(){return b.JSModuleURL},set:function(e){b.JSModuleURL=e}});Object.defineProperty(B,"WasmModuleURL",{get:function(){return b.WasmModuleURL},set:function(e){b.WasmModuleURL=e}});class M{constructor(){this.supportCascades=!1}loadCubeData(o,s,l,r,c){if(Array.isArray(o))return;const t=s.getEngine().getCaps(),n={supportedCompressionFormats:{etc1:!!t.etc1,s3tc:!!t.s3tc,pvrtc:!!t.pvrtc,etc2:!!t.etc2,astc:!!t.astc,bc7:!!t.bptc}};G(o,n).then(a=>{const d=a.fileInfo.images[0].levels.length>1&&s.generateMipMaps;P(s,a),s.getEngine()._setCubeMapTextureParams(s,d),s.isReady=!0,s.onLoadedObservable.notifyObservers(s),s.onLoadedObservable.clear(),r&&r()}).catch(a=>{h.Warn("Failed to transcode Basis file, transcoding may not be supported on this device"),s.isReady=!0,c&&c(a)})}loadData(o,s,l){const r=s.getEngine().getCaps(),c={supportedCompressionFormats:{etc1:!!r.etc1,s3tc:!!r.s3tc,pvrtc:!!r.pvrtc,etc2:!!r.etc2,astc:!!r.astc,bc7:!!r.bptc}};G(o,c).then(t=>{const n=t.fileInfo.images[0].levels[0],a=t.fileInfo.images[0].levels.length>1&&s.generateMipMaps;l(n.width,n.height,a,t.format!==-1,()=>{P(s,t)})}).catch(t=>{h.Warn("Failed to transcode Basis file, transcoding may not be supported on this device"),h.Warn(`Failed to transcode Basis file: ${t}`),l(0,0,!1,!1,()=>{},!0)})}}export{M as _BasisTextureLoader};
