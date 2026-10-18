import {appImagePresentation} from '../core/appImageAppearance.mjs';
import {PUBLIC_GALLERY_LIMIT,publicAppGallery} from "../core/publicAppGallery.mjs";
import React from 'react';
import {View,Text,Pressable} from 'react-native';
import {Card} from '../components/ui';
// Presentation extracted from MiniAppSurface. Owner-selection callbacks still
// reach the original Studio; public rendering has no editor controls/actions.
export function AppGallerySurface({config,responsive,colors,visual,ImageComponent,onQualityObservation,ownerSelection=null,publicMode=false}){
 const raw=Array.isArray(config?.publicProfile?.assets?.gallery)?config.publicProfile.assets.gallery:[];
 const gallery=(publicMode?publicAppGallery(raw):raw.filter(asset=>String(asset?.uri||'').startsWith('https://'))).slice(0,PUBLIC_GALLERY_LIMIT);
 const owner=publicMode?null:ownerSelection;
 const Frame=owner?Pressable:View;
 const heading={color:colors.text,fontSize:visual.type.sectionSize,fontWeight:visual.type.sectionWeight,marginBottom:8};
 return <View style={{backgroundColor:colors.surface,padding:12,borderRadius:12,marginVertical:10}}>
  {owner?<Pressable accessibilityRole="button" accessibilityLabel="Select gallery presentation" accessibilityState={{selected:owner.selection?.part==='gallery'}} onPress={()=>owner.onSelect({part:'gallery'})} style={{borderWidth:2,borderColor:owner.selection?.part==='gallery'?'#4489ed':colors.muted,padding:8}}><Text style={heading}>Gallery</Text></Pressable>:<Text style={heading}>Gallery</Text>}
  {gallery.length?<View style={{flexDirection:'row',flexWrap:'wrap',gap:responsive.ok?responsive.gap:8}}>
   {gallery.map((asset,index)=>{
    const rawIndex=raw.indexOf(asset),approved=asset.approved===true||asset.marketingOk===true;
    const picture=appImagePresentation(config?.presentation?.imageStyles,asset.uri,{height:responsive.ok?responsive.galleryHeight:205,corners:config?.presentation?.imageCorners});
    const selected=owner?.selection?.part==='image'&&owner.selection.index===rawIndex;
    return <Frame key={asset.key||asset.uri||'gallery-'+index} accessibilityRole={owner?'button':undefined}
     accessibilityLabel={owner?'Select gallery photo '+(index+1):undefined}
     disabled={owner?!approved:undefined}
     accessibilityState={owner?{selected,disabled:!approved}:undefined}
     onPress={owner?()=>{if(approved)owner.onSelect({part:'image',index:rawIndex,expectedUri:asset.uri});}:undefined}
     style={{...(owner?{borderWidth:2,borderColor:selected?'#4489ed':colors.muted}:{}),width:responsive.ok?(responsive.galleryColumns===3?'31%':responsive.galleryColumns===2?'48%':'100%'):'100%'}}>
     <ImageComponent source={{uri:asset.uri}} resizeMode={picture.resizeMode} observationKey={'gallery-'+index} observationKind="gallery_image" onObservation={onQualityObservation}
      accessibilityLabel={String(asset.alt||asset.caption||asset.description||'Business gallery photo '+(index+1)).slice(0,140)}
      style={{width:'100%',height:picture.height,borderRadius:picture.borderRadius,marginBottom:asset.caption?4:8}}/>
     {asset.caption?<Text style={{color:colors.muted,fontSize:visual.type.bodySize,lineHeight:visual.type.bodySize+7,marginTop:6}}>{String(asset.caption).slice(0,240)}</Text>:null}
    </Frame>;
   })}
  </View>:<Card eyebrow="Gallery" title="No approved photos yet" body="Only imagery approved for public business use is shown here." tone="amber"/>}
 </View>;
}
