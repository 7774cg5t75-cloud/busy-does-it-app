// One finite wording policy for original Creator and Growth; no execution authority.
export const CONTENT_FORMAT_CHOICES=Object.freeze([
 Object.freeze(['social','Social post wording']),Object.freeze(['poster','Poster wording']),
 Object.freeze(['advert','Advert wording']),Object.freeze(['newsletter','Newsletter wording'])
]);
export const CONTENT_TEXT_FORMATS=Object.freeze(CONTENT_FORMAT_CHOICES.map(([value])=>value));
export const supportsContentTextFormat=value=>CONTENT_TEXT_FORMATS.includes(value);
