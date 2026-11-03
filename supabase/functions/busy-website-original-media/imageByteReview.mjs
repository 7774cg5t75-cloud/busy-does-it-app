// Bounded image-container inspection, NOT a pixel decoder or copyright proof.
// Privacy metadata is refused, never silently stripped from an owner's original.
const deny=reason=>({ok:false,reason});
export function reviewOriginalImageBytes(bytes,{forPrivateNormalisation=false}={}){
 if(!(bytes instanceof Uint8Array)||bytes.length<20||bytes.length>9437184)return deny('Choose an image no larger than 9 MB.');
 const n=bytes.length,tag=(a,b)=>String.fromCharCode(...bytes.subarray(a,b)),be=(i)=>bytes[i]*16777216+bytes[i+1]*65536+bytes[i+2]*256+bytes[i+3],le=i=>bytes[i]+bytes[i+1]*256+bytes[i+2]*65536+bytes[i+3]*16777216;
 const finish=(contentType,width,height)=>Number.isSafeInteger(width)&&Number.isSafeInteger(height)&&width>0&&height>0&&width<=20000&&height<=20000&&width*height<=40000000?{ok:true,contentType,width,height,bytes:n,metadataPolicy:'restricted_container_metadata',decodedPixelsVerified:false,requiresDecodedReview:true,publicUseAuthorised:false}:deny('Image dimensions exceed the reviewed limits.');
 if(bytes[0]===255&&bytes[1]===216){
  if(bytes[n-2]!==255||bytes[n-1]!==217)return deny('JPEG is incomplete.');let p=2,w=0,h=0,nodes=0;
  while(p<n-2&&++nodes<=4096){
   if(bytes[p++]!==255)return deny('JPEG framing is invalid.');while(bytes[p]===255)p++;const marker=bytes[p++];
   if(marker===0xda)return w&&h?finish('image/jpeg',w,h):deny('JPEG dimensions are missing.');
   if([0xd8,0xd9,0,0x01].includes(marker)||marker>=0xd0&&marker<=0xd7||p+2>n)return deny('Unsupported JPEG structure.');
   const length=bytes[p]*256+bytes[p+1];if(length<2||p+length>n-2)return deny('JPEG segment is incomplete.');
   // EXIF/XMP/IPTC/comments can expose location, identity or hidden owner text.
   if(!forPrivateNormalisation&&([0xe1,0xed,0xfe].includes(marker)||marker>=0xe3&&marker<=0xef||marker===0xe0&&tag(p+2,p+7)!=='JFIF\x00'||marker===0xe2&&tag(p+2,p+14)!=='ICC_PROFILE\x00'))return deny('Export a privacy-reviewed copy without EXIF, XMP, IPTC or comments. Orientation must be baked into the pixels.');
   if([0xc0,0xc1,0xc2].includes(marker)){if(w||length<8)return deny('Ambiguous JPEG dimensions.');h=bytes[p+3]*256+bytes[p+4];w=bytes[p+5]*256+bytes[p+6];}
   p+=length;
  }
  return deny('Unsupported or excessive JPEG structure.');
 }
 if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)){
  let p=8,w=0,h=0,image=false,nodes=0;
  while(p+12<=n&&++nodes<=4096){
   const size=be(p),name=tag(p+4,p+8);if(size>n-p-12)return deny('PNG chunk is incomplete.');
   let crc=0xffffffff;for(let i=p+4;i<p+8+size;i++){crc^=bytes[i];for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}if((crc^0xffffffff)>>>0!==be(p+8+size))return deny('PNG integrity check failed.');
   if(['acTL','fcTL','fdAT'].includes(name)||!forPrivateNormalisation&&['eXIf','tEXt','iTXt','zTXt'].includes(name))return deny('Use a still PNG without private text, EXIF or animation metadata.');
   if(!w){if(name!=='IHDR'||size!==13)return deny('PNG header is invalid.');w=be(p+8);h=be(p+12);}else if(name==='IHDR')return deny('Duplicate PNG header.');
   if(name==='IDAT'&&size>0)image=true;p+=12+size;
   if(name==='IEND')return size===0&&p===n&&image?finish('image/png',w,h):deny('PNG ending is invalid.');
  }return deny('PNG is incomplete or excessive.');
 }
 if(tag(0,4)==='RIFF'&&tag(8,12)==='WEBP'){
  if(le(4)!==n-8)return deny('WebP size is invalid.');let p=12,w=0,h=0,picture=false,nodes=0;
  while(p+8<=n&&++nodes<=4096){const name=tag(p,p+4),size=le(p+4),a=p+8;if(size>n-a)return deny('WebP chunk is incomplete.');
   if(['ANIM','ANMF'].includes(name)||!forPrivateNormalisation&&['EXIF','XMP '].includes(name))return deny('Use a still WebP without private metadata.');
   if(name==='VP8X'){if(size!==10||bytes[a]&(forPrivateNormalisation?0x02:0x0e))return deny('Unsupported WebP metadata or animation.');w=1+bytes[a+4]+bytes[a+5]*256+bytes[a+6]*65536;h=1+bytes[a+7]+bytes[a+8]*256+bytes[a+9]*65536;}
   if(name==='VP8 '){if(size<10||tag(a+3,a+6)!=='\x9d\x01\x2a')return deny('Invalid WebP frame.');const x=(bytes[a+6]+bytes[a+7]*256)&0x3fff,y=(bytes[a+8]+bytes[a+9]*256)&0x3fff;if(w&&(w!==x||h!==y))return deny('WebP dimensions conflict.');w=x;h=y;picture=true;}
   if(name==='VP8L'){if(size<5||bytes[a]!==0x2f)return deny('Invalid lossless WebP.');const x=1+bytes[a+1]+((bytes[a+2]&63)<<8),y=1+(bytes[a+2]>>6)+(bytes[a+3]<<2)+((bytes[a+4]&15)<<10);if(w&&(w!==x||h!==y))return deny('WebP dimensions conflict.');w=x;h=y;picture=true;}
   p=a+size+(size%2);
  }return p===n&&picture?finish('image/webp',w,h):deny('Unsupported WebP structure.');
 }
 return deny('Only reviewed JPEG, PNG and WebP containers are supported.');
}
