// Serialise existing native encrypted-store operations across same-scope remounts.
const queues=new Map();
function enqueuePrivateCheckpoint(key,work){
 const task=(queues.get(key)||Promise.resolve()).then(work);
 const tail=task.catch(()=>{});queues.set(key,tail);
 tail.then(()=>{if(queues.get(key)===tail)queues.delete(key);});return task;
}
export {enqueuePrivateCheckpoint};
