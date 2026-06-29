import fs from 'node:fs';
import https from 'node:https';
const dist='C:/Users/黄安毅/Desktop/project/apps/web/dist';
const repo='wqdsj52/chatapp';
const token=process.env.GH_TOKEN;
if(!fs.existsSync(dist+'/index.html')) throw new Error('missing index.html');
function req(method,url,body){
  return new Promise((resolve,reject)=>{
    const u=new URL(url);
    const payload=body?JSON.stringify(body):null;
    const options={hostname:u.hostname,path:u.pathname+u.search,method,headers:{'User-Agent':'gh-deploy-script','Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'}};
    if(payload){options.headers['Content-Type']='application/json';options.headers['Content-Length']=Buffer.byteLength(payload)}
    const r=https.request(options,(res)=>{const chunks=[];res.on('data',(c)=>chunks.push(c));res.on('end',()=>{const text=Buffer.concat(chunks).toString();try{resolve({status:res.statusCode,data:JSON.parse(text)})}catch(e){resolve({status:res.statusCode,data:text})}})});
    r.on('error',reject);if(payload)r.write(payload);r.end();
  });
}
const files=[];
const walk=(d,p='')=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const rel=p?p+'/'+e.name:e.name;const full=d+'/'+e.name;if(e.isDirectory()) walk(full,rel);else if(e.isFile()) files.push({rel,full})}};
walk(dist);
console.log('files='+files.length);
const blobShaByRel=new Map();
for(const f of files){
  const body=fs.readFileSync(f.full).toString('base64');
  const res=await req('POST','https://api.github.com/repos/'+repo+'/git/blobs',{content:body,encoding:'base64'});
  if(res.status>=300) throw new Error('blob failed '+f.rel+' '+JSON.stringify(res.data));
  blobShaByRel.set(f.rel,res.data.sha);
}
let baseTree='';
try{
  const ref=(await req('GET','https://api.github.com/repos/'+repo+'/git/refs/heads/gh-pages')).data;
  const commit=(await req('GET','https://api.github.com/repos/'+repo+'/git/commits/'+ref.object.sha)).data;
  baseTree=commit.tree.sha;
}catch(e){baseTree=''}
const payload={tree:[...blobShaByRel.entries()].map(([path,sha])=>({path,mode:'100644',type:'blob',sha}))};
if(baseTree) payload.base_tree=baseTree;
const treeRes=await req('POST','https://api.github.com/repos/'+repo+'/git/trees',payload);
if(treeRes.status>=300) throw new Error('tree failed '+JSON.stringify(treeRes.data));
const commitBody={message:'deploy: update pages',tree:treeRes.data.sha};
if(baseTree) commitBody.parents=[(await req('GET','https://api.github.com/repos/'+repo+'/git/refs/heads/gh-pages')).data.object.sha];
const commitRes=await req('POST','https://api.github.com/repos/'+repo+'/git/commits',commitBody);
if(commitRes.status>=300) throw new Error('commit failed '+JSON.stringify(commitRes.data));
const refRes=await req('PATCH','https://api.github.com/repos/'+repo+'/git/refs/heads/gh-pages',{sha:commitRes.data.sha,force:true});
if(refRes.status>=300) throw new Error('ref failed '+JSON.stringify(refRes.data));
console.log(commitRes.data.sha);
