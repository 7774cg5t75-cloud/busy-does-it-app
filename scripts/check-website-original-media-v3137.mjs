import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validExportOriginalPath,sitePhotoAssets,attachExportOriginal,preserveExportOriginals}
 from "../src/core/websiteOriginalMedia.mjs";
import {archiveRequirements} from "../src/core/websiteStandaloneArchive.mjs";

const business="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const other="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const uploader="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const file="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const cloud=`${business}/${uploader}/${file}.jpg`;
assert.equal(validExportOriginalPath(cloud,business),true,"approved business original path");
for(const invalid of [
 `${other}/${uploader}/${file}.jpg`,cloud+"?token=abc",
 `${business}/../${file}.jpg`,`${business}/${uploader}/../../other.jpg`,
 "https://example.com/photo.jpg","prototype/social-post/secret.jpg",
 `${business}/${uploader}/${file}.svg`
])assert.equal(validExportOriginalPath(invalid,business),false,"refuse untrusted path "+invalid);

const asset={uri:"file:///owner-private.jpg",storagePath:"prototype/post/01.jpg",approved:true,alt:"Owner photograph"};
const draft={id:"test-site",pages:[{id:"home",outputPath:"index.html"}],sections:[
 {id:"hero",type:"hero",enabled:true,asset},
 {id:"gallery",type:"gallery",enabled:true,items:[{...asset},{uri:"file:///another.png",approved:true}]},
 {id:"custom-1",type:"photo-feature",enabled:true,asset:{...asset}},
 {id:"hidden",type:"gallery",enabled:false,items:[{uri:"file:///private-hidden.jpg"}]}
]};
assert.deepEqual(sitePhotoAssets(draft).map(item=>item.key),[
 "prototype/post/01.jpg","file:///another.png"
],"all current public photos, deduplicated, no hidden assets");
const attached=attachExportOriginal(draft,"prototype/post/01.jpg",cloud);
assert.notEqual(attached,draft,"no in-place mutation");
assert.equal(draft.sections[0].asset.exportOriginalPath,undefined,"old draft untouched");
assert.equal(attached.sections[0].asset.exportOriginalPath,cloud,"hero backed up");
assert.equal(attached.sections[1].items[0].exportOriginalPath,cloud,"gallery matching copy backed up");
assert.equal(attached.sections[2].asset.exportOriginalPath,cloud,"rich picture backed up");
assert.equal(attached.sections[1].items[1].exportOriginalPath,undefined,"different original not affected");
assert.equal(attached.sections[0].asset.storagePath,asset.storagePath,"hosting source remains intact");
assert.equal(archiveRequirements(attached).ok,true,"exports still support approved originals");

const rebuilt=preserveExportOriginals(attached,[
 {id:"hero",type:"hero",asset:{...asset}},
 {id:"gallery",type:"gallery",items:[{...asset}]},
 {id:"new",type:"photo-feature",asset:{uri:"file:///new.jpg"}}
]);
assert.equal(rebuilt[0].asset.exportOriginalPath,cloud,"private backup survives Brand Brain refresh");
assert.equal(rebuilt[1].items[0].exportOriginalPath,cloud);
assert.equal(rebuilt[2].asset.exportOriginalPath,undefined);
assert.equal(attachExportOriginal(draft,"missing",cloud).sections[0].asset.exportOriginalPath,undefined);

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const gateway=read("supabase/functions/busy-website-original-media/index.ts");
const sql=read("supabase/migrations/20261011000000_busy_website_original_media.sql");
const app=read("src/app/AppController.js");
const page=read("src/screens/websitePagesEditor.js");
const pkg=JSON.parse(read("package.json"));
assert.match(gateway,/supabase\.auth\.getUser\(token\)/);
assert.match(gateway,/busy_business_memberships/);
assert.match(gateway,/storage_path",path\)/);
assert.match(gateway,/busy_website_original_media_audit/);
assert.doesNotMatch(gateway,/createSignedUrl|SERVICE_ROLE_KEY.*response/i);
assert.match(sql,/public=false/);
assert.match(sql,/enable row level security/g);
assert.match(sql,/revoke all.*anon,authenticated/);
assert.match(app,/validExportOriginalPath\(path,businessId\)/);
assert.match(app,/const backupWebsiteOriginals=async/);
assert.match(app,/Sharing\.shareAsync\(file\.uri/);
assert.match(page,/Privately back up my original photos/);
assert.equal(pkg.dependencies["expo-sharing"],"~57.0.19");
console.log("V3.137 original photo/tenant isolation/portable ZIP UI contract checks: PASS");
