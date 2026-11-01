import {Platform} from 'react-native';
import {requireOptionalNativeModule} from 'expo-modules-core';
import {createNativeArtifactIntegrity,createWebArtifactIntegrity} from './artifactIntegrity.mjs';
// Optional lookup is deliberate: installed Owner Preview29 must still boot when
// the new native module is absent. The affected private feature fails closed.
export const privateArtifactCrypto=Platform.OS==='web'?createWebArtifactIntegrity():createNativeArtifactIntegrity(()=>{try{return requireOptionalNativeModule('ExpoCrypto');}catch{return null;}});
