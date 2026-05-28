import { useState, useEffect, useContext, createContext, useReducer } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

// ─── DATA ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Food",      icon: "🍜", color: "#f97316" },
  { name: "Transport", icon: "🚌", color: "#3b82f6" },
  { name: "Bills",     icon: "⚡", color: "#a855f7" },
  { name: "Shopping",  icon: "🛍️", color: "#ec4899" },
  { name: "Health",    icon: "💊", color: "#22c55e" },
  { name: "Education", icon: "📚", color: "#eab308" },
  { name: "Income",    icon: "💰", color: "#10b981" },
  { name: "Other",     icon: "📦", color: "#6b7280" },
];

const SEED = [
  { id:1,  title:"Salary",       amount:55000, type:"income",  category:"Income",    date:"2025-05-01" },
  { id:2,  title:"Rent",         amount:12000, type:"expense", category:"Bills",     date:"2025-05-02" },
  { id:3,  title:"Groceries",    amount:2400,  type:"expense", category:"Food",      date:"2025-05-04" },
  { id:4,  title:"Metro Pass",   amount:500,   type:"expense", category:"Transport", date:"2025-05-05" },
  { id:5,  title:"Swiggy Order", amount:380,   type:"expense", category:"Food",      date:"2025-05-07" },
  { id:6,  title:"Freelance",    amount:8000,  type:"income",  category:"Income",    date:"2025-05-10" },
  { id:7,  title:"Electricity",  amount:900,   type:"expense", category:"Bills",     date:"2025-05-11" },
  { id:8,  title:"Gym",          amount:1200,  type:"expense", category:"Health",    date:"2025-05-12" },
  { id:9,  title:"Books",        amount:650,   type:"expense", category:"Education", date:"2025-05-14" },
  { id:10, title:"Amazon",       amount:1800,  type:"expense", category:"Shopping",  date:"2025-05-16" },
];

// ─── REDUCER ─────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case "ADD":
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case "DELETE":
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case "SET_FILTER":
      return { ...state, filter: action.payload };
    case "SET_TAB":
      return { ...state, tab: action.payload };
    default:
      return state;
  }
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const AppContext = createContext();

function AppProvider({ children }) {
  const load = () => {
    try { return JSON.parse(localStorage.getItem("et_txns")) || SEED; }
    catch { return SEED; }
  };

  const [state, dispatch] = useReducer(reducer, {
    transactions: load(),
    filter: "All",
    tab: "dashboard",
  });

  useEffect(() => {
    localStorage.setItem("et_txns", JSON.stringify(state.transactions));
  }, [state.transactions]);

  const totalIncome  = state.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = state.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  return (
    <AppContext.Provider value={{ state, dispatch, totalIncome, totalExpense, balance, CATEGORIES }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── HELPER ──────────────────────────────────────────────────────────────────

const fmt = n => "₹" + Number(n).toLocaleString("en-IN");
const catOf = name => CATEGORIES.find(c => c.name === name) || CATEGORIES[7];

// ─── SUMMARY CARDS ───────────────────────────────────────────────────────────

function SummaryCards() {
  const { balance, totalIncome, totalExpense } = useContext(AppContext);
  const savingsPct = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  const cards = [
    { label: "Balance",  value: fmt(balance),       color: balance >= 0 ? "#10b981" : "#ef4444" },
    { label: "Income",   value: fmt(totalIncome),   color: "#10b981" },
    { label: "Expenses", value: fmt(totalExpense),  color: "#ef4444" },
    { label: "Savings",  value: savingsPct + "%",   color: "#f59e0b" },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"20px 18px", position:"relative", overflow:"hidden" }}>
          <div style={{ fontSize:11, color:"#9ca3af", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{c.label}</div>
          <div style={{ fontSize:20, fontWeight:700, color:c.color, fontFamily:"monospace" }}>{c.value}</div>
          <div style={{ position:"absolute", right:-10, top:-10, width:50, height:50, borderRadius:"50%", background:c.color+"18" }} />
        </div>
      ))}
    </div>
  );
}

// ─── PIE CHART ───────────────────────────────────────────────────────────────

function ExpensePie() {
  const { state, CATEGORIES } = useContext(AppContext);

  const data = CATEGORIES
    .filter(c => c.name !== "Income")
    .map(c => ({
      name:  c.name,
      icon:  c.icon,
      color: c.color,
      value: state.transactions
        .filter(t => t.type === "expense" && t.category === c.name)
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter(d => d.value > 0);

  if (!data.length) return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24, textAlign:"center", color:"#6b7280" }}>
      No expense data yet
    </div>
  );

  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24 }}>
      <div style={{ fontSize:12, color:"#9ca3af", letterSpacing:1, textTransform:"uppercase", marginBottom:16 }}>Spending by category</div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={v => fmt(v)} contentStyle={{ background:"#1f2937", border:"none", borderRadius:8, fontSize:13 }} />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px 14px", marginTop:12 }}>
        {data.map(d => (
          <div key={d.name} style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:9, height:9, borderRadius:2, background:d.color, flexShrink:0 }} />
            <span style={{ fontSize:11, color:"#9ca3af" }}>{d.icon} {d.name}</span>
            <span style={{ marginLeft:"auto", fontSize:11, color:"#e5e7eb", fontFamily:"monospace" }}>{fmt(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BAR CHART ───────────────────────────────────────────────────────────────

function MonthlyBar() {
  const { state } = useContext(AppContext);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const data = months.map((m, i) => {
    const mo = state.transactions.filter(t => new Date(t.date).getMonth() === i);
    return {
      month:   m,
      Income:  mo.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      Expense: mo.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  }).filter(d => d.Income || d.Expense);

  if (!data.length) return null;

  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24 }}>
      <div style={{ fontSize:12, color:"#9ca3af", letterSpacing:1, textTransform:"uppercase", marginBottom:16 }}>Monthly overview</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="month" tick={{ fill:"#9ca3af", fontSize:11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill:"#9ca3af", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => "₹"+(v/1000)+"k"} />
          <Tooltip formatter={v => fmt(v)} contentStyle={{ background:"#1f2937", border:"none", borderRadius:8, fontSize:13 }} />
          <Legend wrapperStyle={{ fontSize:12, color:"#9ca3af" }} />
          <Bar dataKey="Income"  fill="#10b981" radius={[4,4,0,0]} />
          <Bar dataKey="Expense" fill="#f97316" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── ADD FORM ────────────────────────────────────────────────────────────────

function AddForm() {
  const { dispatch, CATEGORIES } = useContext(AppContext);

  const [form, setForm] = useState({
    title: "", amount: "", type: "expense", category: "Food",
    date: new Date().toISOString().slice(0, 10),
  });
  const [success, setSuccess] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = () => {
    if (!form.title.trim() || !form.amount || +form.amount <= 0) return;
    dispatch({ type:"ADD", payload:{ ...form, id:Date.now(), amount:+form.amount } });
    setForm({ title:"", amount:"", type:"expense", category:"Food", date:new Date().toISOString().slice(0,10) });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const inp = {
    background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:10, padding:"10px 13px", color:"#f3f4f6", fontSize:14,
    outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit",
  };

  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:28 }}>
      <div style={{ fontSize:16, fontWeight:700, color:"#f3f4f6", marginBottom:22 }}>➕ Add Transaction</div>

      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:12, color:"#9ca3af", display:"block", marginBottom:6 }}>Title</label>
        <input name="title" value={form.title} onChange={handle} placeholder="e.g. Swiggy Order" style={inp} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13, marginBottom:14 }}>
        <div>
          <label style={{ fontSize:12, color:"#9ca3af", display:"block", marginBottom:6 }}>Amount (₹)</label>
          <input name="amount" type="number" value={form.amount} onChange={handle} placeholder="0" style={inp} />
        </div>
        <div>
          <label style={{ fontSize:12, color:"#9ca3af", display:"block", marginBottom:6 }}>Date</label>
          <input name="date" type="date" value={form.date} onChange={handle} style={inp} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13, marginBottom:4 }}>
        <div>
          <label style={{ fontSize:12, color:"#9ca3af", display:"block", marginBottom:6 }}>Type</label>
          <select name="type" value={form.type} onChange={handle} style={inp}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:"#9ca3af", display:"block", marginBottom:6 }}>Category</label>
          <select name="category" value={form.category} onChange={handle} style={inp}>
            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      </div>

      <button onClick={submit} style={{
        marginTop:20, width:"100%", padding:13, borderRadius:10, border:"none",
        background: success ? "#10b981" : "linear-gradient(135deg,#f97316,#ef4444)",
        color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:"inherit",
      }}>
        {success ? "✅ Added!" : "Add Transaction"}
      </button>
    </div>
  );
}

// ─── TRANSACTION LIST ────────────────────────────────────────────────────────

function TransactionList() {
  const { state, dispatch, CATEGORIES } = useContext(AppContext);

  const filtered = state.filter === "All"
    ? state.transactions
    : state.transactions.filter(t => t.category === state.filter);

  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div style={{ fontSize:16, fontWeight:700, color:"#f3f4f6" }}>All Transactions ({filtered.length})</div>
        <select value={state.filter} onChange={e => dispatch({ type:"SET_FILTER", payload:e.target.value })}
          style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"7px 12px", color:"#e5e7eb", fontSize:13 }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:9, maxHeight:460, overflowY:"auto" }}>
        {filtered.length === 0
          ? <div style={{ textAlign:"center", color:"#6b7280", padding:40 }}>No transactions found</div>
          : filtered.map(t => {
              const cat = catOf(t.category);
              return (
                <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 13px", background:"rgba(255,255,255,0.03)", borderRadius:12, border:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:cat.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"#f3f4f6", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.title}</div>
                    <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{t.category} · {t.date}</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:t.type==="income"?"#10b981":"#f87171", fontFamily:"monospace", flexShrink:0 }}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </div>
                  <button onClick={() => dispatch({ type:"DELETE", payload:t.id })}
                    style={{ background:"none", border:"none", color:"#6b7280", cursor:"pointer", fontSize:14, padding:"4px 7px", borderRadius:6, flexShrink:0 }}>
                    ✕
                  </button>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────

function Nav() {
  const { state, dispatch } = useContext(AppContext);

  const tabs = [
    { id:"dashboard",    label:"📊 Dashboard"    },
    { id:"add",          label:"➕ Add"           },
    { id:"transactions", label:"📋 Transactions"  },
  ];

  return (
    <div style={{ display:"flex", gap:8, marginBottom:24 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => dispatch({ type:"SET_TAB", payload:t.id })} style={{
          padding:"9px 16px", borderRadius:10, border:"1px solid",
          borderColor: state.tab === t.id ? "#f97316" : "rgba(255,255,255,0.12)",
          background:  state.tab === t.id ? "rgba(249,115,22,0.15)" : "transparent",
          color:       state.tab === t.id ? "#f97316" : "#9ca3af",
          cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit",
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

function AppContent() {
  const { state } = useContext(AppContext);

  return (
    <div style={{ minHeight:"100vh", background:"#0d1117", fontFamily:"'DM Sans', -apple-system, sans-serif", color:"#f3f4f6", padding:"28px 20px" }}>
      <div style={{ maxWidth:860, margin:"0 auto" }}>

        <div style={{ marginBottom:28 }}>
          <h1 style={{ margin:0, fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>
            💸 <span style={{ background:"linear-gradient(135deg,#f97316,#ef4444)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Expense Tracker
            </span>
          </h1>
          <p style={{ margin:"5px 0 0", color:"#6b7280", fontSize:13 }}>Track your income, expenses & savings</p>
        </div>

        <Nav />
        <SummaryCards />

        {state.tab === "dashboard" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <ExpensePie />
            <MonthlyBar />
          </div>
        )}

        {state.tab === "add" && (
          <div style={{ maxWidth:500, margin:"0 auto" }}>
            <AddForm />
          </div>
        )}

        {state.tab === "transactions" && <TransactionList />}

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}