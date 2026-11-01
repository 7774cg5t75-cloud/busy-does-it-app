import {Platform} from 'react-native';
import {requireOptionalNativeModule} from 'expo-modules-core';
import {createCustomerFormRecovery} from '../core/customerFormRecovery.mjs';
export function nativeCustomerFormRecovery(scope,isCurrent){
 if(!['ios','android'].includes(Platform.OS))return null;
 // The SDK's top-level import throws when an older binary lacks its module.
 // Resolve optionally first, then use the original SDK's reviewed wrappers.
 let SecureStore;try{if(!requireOptionalNativeModule('ExpoSecureStore'))return null;SecureStore=require('expo-secure-store');}catch{return null;}
 if(!['ios','android'].includes(Platform.OS)||['isAvailableAsync','getItemAsync','setItemAsync','deleteItemAsync'].some(k=>typeof SecureStore[k]!=='function')||Platform.OS==='ios'&&typeof SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY!=='number')return null;
 const options=Platform.OS==='ios'?{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY}:{};
 return createCustomerFormRecovery({isAvailableAsync:()=>SecureStore.isAvailableAsync(),getItemAsync:key=>SecureStore.getItemAsync(key,options),setItemAsync:(key,value)=>SecureStore.setItemAsync(key,value,options),deleteItemAsync:key=>SecureStore.deleteItemAsync(key,options)},scope,{isCurrent});
}
