const ORIGIN = 'https://bohyeon04.github.io';
const API = 'https://api.github.com/repos/bohyeon04/bohyeon04.github.io/issues';
const recent = new Map();
const headers = {'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'};
const json = (data,status=200,extra={}) => new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/') return json({service:'BOHYEON LAB Board API',ready:!!env.GITHUB_TOKEN});
    if (path !== '/posts') return json({error:'페이지를 찾을 수 없어요.'},404);
    if (request.headers.get('Origin') !== ORIGIN) return json({error:'BOHYEON LAB 게시판에서 작성해 주세요.'},403);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
    if (request.method !== 'POST') return json({error:'지원하지 않는 요청입니다.'},405,{Allow:'POST, OPTIONS'});
    if (!env.GITHUB_TOKEN) return json({error:'게시판 저장 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.'},503);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'잘못된 요청 형식입니다.'},415);
    let input;
    try {
      const reader = request.body?.getReader();
      if (!reader) return json({error:'내용을 입력해 주세요.'},400);
      const chunks=[]; let size=0;
      while (true) {
        const {done,value}=await reader.read(); if(done) break;
        size+=value.byteLength;
        if(size>24000){await reader.cancel();return json({error:'내용이 너무 길어요.'},413);}
        chunks.push(value);
      }
      const bytes=new Uint8Array(size);let offset=0;
      for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
      input=JSON.parse(new TextDecoder().decode(bytes));
    } catch {return json({error:'입력 내용을 확인해 주세요.'},400);}
    if (!input || typeof input !== 'object' || Array.isArray(input)) return json({error:'입력 내용을 확인해 주세요.'},400);
    if (input.website) return json({error:'요청을 처리할 수 없어요.'},400);
    const {title,body,category,nickname}=input;
    if (typeof title!=='string'||!title.trim()||title.trim().length>100 || typeof body!=='string'||!body.trim()||body.trim().length>5000 || !['자유','질문','후기'].includes(category) || typeof nickname!=='string'||nickname.trim().length>24 || /[\r\n]/.test(nickname)) return json({error:'제목 100자, 내용 5,000자, 이름 24자 이내로 입력해 주세요.'},400);
    // Best-effort burst protection per Worker instance. Never store the IP in GitHub.
    const now=Date.now();
    for(const [key,time] of recent) if(now-time>60000)recent.delete(key);
    const ip=request.headers.get('CF-Connecting-IP')||'unknown';
    if(recent.has(ip))return json({error:'글을 등록한 뒤 1분 후에 다시 작성해 주세요.'},429,{'Retry-After':'60'});
    recent.set(ip,now);
    const author=nickname.trim()||'익명';
    // Keep user input in plain text; GitHub @mentions should not notify other accounts.
    const safe=text=>text.replaceAll('@','＠');
    const content='<!-- bohyeon-board-v1 -->\n작성자: '+safe(author)+'\n\n'+safe(body.trim());
    try {
      const result=await fetch(API,{method:'POST',headers:{'Authorization':'Bearer '+env.GITHUB_TOKEN,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'BOHYEON-LAB-Board','Content-Type':'application/json'},body:JSON.stringify({title:'['+category+'] '+safe(title.trim()),body:content}),signal:AbortSignal.timeout(15000)});
      if(!result.ok) return json({error:'GitHub에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'},502);
      const post=await result.json();
      return json({number:post.number,url:post.html_url},201);
    } catch {return json({error:'저장 결과를 확인하지 못했어요. 목록을 새로고침한 뒤 다시 시도해 주세요.'},502);}
  }
};
