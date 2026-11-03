// Delivery maps are supplied by the original renderer/export authority, never
// read from arbitrary fields on a draft asset. Legacy maps render unchanged.
export function responsivePhotoAttributes(asset,base,map,escape,{hero=false}={}){
 const key=asset?.storagePath||asset?.uri;
 if(typeof key!=='string'||typeof base!=='string'||!map||typeof escape!=='function')return '';
 const safe=v=>typeof v==='string'&&v.length<=2048&&!/[\s,"'<>]/.test(v)&&(/^(?:\.\.\/)*assets\/[a-zA-Z0-9_.-]+\.webp$/.test(v)||/^https:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?\/[a-zA-Z0-9_./%-]+\.webp$/.test(v));
 const candidates=[640,1280,1920].map(width=>({width,url:map[key+'#'+width]})).filter(x=>safe(x.url));
 if(!candidates.length)return '';
 return ' srcset="'+escape(candidates.map(x=>x.url+' '+x.width+'w').join(', '))+'" sizes="'+(hero?'(max-width: 700px) 100vw, (max-width: 1100px) 80vw, 960px':'(max-width: 700px) 100vw, 50vw')+'"';
}
