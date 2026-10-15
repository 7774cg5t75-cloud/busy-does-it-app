import {privateAppEditSource} from './privateAppEditSession.mjs';
function bindAppControlReview(change,context){
 const source=privateAppEditSource(context);return source&&context.ownerId?{...change,reviewSource:{...source,ownerId:context.ownerId}}:null;
}
function appControlReviewCurrent(review,context){
 const source=privateAppEditSource(context),expected=review?.reviewSource;
 return !!source&&!!expected&&context.ownerId===expected.ownerId&&Object.entries(source).every(([key,value])=>expected[key]===value);
}
export {bindAppControlReview,appControlReviewCurrent};
