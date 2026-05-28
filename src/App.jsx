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

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmt = n => "₹" + Number(n).toLocaleString("en-IN");
const catOf = name => CATEGORIES.find(c => c.name === name) || CATEGORIES[7];

// ─── SUMMARY CARDS ───────────────────────────────────────────────────────────

function SummaryCards() {
  const { balance, totalIncome, totalExpense } = useContext(AppContext);
  const savingsPct = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  const cards = [
    { label: "Balance",  value: fmt(balance),      color: balance >= 0 ? "text-emerald-400" : "text-red-400",  dot: balance >= 0 ? "bg-emerald-400" : "bg-red-400" },
    { label: "Income",   value: fmt(totalIncome),  color: "text-emerald-400", dot: "bg-emerald-400" },
    { label: "Expenses", value: fmt(totalExpense), color: "text-red-400",     dot: "bg-red-400"     },
    { label: "Savings",  value: savingsPct + "%",  color: "text-yellow-400",  dot: "bg-yellow-400"  },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">{c.label}</div>
          <div className={`text-lg font-bold font-mono ${c.color}`}>{c.value}</div>
          <div className={`absolute -right-3 -top-3 w-12 h-12 rounded-full opacity-10 ${c.dot}`} />
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
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-gray-500">
      No expense data yet
    </div>
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="text-xs text-gray-400 uppercase tracking-widest mb-4">Spending by Category</div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={v => fmt(v)} contentStyle={{ background:"#1f2937", border:"none", borderRadius:8, fontSize:13 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-gray-400">{d.icon} {d.name}</span>
            <span className="ml-auto text-xs text-gray-200 font-mono">{fmt(d.value)}</span>
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
      Income:  mo.filter(t => t.type === "income").reduce((s, t)  => s + t.amount, 0),
      Expense: mo.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  }).filter(d => d.Income || d.Expense);

  if (!data.length) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="text-xs text-gray-400 uppercase tracking-widest mb-4">Monthly Overview</div>
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

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-gray-100 text-sm outline-none focus:border-orange-500 transition-colors";

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="text-base font-bold text-gray-100 mb-5">➕ Add Transaction</div>

      <div className="mb-4">
        <label className="text-xs text-gray-400 block mb-1.5">Title</label>
        <input name="title" value={form.title} onChange={handle} placeholder="e.g. Swiggy Order" className={inp} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Amount (₹)</label>
          <input name="amount" type="number" value={form.amount} onChange={handle} placeholder="0" className={inp} />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Date</label>
          <input name="date" type="date" value={form.date} onChange={handle} className={inp} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Type</label>
          <select name="type" value={form.type} onChange={handle} className={inp}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Category</label>
          <select name="category" value={form.category} onChange={handle} className={inp}>
            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      </div>

      <button onClick={submit} className={`mt-5 w-full py-3 rounded-xl border-none font-bold text-white text-sm cursor-pointer transition-all ${success ? "bg-emerald-500" : "bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90"}`}>
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
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="text-base font-bold text-gray-100">All Transactions ({filtered.length})</div>
        <select value={state.filter} onChange={e => dispatch({ type:"SET_FILTER", payload:e.target.value })}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-gray-200 text-sm outline-none">
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {filtered.length === 0
          ? <div className="text-center text-gray-500 py-10">No transactions found</div>
          : filtered.map(t => {
              const cat = catOf(t.category);
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: cat.color + "22" }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-100 truncate">{t.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.category} · {t.date}</div>
                  </div>
                  <div className={`text-sm font-bold font-mono flex-shrink-0 ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </div>
                  <button onClick={() => dispatch({ type:"DELETE", payload:t.id })}
                    className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer text-sm px-1.5 py-1 rounded flex-shrink-0 transition-colors">
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
    { id:"dashboard",    label:"📊 Dashboard"   },
    { id:"add",          label:"➕ Add"          },
    { id:"transactions", label:"📋 Transactions" },
  ];

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {tabs.map(t => (
        <button key={t.id} onClick={() => dispatch({ type:"SET_TAB", payload:t.id })}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-all
            ${state.tab === t.id
              ? "border-orange-500 bg-orange-500/15 text-orange-400"
              : "border-white/10 bg-transparent text-gray-400 hover:text-gray-200"
            }`}>
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
    <div className="min-h-screen bg-[#0d1117] text-gray-100 px-4 py-7 font-sans">
      <div className="max-w-4xl mx-auto">

        <div className="mb-7">
          <h1 className="text-2xl font-extrabold tracking-tight">
            💸 <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Expense Tracker
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track your income, expenses & savings</p>
        </div>

        <Nav />
        <SummaryCards />

        {state.tab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ExpensePie />
            <MonthlyBar />
          </div>
        )}

        {state.tab === "add" && (
          <div className="max-w-md mx-auto">
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