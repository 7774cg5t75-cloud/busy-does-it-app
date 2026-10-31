import React from 'react';
// Install transport denial before evaluating original application modules.
require('./policy.js').install();
const Application=require('../../BusyDoesItApp').default;
export default function OwnerPreview(){return <Application/>;}
