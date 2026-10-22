"use client";
// Thin UI over src/lib/treasury/flows.ts (all core logic lives there). UI checks are NOT authorization.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTideCloak } from '@tidecloak/nextjs';
import { createTreasuryClient, type Payout, type Transfer } from '@/lib/treasury/flows';
import { explainTideError } from '@/lib/treasury/tideCrypto';

const TC_URL = process.env.NEXT_PUBLIC_TIDECLOAK_URL ?? 'http://localhost:8080';
const REALM = process.env.NEXT_PUBLIC_TIDE_REALM ?? 'quy-nhom';
const vnd = (n: number | string) => Number(n).toLocaleString('vi-VN') + ' ₫';

export default function TreasuryPage() {
  const tc: any = useTideCloak();
  const client = useMemo(
    () => createTreasuryClient(tc.secureFetch, { refreshToken: tc.forceRefreshToken ?? tc.refreshToken }),
    [tc.secureFetch, tc.forceRefreshToken, tc.refreshToken],
  );
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [form, setForm] = useState<Record<string, { recipient: string; account: string }>>({});

  const me: string = tc.getValueFromIdToken?.('preferred_username') ?? '';
  const isTreasurer: boolean = !!tc.hasClientRole?.('tide-realm-admin', 'realm-management'); // UI only; server re-checks
  const say = (m: string) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${m}`, ...l].slice(0, 30));

  const load = useCallback(async () => {
    try { const j = await client.list(); setPayouts(j.payouts); setTransfers(j.transfers); }
    catch (e) { say('❌ ' + explainTideError(e)); }
  }, [client]);

  useEffect(() => { if (tc.authenticated) load(); }, [tc.authenticated, load]);

  async function run(id: string, fn: () => Promise<void>) {
    setBusy(id);
    try { await fn(); } catch (e) { say('❌ ' + explainTideError(e)); } finally { setBusy(null); load(); }
  }

  const create = () => run('new', async () => {
    const { id } = await client.create(newTitle, Number(newAmount));
    say(`📝 Tạo yêu cầu chi ${id}`); setNewTitle(''); setNewAmount('');
  });

  const seal = (p: Payout) => run(p.id, async () => {
    const f = form[p.id];
    if (!f?.recipient || !f?.account) throw new Error('Nhập người nhận và số tài khoản');
    await client.seal(p, f, (m) => say('🔏 ' + m));
  });

  const release = (p: Payout) => run(p.id, async () => {
    const ins = await client.release(p.id, (m) => say('🔓 ' + m));
    say(`🏦 Ngân hàng đã chuyển ${vnd(ins.amount)} cho ${ins.recipient} (${ins.account})`);
  });

  if (!tc.authenticated) {
    return <main style={S.main}><h1>Quỹ Nhóm</h1><button style={S.btn} onClick={() => tc.login()}>Đăng nhập bằng Tide</button></main>;
  }

  return (
    <main style={S.main}>
      <header style={S.row}>
        <div><h1 style={{ margin: 0 }}>Quỹ Nhóm</h1>
          <small>Không thủ quỹ, admin hay server nào một mình chuyển được tiền.</small></div>
        <div style={{ textAlign: 'right' }}><b>{me}</b><br />
          <small>{isTreasurer ? 'Thủ quỹ (tide-realm-admin)' : 'Thành viên'}</small><br />
          <button style={S.link} onClick={() => tc.logout()}>Đăng xuất</button></div>
      </header>

      {isTreasurer && (
        <section style={S.card}>
          <h3>Yêu cầu chi mới</h3>
          <input style={S.input} placeholder="Nội dung (vd: Thuê sân bóng tháng 11)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <input style={S.input} placeholder="Số tiền (VND)" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
          <button style={S.btn} disabled={busy === 'new'} onClick={create}>Tạo</button>
        </section>
      )}

      {payouts.map((p) => (
        <section key={p.id} style={S.card}>
          <div style={S.row}>
            <div><b>{p.title}</b><br /><code>{p.id}</code> · đề xuất bởi {p.requested_by}</div>
            <div style={{ textAlign: 'right' }}><b>{vnd(p.amount_public)}</b><br /><span style={S.badge(p.status)}>{p.status}</span></div>
          </div>

          {p.status === 'DRAFT' && isTreasurer && (
            <div style={{ marginTop: 12 }}>
              <input style={S.input} placeholder="Người nhận" onChange={(e) => setForm({ ...form, [p.id]: { ...form[p.id], recipient: e.target.value } })} />
              <input style={S.input} placeholder="Số tài khoản" onChange={(e) => setForm({ ...form, [p.id]: { ...form[p.id], account: e.target.value } })} />
              <button style={S.btn} disabled={busy === p.id} onClick={() => seal(p)}>Niêm phong lệnh chi</button>
            </div>
          )}

          {p.status === 'SEALED' && (
            <div style={{ marginTop: 12 }}>
              <ol style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 14 }}>
                <li>Một thủ quỹ tạo realm role <code>{p.id}</code> và gán cho người giải ngân trong{' '}
                  <a href={`${TC_URL}/admin/${REALM}/console/`} target="_blank" rel="noreferrer">Tide Console</a>.</li>
                <li>Ít nhất <b>2/3 thủ quỹ</b> duyệt change request trong enclave Tide.</li>
                <li>Người được cấp bấm <b>Giải ngân</b>.</li>
              </ol>
              <button style={S.btn} disabled={busy === p.id} onClick={() => release(p)}>Giải ngân</button>
            </div>
          )}

          {p.status === 'RELEASED' && <p style={{ marginBottom: 0 }}>✅ Đã giải ngân bởi {p.released_by}</p>}
        </section>
      ))}

      <section style={S.card}>
        <h3>Sổ ngân hàng (mock)</h3>
        {transfers.length === 0 ? <small>Chưa có giao dịch.</small> : transfers.map((t) => (
          <div key={t.id} style={{ fontSize: 14 }}>{t.payout_id} → {t.recipient} ({t.account}) · {vnd(t.amount)} · bởi {t.executed_by}</div>
        ))}
      </section>

      <section style={{ ...S.card, background: '#0b1220', color: '#cde' }}>
        <h3 style={{ marginTop: 0 }}>Nhật ký</h3>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>{log.join('\n') || '—'}</pre>
      </section>
    </main>
  );
}

const S: any = {
  main: { maxWidth: 820, margin: '32px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  card: { border: '1px solid #d0d7de', borderRadius: 10, padding: 16, margin: '16px 0', background: '#fff' },
  input: { padding: 8, marginRight: 8, marginBottom: 8, border: '1px solid #bbb', borderRadius: 6, minWidth: 200 },
  btn: { padding: '8px 14px', borderRadius: 6, border: 0, background: '#1f6f4e', color: '#fff', cursor: 'pointer' },
  link: { background: 'none', border: 0, color: '#1f6feb', cursor: 'pointer', padding: 0 },
  badge: (s: string) => ({
    fontSize: 12, padding: '2px 8px', borderRadius: 999, color: '#fff',
    background: s === 'RELEASED' ? '#1f883d' : s === 'SEALED' ? '#9a6700' : '#57606a',
  }),
};
