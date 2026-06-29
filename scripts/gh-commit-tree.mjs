import fs from 'node:fs';
import https from 'node:https';
const repo='wqdsj52/chatapp';
const token=process.env.GH_TOKEN;
const message=process.argv[2] || 'update';
const rootDir=process.argv[3] || '.';
const branch=process.argv[4] || 'master';
function req(method,url,body){return new Promise((resolve,reject)=>{const u=new URL(url);const payload=body?JSON.stringify(body):null;const options={hostname:u.hostname,path:u.pathname+u.search,method,headers:{'User-Agent':'gh-deploy-script','Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'}};if(payload){options.headers['Content-Type']='application/json';options.headers['Content-Length']=Buffer.byteLength(payload)}const r=https.request(options,(res)=>{const chunks=[];res.on('data',(c)=>chunks.push(c));res.on('end',()=>{const text=Buffer.concat(chunks).toString();try{resolve({status:res.statusCode,data:JSON.parse(text)})}catch(e){resolve({status:res.statusCode,data:text})}})});r.on('error',reject);if(payload)r.write(payload);r.end();});}
function collectFiles(dir,prefix=''){const out=[];for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix?prefix+'/'+entry.name:entry.name;const full=dir+'/'+entry.name;if(entry.isDirectory()){if(['node_modules','.git','dist','.netlify','apk-output','apk-release','screenshots'].includes(entry.name)) continue;out.push(...collectFiles(full,rel))}else if(entry.isFile()){out.push({rel,full})}} return out}
async function main(){
const files=collectFiles(rootDir);
console.log('files='+files.length);
const blobMap=new Map();
for(const f of files){const body=fs.readFileSync(f.full).toString('base64');const res=await req('POST','https://api.github.com/repos/'+repo+'/git/blobs',{content:body,encoding:'base64'});if(res.status>=300) throw new Error('blob failed '+f.rel+' '+JSON.stringify(res.data));blobMap.set(f.rel,res.data.sha)}
let baseSha='';
try{const ref=await req('GET','https://api.github.com/repos/'+repo+'/git/refs/heads/'+branch);baseSha=ref.data.object.sha}catch(e){baseSha=''}
let baseTree='';
if(baseSha){const commit=await req('GET','https://api.github.com/repos/'+repo+'/git/commits/'+baseSha);if(commit.status<300) baseTree=commit.data.tree.sha}
const payload={tree:[...blobMap.entries()].map(([path,sha])=>({path,mode:'100644',type:'blob',sha}))};
if(baseTree) payload.base_tree=baseTree;
const tree=await req('POST','https://api.github.com/repos/'+repo+'/git/trees',payload);
if(tree.status>=300) throw new Error('tree failed '+JSON.stringify(tree.data));
const body={message,tree:tree.data.sha};
if(baseSha) body.parents=[baseSha];
const commit=await req('POST','https://api.github.com/repos/'+repo+'/git/commits',body);
if(commit.status>=300) throw new Error('commit failed '+JSON.stringify(commit.data));
const ref=await req('PATCH','https://api.github.com/repos/'+repo+'/git/refs/heads/'+branch,{sha:commit.data.sha,force:true});
if(ref.status>=300) throw new Error('ref failed '+JSON.stringify(ref.data));
console.log(commit.data.sha);
}
main().catch((e)=>{console.error(e);process.exit(1)});
