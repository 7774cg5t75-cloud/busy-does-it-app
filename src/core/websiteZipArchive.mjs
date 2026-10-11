/**
 * V3.136 bounded, deterministic ZIP32 "store" writer. No third-party module,
 * server upload, ZIP slip paths, password material, or implicit network calls.
 * Input files are intentionally already-vetted UTF-8 text or Uint8Array media.
 */
const encoder=new TextEncoder();
const MAX_FILES=96;
const MAX_BYTES=32*1024*1024;
const u16=(array,at,value)=>{array[at]=value&255;array[at+1]=(value>>>8)&255;};
const u32=(array,at,value)=>{u16(array,at,value&65535);u16(array,at+2,(value>>>16)&65535);};
const table=Array.from({length:256},(_,i)=>{
 let x=i;
 for(let n=0;n<8;n++)x=x&1?0xedb88320^(x>>>1):x>>>1;
 return x>>>0;
});
function crc32(data){
 let crc=0xffffffff;
 for(let i=0;i<data.length;i++)crc=table[(crc^data[i])&255]^(crc>>>8);
 return (crc^0xffffffff)>>>0;
}
function zipPath(name){
 if(typeof name!=="string"||!name||name.length>220||name.startsWith("/")||
    name.includes("\\")||name.includes("\0")||name.includes(":")||
    name.split("/").some(x=>!x||x==="."||x==="..")||
    !/^[a-zA-Z0-9_./-]+$/.test(name))throw Error("Unsafe archive entry path");
 return name;
}
function makeWebsiteZip(files=[]){
 if(!Array.isArray(files)||!files.length||files.length>MAX_FILES)
  throw Error("The website archive contains too many or too few files.");
 const seen=new Set();
 const encoded=files.map(file=>{
  const name=zipPath(file?.path);
  if(seen.has(name))throw Error("Duplicate archive file: "+name);
  seen.add(name);
  const bytes=typeof file.content==="string"?encoder.encode(file.content):file.content;
  if(!(bytes instanceof Uint8Array))throw Error("Archive content must be text or image bytes.");
  if(bytes.length>12*1024*1024)throw Error("An archive file is over the 12 MB limit.");
  return {name:name,filename:encoder.encode(name),data:bytes,crc:crc32(bytes)};
 });
 const totalData=encoded.reduce((sum,x)=>sum+x.data.length,0);
 if(totalData>MAX_BYTES)throw Error("Website archive exceeds the 32 MB safety limit.");
 const localSize=encoded.reduce((sum,x)=>sum+30+x.filename.length+x.data.length,0);
 const centralSize=encoded.reduce((sum,x)=>sum+46+x.filename.length,0);
 const output=new Uint8Array(localSize+centralSize+22);
 let off=0;
 const entries=[];
 for(const entry of encoded){
  const start=off,nameSize=entry.filename.length,dataSize=entry.data.length;
  u32(output,off,0x04034b50);u16(output,off+4,20);
  u16(output,off+6,0x0800);u16(output,off+8,0); // UTF-8, stored
  u16(output,off+10,0);u16(output,off+12,0);
  u32(output,off+14,entry.crc);
  u32(output,off+18,dataSize);u32(output,off+22,dataSize);
  u16(output,off+26,nameSize);u16(output,off+28,0);
  off+=30;output.set(entry.filename,off);off+=nameSize;
  output.set(entry.data,off);off+=dataSize;
  entries.push({...entry,start});
 }
 const centralOffset=off;
 for(const entry of entries){
  const nameSize=entry.filename.length,dataSize=entry.data.length;
  u32(output,off,0x02014b50);u16(output,off+4,20);u16(output,off+6,20);
  u16(output,off+8,0x0800);u16(output,off+10,0);
  u16(output,off+12,0);u16(output,off+14,0);
  u32(output,off+16,entry.crc);
  u32(output,off+20,dataSize);u32(output,off+24,dataSize);
  u16(output,off+28,nameSize);u16(output,off+30,0);
  u16(output,off+32,0);u16(output,off+34,0);
  u16(output,off+36,0);u32(output,off+38,0);
  u32(output,off+42,entry.start);
  off+=46;output.set(entry.filename,off);off+=nameSize;
 }
 const centralLength=off-centralOffset;
 u32(output,off,0x06054b50);
 u16(output,off+4,0);u16(output,off+6,0);
 u16(output,off+8,entries.length);u16(output,off+10,entries.length);
 u32(output,off+12,centralLength);u32(output,off+16,centralOffset);
 u16(output,off+20,0);
 return output;
}
export {makeWebsiteZip,crc32,zipPath};
