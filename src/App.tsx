import React, { useState, useEffect, useRef } from 'react';
import { useFinance, FinanceProvider } from './contexts/FinanceContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import confetti from 'canvas-confetti';

const INTRO_MSG='<strong>Analyzing your data…</strong><br><br>Your <span class="chip chip-r">Credit Card @ 36%</span> is the #1 threat — it\'s costing you <span class="chip chip-r">₹4,200/mo</span> in pure interest. That\'s ₹50,400/year.<br><br>Want me to run a debt-kill sequence?<span class="upd-tag">✓ Profile loaded</span>';

const REPLIES: Record<string, string> = {
  "Kill the Credit Card":'<strong>Debt-Kill Sequence: Credit Card</strong><br><br>You have <span class="chip chip-o">₹14,500</span> monthly surplus. Strategy:<br><br>▸ Redirect <span class="chip chip-g">₹12,000/mo</span> to credit card<br>▸ Cleared in <strong>~6 months</strong><br>▸ Then redirect that ₹4,200 saved to <span class="chip chip-g">Nifty SIP</span><br><br>Year 1 total interest saved: <span class="chip chip-g">₹28,400</span> <span class="upd-tag">✓ Strategy saved</span>',
  "Should I invest or repay?":'Deterministic math says:<br><br><span class="chip chip-r">Credit Card 36% APR</span> guaranteed return on payoff<br><span class="chip chip-o">Home Loan 8.5%</span> vs Nifty avg ~12%<br><br>▸ CC: <strong>Pay off first.</strong> 36% > any market return<br>▸ Car Loan: Borderline — split 50/50<br>▸ Home Loan: <strong>Invest instead.</strong> Market wins at 8.5%<br><br>Bottom line: <span class="chip chip-g">Kill CC → invest surplus</span>',
  "Show my debt-free date":'Based on current EMIs + surplus:<br><br>▸ Credit Card: <span class="chip chip-g">Dec 2025</span><br>▸ Car Loan: <span class="chip chip-o">Mar 2027</span><br>▸ Home Loan: <span class="chip chip-o">Aug 2037</span><br><br>If you add ₹5K/mo extra to Car Loan:<br><span class="chip chip-g">Car Loan → Oct 2026</span> — saves ₹18,400 interest',
  "What is ROI on prepayment?":'<strong>Guaranteed ROI Calculation</strong><br><br>Prepaying ₹1L on Home Loan @ 8.5%:<br>▸ Interest saved: <span class="chip chip-g">₹3,40,000</span><br>▸ Loan shortened: <span class="chip chip-g">~2 years</span><br>▸ Guaranteed ROI: <span class="chip chip-g">8.5%</span><br><br>vs FD @ ~7.1%: <span class="chip chip-r">Prepay wins</span><br>vs Nifty @ ~12%: <span class="chip chip-o">Invest wins</span>',
};

const SUGS_LIST=["Kill the Credit Card","Should I invest or repay?","Show my debt-free date","What is ROI on prepayment?"];

function BlobCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bx = canvas.getContext('2d');
    if (!bx) return;
    
    let bW = window.innerWidth, bH = window.innerHeight, bT = 0;
    const br = () => { bW = canvas.width = window.innerWidth; bH = canvas.height = window.innerHeight; };
    br(); window.addEventListener('resize', br);
    
    const blobs = [
      {x:.15,y:.3,rx:.4,ry:.3,spd:.00028,ph:0,c:'242,125,38'},
      {x:.8,y:.7,rx:.35,ry:.25,spd:.00022,ph:2.1,c:'242,125,38'},
      {x:.5,y:.1,rx:.3,ry:.22,spd:.00035,ph:4.2,c:'255,100,50'},
    ];
    let req: number;
    function drawB() {
      if (!bx) return;
      bx.clearRect(0,0,bW,bH); bT++;
      if (!active) {
        req = requestAnimationFrame(drawB);
        return;
      }
      blobs.forEach(b => {
        const Mathcos = Math.cos(bT*b.spd*.7+b.ph);
        const cx=bW*(b.x+Math.sin(bT*b.spd+b.ph)*.1);
        const cy=bH*(b.y+Mathcos*.08);
        const rx=bW*b.rx, ry=bH*b.ry;
        const g=bx.createRadialGradient(cx,cy,0,cx,cy,Math.max(rx,ry));
        g.addColorStop(0,`rgba(${b.c},.08)`); g.addColorStop(.5,`rgba(${b.c},.025)`); g.addColorStop(1,`rgba(${b.c},0)`);
        bx.save(); bx.translate(cx,cy); bx.rotate(bT*b.spd*.4);
        bx.scale(rx/Math.max(rx,ry), ry/Math.max(rx,ry));
        bx.beginPath(); bx.arc(0,0,Math.max(rx,ry),0,Math.PI*2);
        bx.fillStyle=g; bx.fill(); bx.restore();
      });
      req = requestAnimationFrame(drawB);
    }
    req = window.requestAnimationFrame(drawB);
    return () => { cancelAnimationFrame(req); window.removeEventListener('resize', br); };
  }, [active]);

  return <canvas id="blob-c" ref={canvasRef}></canvas>;
}

function MainApp() {
  const { user, login, logout } = useFinance();
  const [screen, setScreen] = useState<'LOGIN'|'APP'>('LOGIN');
  
  const [hookDebt, setHookDebt] = useState<number>(1000000);
  const [hookRate, setHookRate] = useState<number>(12);
  const [toastMsg, setToastMsg] = useState('');
  
  const [privacy, setPrivacy] = useState(false);
  const [fhsOpen, setFhsOpen] = useState(false);
  
  const [chatInp, setChatInp] = useState('');
  const [msgs, setMsgs] = useState<{role: "u"|"a", html?: string, typing?: boolean}[]>([]);
  const [sugs, setSugs] = useState<string[]>([]);
  
  const [loans, setLoans] = useState([
    { name: 'Home Loan', apr: 8.5, bar: 78, emi: '₹22,000', color: 'var(--o)', shadow: 'rgba(242,125,38,.5)', classList: '' },
    { name: 'Car Loan', apr: 12, bar: 40, emi: '₹8,500', color: 'var(--re)', shadow: 'rgba(239,68,68,.5)', classList: 'text-red-500' },
    { name: 'Credit Card', apr: 36, bar: 18, emi: '₹4,200', color: 'var(--re)', shadow: 'rgba(239,68,68,.7)', classList: 'text-red-500' },
  ]);
  const [showCelebrate, setShowCelebrate] = useState(false);
  
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if(cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  const triggerLogin = async () => {
    try {
      if (!user) await login();
      setScreen('APP');
      setTimeout(() => {
        setSugs(SUGS_LIST);
        pushAiMsg(INTRO_MSG);
      }, 600);
    } catch(e) {
      console.error(e);
      setScreen('APP');
      setTimeout(() => {
        setSugs(SUGS_LIST);
        pushAiMsg(INTRO_MSG);
      }, 600);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  };

  const msgsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const pushAiMsg = (html: string) => {
    setMsgs(prev => [...prev, { role: 'a', typing: true }]);
    setTimeout(() => {
      setMsgs(prev => {
        const withoutTyping = prev.filter(m => !m.typing);
        return [...withoutTyping, { role: 'a', html }];
      });
    }, 1200);
  };

  const sendMsg = async (text: string) => {
    if(!text.trim()) return;
    setSugs([]);
    setChatInp('');
    setMsgs(prev => [...prev, { role: 'u', html: text }]);
    
    // Hardcoded replies for specific scenarios
    if (REPLIES[text]) {
      pushAiMsg(REPLIES[text]);
      setTimeout(() => showToast('✓ Strategy updated'), 1800);
      return;
    }

    setMsgs(prev => [...prev, { role: 'a', typing: true }]);

    try {
      const token = user ? await user.getIdToken() : null;
      if (!token) throw new Error("Not authenticated");

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text, profileSummary: "User wants to kill their credit card debt." })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch");
      }
      
      setMsgs(prev => {
        const withoutTyping = prev.filter(m => !m.typing);
        return [...withoutTyping, { role: 'a', html: data.text }];
      });
    } catch (e) {
      console.error("Chat error:", e);
      setMsgs(prev => {
        const withoutTyping = prev.filter(m => !m.typing);
        return [...withoutTyping, { role: 'a', html: "Sorry, I'm having trouble connecting to my servers right now." }];
      });
    }
  };
  
  const demoSend = (text: string) => {
     setSugs([]);
     setMsgs(prev => [...prev, { role: 'u', html: text }]);
     const reply = REPLIES[text] || `Analyzing <strong>${text}</strong>…<br><br>Your fundamentals are solid — <span class="chip chip-g">FHS 75</span>, positive cash flow. Give me more context for a precision plan.`;
     pushAiMsg(reply);
     setTimeout(() => showToast('✓ Profile updated'), 2000);
  };

  const closeLoan = (idx: number) => {
    setLoans(prev => prev.filter((_, i) => i !== idx));
    setShowCelebrate(true);
    for (let i=0;i<60;i++) {
      setTimeout(() => {
        confetti({
           particleCount: 2,
           angle: 60,
           spread: 55,
           origin: { x: 0 },
           colors: ['#F27D26', '#ffffff', '#22c55e', '#ffd700']
        });
        confetti({
           particleCount: 2,
           angle: 120,
           spread: 55,
           origin: { x: 1 },
           colors: ['#F27D26', '#ffffff', '#22c55e', '#ffd700']
        });
      }, i * 40);
    }
    setTimeout(() => setShowCelebrate(false), 4000);
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const handleCardMove = (e: React.MouseEvent) => {
    if(!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width;
    const cy = (e.clientY - r.top) / r.height;
    cardRef.current.style.transform = `perspective(700px) rotateX(${(cy - .5) * -9}deg) rotateY(${(cx - .5) * 9}deg) scale(1.015)`;
  };
  const handleCardLeave = () => {
    if(!cardRef.current) return;
    cardRef.current.style.transition = 'transform .5s cubic-bezier(.34,1.2,.64,1)';
    cardRef.current.style.transform = 'perspective(700px) rotateX(0) rotateY(0) scale(1)';
    setTimeout(() => { if(cardRef.current) cardRef.current.style.transition = ''; }, 500);
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const [tipData, setTipData] = useState<{v: number, m: string, x: number, y: number} | null>(null);
  
  const generateChart = () => {
    const data = [310000,420000,490000,540000,620000,700000,800000,920000];
    const months = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
    const W=560,H=140,pl=8,pr=8,pt=8,pb=26;
    const iW=W-pl-pr,iH=H-pt-pb;
    const mn=200000,mx=1000000;
    const pts = data.map((v,i) => ({x: pl + (i/(data.length-1))*iW, y: pt + iH - ((v-mn)/(mx-mn))*iH, v, m: months[i]}));
    const line = pts.map((p,i) => (i===0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
    const area = line + ` L${pts[pts.length-1].x},${pt+iH} L${pl},${pt+iH} Z`;
    return { pts, line, area, months, data, W, H, pl, iW };
  };

  return (
    <div className={privacy ? "privacy-on" : ""}>
      <div id="cur" ref={cursorRef}></div>
      <div id="toast" className={toastMsg ? "show" : ""}>{toastMsg}</div>
      <div id="celebrate" className={showCelebrate ? "show" : ""}>
        <div className="cel-box">
          <div className="cel-icon">🚩</div><div className="cel-title">Debt Slain</div><div className="cel-sub">You just killed the interest monster</div>
        </div>
      </div>
      
      {/* ══ LOGIN ══ */}
      <div id="login" className={`scr ${screen === 'LOGIN' ? 'on' : ''}`}>
        <BlobCanvas active={screen==='LOGIN'} />
        <div className="login-wrap">
          <div>
            <div className="l-eyebrow"><span className="ping"></span> AI-Powered Debt Engine</div>
            <h1 className="l-h1">Stop Paying<br/>Banks.<br/><span>Start Building Wealth.</span></h1>
            <p className="l-sub">The only AI strategist using <strong>deterministic math</strong> to compare debt vs market ROI. No hallucinations. Just numbers.</p>
            <div className="l-stats">
              <div className="l-stat">Real-time financial health scoring</div>
              <div className="l-stat">Debt vs investment ROI comparison</div>
              <div className="l-stat">AI advisory personalized to your data</div>
              <div className="l-stat">Encrypted · Never shared · Delete anytime</div>
            </div>
            <button className="cta-btn" onClick={triggerLogin}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Secure Login with Google
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div className="l-right">
            <div className="l-card" id="lcrd" ref={cardRef} onMouseMove={handleCardMove} onMouseLeave={handleCardLeave}>
              <div className="l-card-bar"></div>
              <div className="l-card-scan"></div>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18}}>
                <div>
                  <span className="tag tag-o">✦ Featured Tool</span>
                  <div style={{fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.4rem', letterSpacing:'-0.03em', marginTop:8, fontStyle:'italic'}}>The Lazy Interest Trap</div>
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <div className="calc-label">Total Debt (₹)</div>
                <input type="number" value={hookDebt} onChange={e => setHookDebt(+e.target.value)} className="calc-input" />
              </div>
              <div style={{marginBottom:20}}>
                <div className="calc-label">Interest Rate (APR %)</div>
                <input type="number" value={hookRate} onChange={e => setHookRate(+e.target.value)} className="calc-input" />
                <div className="range-wrap">
                  <input type="range" min="6" max="36" value={hookRate} onChange={e => setHookRate(+e.target.value)} />
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'.58rem', color:'var(--t3)', fontFamily:'JetBrains Mono, monospace', marginTop:2}}><span>6%</span><span>36%</span></div>
                </div>
              </div>
              <div className="result-box">
                <div className="result-label">▼ 10-Year Lazy Interest</div>
                <div className="result-val">{'₹'+Math.round(hookDebt*(hookRate/100)*10).toLocaleString('en-IN')}</div>
                <div className="result-sub">You are set to pay this in <strong>"Lazy Interest"</strong> to the bank. Every year you wait costs more.</div>
              </div>
              <button className="ghost-btn" onClick={triggerLogin}>
                Kill This Interest
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ APP ══ */}
      <div id="app" className={`scr ${screen === 'APP' ? 'on' : ''}`}>
        <div className="sidebar">
          <div className="sb-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <div className="fhs-mini">
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5"/>
              <circle cx="26" cy="26" r="21" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeDasharray="131.9" strokeDashoffset={screen==='APP'?33:131.9} transform="rotate(-90 26 26)" style={{filter:'drop-shadow(0 0 6px rgba(34,197,94,.5))', transition:'stroke-dashoffset 1.5s cubic-bezier(.34,1.2,.64,1)'}} />
              <text x="26" y="30" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="11" fontWeight="700" fill="#E4E3E0">75</text>
            </svg>
            <div className="fhs-mini-val">FHS</div>
          </div>
          <button className="nav-btn act"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg><span className="tt">Dashboard</span></button>
          <button className="nav-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg><span className="tt">Goals</span></button>
          <button className="nav-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><span className="tt">Analytics</span></button>
          <button className="nav-btn" onClick={() => setPrivacy(!privacy)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span className="tt">Privacy Mode</span></button>
          <button className="av-btn" onClick={() => { logout(); setScreen('LOGIN'); }}>R<span className="tt">Logout</span></button>
        </div>
        <div style={{display:'flex', flexDirection:'column', flex:1, height:'100vh', overflow:'hidden'}}>
          <div className="topbar">
            <span className="tb-brand">DebtStrategist<span>.AI</span></span>
            <span className="tb-sep">/</span>
            <span className="tb-crumb">Dashboard</span>
            <div className="tb-sp"></div>
            <div className="tb-chip"><span style={{width:6, height:6, borderRadius:'50%', background:'#E8C547', flexShrink:0}}></span> Jun 5, 2025</div>
            <div className="tb-chip"><span className="live-dot"></span> AI Sync</div>
            <div className={`tb-chip ${privacy?'act':''}`} onClick={()=>setPrivacy(!privacy)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Privacy
            </div>
            <div className="tb-chip" onClick={()=>showToast('📄 Exporting roadmap…')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Export
            </div>
            <div className="tb-av">R</div>
          </div>
          <div className="app-body">
            <div className="main-panel">
              <div className="stat-grid">
                <div className="s-card" style={{animation:'msg-in .4s .05s both'}}>
                  <div className="s-card-top" style={{background:'linear-gradient(90deg,#22c55e,#4ade80)'}}></div>
                  <div className="s-lbl">Net Worth</div>
                  <div className="s-val pv">₹9,20,000</div>
                  <svg className="s-spark" viewBox="0 0 100 26" width="100%" height="26" dangerouslySetInnerHTML={{__html: `<defs><linearGradient id="gnw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22c55e" stop-opacity=".3"/><stop offset="100%" stop-color="#22c55e" stop-opacity="0"/></linearGradient></defs><path d="M0,19.3 L14.3,17.4 L28.6,18.5 L42.9,13.7 L57.1,14.8 L71.4,10.4 L85.7,8.2 L100,3.7 L100,26 L0,26 Z" fill="url(#gnw)"/><path d="M0,19.3 L14.3,17.4 L28.6,18.5 L42.9,13.7 L57.1,14.8 L71.4,10.4 L85.7,8.2 L100,3.7" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px #22c55e80)"/>`}}></svg>
                  <div className="s-hint pv">↑ ₹42,000 this month</div>
                </div>
                <div className="s-card" style={{animation:'msg-in .4s .1s both'}}>
                  <div className="s-card-top" style={{background:'linear-gradient(90deg,#F27D26,#FF9F54)'}}></div>
                  <div className="s-lbl">Monthly Income</div>
                  <div className="s-val pv">₹85,000</div>
                  <svg className="s-spark" viewBox="0 0 100 26" width="100%" height="26" dangerouslySetInnerHTML={{__html: `<defs><linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F27D26" stop-opacity=".3"/><stop offset="100%" stop-color="#F27D26" stop-opacity="0"/></linearGradient></defs><path d="M0,20.0 L14.3,17.1 L28.6,12.7 L42.9,12.7 L57.1,8.3 L71.4,5.4 L85.7,2.4 L100,-2.0 L100,26 L0,26 Z" fill="url(#gi)"/><path d="M0,20.0 L14.3,17.1 L28.6,12.7 L42.9,12.7 L57.1,8.3 L71.4,5.4 L85.7,2.4 L100,-2.0" fill="none" stroke="#F27D26" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px #F27D2680)"/>`}}></svg>
                  <div className="s-hint">Fixed salary</div>
                </div>
                <div className="s-card" style={{animation:'msg-in .4s .15s both'}}>
                  <div className="s-card-top" style={{background:'linear-gradient(90deg,#60a5fa,#38bdf8)'}}></div>
                  <div className="s-lbl">Cash Flow</div>
                  <div className="s-val pv">₹14,500</div>
                  <svg className="s-spark" viewBox="0 0 100 26" width="100%" height="26" dangerouslySetInnerHTML={{__html: `<defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#60a5fa" stop-opacity=".3"/><stop offset="100%" stop-color="#60a5fa" stop-opacity="0"/></linearGradient></defs><path d="M0,20.0 L14.3,13.2 L28.6,16.6 L42.9,9.8 L57.1,6.5 L71.4,3.1 L85.7,6.5 L100,-2.0 L100,26 L0,26 Z" fill="url(#gc)"/><path d="M0,20.0 L14.3,13.2 L28.6,16.6 L42.9,9.8 L57.1,6.5 L71.4,3.1 L85.7,6.5 L100,-2.0" fill="none" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px #60a5fa80)"/>`}}></svg>
                  <div className="s-hint pv" style={{color:'var(--go)'}}>↑ Positive</div>
                </div>
                <div className="s-card" onClick={()=>setFhsOpen(!fhsOpen)} style={{cursor:'pointer', animation:'msg-in .4s .2s both'}} title="Click for breakdown">
                  <div className="s-card-top" style={{background:'linear-gradient(90deg,#a855f7,#ec4899)'}}></div>
                  <div className="s-lbl">Health Score</div>
                  <div className="s-val" style={{color:'#a855f7'}}>75</div>
                  <svg className="s-spark" viewBox="0 0 100 26" width="100%" height="26" dangerouslySetInnerHTML={{__html: `<defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a855f7" stop-opacity=".3"/><stop offset="100%" stop-color="#a855f7" stop-opacity="0"/></linearGradient></defs><path d="M0,20.0 L14.3,17.1 L28.6,12.7 L42.9,8.3 L57.1,5.4 L71.4,2.4 L85.7,1.0 L100,-2.0 L100,26 L0,26 Z" fill="url(#gf)"/><path d="M0,20.0 L14.3,17.1 L28.6,12.7 L42.9,8.3 L57.1,5.4 L71.4,2.4 L85.7,1.0 L100,-2.0" fill="none" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px #a855f780)"/>`}}></svg>
                  <div className="s-hint" style={{color:'var(--t3)', fontSize:'.58rem'}}>Click for breakdown ▸</div>
                </div>
              </div>
              {fhsOpen && (
                <div style={{marginBottom:16, animation:'msg-in .35s both'}}>
                  <div className="section-card">
                    <div className="section-head">
                      <div className="section-title">⚡ FHS Breakdown</div>
                      <button onClick={()=>setFhsOpen(false)} style={{background:'none', border:'none', color:'var(--t3)', cursor:'pointer', fontSize:'.7rem', fontFamily:'JetBrains Mono, monospace'}}>CLOSE ✕</button>
                    </div>
                    <div style={{padding:'16px 18px', display:'flex', flexDirection:'column', gap:12}}>
                      {[
                        ['Savings Rate', '82%', 'var(--go)', 82],
                        ['Debt Load', '70%', 'var(--o)', 70],
                        ['Emergency Fund', '68%', 'var(--bl)', 68],
                        ['Investment Rate', '74%', '#a855f7', 74]
                      ].map(([l, v, c, n], i) => (
                        <div key={i}>
                          <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                            <span style={{fontSize:'.7rem', color:'var(--t2)'}}>{l.toString()}</span>
                            <span style={{fontFamily:'JetBrains Mono, monospace', fontSize:'.7rem', fontWeight:700, color:c as string}}>{v.toString()}</span>
                          </div>
                          <div className="goal-track"><div className="goal-fill" style={{width:`${screen==='APP'?n:0}%`, background:c as string, boxShadow:`0 0 8px ${c}60`}}></div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="next-move" style={{animation:'msg-in .4s .25s both'}}>
                <div className="next-move-kicker">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  The Play
                </div>
                <h2>Your Best Next Move</h2>
                <p>Your <strong>Home Loan at 8.5%</strong> is costing you ₹3.4L in extra interest. A ₹1L prepayment now cuts 2 years off your loan and saves more than any FD. <strong>Commit to the prepayment this month.</strong></p>
                <div style={{display:'flex', gap:10}}>
                  <button className="cta-btn" style={{fontSize:'.75rem', padding:'10px 20px'}} onClick={()=>showToast('🎯 Strategy committed to plan!')}>Commit to Play</button>
                  <button className="ghost-btn" style={{width:'auto', padding:'10px 18px', fontSize:'.75rem'}} onClick={()=>showToast('📊 Running simulation…')}>Simulate Scenario</button>
                </div>
              </div>
              <div className="section-card" style={{animation:'msg-in .4s .3s both', marginBottom:16}}>
                <div className="section-head">
                  <div className="section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--o)" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>
                    Net Worth Journey
                  </div>
                  <div style={{display:'flex', gap:6}}><span className="tag tag-g">+₹42K this month</span></div>
                </div>
                <div className="chart-wrap" style={{position:'relative'}} onMouseLeave={()=>setTipData(null)}>
                  <svg width="100%" height="140" viewBox="0 0 560 140" preserveAspectRatio="none" style={{overflow:'visible', display:'block'}} ref={svgRef}>
                    <defs>
                      <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F27D26" stopOpacity=".2"/><stop offset="100%" stopColor="#F27D26" stopOpacity="0"/></linearGradient>
                    </defs>
                    {(() => {
                      const { pts, line, area, months, W, H, pl, iW } = generateChart();
                      return (
                        <>
                          <line x1="8" y1="114" x2="552" y2="114" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
                          <path d={area} fill="url(#ag)" />
                          <path d={line} fill="none" stroke="#F27D26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{filter:'drop-shadow(0 0 8px rgba(242,125,38,.55))'}} />
                          {pts.map((p: any, i: number) => (
                            <circle key={i} cx={p.x} cy={p.y} r={tipData?.x === p.x ? 7 : 4.5} fill="#F27D26" stroke="#050508" strokeWidth="2" style={{cursor:'pointer', filter:'drop-shadow(0 0 5px rgba(242,125,38,.7))'}}
                              onMouseEnter={(e: any) => {
                                const wr = svgRef.current?.getBoundingClientRect();
                                const cr = (e.target as SVGCircleElement).getBoundingClientRect();
                                if(!wr) return;
                                setTipData({ v: p.v, m: p.m, x: p.x, y: (cr.top - wr.top - 8) })
                              }}
                            />
                          ))}
                          {months.map((m: any, i: number) => (
                            <text key={i} x={pl + (i/(months.length-1))*iW} y={H-3} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="9" fill="rgba(255,255,255,.25)">{m}</text>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                  {tipData && (
                    <div className="chart-tooltip" style={{opacity: 1, left: (tipData.x / 560)*100 + '%', top: tipData.y, transform: 'translate(-50%,-100%)'}}>
                      <strong style={{fontFamily:'JetBrains Mono, monospace', color:'#F27D26', fontSize:'1rem'}}>
                        {tipData.v >= 100000 ? '₹'+(tipData.v/100000).toFixed(1)+'L' : '₹'+tipData.v.toLocaleString('en-IN')}
                      </strong><br/>
                      <span style={{fontSize:'.65rem', color:'rgba(255,255,255,.4)'}}>{tipData.m} 2024</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16, animation:'msg-in .4s .35s both'}}>
                <div className="section-card">
                  <div className="section-head">
                    <div className="section-title"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--o)" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> AI Intelligence Feed</div>
                    <span className="tag tag-o">3 Active</span>
                  </div>
                  <div>
                    <div className="insight-row"><div className="insight-ico" style={{background:'rgba(239,68,68,.1)'}}>⚠️</div><div className="insight-txt">Home loan EMI is <strong>28% of income</strong> — borderline high. Reduce or prepay within 6 months.<div style={{marginTop:6}}><span className="tag tag-r" style={{fontSize:'.55rem'}}>CRITICAL</span></div></div></div>
                    <div className="insight-row"><div className="insight-ico" style={{background:'rgba(242,125,38,.1)'}}>📈</div><div className="insight-txt">₹5K/mo in <strong>Nifty 50 SIP</strong> will compound to ₹62L in 10 years at 12% CAGR.<div style={{marginTop:6}}><span className="tag tag-o" style={{fontSize:'.55rem'}}>HIGH</span></div></div></div>
                    <div className="insight-row"><div className="insight-ico" style={{background:'rgba(96,165,250,.1)'}}>💡</div><div className="insight-txt">Cancelling 2 unused OTT subscriptions saves <strong>₹800/mo</strong> → extra ₹9,600/yr.<div style={{marginTop:6}}><span className="tag tag-b" style={{fontSize:'.55rem'}}>MEDIUM</span></div></div></div>
                  </div>
                </div>
                <div className="section-card">
                  <div className="section-head">
                    <div className="section-title"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--o)" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Liability Breakdown</div>
                    <span className="tag tag-r" style={{fontSize:'.55rem'}}>₹37L Total</span>
                  </div>
                  <div>
                    {loans.map((loan, idx) => (
                      <div className="loan-row" key={idx}>
                        <div className="loan-name">{loan.name}</div>
                        <div className={`loan-apr ${loan.classList}`}>{loan.apr}%</div>
                        <div className="loan-bar-wrap"><div className="loan-bar" style={{width: screen === 'APP' ? `${loan.bar}%` : '0%', background: loan.color, boxShadow: `0 0 6px ${loan.shadow}`}}></div></div>
                        <div className="loan-emi pv">{loan.emi}</div>
                        <button className="close-btn" onClick={() => closeLoan(idx)}>Close</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="section-card" style={{animation:'msg-in .4s .4s both', marginBottom:40}}>
                <div className="section-head">
                  <div className="section-title"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--o)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> Financial Goals</div>
                </div>
                <div>
                  <div className="goal-row">
                    <div className="goal-header"><div className="goal-name">Emergency Fund</div><div className="goal-pct">68%</div></div>
                    <div className="goal-track"><div className="goal-fill" style={{width: screen==='APP'?'68%':'0%', background:'linear-gradient(90deg,var(--o),#FF9F54)', boxShadow:'0 0 8px rgba(242,125,38,.5)'}}></div></div>
                    <div className="goal-meta pv">₹2.0L of ₹3.0L · 7 months left · save ₹14K/mo</div>
                  </div>
                  <div className="goal-row">
                    <div className="goal-header"><div className="goal-name">Dream Home 🏡</div><div className="goal-pct" style={{color:'var(--bl)'}}>22%</div></div>
                    <div className="goal-track"><div className="goal-fill" style={{width: screen==='APP'?'22%':'0%', background:'linear-gradient(90deg,#3b82f6,var(--bl))', boxShadow:'0 0 8px rgba(96,165,250,.5)'}}></div></div>
                    <div className="goal-meta pv">₹5.5L of ₹25L · 4.2 yrs left · save ₹25K/mo</div>
                  </div>
                  <div className="goal-row" style={{border:'none'}}>
                    <div className="goal-header"><div className="goal-name">Retirement 🌴</div><div className="goal-pct" style={{color:'#a855f7'}}>11%</div></div>
                    <div className="goal-track"><div className="goal-fill" style={{width: screen==='APP'?'11%':'0%', background:'linear-gradient(90deg,#9333ea,#a855f7)', boxShadow:'0 0 8px rgba(168,85,247,.5)'}}></div></div>
                    <div className="goal-meta pv">₹1.1L of ₹1Cr · 26 yrs · invest ₹8K/mo</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="chat-panel">
              <div className="chat-hd">
                <div className="chat-hd-left"><div className="live-dot"></div><div><div className="chat-hd-title">AI Advisory Mode</div><div style={{fontSize:'.58rem', color:'var(--t3)', fontFamily:'JetBrains Mono, monospace'}}>Real-time financial analysis</div></div></div>
                <span className="tag tag-o" style={{fontSize:'.55rem'}}>Home Loan @ 8.5%</span>
              </div>
              <div className="chat-msgs" id="msgs">
                {msgs.map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}>
                    <div className="msg-av">{m.role === 'u' ? 'R' : '⚡'}</div>
                    <div className="bubble">
                      {m.typing ? (
                        <div className="typing"><span></span><span></span><span></span></div>
                      ) : (
                        <span dangerouslySetInnerHTML={{__html: m.html || ''}}></span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={msgsEndRef} />
              </div>
              <div className="chat-sugs">
                {sugs.map(s => (
                  <div key={s} className="sug" onClick={() => demoSend(s)}>{s}</div>
                ))}
              </div>
              <div className="chat-inp-wrap">
                <div className="chat-inp-row">
                  <input type="text" value={chatInp} onChange={e => setChatInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg(chatInp)} placeholder="Ask about debt strategy…" />
                  <button className="send-btn" onClick={() => sendMsg(chatInp)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
                <div className="chat-note">DebtStrategist.AI · Not certified financial advice</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FinanceProvider>
        <MainApp />
      </FinanceProvider>
    </ErrorBoundary>
  );
}
