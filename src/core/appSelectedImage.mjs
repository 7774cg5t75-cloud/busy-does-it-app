import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
// Selection adapter only. Existing Studio operations/server CAS and Undo own
// every edit. No media upload, replacement, approval or new persistence path.
function selectedAppImage(config,selection){
 const gallery=config?.publicProfile?.assets?.gallery;
 if(selection?.part!=='image'||!Number.isInteger(selection.index)||!Array.isArray(gallery)||
  !config?.modules?.some(m=>m.key==='gallery'&&m.enabled===true))return null;
 const image=gallery[selection.index];
 return image&&image.uri===selection.expectedUri&&/^https:\/\//i.test(image.uri)&&
  (image.approved===true||image.marketingOk===true)?image:null;
}
function selectedAppImageOperation(config,selection,{kind,alt,caption,direction}={}){
 const image=selectedAppImage(config,selection);
 if(!image)return {ok:false,reason:'Select a current approved gallery image again.'};
 let operation;
 if(kind==='description')operation={kind:'photo_description',index:selection.index,expectedUri:selection.expectedUri,value:{alt:alt===''?null:alt,caption:caption===''?null:caption}};
 else if(kind==='move'&&['earlier','later'].includes(direction))operation={kind:'photo',from:selection.index,to:selection.index+(direction==='earlier'?-1:1)};
 else return {ok:false,reason:'Use a supported image description or relative move.'};
 const proposal=proposeCoordinatedAppChanges(config,[operation]);
 return proposal.ok?{ok:true,operation,proposal}:proposal;
}
export {selectedAppImage,selectedAppImageOperation};
