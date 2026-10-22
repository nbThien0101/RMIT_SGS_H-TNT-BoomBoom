# AGENTS.md — Tide UNLOCKED Challenge 2 · Living Project Brief · **Quỹ Xóm**

> **Loại tài liệu:** Project brief + agent instructions + spec để dựng lại + project state + decision log + change log.
> **Agent chính:** Anthropic Claude (Claude Code trên máy dev, hoặc Claude trên claude.ai). File `CLAUDE.md` import file này.
> **Ngôn ngữ làm việc:** Tiếng Việt; giữ nguyên tên công nghệ, API và thuật ngữ kỹ thuật tiếng Anh.
> **Cập nhật gần nhất:** 2026-10-22 11:10 (Asia/Ho_Chi_Minh).
> **Trạng thái:** `IMPLEMENTING` — code nghiệp vụ đã viết (overlay), **CHƯA chạy trên TideCloak thật** (`NOT VERIFIED`).
> **Concept đã chốt:** **Quỹ Xóm (Community Treasury)** — user đồng ý lúc 10:58 ngày 2026-10-22 (DEC-006).
> **Source of truth:** Yêu cầu chính thức lấy từ trang Tide; kiến trúc, tiến độ và quyết định nội bộ theo file này. Nếu khác nhau, ưu tiên quy định mới nhất của ban tổ chức rồi sửa file này.

---

## 0. MỆNH LỆNH BẮT BUỘC CHO MỌI AI / CODING AGENT

**Đọc toàn bộ `AGENTS.md` ngay đầu phiên, TRƯỚC KHI viết, sửa hoặc chạy code.** Không giả định AI có lịch sử chat; mọi ngữ cảnh cần thiết nằm ở đây.

### Quy tắc đồng bộ (MUST)

1. **Mọi thay đổi có ý nghĩa** (scope, business rule, kiến trúc, API, role, bảo mật, config, schema, code, test, bug, quyết định, tiến độ, demo, README, trạng thái nộp bài) **phải cập nhật CHÍNH file này** trong cùng phiên, và cùng commit/PR nếu dùng Git.
2. **Trước khi thay đổi:** đối chiếu Mục 2 (Requirements), 11 (Decisions), 10 (Project state), 7 (Acceptance). Có mâu thuẫn thì giải quyết hoặc ghi rõ trước.
3. **Sau khi thay đổi:** cập nhật mục liên quan, tick checklist **chỉ khi có bằng chứng**, thêm 1 dòng Change log (thời điểm, actor, nội dung, lý do, file, kết quả xác minh).
4. **Phương án cũ bị thay:** ghi DEC mới, đổi DEC cũ thành `SUPERSEDED`; không xóa lịch sử.
5. **Không tuyên bố đã test/tích hợp/nộp** khi chưa có kết quả thực tế. Dùng đúng nhãn: `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `DONE`, `NOT VERIFIED`.
6. **Tài liệu lệch code:** kiểm tra thực tế, sửa một bên, ghi lại lựa chọn.
7. **Không commit bí mật:** mật khẩu, token, `.env`, `data/tidecloak.json` thật, dữ liệu người thật. Dùng `.env.example` + synthetic data.
8. **Không giả lập mật mã Tide** (không `btoa`, không `if (role)` thay cho E2EE, không static key). Mock chỉ được dùng cho hệ thống ngoại vi (ngân hàng).
9. **Hỏi người dùng, không tự quyết** những việc Tide bắt buộc người dùng trả lời: email license, đồng ý Terms, hosting, branding, trường thông tin người dùng mới (Mục 5.4).
10. **Kết thúc mỗi phiên:** báo cáo đã làm gì, đã test gì, đã sửa mục nào của file này, còn gì chưa xong.

### Quy trình cố định cho từng task

```text
READ AGENTS.md -> INSPECT repo/runtime/docs (Raziel MCP) -> IDENTIFY change
  -> IMPLEMENT smallest change -> VERIFY (tide-doctor, real login, test matrix)
  -> UPDATE AGENTS.md (state + decisions + changelog) -> REPORT
```

**AI mới: tiếp tục từ Mục 10 (Project state) và Mục 6 (checklist). Không làm lại task `DONE` trừ khi cần xác minh.**

---

## 1. NGỮ CẢNH VÀ MỤC TIÊU

- Cuộc thi: **RMIT Hackathon 2026 — Tide UNLOCKED, Challenge 2**.
- Đề bài: Xây **working prototype nhỏ có tích hợp TideCloak thật**, minh họa một khả năng mới khi gỡ bỏ "trust bottleneck".
- Thông điệp cốt lõi (**Emergent Authority**): không một admin, tổ chức, server hay AI riêng lẻ nào **đơn phương vượt qua** quy tắc bảo vệ dữ liệu/quyết định trong tình huống demo.
- **Bẫy cần tránh:** nếu app chạy y hệt khi thay Tide bằng login thường + backend RBAC thì **trượt tiêu chí**.
- Cho phép synthetic data và mock hệ thống ngoại vi. **Không mock cơ chế bảo mật TideCloak cốt lõi.**

### Câu chuyện demo phải trả lời

1. **Possibility** — khả năng hữu ích nào được mở ra?
2. **Constraint** — việc phải tin một bên có toàn quyền đang chặn điều gì?
3. **Prototype** — chạy thế nào, TideCloak tham gia ở đâu?
4. **Change** — điều gì đáng tin hơn khi bỏ quyền đơn phương?

Nguồn đề: https://tide.org/unlocked/#challenge (trang chặn bot tự động; WebFetch trả `ROBOTS_DISALLOWED` ngày 2026-10-22 → người dùng phải tự mở).

---

## 2. YÊU CẦU CHÍNH THỨC (PHẢI GIỮ)

### Deliverables & nộp bài

- **GitHub repo PUBLIC** chứa prototype tích hợp TideCloak, source, README, video.
- **README overview ở đầu README:** 1 câu mô tả + trả lời **chính xác 5 prompt** trong nút `Copy README template` trên trang Tide; phần này **≤ 300 từ**. Hướng dẫn cài đặt để ở mục riêng.
- **Video demo ~2 phút**, `.mp4`, **< 100 MB**, nằm **trong repo**.
- **Nộp link repo qua Google Form** trên trang chính thức.

**KHÔNG BỊA 5 PROMPT.** README hiện tại (bản nháp 296 từ) đang theo cấu trúc 4 phần Possibility / Constraint / How it works / What changes + Honest limits. **Việc P0:** người dùng mở trang, bấm `Copy README template`, dán nguyên văn vào đây (Mục 2.1), rồi chỉnh README cho khớp.

#### 2.1 Năm prompt chính thức (CHƯA CÓ — dán nguyên văn vào đây)

```text
<chưa lấy được — chờ người dùng copy từ trang Tide>
```

### Deadline — CẢNH BÁO MÂU THUẪN

- Người dùng nêu: **22/10/2026, 18:00 giờ Việt Nam**.
- Trang Tide (theo bản brief trước): `Vietnam: Thu 22 Oct, 6:00 pm` và `Melbourne: Fri 23 Oct, 10:00 am AEDT` (= 06:00 ngày 23/10 giờ VN) — **không khớp nhau**; có lúc hiển thị `Submissions have closed`.
- **Làm việc theo mốc sớm nhất: 18:00 ngày 22/10.** Xác minh form còn mở với ban tổ chức (P0-01).

---

## 3. SẢN PHẨM: QUỸ XÓM (ĐÃ CHỐT)

### One-liner

> **Quỹ Xóm:** quỹ cộng đồng của một con hẻm, nơi mỗi khoản chi chỉ được thực hiện khi **quorum 2/3 thủ quỹ** đồng ý, và sự đồng ý đó do **mạng Tide** thực thi chứ không phải code của app — nên không thủ quỹ, admin server hay chủ database nào một mình rút được tiền.

### Trust bottleneck bị gỡ bỏ

- **App thường:** "2/3 phải duyệt" là một câu `if` + một cờ trong DB. Ai kiểm soát server/DB/tài khoản admin thì lật được cờ.
- **Quỹ Xóm:**
  1. Lệnh chi (người nhận, số tài khoản, số tiền) được **mã hóa ngay trong trình duyệt** bằng hợp đồng có sẵn `RelationshipAttestation:1`. Server chỉ lưu ciphertext.
  2. Chỉ ai giữ **realm role `payout-<id>`** mới giải mã được lệnh chi đó (mạng ORK kiểm tra).
  3. Cấp role đó là một **IGA change request**. Với 3 thủ quỹ (3 `tide-realm-admin`), cần **2 chữ ký enclave** mới commit được. Trước khi commit, role không có trong token của ai → mạng Tide từ chối giải mã.
  4. Ngân hàng giả lập trả đúng **số tiền trong bản niêm phong**, cho người có role `payout-<id>` trong token đã được Tide ký.

### User stories (MVP)

- **US-01** Thủ quỹ đăng nhập/đăng xuất bằng TideCloak (Tide account, DPoP).
- **US-02** Thủ quỹ tạo yêu cầu chi (tiêu đề + số tiền công khai).
- **US-03** Thủ quỹ niêm phong lệnh chi: ký 2 policy qua popup enclave (GHI cho thủ quỹ, ĐỌC cho role `payout-<id>`), mã hóa trong trình duyệt, gửi ciphertext lên server.
- **US-04** Bấm "Giải ngân" khi chưa có quorum → bị từ chối (403 từ API và/hoặc mạng Tide từ chối giải mã).
- **US-05** Một thủ quỹ tự gán role `payout-<id>` → change request **PENDING 1/2**, vẫn bị từ chối.
- **US-06** Thủ quỹ thứ hai duyệt trong enclave → commit → người được cấp đăng nhập lại → giải mã thành công → mock bank ghi giao dịch.
- **US-07** "Admin xấu" sửa DB: chỉ thấy ciphertext; sửa ciphertext → giải mã thất bại; giả trạng thái `RELEASED` → không có giao dịch ngân hàng nào.

### Không làm trong MVP

- Ngân hàng thật, tiền thật, thông báo, đa tenant, UI cầu kỳ.
- Không tự viết trang duyệt change request — **dùng Tide Console có sẵn** (tiết kiệm 1–2 giờ).
- Không viết custom Forseti contract (không tự triển khai được — xem DEC-007).

### Ý tưởng đã loại (giữ để tham khảo)

- `TrustVault` (chia sẻ tài liệu E2EE) — SUPERSEDED bởi Quỹ Xóm.
- `MediBridge` (hồ sơ y tế đồng thuận) — phương án dự phòng, cùng dùng IGA + RelationshipAttestation.
- `AgentGuard` (AI agent bị quản trị) — quá nhiều phần cho thời gian còn lại.

---

## 4. KIẾN TRÚC

```text
[Browser: Next.js (template nextjs-e2ee-vault) + @tidecloak/nextjs]
  |  - Login Tide (DPoP strict, ES256)
  |  - signRelationshipPolicy()  -> popup enclave, mạng Tide ký policy
  |  - encryptForRecord / decryptForRecord  (tag duy nhất = payout id)
  |  - Duyệt change request: thủ quỹ dùng Tide Console (admin's own browser + token)
  |
  +--> [Next.js API routes]  (mọi route qua withAuth của template: JWT local JWK + DPoP)
  |       /api/payouts            GET list, POST create (treasurer)
  |       /api/payouts/policies   POST store signed policy (treasurer), GET (chỉ người policy áp dụng)
  |       /api/payouts/seal       POST ciphertext (treasurer), GET ciphertext
  |       /api/mock-bank          POST transfer (cần role payout-<id> trong JWT)
  |               v
  |       [PostgreSQL 16 (docker compose, cổng 5433)]
  |          payouts / policies / bank_transfers — KHÔNG có plaintext
  |
[TideCloak dev (Docker, :8080), realm `quy-xom`, client `quy-xom-client`]
  - IGA/QEA bật; 3 tide-realm-admin => threshold 2
  - Realm roles: _tide_encryptor, _tide_decryptor (cấp riêng từng thủ quỹ), payout-<id> (tạo theo từng khoản chi)
  - Mạng ORK chạy RelationshipAttestation:1 trên mỗi lần encrypt/decrypt
```

### Policy cho mỗi khoản chi (RelationshipAttestation:1)

| Policy | subjectType | subjectId | clientId | assignmentId | roles (JSON string) |
|---|---|---|---|---|---|
| GHI (niêm phong) | `Role` | `tide-realm-admin` | `realm-management` | `payout-<id>` | `["_tide_encryptor"]` |
| ĐỌC (giải ngân) | `Role` | `payout-<id>` | — | `payout-<id>` | `["_tide_decryptor"]` |

Policy luôn `IMPLICIT` + `PRIVATE`, keyId = `vendorId` của adapter. Mỗi policy = 1 lần duyệt enclave của một `tide-realm-admin`.

### Security invariants (không được vi phạm)

- Không plaintext lệnh chi trên server, DB, log, API request (trừ request tới mock bank — ghi rõ đây là giới hạn của prototype; ngân hàng thật là hệ thống ngoài).
- Mọi API route verify JWT bằng **embedded JWK** (`createLocalJWKSet`, cấm `createRemoteJWKSet`), kiểm tra `iss`, `azp`, `exp`, **DPoP binding**, và role phía server. Kiểm tra ở UI không phải phân quyền.
- `tide-realm-admin` là **client role** của `realm-management` (đọc ở `resource_access`, không phải `realm_access`).
- `_tide_encryptor` / `_tide_decryptor` là **realm role**, cấp theo từng user, **không** đưa vào default roles.
- Mỗi item mã hóa có **đúng 1 tag** = payout id.
- **Duyệt change request phải đi thẳng từ trình duyệt admin tới TideCloak bằng token của chính admin**, không proxy qua server (proxy làm mọi chữ ký bị tính cho một tài khoản → quorum kẹt; AP-89).
- Không khẳng định tuyệt đối "không ai can thiệp được": realm `master` không bị IGA quản lý; master admin chỉ dùng lúc bootstrap. Ghi rõ threat model.

---

## 5. MÔI TRƯỜNG, MCP VÀ BOOTSTRAP

### 5.1 Prerequisites

Docker, Node ≥ 20.9, npm, `curl`, `jq`, internet, 3 profile trình duyệt (mỗi thủ quỹ một profile).

### 5.2 Kết nối Raziel MCP cho Claude

- Server: `https://mcp.tide.org/mcp` (remote, read-only, 9+ tool). Gói local: `@tideorg/mcp` (stdio).
- **claude.ai:** Settings → Connectors → thêm custom connector với URL trên. Đã kết nối thành công 2026-10-22.
- **Claude Code (máy dev):**
  ```bash
  claude mcp add --transport http raziel https://mcp.tide.org/mcp
  claude mcp list        # xác minh; nếu lỗi, thử: claude mcp add raziel -- npx -y @tideorg/mcp
  ```
- Tool hay dùng: `tide_choose_scenario`, `tide_scenario` (`relationship-attestation`, `iga-admin-governance`), `tide_scaffold`, `tide_playbook`, `tide_canon` (`iga-change-requests-api`, `invariants`, `anti-patterns`), `tide_dpop_asset`, `tide_doctor`, `tide_branding`, `tide_onboarding`.
- **Lưu ý:** sandbox cloud của claude.ai **bị chặn** `mcp.tide.org/pack/...` và `registry.npmjs.org` (403, 2026-10-22). Vì vậy code được viết dạng overlay và phải chạy trên máy người dùng.

### 5.3 Dựng lại dự án từ đầu (theo thứ tự)

```bash
mkdir hackathon && cd hackathon
mkdir -p .tide-pack && curl -fsSL "https://mcp.tide.org/pack/templates.tgz" | tar -xz -C .tide-pack
mkdir -p quy-xom && cp -R .tide-pack/templates/nextjs-e2ee-vault/. quy-xom/
cd quy-xom
# 1) package.json: "name": "quy-xom"   (realm = quy-xom, client = quy-xom-client)
# 2) chép overlay (Mục 9) vào đây, rồi:
mkdir -p src/lib/tide && cp ../.tide-pack/templates/relationship-attestation/relationship.ts src/lib/tide/
npm install && npm install pg && npm install -D @types/pg
cp .env.example .env          # điền theo Mục 5.4
# 3) thêm '/treasury' vào protectedRoutes của proxy/middleware template (giống '/vault')
docker compose up -d          # Postgres + schema + seed
npm run init                  # TideCloak: realm, license, IGA; dừng ở invite link
npm run dev
bash ../.tide-pack/templates/shared/tide-doctor.sh
bash ../.tide-pack/templates/shared/tide-doctor.sh --url http://localhost:3000   # lặp tới RESULT: OK
```

Sau đó (Tide Console `http://localhost:8080/admin/quy-xom/console/`):
1. Thủ quỹ 1 hoàn tất invite link (trình duyệt A).
2. Tạo `thuquy2`, `thuquy3`, mỗi người hoàn tất invite link ở trình duyệt B, C.
3. Gán `realm-management → tide-realm-admin` cho từng người (khi còn 1–2 admin, threshold = 1).
4. Gán `_tide_encryptor` + `_tide_decryptor` cho cả 3 (từ lúc 3 admin, mỗi change request cần 2 chữ ký).
5. Cả 3 đăng xuất / đăng nhập lại.

### 5.4 Câu trả lời của người dùng (đã có / còn thiếu)

| Câu hỏi bắt buộc | Trả lời | Thời điểm |
|---|---|---|
| Email license Tide | `nghiatucayfai75@gmail.com` (giá trị cho `TIDE_LICENSE_EMAIL` trong `.env`, KHÔNG commit `.env`) | 2026-10-22 10:58 |
| Đồng ý Terms https://tide.org/legal | **Yes** → `TIDE_TERMS_ACCEPTED=yes` | 2026-10-22 10:58 |
| Hosting | **Local Docker** | 2026-10-22 10:58 |
| Branding màn đăng nhập | **CHƯA TRẢ LỜI** (đề xuất: logo "Quỹ Xóm" xanh lá `1f6f4e` qua `tide_branding`) | — |
| Trường thông tin user mới | **CHƯA TRẢ LỜI** (đề xuất: chỉ `displayName` qua `tide_onboarding`) | — |
| Mạng ORK có `RelationshipAttestation:1`? | **CHƯA XÁC MINH** — hỏi Tide Discord https://discord.gg/XBMd9ny2q5 | — |

### 5.5 Biến môi trường (`.env`, không commit)

```
KC_BOOTSTRAP_ADMIN_PASSWORD=<người dùng tự đặt>
TIDE_LICENSE_EMAIL=<email ở Mục 5.4>
TIDE_TERMS_ACCEPTED=yes
DATABASE_URL=postgres://quyxom:quyxom-dev@localhost:5433/quyxom
NEXT_PUBLIC_TIDECLOAK_URL=http://localhost:8080
NEXT_PUBLIC_TIDE_REALM=quy-xom
```

---

## 6. CHECKLIST TRIỂN KHAI

### P0 — bắt buộc

- [ ] `P0-01` Xác minh Google Form + deadline (bằng chứng, thời điểm).
- [x] `P0-02` Chốt concept → **Quỹ Xóm** (DEC-006).
- [x] `P0-03a` Viết overlay code nghiệp vụ (Mục 9) — `DONE` về mặt viết; type-check với stub OK; **chưa build trên template thật**.
- [ ] `P0-03b` Scaffold template trên máy dev, chép overlay, `npm run build` thành công.
- [ ] `P0-04` `npm run init` xong, đăng nhập Tide thật với Thủ quỹ 1.
- [ ] `P0-05` 3 thủ quỹ là `tide-realm-admin`; threshold = 2 (kiểm tra trên change request).
- [ ] `P0-06` Cấp `_tide_encryptor`/`_tide_decryptor` qua change request đã commit.
- [ ] `P0-07` Sửa 3 adapter point (Mục 9.2) cho khớp template; `tide-doctor` báo `RESULT: OK`.
- [ ] `P0-08` Niêm phong 1 khoản chi thật (2 policy ký qua enclave, ciphertext trong DB).
- [ ] `P0-09` Negative: giải ngân khi chưa có quorum bị từ chối; PENDING 1/2 vẫn bị từ chối.
- [ ] `P0-10` Positive: sau khi thủ quỹ 2 duyệt → giải mã + mock bank ghi giao dịch.
- [ ] `P0-11` Rogue admin: `show` / `tamper` / `force` cho kết quả như Mục 7.
- [ ] `P0-12` README theo **5 prompt chính thức**, ≤ 300 từ phần overview.
- [ ] `P0-13` Video `.mp4` ~2 phút, < 100 MB, trong repo.
- [ ] `P0-14` Repo GitHub public, không lộ bí mật (`.env`, `data/tidecloak.json`).
- [ ] `P0-15` Nộp Google Form, lưu bằng chứng.

### P1 — nếu còn thời gian

- [ ] `P1-01` Branding màn đăng nhập (`tide_branding`) — sau khi người dùng trả lời.
- [ ] `P1-02` Form onboarding (`tide_onboarding`) — sau khi người dùng trả lời.
- [ ] `P1-03` Ảnh chụp Tide Console (PENDING 1/2 → committed) trong README.
- [ ] `P1-04` Nút trong app tự tạo change request cấp role (gọi thẳng TideCloak từ browser bằng token admin) thay cho thao tác Console.

### Phương án dự phòng (nếu mạng không có `RelationshipAttestation:1`)

Bỏ bước niêm phong; giữ câu chuyện: mock bank chỉ nhận lệnh từ người có role `payout-<id>` trong JWT do Tide ký, và role đó chỉ có khi quorum duyệt. **Không** tự viết custom contract (AP-RA01). Ghi DEC mới nếu chuyển sang phương án này.

---

## 7. ACCEPTANCE CRITERIA / TEST MATRIX

| ID | Kiểm tra | Kết quả mong đợi | Status | Evidence |
|---|---|---|---|---|
| AC-01 | Login/logout Tide thật | Thành công, đúng user | NOT STARTED | — |
| AC-02 | API không có/ sai token | 401/403 | NOT STARTED | — |
| AC-03 | Niêm phong khoản chi | 2 popup enclave; DB có `sealed` + 2 dòng `policies` | NOT STARTED | — |
| AC-04 | `rogue-admin.sh show` | Chỉ thấy ciphertext | NOT STARTED | — |
| AC-05 | Giải ngân khi chưa có role | 403 "You do not hold role payout-…" | NOT STARTED | — |
| AC-06 | Tự gán role, chưa đủ quorum | Change request PENDING 1/2; vẫn bị từ chối | NOT STARTED | — |
| AC-07 | Thủ quỹ 2 duyệt | Commit; sau re-login giải mã OK; `bank_transfers` +1 | NOT STARTED | — |
| AC-08 | `tamper <id>` rồi giải ngân | Mạng Tide từ chối giải mã | NOT STARTED | — |
| AC-09 | `force <id>` | Status RELEASED nhưng không có `bank_transfers` | NOT STARTED | — |
| AC-10 | `inflate <id>` | Ngân hàng trả số tiền trong bản niêm phong | NOT STARTED | — |
| AC-11 | `tide-doctor --url` | `RESULT: OK` | NOT STARTED | — |
| AC-12 | README theo 5 prompt, ≤ 300 từ | Đạt | NOT STARTED | — |
| AC-13 | Video hợp lệ | `.mp4`, ~120 s, < 100 MB | NOT STARTED | — |
| AC-14 | Repo public an toàn | Truy cập được, không có bí mật | NOT STARTED | — |
| AC-15 | Nộp form | Có xác nhận | NOT VERIFIED | — |

---

## 8. VIDEO DEMO — SCRIPT 120 GIÂY

Chi tiết lời thoại và cảnh quay ở `DEMO_SCRIPT.md`. Tóm tắt:

| Thời gian | Nội dung |
|---|---|
| 0:00–0:25 | Possibility: quỹ xóm không cần tin một thủ quỹ. |
| 0:25–0:50 | Constraint: app thường = cờ trong DB; `rogue-admin.sh show` chỉ thấy ciphertext. |
| 0:50–1:35 | Prototype: tự giải ngân bị từ chối → tự cấp role PENDING 1/2 → thủ quỹ 2 duyệt → giải ngân thành công. |
| 1:35–1:50 | Rogue admin: `tamper` hỏng, `force` không chuyển tiền. |
| 1:50–2:00 | What changes: quyền lực nảy sinh từ quorum. |

Chỉ quay tính năng đã chạy thật. Không dùng animation làm bằng chứng mật mã.

---

## 9. CẤU TRÚC REPO & ĐẶC TẢ CODE

### 9.1 Overlay (file Claude đã viết, chép đè lên template)

```text
quy-xom/                               (= template nextjs-e2ee-vault + overlay)
├── AGENTS.md / CLAUDE.md               # file này + import cho Claude Code
├── README.md                           # overview (cần chỉnh theo 5 prompt) — ghi đè README template
├── SETUP.md                            # hướng dẫn chạy chi tiết (tiếng Việt)
├── DEMO_SCRIPT.md                      # kịch bản video
├── docker-compose.yml                  # postgres:16-alpine, container quyxom-db, cổng 5433
├── db/schema.sql                       # payouts, policies, bank_transfers + 2 dòng seed
├── scripts/rogue-admin.sh              # show | tamper <id> | inflate <id> | force <id>
└── src/
    ├── lib/db.ts                       # pg Pool lazy (không connect lúc build)
    ├── lib/treasury/guard.ts           # ADAPTER #1: withAuth của template; isTreasurer, holdsPayoutRole
    ├── lib/treasury/tideCrypto.ts      # ADAPTER #2: bọc relationship.ts (sign/encrypt/decrypt)
    ├── lib/treasury/apiFetch.ts        # ADAPTER #3: fetch có DPoP
    ├── app/api/payouts/route.ts        # GET list (+transfers), POST create (treasurer)
    ├── app/api/payouts/policies/route.ts  # POST store (treasurer, kiểm shape), GET (đúng người)
    ├── app/api/payouts/seal/route.ts   # POST ciphertext (treasurer), GET ciphertext
    ├── app/api/mock-bank/route.ts      # POST, cần role payout-<id>; transaction FOR UPDATE; chống trả 2 lần
    └── app/treasury/page.tsx           # UI tiếng Việt: tạo, niêm phong, giải ngân, sổ ngân hàng, nhật ký
```

File template **không được sửa** (theo `tide_scaffold`): `next.config.ts`, `public/silent-check-sso.html`, `public/tide_dpop_auth.html`, `scripts/init-tidecloak.sh`, `scripts/realm.json.template`, `src/app/auth/redirect/page.tsx`, `src/app/providers.tsx`, `src/lib/auth/*`. Ngoại lệ duy nhất: thêm `/treasury` vào `protectedRoutes`.

### 9.2 Ba adapter point (rủi ro đã biết)

Overlay được viết **khi chưa xem được file template thật** (sandbox bị chặn). Nếu build lỗi, chỉ sửa 3 file này:

| # | File | Đối chiếu với | Giả định hiện tại |
|---|---|---|---|
| 1 | `src/lib/treasury/guard.ts` | `src/lib/auth/middleware.ts`, `src/app/api/vault/route.ts` | `withAuth(handler(req, jwt))` |
| 2 | `src/lib/treasury/tideCrypto.ts` | `src/lib/tide/relationship.ts` + README của nó | `signRelationshipPolicy({subject, recordId, access})`, `encryptForRecord({recordId, data, policy})`, `decryptForRecord({recordId, encrypted, policy})` |
| 3 | `src/lib/treasury/apiFetch.ts` | cách `src/app/vault/page.tsx` gọi `/api/vault` | `secureFetch` trên hook hoặc `IAMService` |

Prompt gợi ý cho Claude Code:
> "Read src/lib/tide/relationship.ts, src/lib/auth/middleware.ts and src/app/vault/page.tsx. Fix ONLY src/lib/treasury/{guard,tideCrypto,apiFetch}.ts to call those APIs correctly. Do not edit template files. Run tide_doctor until RESULT: OK. Update AGENTS.md."

### 9.3 Schema DB (tóm tắt)

- `payouts(id 'payout-<hex>', title, amount_public, sealed, status DRAFT|SEALED|RELEASED|REJECTED, requested_by, released_by, created_at, released_at)`
- `policies(subject_type, subject_id, client_id, record_id, access write|read, policy_b64, granted_by, created_at)` PK `(subject_type, subject_id, client_id, record_id)`
- `bank_transfers(id, payout_id, recipient, account, amount, executed_by, created_at)`

### 9.4 Kiến thức Tide đã xác minh qua Raziel (2026-10-22, pack v1.9.33)

- Custom Forseti contract (ký theo ngưỡng) **không tự triển khai được**; đội Tide deploy trên mạng thử nghiệm.
- `RelationshipAttestation:1` có sẵn trong ORK (`main` từ 2026-10-16), chỉ cho encrypt/decrypt; subject `User`/`Group`/`Role`; mọi param là string; `roles` là JSON string.
- Lỗi do contract từ chối hiện ra dưới dạng `TIDE-TIDEJS-NET-THRESHOLD_FAILURE` — đó là "không", không phải mất mạng (AP-RA18). Không retry.
- IGA: approve qua `POST /admin/realms/{realm}/iga/change-requests/{id}/approve` (2 pha: `{}` → `needs-approval` + `requestModel` → ký enclave → POST lại). Tự commit khi đủ quorum. Đếm chữ ký ở `authorizationCount`.
- Threshold: `max(1, floor(0.7 × số tide-realm-admin))` → 1, 1, **2**, 2, 3 cho 1–5 admin.
- Cấp `tide-realm-admin` đầu tiên chuyển realm FirstAdmin → MultiAdmin (không quay lại). Làm mọi thay đổi cấu hình **trước** bước này.
- Role mới vào token sau khi refresh (có thể trễ tới ~120 s); bảo user đăng nhập lại.
- `toggle-iga` là công tắc đảo trạng thái — gọi lần 2 sẽ tạo `DISABLE_IGA`. Đừng gọi thủ công.

---

## 10. PROJECT STATE (CẬP NHẬT LIÊN TỤC)

| Field | Current value |
|---|---|
| Lifecycle | `IMPLEMENTING` |
| Concept | **Quỹ Xóm** — ACCEPTED (DEC-006) |
| Overlay code | `WRITTEN` — `quy-xom-overlay.zip` (27 file); type-check với stub OK; **NOT VERIFIED** trên template thật |
| Working repository | `NOT CREATED` (chưa có GitHub repo) |
| TideCloak realm / license | `NOT STARTED` (đã có email + đồng ý Terms) |
| Raziel MCP | `CONNECTED` trên claude.ai (2026-10-22); Claude Code: `NOT VERIFIED` |
| Login integration | `NOT STARTED` (do template cung cấp) |
| E2EE (RelationshipAttestation) | `CODE WRITTEN`, `NOT VERIFIED`; mạng có contract chưa: `UNKNOWN` |
| QEA 3 admin | `NOT STARTED` |
| README | `DRAFT` 296 từ — chưa theo 5 prompt chính thức |
| Demo script | `DRAFT` (`DEMO_SCRIPT.md`) |
| Video | `NOT STARTED` |
| GitHub public URL | `UNKNOWN` |
| Google Form | `NOT VERIFIED` |
| Last progress update | `2026-10-22 11:10 — AGENTS.md viết lại cho Claude, chốt Quỹ Xóm` |

### Blockers / câu hỏi mở

1. **Deadline/form** — chưa xác minh (P0-01).
2. **5 prompt README** — chờ người dùng copy từ trang Tide.
3. **Contract trên mạng ORK** — hỏi Tide Discord; nếu không có thì dùng phương án dự phòng (Mục 6).
4. **3 adapter point** — cần đối chiếu file template thật.
5. **Branding + trường onboarding** — chờ người dùng trả lời (Mục 5.4).

---

## 11. DECISION LOG (KHÔNG XÓA LỊCH SỬ)

| ID | Date | Decision | Status | Why / effect |
|---|---|---|---|---|
| DEC-001 | 2026-10-22 | `AGENTS.md` là living source-of-truth. | ACCEPTED | AI tiếp quản không mất ngữ cảnh. |
| DEC-002 | 2026-10-22 | TrustVault là concept MVP. | **SUPERSEDED by DEC-006** | — |
| DEC-003 | 2026-10-22 | Next.js + TypeScript + TideCloak. | ACCEPTED | Template chính thức `nextjs-e2ee-vault` từ `tide_scaffold`. |
| DEC-004 | 2026-10-22 | Ưu tiên demo chạy thật + negative test hơn UI. | ACCEPTED | Chứng minh khác biệt với RBAC. |
| DEC-005 | 2026-10-22 | Không khẳng định deadline duy nhất trước khi xác minh. | OPEN | Mốc giờ trên trang Tide bất nhất. |
| DEC-006 | 2026-10-22 10:58 | Chốt concept **Quỹ Xóm** (IGA quorum + RelationshipAttestation). | ACCEPTED BY USER | Câu chuyện "trước/sau" dễ hiểu nhất trong 2 phút; tự triển khai được hôm nay. |
| DEC-007 | 2026-10-22 | Không dùng policy-governed signing (custom Forseti). | ACCEPTED | Raziel: deploy contract không self-service. Ngưỡng tiền vẫn là app logic — ghi rõ ở README. |
| DEC-008 | 2026-10-22 | Duyệt change request bằng Tide Console có sẵn, không tự viết admin panel. | ACCEPTED | Tiết kiệm 1–2 giờ; tránh lỗi proxy approval (AP-89). |
| DEC-009 | 2026-10-22 | PostgreSQL qua docker compose (cổng 5433) thay vì SQLite. | ACCEPTED | Stack người dùng nêu; dễ demo "admin xấu" bằng psql. |
| DEC-010 | 2026-10-22 | Hosting TideCloak: Local Docker. | ACCEPTED BY USER | Nhanh nhất; realm không chuyển được sau này. |
| DEC-011 | 2026-10-22 | Agent chính là Anthropic Claude; thêm `CLAUDE.md` import `AGENTS.md`. | ACCEPTED BY USER | Claude Code tự đọc `CLAUDE.md`. |

---

## 12. CHANGE LOG (APPEND-ONLY)

> Giờ theo `Asia/Ho_Chi_Minh`. Không biết giờ chính xác thì ghi `time unverified`.

### 2026-10-22 — Initial handoff document
- **Actor:** ChatGPT (planning assistant).
- **Changes:** Tạo `AGENTS.md` với yêu cầu Challenge 2, phương án TrustVault, kiến trúc, checklist, test, demo, nguồn.
- **Verification:** Đối chiếu trang Tide và docs ngày 2026-10-22. Chưa chạy app.
- **Impacted:** `AGENTS.md`.

### 2026-10-22 ~10:36–11:05 — Ideation, chốt Quỹ Xóm, viết overlay
- **Actor:** Claude Opus 5.5 (claude.ai, có Raziel MCP).
- **Changed:** Đề xuất 3 ý tưởng; tra Raziel (`policy-governed-signing`, `iga-admin-governance`, `relationship-attestation`, `tide_scaffold`, playbooks, canon IGA). Phát hiện custom Forseti không self-service → thiết kế lại Quỹ Xóm. Viết overlay 27 file + `README.md` (296 từ) + `DEMO_SCRIPT.md` + `SETUP.md`.
- **Reason:** DEC-006, DEC-007, DEC-008, DEC-009, DEC-010.
- **Verification:** `tsc` với module stub: chỉ còn lỗi do thiếu type Node/React trong stub. `bash -n` script OK. **Chưa build trên template, chưa chạy TideCloak** (sandbox chặn `mcp.tide.org` và npm, HTTP 403).
- **Files:** toàn bộ overlay (Mục 9.1).
- **State/checklist:** P0-02, P0-03a.
- **Follow-up:** P0-01, P0-03b trở đi; 5 prompt; branding/onboarding; contract trên mạng.

### 2026-10-22 11:10 — Viết lại AGENTS.md cho Claude
- **Actor:** Claude Opus 5.5.
- **Changed:** Thay TrustVault bằng Quỹ Xóm ở Mục 3, 4, 6–11; thêm hướng dẫn Raziel cho Claude Code (5.2), quy trình dựng lại (5.3), câu trả lời bắt buộc của người dùng (5.4), đặc tả code + adapter point (9), kiến thức Tide đã xác minh (9.4); thêm `CLAUDE.md`.
- **Reason:** Người dùng yêu cầu AI (Claude) nắm context và dựng lại được dự án. DEC-011.
- **Verification:** Đối chiếu với file overlay thực tế trong `quy-xom-overlay/`.
- **Files:** `AGENTS.md`, `CLAUDE.md`.
- **State/checklist:** Mục 10 cập nhật.

### TEMPLATE FOR NEXT ENTRY

```md
### YYYY-MM-DD HH:mm Asia/Ho_Chi_Minh — <short title>
- Actor: <agent / human>
- Changed: <...>
- Reason / decision: <DEC-ID>
- Verification: <commands + actual results; or NOT VERIFIED>
- Files impacted: <paths>
- Project state & checklist updated: <IDs>
- Follow-up / blockers: <items>
```

---

## 13. OFFICIAL SOURCES

| Source | Link | Use |
|---|---|---|
| Challenge & nộp bài | https://tide.org/unlocked/ | Đề, deliverable, 5 prompt, deadline |
| TideCloak Quickstart | https://docs.tide.org/get-started/Tidecloak%20Quickstart | Docker dev, initializer |
| Raziel MCP | https://tide.org/agent-plugins · https://docs.tide.org/ai-agent-pack | Kết nối agent, playbook |
| Raziel endpoint | https://mcp.tide.org/mcp | Remote MCP |
| Tide pack templates | https://mcp.tide.org/pack/templates.tgz | Template + relationship.ts + tide-doctor |
| Tide E2EE | https://docs.tide.org/Admin/e2ee | doEncrypt/doDecrypt |
| QEA setup / workflow | https://docs.tide.org/Admin/SetupIGA · https://docs.tide.org/Core-Concepts/iga-workflow | Quorum |
| Tide FAQ | https://docs.tide.org/FAQ/ | JWT, CORS, lỗi E2EE |
| Tide Discord | https://discord.gg/XBMd9ny2q5 | Hỏi contract, sự cố mạng |

---

## 14. FIRST INSTRUCTION FOR THE NEXT AI (Claude)

You are the engineering agent for Tide UNLOCKED Challenge 2, project **Quỹ Xóm**. This file is your mandatory living context.

1. Read every section. Inspect the actual repo: does `quy-xom/` exist with the template + overlay? Record findings in Mục 10.
2. Confirm Raziel MCP is connected (`claude mcp list`). Use it before writing Tide code; never retype `tide_dpop_auth.html`.
3. If the repo does not exist, rebuild it with Mục 5.3 + overlay files (Mục 9). If overlay files are missing, regenerate them from the spec in Mục 3, 4 and 9.
4. Fix the 3 adapter points (Mục 9.2), run `tide-doctor` to `RESULT: OK`, then walk the test matrix (Mục 7) in order and record evidence.
5. Ask the human for anything in Mục 5.4 still marked CHƯA TRẢ LỜI. Never invent the licence email or accept Terms on their behalf.
6. Keep this file in sync with every change. Never claim verification or submission without evidence.
7. End every session with: completed, verified, AGENTS.md sections changed, blockers, next task.

**Definition of done for ANY task:** work done + verified as far as possible + `AGENTS.md` updated + reported accurately.
