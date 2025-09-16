console.log('Parcheando flags de cookie jrt en dist/...');

const fs = require('fs');
const path = require('path');

function walk(dir){
  return fs.readdirSync(dir).flatMap(f=>{
    const p = path.join(dir,f);
    const st = fs.statSync(p);
    return st.isDirectory() ? walk(p) : (p.endsWith('.js') ? [p] : []);
  });
}

const wantOpts = '{ domain: ".lider.chat", path: "/", httpOnly: true, secure: true, sameSite: "none", maxAge: 2592000000 }';
const reSet = /res\.cookie\(\s*(['"])jrt\1\s*,\s*([^,\)]+)(?:\s*,\s*\{[^}]*\})?\s*\)/g;
const reClr = /res\.clearCookie\(\s*(['"])jrt\1\s*(?:,\s*\{[^}]*\})?\s*\)/g;

let touched = [];

for (const file of walk('dist')) {
  let s = fs.readFileSync(file, 'utf8');
  let ns = s.replace(reSet, (_m, _q, val) => `res.cookie("jrt", ${val}, ${wantOpts})`);
  ns = ns.replace(reClr, (_m, _q) => `res.clearCookie("jrt", { domain: ".lider.chat", path: "/", httpOnly: true, secure: true, sameSite: "none" })`);
  if (ns !== s) { fs.writeFileSync(file, ns); touched.push(file); }
}

console.log('Archivos modificados:', touched.length);
touched.forEach(f => console.log(' -', f));
