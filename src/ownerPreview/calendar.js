import {blocked} from './policy.js';
export const isAvailableAsync=async()=>false;
export const requestCalendarPermissionsAsync=async()=>({status:'denied',granted:false});
export const getCalendarsAsync=blocked,getEventAsync=blocked,getEventsAsync=blocked,createEventAsync=blocked,updateEventAsync=blocked,deleteEventAsync=blocked;
export const EntityTypes={EVENT:'event'};
