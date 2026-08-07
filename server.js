const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "mes-do-cliente.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");
  db.run(`
    CREATE TABLE IF NOT EXISTS sellers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      team TEXT DEFAULT '',
      goal INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      order_number TEXT NOT NULL UNIQUE,
      seller_id INTEGER NOT NULL,
      order_value REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES sellers(id)
    )
  `);
});

app.use(express.json());

app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>MÊS DO CLIENTE</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#fff5f5;color:#3d1016}
.hero{padding:24px}.hero-box{max-width:1100px;margin:0 auto;background:linear-gradient(135deg,#6d0c15,#c1121f,#e5383b);color:#fff;padding:28px;border-radius:24px}
.badge{display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.14);font-size:13px;font-weight:700}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.stat{background:rgba(255,255,255,.12);padding:16px;border-radius:18px}.stat strong{display:block;margin-top:8px;font-size:28px}
.layout{max-width:1100px;margin:0 auto;padding:0 24px 32px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.panel{background:#fff;border:1px solid #f1c9cf;border-radius:22px;padding:22px;box-shadow:0 10px 30px rgba(124,17,28,.08)}
label{display:grid;gap:8px;font-weight:700;font-size:14px}form{display:grid;gap:12px;margin-top:16px}
input,select{width:100%;padding:14px;border:1px solid #f1c9cf;border-radius:14px;font:inherit}
button{border:0;background:#c1121f;color:#fff;padding:14px 16px;border-radius:14px;font:inherit;font-weight:700}
.table{margin-top:18px;overflow:auto;border:1px solid #f1c9cf;border-radius:16px}
table{width:100%;border-collapse:collapse}th,td{padding:12px 14px;text-align:left;border-bottom:1px solid #f1c9cf;font-size:14px}th{background:#fff6f7;font-size:12px;text-transform:uppercase;color:#8d4c55}
.msg{min-height:18px;color:#c1121f;font-size:13px;font-weight:700}.empty{text-align:center;color:#8d4c55}
.leader{margin-top:18px;padding:16px;border-radius:16px;background:#fff0f2;border:1px solid #f1c9cf}.ranking{display:grid;gap:12px;margin-top:14px}
.item{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:14px;border:1px solid #f1c9cf;border-radius:16px}
.pos{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#ffe5e8;color:#c1121f;font-weight:800}.top .pos{background:#c1121f;color:#fff}
.pill{display:inline-block;margin-top:6px;padding:5px 9px;border-radius:999px;background:#ffe9ec;color:#8f0f19;font-size:12px;font-weight:700}
.right{text-align:right}.sync{margin-top:16px;padding:14px;border-radius:14px;background:#fff0f2;border:1px solid #f1c9cf}
@media (max-width:980px){.layout,.stats{grid-template-columns:1fr}}
</style>
</head>
<body>
<header class="hero">
  <div class="hero-box">
    <span class="badge">Campanha comercial</span>
    <h1>MÊS DO CLIENTE</h1>
    <p>Cadastre vendedores, clientes e pedidos em uma base compartilhada.</p>
    <div class="stats">
      <div class="stat"><span>Vendedores</span><strong id="tv">0</strong></div>
      <div class="stat"><span>Pedidos</span><strong id="tp">0</strong></div>
      <div class="stat"><span>Total vendido</span><strong id="tt">R$ 0,00</strong></div>
    </div>
  </div>
</header>

<main class="layout">
  <section class="panel">
    <h2>Cadastro dos vendedores</h2>
    <p>Inclua os vendedores participantes da campanha.</p>
    <form id="fs">
      <label>Nome do vendedor<input id="sn" required></label>
      <label>Equipe ou loja<input id="st"></label>
      <label>Meta de pedidos<input id="sg" type="number" min="0" step="1"></label>
      <button type="submit">Cadastrar vendedor</button>
      <div id="ms" class="msg"></div>
    </form>
    <div class="table">
      <table>
        <thead><tr><th>Vendedor</th><th>Equipe</th><th>Meta</th></tr></thead>
        <tbody id="ls"><tr><td colspan="3" class="empty">Nenhum vendedor cadastrado ainda.</td></tr></tbody>
      </table>
    </div>
  </section>

  <section class="panel">
    <h2>Cadastro dos clientes</h2>
    <p>Cadastre cliente, telefone, pedido e vendedor.</p>
    <form id="fc">
      <label>Nome do cliente<input id="cn" required></label>
      <label>Telefone<input id="cp" required></label>
      <label>Número do pedido<input id="co" required></label>
      <label>Vendedor responsável<select id="cs" required><option value="">Selecione um vendedor</option></select></label>
      <label>Valor do pedido<input id="cv" type="number" min="0" step="0.01"></label>
      <button type="submit">Cadastrar cliente</button>
      <div id="mc" class="msg"></div>
    </form>
    <div class="table">
      <table>
        <thead><tr><th>Cliente</th><th>Telefone</th><th>Pedido</th><th>Vendedor</th><th>Valor</th></tr></thead>
        <tbody id="lc"><tr><td colspan="5" class="empty">Nenhum pedido cadastrado ainda.</td></tr></tbody>
      </table>
    </div>
  </section>

  <section class="panel">
    <h2>Ranking da campanha</h2>
    <p>Veja qual vendedor está na frente.</p>
    <div class="sync"><strong>Base compartilhada.</strong> Todos usam o mesmo banco.</div>
    <div id="leader" class="leader"><strong>Nenhum vendedor no ranking</strong><p>Cadastre vendedores e pedidos para começar.</p></div>
    <div id="rk" class="ranking"><div class="empty">O ranking aparecerá aqui.</div></div>
  </section>
</main>

<script>
let sellers=[], customers=[], ranking=[];
const fs=document.getElementById("fs"), fc=document.getElementById("fc");
const ls=document.getElementById("ls"), lc=document.getElementById("lc"), cs=document.getElementById("cs");
const ms=document.getElementById("ms"), mc=document.getElementById("mc");
const leader=document.getElementById("leader"), rk=document.getElementById("rk");

fs.addEventListener("submit", saveSeller);
fc.addEventListener("submit", saveCustomer);
load();
setInterval(()=>load(true),15000);

async function saveSeller(e){
  e.preventDefault();
  const body={name:sn.value.trim(),team:st.value.trim(),goal:Number(sg.value)||0};
  if(!body.name){msg(ms,"Informe o nome do vendedor.",1);return}
  try{
    await api("/api/sellers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    fs.reset(); msg(ms,"Vendedor cadastrado com sucesso.");
    load(true);
  }catch(err){msg(ms,err.message,1)}
}

async function saveCustomer(e){
  e.preventDefault();
  if(!sellers.length){msg(mc,"Cadastre pelo menos um vendedor antes.",1);return}
  const body={customerName:cn.value.trim(),phone:phone(cp.value),orderNumber:co.value.trim(),sellerId:Number(cs.value),orderValue:Number(cv.value)||0};
  if(!body.customerName||!body.phone||!body.orderNumber||!body.sellerId){msg(mc,"Preencha nome, telefone, pedido e vendedor.",1);return}
  try{
    await api("/api/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    fc.reset(); msg(mc,"Cliente cadastrado com sucesso.");
    load(true);
  }catch(err){msg(mc,err.message,1)}
}

async function load(silent){
  try{
    const data=await api("/api/dashboard");
    sellers=data.sellers||[]; customers=data.customers||[]; ranking=data.ranking||[];
    render();
    if(!silent){msg(ms,"");msg(mc,"")}
  }catch(e){
    if(!silent){msg(ms,"Não foi possível carregar os dados.",1);msg(mc,"Verifique o servidor.",1)}
  }
}

function render(){
  tv.textContent=sellers.length; tp.textContent=customers.length;
  tt.textContent=money(customers.reduce((a,b)=>a+Number(b.orderValue||0),0));

  ls.innerHTML=sellers.length?sellers.map(s=>"<tr><td>"+safe(s.name)+"</td><td>"+safe(s.team||"-")+"</td><td>"+(s.goal||0)+"</td></tr>").join(""):'<tr><td colspan="3" class="empty">Nenhum vendedor cadastrado ainda.</td></tr>';
  cs.innerHTML='<option value="">Selecione um vendedor</option>'+sellers.map(s=>'<option value="'+s.id+'">'+safe(s.name)+'</option>').join("");
  lc.innerHTML=customers.length?customers.map(c=>"<tr><td>"+safe(c.customerName)+"</td><td>"+safe(c.phone)+"</td><td>"+safe(c.orderNumber)+"</td><td>"+safe(c.sellerName||"")+"</td><td>"+money(c.orderValue)+"</td></tr>").join(""):'<tr><td colspan="5" class="empty">Nenhum pedido cadastrado ainda.</td></tr>';

  if(!ranking.length){
    leader.innerHTML="<strong>Nenhum vendedor no ranking</strong><p>Cadastre vendedores e pedidos para começar.</p>";
    rk.innerHTML='<div class="empty">O ranking aparecerá aqui.</div>';
    return;
  }
  leader.innerHTML="<strong>"+safe(ranking[0].name)+"</strong><p>"+ranking[0].totalOrders+" pedido(s) e "+money(ranking[0].totalRevenue)+" em vendas.</p>";
  rk.innerHTML=ranking.map((s,i)=>'<div class="item '+(i===0?"top":"")+'"><div class="pos">'+(i+1)+'</div><div><strong>'+safe(s.name)+'</strong><div>'+safe(s.team||"Equipe nao informada")+'</div><span class="pill">'+s.totalOrders+' pedido(s)</span></div><div class="right"><strong>'+money(s.totalRevenue)+'</strong><div>'+(s.goal?String(s.goalProgress)+"% da meta":"Sem meta cadastrada")+'</div></div></div>').join("");
}

async function api(url,opt){
  const r=await fetch(url,opt); const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.message||"Erro");
  return d;
}
function msg(el,t,e){el.textContent=t||"";el.style.color=e?"#8f0f19":"#c1121f"}
function money(v){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v||0))}
function phone(v){
  const d=String(v||"").replace(/\\D/g,"").slice(0,11);
  if(!d) return "";
  if(d.length<=10) return d.replace(/(\\d{2})(\\d{4})(\\d{0,4})/,(_,a,b,c)=>c?"("+a+") "+b+"-"+c:"("+a+") "+b);
  return d.replace(/(\\d{2})(\\d{5})(\\d{0,4})/,(_,a,b,c)=>c?"("+a+") "+b+"-"+c:"("+a+") "+b);
}
function safe(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
</script>
</body>
</html>`);
});

app.get("/api/dashboard", async (_req, res) => {
  try {
    const sellers = await all("SELECT id, name, team, goal, created_at AS createdAt FROM sellers ORDER BY id DESC");
    const customers = await all(`
      SELECT customers.id, customers.customer_name AS customerName, customers.phone,
             customers.order_number AS orderNumber, customers.seller_id AS sellerId,
             sellers.name AS sellerName, customers.order_value AS orderValue,
             customers.created_at AS createdAt
      FROM customers
      INNER JOIN sellers ON sellers.id = customers.seller_id
      ORDER BY customers.id DESC
    `);
    const ranking = await all(`
      SELECT sellers.id, sellers.name, sellers.team, sellers.goal,
             COUNT(customers.id) AS totalOrders,
             COALESCE(SUM(customers.order_value), 0) AS totalRevenue
      FROM sellers
      LEFT JOIN customers ON customers.seller_id = sellers.id
      GROUP BY sellers.id
      ORDER BY totalOrders DESC, totalRevenue DESC, sellers.name ASC
    `);

    res.json({
      sellers,
      customers,
      ranking: ranking.map((item) => ({
        ...item,
        totalOrders: Number(item.totalOrders || 0),
        totalRevenue: Number(item.totalRevenue || 0),
        goalProgress: item.goal ? Math.min(100, Math.round((Number(item.totalOrders || 0) / item.goal) * 100)) : 0
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Nao foi possivel carregar os dados." });
  }
});

app.post("/api/sellers", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const team = String(req.body?.team || "").trim();
  const goal = Number(req.body?.goal) || 0;

  if (!name) {
    return res.status(400).json({ message: "Informe o nome do vendedor." });
  }

  try {
    const result = await run("INSERT INTO sellers (name, team, goal) VALUES (?, ?, ?)", [name, team, Math.floor(goal)]);
    const seller = await get("SELECT id, name, team, goal, created_at AS createdAt FROM sellers WHERE id = ?", [result.lastID]);
    res.status(201).json(seller);
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "Este vendedor ja foi cadastrado." });
    }
    res.status(500).json({ message: "Nao foi possivel salvar o vendedor." });
  }
});

app.post("/api/customers", async (req, res) => {
  const customerName = String(req.body?.customerName || "").trim();
  const rawPhone = String(req.body?.phone || "");
  const orderNumber = String(req.body?.orderNumber || "").trim();
  const sellerId = Number(req.body?.sellerId);
  const orderValue = Number(req.body?.orderValue) || 0;
  const formattedPhone = formatPhone(rawPhone);

  if (!customerName || !formattedPhone || !orderNumber || !sellerId) {
    return res.status(400).json({ message: "Preencha nome, telefone, pedido e vendedor." });
  }

  try {
    const seller = await get("SELECT id FROM sellers WHERE id = ?", [sellerId]);
    if (!seller) {
      return res.status(404).json({ message: "O vendedor informado nao foi encontrado." });
    }

    const result = await run(
      "INSERT INTO customers (customer_name, phone, order_number, seller_id, order_value) VALUES (?, ?, ?, ?, ?)",
      [customerName, formattedPhone, orderNumber, sellerId, orderValue]
    );

    const customer = await get(`
      SELECT customers.id, customers.customer_name AS customerName, customers.phone,
             customers.order_number AS orderNumber, customers.seller_id AS sellerId,
             sellers.name AS sellerName, customers.order_value AS orderValue,
             customers.created_at AS createdAt
      FROM customers
      INNER JOIN sellers ON sellers.id = customers.seller_id
      WHERE customers.id = ?
    `, [result.lastID]);

    res.status(201).json(customer);
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "Este numero de pedido ja foi cadastrado." });
    }
    res.status(500).json({ message: "Nao foi possivel salvar o cliente." });
  }
});

app.listen(PORT, () => {
  console.log("Servidor ativo na porta " + PORT);
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) return reject(error);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) return reject(error);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, ddd, p1, p2) => p2 ? "(" + ddd + ") " + p1 + "-" + p2 : "(" + ddd + ") " + p1);
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, ddd, p1, p2) => p2 ? "(" + ddd + ") " + p1 + "-" + p2 : "(" + ddd + ") " + p1);
}
