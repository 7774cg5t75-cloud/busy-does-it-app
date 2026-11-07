// Recheck current owner authority before AND after the multi-read status packet.
// This is response-egress protection, not an atomic database snapshot or JWT proof.
export async function scopedOwnerStatus({read,verify}){
 await verify();const packet=await read();await verify();return packet;
}
