(function(){
const id=new URLSearchParams(location.search).get('id')||location.pathname.match(/chapter-(\d+)/)?.[1]||1;
const c=A2Z_getChapter(id);const key='a2z-progress-v1';
const read=()=>JSON.parse(localStorage.getItem(key)||'{}');const save=x=>localStorage.setItem(key,JSON.stringify(x));
const p=read();p[c.id]??={visited:false,quiz:0,attempts:0,completed:false};p[c.id].visited=true;save(p);
document.title=`Chapter ${c.id}: ${c.title} | A2Z Learning Solutions`;
const practiceLink=c.id===1?'../chapter-1/practice-test.html':null;
document.body.innerHTML=`<main class="wrap"><header><a href="../">← Class 6 Science</a><h1>Chapter ${c.id}: ${c.title}</h1><p>Learn → Practice → Revise → Test → Analyse</p></header>
<nav class="learning-steps" aria-label="Chapter learning journey"><a class="active" href="#learn">1. Learn</a><a href="#practice">2. Practice</a><a href="#revise">3. Revise</a><a href="#test">4. Test</a><a href="#analyse">5. Analyse</a></nav>
<section class="grid">
<article id="learn" class="card"><h2>📖 Learn</h2><p>This chapter follows the A2Z learning architecture: explanation, key concepts, questions, assessment and progress tracking.</p>${c.source?`<a class="btn" href="${c.source}">Open chapter notes →</a>`:'<p><strong>Content preparation:</strong> This chapter is queued for full content production.</p>'}</article>
<article id="practice" class="card"><h2>✏️ Practice</h2><p>Use questions and recall before taking the assessment.</p>${practiceLink?`<a class="btn" href="${practiceLink}">Open Chapter 1 Practice Test →</a>`:'<p>Practice questions will be added as this chapter receives its full learning template.</p>'}</article>
<article id="revise" class="card"><h2>🔄 Revise</h2><p>Return to the chapter notes, key terms and summary. Focus on concepts you could not recall during practice.</p>${c.source?`<a class="btn secondary" href="${c.source}#summary">Open Summary →</a>`:''}</article>
<article id="test" class="card"><h2>🎯 Test</h2><p>Chapter score: <strong>${p[c.id].quiz||0}%</strong></p><button id="start">Start Chapter Assessment</button><div id="quiz"></div></article>
<article id="analyse" class="card"><h2>📊 Analyse</h2><div id="progress"></div><p class="tip"><strong>Study rule:</strong> If your score is below 60%, revise the weak concepts and retry.</p></article>
</section></main>`;
const qs=[{q:`What is the best way to study Chapter ${c.id}?`,a:['Read, recall, practise and review','Only memorise headings','Skip assessment','Read once'],x:0},{q:'Which action gives useful learning evidence?',a:['Guessing','Taking a quiz and reviewing mistakes','Closing the page','Skipping questions'],x:1},{q:'What should a student do after a weak score?',a:['Stop studying','Review weak concepts and retry','Delete progress','Ignore mistakes'],x:1}];
function render(){document.getElementById('progress').innerHTML=`<p>Visited: ${p[c.id].visited?'✓':'—'}</p><p>Attempts: ${p[c.id].attempts}</p><p>Best score: ${p[c.id].quiz}%</p><p>Completed: ${p[c.id].completed?'✓':'Not yet'}</p>`}
document.getElementById('start').onclick=()=>{document.getElementById('quiz').innerHTML=qs.map((q,i)=>`<div class="q"><b>${i+1}. ${q.q}</b>${q.a.map((a,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${a}</label>`).join('')}</div>`).join('')+'<button id="submit">Submit assessment</button>';document.getElementById('submit').onclick=()=>{let s=0;qs.forEach((q,i)=>{if(document.querySelector('input[name=q'+i+']:checked')?.value==q.x)s++});const score=Math.round(s/qs.length*100);p[c.id].quiz=Math.max(p[c.id].quiz,score);p[c.id].attempts++;p[c.id].completed=score>=60;save(p);document.getElementById('quiz').insertAdjacentHTML('afterbegin',`<div class="result"><strong>Score: ${score}%</strong> — ${score>=60?'Chapter completed!':'Review the chapter and try again.'}</div>`);render()}};render();
})();
