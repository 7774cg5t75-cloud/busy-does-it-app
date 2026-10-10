/**
 * Global-Ready display only. Store appointment instants in UTC; format using
 * explicit IANA timezone including DST. Currency formatting is NOT payment,
 * tax, exchange-rate conversion, price generation or subscription billing.
 */
function formatBusinessAppointment(utcIso,regional){
 if(!regional?.timeZone||!regional?.locale||
    typeof utcIso!=="string"||!/Z$/.test(utcIso))
   return {status:"unavailable",text:null,
     reason:"Confirmed locale, time zone and a UTC appointment are needed."};
 const time=new Date(utcIso);
 if(!Number.isFinite(time.getTime()))
   return {status:"unavailable",text:null,reason:"Invalid UTC appointment."};
 try{
  return {status:"display-only",text:new Intl.DateTimeFormat(regional.locale,{
    timeZone:regional.timeZone,year:"numeric",month:"short",day:"numeric",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(time),
    timeZone:regional.timeZone,storedUtc:time.toISOString(),
    appointmentChanged:false,serverBookingCreated:false};
 }catch{return {status:"unavailable",text:null,reason:"Invalid display configuration."};}
}
function formatBusinessCurrency(minorUnits,regional){
 if(!regional?.locale||!regional?.currency||
   !Number.isSafeInteger(minorUnits)||minorUnits<0)
  return {status:"unavailable",text:null,
    reason:"Valid smallest-unit amount and display currency required."};
 try{
  const fmt=new Intl.NumberFormat(regional.locale,{
    style:"currency",currency:regional.currency});
  const decimals=fmt.resolvedOptions().maximumFractionDigits;
  return {status:"display-only",
    text:fmt.format(minorUnits/(10**decimals)),
    currency:regional.currency,taxIncluded:null,
    convertedFromAnotherCurrency:false,
    actualPaymentVerified:false,customerCharged:false};
 }catch{return {status:"unavailable",text:null,reason:"Invalid currency configuration."};}
}
export {formatBusinessAppointment,formatBusinessCurrency};
