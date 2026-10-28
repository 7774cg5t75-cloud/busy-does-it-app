// Build-scoped offline exploration; never an authentication or server authority.
const MODE='owner-preview';
const blocked=async()=>{throw new Error('Unavailable in offline owner preview. Nothing was sent or saved to an account.');};
const localUri=uri=>typeof uri==='string'&&/^(data:image\/|file:\/\/|content:\/\/)/.test(uri);
function install(){
 global.fetch=blocked;
 global.XMLHttpRequest=function(){throw new Error('Networking disabled in owner preview');};
 global.WebSocket=function(){throw new Error('Networking disabled in owner preview');};
}
module.exports={MODE,blocked,localUri,install};
