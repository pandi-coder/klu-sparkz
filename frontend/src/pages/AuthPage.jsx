import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp }  from '../context/AppContext';

const DEPARTMENTS = [
  'Computer Science','Electronics & Communication','Mechanical Engineering',
  'Civil Engineering','Electrical Engineering','Information Technology',
  'Artificial Intelligence','Data Science','MBA','MCA','Physics','Mathematics',
];

export default function AuthPage() {
  const { login, register } = useAuth();
  const { showToast }       = useApp();
  const navigate            = useNavigate();
  const canvasRef           = useRef();

  const [mode,      setMode]      = useState('login');
  const [loading,   setLoading]   = useState(false);
  const [role,      setRole]      = useState('Student');
  const [loginForm, setLoginForm] = useState({ email:'', password:'' });
  const [regForm,   setRegForm]   = useState({
    name:'', email:'', phone:'', password:'',
    dob:'', gender:'', department:'', year:'',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const pts = Array.from({length:80},()=>({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5,
      r:1+Math.random()*2.5, a:.08+Math.random()*.35,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p=>{
        p.x=(p.x+p.vx+canvas.width)%canvas.width;
        p.y=(p.y+p.vy+canvas.height)%canvas.height;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,215,0,${p.a})`; ctx.fill();
      });
      pts.forEach((p,i)=>pts.slice(i+1).forEach(q=>{
        const d=Math.hypot(p.x-q.x,p.y-q.y);
        if(d<90){
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
          ctx.strokeStyle=`rgba(220,40,60,${.12*(1-d/90)})`;
          ctx.lineWidth=.5; ctx.stroke();
        }
      }));
      raf=requestAnimationFrame(draw);
    };
    draw();
    return ()=>cancelAnimationFrame(raf);
  },[]);

  const handleLogin = async e => {
    e.preventDefault(); setLoading(true);
    const res = await login(loginForm.email, loginForm.password);
    setLoading(false);
    if (res.success) {
      showToast('Welcome back! 🎉','success');
      navigate('/',{replace:true});
    } else {
      showToast(res.message||'Login failed','danger');
    }
  };

  const handleRegister = async e => {
    e.preventDefault(); setLoading(true);
    const res = await register({...regForm, role});
    setLoading(false);
    if (res.success) {
      if (res.adminPending) {
        showToast('Submitted! Awaiting approval.','info');
        setMode('login');
      } else {
        showToast('Welcome to KLU Sparkz! 🎊','success');
        navigate('/',{replace:true});
      }
    } else {
      showToast(res.message||'Registration failed','danger');
    }
  };

  const lf = k => e => setLoginForm(p=>({...p,[k]:e.target.value}));
  const rf = k => e => setRegForm(p=>({...p,[k]:e.target.value}));

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        .ai { width:100%; padding:10px 12px; border-radius:8px; font-size:0.875rem;
          background:#1e2640; border:1px solid #2d3a5c; color:#ffffff;
          outline:none; box-sizing:border-box; font-family:inherit; }
        .ai::placeholder { color:#4a5578; }
        .ai:focus { border-color:#dc2a3a; box-shadow:0 0 0 2px rgba(220,40,60,0.2); }
        .ai option { background:#1e2640; color:#ffffff; }
      `}</style>

      {/* FULL PAGE BACKGROUND with canvas */}
      <div style={{
        minHeight:'100vh', width:'100%', position:'relative', overflow:'auto',
        background:'linear-gradient(135deg,#0a0c18 0%,#121828 50%,#0a0c18 100%)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'40px 20px',
      }}>
        {/* Particle canvas fills the whole background */}
        <canvas ref={canvasRef} style={{
          position:'fixed', inset:0, width:'100%', height:'100%',
          pointerEvents:'none', zIndex:0,
        }}/>

        {/* Big title behind the card */}
        <div style={{
          position:'fixed', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          zIndex:1, textAlign:'center', pointerEvents:'none',
          opacity:0.06,
        }}>
          <div style={{
            fontFamily:"'Playfair Display',serif",
            fontSize:'20vw', fontWeight:900, color:'#ffd700',
            lineHeight:1, whiteSpace:'nowrap',
          }}>SPARKZ</div>
        </div>

        {/* CARD */}
        <div style={{
          position:'relative', zIndex:10,
          width:'100%', maxWidth:440,
          background:'rgba(14,18,32,0.95)',
          border:'1px solid rgba(220,40,60,0.25)',
          borderRadius:20,
          boxShadow:'0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.06)',
          backdropFilter:'blur(20px)',
          padding:'36px 40px',
        }}>

          {/* Card top — logo + title */}
          <div style={{textAlign:'center', marginBottom:28}}>
            <div style={{
              width:56, height:56, borderRadius:16, margin:'0 auto 14px',
              background:'linear-gradient(135deg,#dc2a3a,#ffd700)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1.5rem', color:'white',
            }}>
              <i className="bi bi-stars"/>
            </div>
            <div style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:'1.4rem', fontWeight:700, color:'#ffffff',
              marginBottom:4,
            }}>
              KLU <span style={{color:'#ffd700'}}>EventFlow</span> Pro
            </div>
            <div style={{fontSize:'0.8rem', color:'#6b7a9a'}}>
              SPARKZ 2K26 · Official Registration Portal
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display:'flex', background:'#131928', borderRadius:10,
            padding:3, marginBottom:24,
          }}>
            {[['login','Sign In'],['register','Create Account']].map(([t,lb])=>(
              <button key={t} type="button" onClick={()=>setMode(t)} style={{
                flex:1, padding:'9px 6px', border:'none', borderRadius:8,
                cursor:'pointer', fontSize:'0.875rem', fontWeight:600,
                transition:'all 0.25s',
                background: mode===t ? '#dc2a3a' : 'transparent',
                color:      mode===t ? '#ffffff' : '#6b7a9a',
              }}>
                {lb}
              </button>
            ))}
          </div>

          {/* ── LOGIN ── */}
          {mode==='login' && (
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>
                  Email Address
                </div>
                <input className="ai" type="email"
                  value={loginForm.email} onChange={lf('email')}
                  placeholder="you@klu.ac.in" required/>
              </div>

              <div style={{marginBottom:10}}>
                <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>
                  Password
                </div>
                <input className="ai" type="password"
                  value={loginForm.password} onChange={lf('password')}
                  placeholder="••••••••" required/>
              </div>

              <div style={{
                fontSize:'0.75rem', color:'#6b7a9a',
                background:'rgba(255,215,0,0.06)',
                border:'1px solid rgba(255,215,0,0.12)',
                borderRadius:8, padding:'8px 12px', marginBottom:18,
              }}>
                Demo: <strong style={{color:'#ffd700'}}>admin@klu.ac.in</strong>
                {' / '}
                <strong style={{color:'#ffd700'}}>admin123</strong>
              </div>

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'12px', border:'none', borderRadius:10,
                background:'linear-gradient(135deg,#dc2a3a,#a01828)',
                color:'#ffffff', fontSize:'0.95rem', fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                opacity: loading ? 0.75 : 1,
              }}>
                {loading
                  ? <span style={{
                      width:18,height:18,borderRadius:'50%',display:'inline-block',
                      border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',
                      animation:'spin .8s linear infinite',
                    }}/>
                  : <><i className="bi bi-arrow-right-circle"/> Sign In</>
                }
              </button>
            </form>
          )}

          {/* ── REGISTER ── */}
          {mode==='register' && (
            <form onSubmit={handleRegister}>

              <div style={{marginBottom:12}}>
                <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>Register as</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {['Student','Admin'].map(r=>(
                    <button key={r} type="button" onClick={()=>setRole(r)} style={{
                      padding:'9px 8px', border:'none', borderRadius:8, cursor:'pointer',
                      fontSize:'0.82rem', fontWeight:600, transition:'all 0.2s',
                      background: role===r ? 'rgba(220,40,60,0.2)' : '#131928',
                      color:      role===r ? '#ffd700'             : '#6b7a9a',
                      outline: role===r ? '1px solid #dc2a3a' : '1px solid #2d3a5c',
                    }}>
                      <i className={`bi bi-${r==='Student'?'mortarboard':'person-gear'}`} style={{marginRight:5}}/>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                <div>
                  <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>Full Name</div>
                  <input className="ai" value={regForm.name} onChange={rf('name')} placeholder="Your name" required/>
                </div>
                <div>
                  <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>Phone</div>
                  <input className="ai" type="tel" value={regForm.phone} onChange={rf('phone')} placeholder="10 digits" required/>
                </div>
              </div>

              <div style={{marginBottom:12}}>
                <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>Email</div>
                <input className="ai" type="email" value={regForm.email} onChange={rf('email')} placeholder="you@klu.ac.in" required/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                <div>
                  <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>Date of Birth</div>
                  <input className="ai" type="date" value={regForm.dob} onChange={rf('dob')} required/>
                </div>
                <div>
                  <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>Gender</div>
                  <select className="ai" value={regForm.gender} onChange={rf('gender')} required>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>

              {role==='Student' && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>Department</div>
                    <select className="ai" value={regForm.department} onChange={rf('department')} required>
                      <option value="">Select</option>
                      {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>Year</div>
                    <select className="ai" value={regForm.year} onChange={rf('year')} required>
                      <option value="">Select</option>
                      {['1','2','3','4'].map(y=><option key={y} value={y}>{y} Year</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div style={{marginBottom:18}}>
                <div style={{fontSize:'0.78rem',color:'#8892a4',fontWeight:500,marginBottom:5}}>Password</div>
                <input className="ai" type="password" value={regForm.password}
                  onChange={rf('password')} placeholder="Min 6 characters" required minLength={6}/>
              </div>

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'12px', border:'none', borderRadius:10,
                background:'linear-gradient(135deg,#ffd700,#d4a000)',
                color:'#1a0f00', fontSize:'0.95rem', fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                opacity: loading ? 0.75 : 1,
              }}>
                {loading
                  ? <span style={{
                      width:18,height:18,borderRadius:'50%',display:'inline-block',
                      border:'2px solid rgba(0,0,0,0.25)',borderTopColor:'#000',
                      animation:'spin .8s linear infinite',
                    }}/>
                  : <><i className="bi bi-person-plus"/> Create Account</>
                }
              </button>

            </form>
          )}

        </div>
      </div>
    </>
  );
}