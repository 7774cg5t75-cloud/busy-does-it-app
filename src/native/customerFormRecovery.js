import {Platform} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {createCustomerFormRecovery} from '../core/customerFormRecovery.mjs';
export function nativeCustomerFormRecovery(scope,isCurrent){
 if(!['ios','android'].includes(Platform.OS)||['isAvailableAsync','getItemAsync','setItemAsync','deleteItemAsync'].some(k=>typeof SecureStore[k]!=='function')||Platform.OS==='ios'&&typeof SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY!=='number')return null;
 const options=Platform.OS==='ios'?{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY}:{};
 return createCustomerFormRecovery({isAvailableAsync:()=>SecureStore.isAvailableAsync(),getItemAsync:key=>SecureStore.getItemAsync(key,options),setItemAsync:(key,value)=>SecureStore.setItemAsync(key,value,options),deleteItemAsync:key=>SecureStore.deleteItemAsync(key,options)},scope,{isCurrent});
}
