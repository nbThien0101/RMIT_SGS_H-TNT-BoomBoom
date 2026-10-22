# Quỹ Xóm — Hướng dẫn chạy (khoảng 45–60 phút)

Bộ file này **chép đè lên template `nextjs-e2ee-vault` của Tide**. Template lo phần đăng nhập, DPoP và xác thực JWT phía server. Bộ file này chỉ thêm phần nghiệp vụ quỹ.

Cần có: Docker, Node 20.9 trở lên, `curl`, `jq`.

## 1. Lấy template của Tide (5 phút)

```bash
mkdir hackathon && cd hackathon
mkdir -p .tide-pack && curl -fsSL "https://mcp.tide.org/pack/templates.tgz" | tar -xz -C .tide-pack
mkdir -p quy-xom && cp -R .tide-pack/templates/nextjs-e2ee-vault/. quy-xom/
cp .tide-pack/templates/relationship-attestation/relationship.ts /tmp/relationship.ts
cd quy-xom
```

- Mở `package.json` và đổi `"name"` thành **`quy-xom`**. Script bootstrap lấy tên realm (`quy-xom`) và tên client (`quy-xom-client`) từ đây.
- Kiểm tra file `.gitignore` đã có chưa. Nếu chưa có thì tạo theo mẫu trong output của `tide_scaffold`.

## 2. Chép bộ file Quỹ Xóm vào

Giải nén `quy-xom-overlay.zip` vào **thư mục gốc của `quy-xom/`** (cho phép ghi đè). Sau đó chạy:

```bash
mkdir -p src/lib/tide && cp /tmp/relationship.ts src/lib/tide/
npm install
npm install pg && npm install -D @types/pg
chmod +x scripts/rogue-admin.sh
```

## 3. Điền `.env`

```bash
cp .env.example .env
```

Thêm hoặc sửa các dòng sau:

```
KC_BOOTSTRAP_ADMIN_PASSWORD=<tự đặt mật khẩu mạnh>
TIDE_LICENSE_EMAIL=nghiatucayfai75@gmail.com
TIDE_TERMS_ACCEPTED=yes
DATABASE_URL=postgres://quyxom:quyxom-dev@localhost:5433/quyxom
NEXT_PUBLIC_TIDECLOAK_URL=http://localhost:8080
NEXT_PUBLIC_TIDE_REALM=quy-xom
```

## 4. Bảo vệ route `/treasury`

Mở file middleware/proxy của template (tìm `createTideCloakProxy` hoặc `protectedRoutes`). Thêm `'/treasury'` vào danh sách route được bảo vệ, làm giống cách template đang bảo vệ `/vault`.

## 5. Khởi động (10–15 phút, phần lớn là chờ)

```bash
docker compose up -d     # Postgres, cổng 5433, tự nạp schema và dữ liệu mẫu
npm run init             # TideCloak: tạo realm, license, bật IGA, rồi dừng ở bước invite link
```

Khi script in ra **invite link**, mở link đó bằng **Trình duyệt A** và tạo tài khoản Tide cho **Thủ quỹ 1**. Script sẽ tự chạy tiếp.

> ⚠️ Nếu `npm run init` hỏi có cấp `tide-realm-admin` không thì cứ để nó làm. Theo đúng thiết kế của Tide, bước này luôn ở cuối cùng.

## 6. Tạo 3 thủ quỹ và cấp quyền mã hóa

Mở Tide Console tại `http://localhost:8080/admin/quy-xom/console/` (đăng nhập bằng Thủ quỹ 1).

1. **Users → Add user**: tạo `thuquy2` và `thuquy3`. Với mỗi người, tạo invite link (link liên kết tài khoản Tide), rồi mở bằng **Trình duyệt B** và **Trình duyệt C**.
2. Gán client role **`realm-management` → `tide-realm-admin`** cho `thuquy2`, rồi đến `thuquy3`.
   - Khi realm còn 1–2 admin, ngưỡng duyệt là 1, nên Thủ quỹ 1 tự duyệt được trong mục **Change Requests**.
   - Khi đủ **3 admin**, ngưỡng tự động thành **2** (`floor(3 × 0.7)`).
3. Gán realm role **`_tide_encryptor`** và **`_tide_decryptor`** cho cả 3 người. Mỗi lần gán tạo ra một change request. Từ lúc có 3 admin, mỗi change request cần 2 người duyệt.
4. Cả 3 người **đăng xuất rồi đăng nhập lại** để role mới vào được token.

## 7. Chạy app và kiểm tra

```bash
npm run dev
# .tide-pack nằm ở thư mục cha (hackathon/)
bash ../.tide-pack/templates/shared/tide-doctor.sh
bash ../.tide-pack/templates/shared/tide-doctor.sh --url http://localhost:3000
```

Sửa cho đến khi doctor báo `RESULT: OK`. Sau đó mở `http://localhost:3000/treasury`.

## 8. Ba điểm "adapter" có thể cần chỉnh

Mình viết code dựa trên tài liệu của Tide nhưng chưa xem được file template thật. Nếu build báo lỗi, chỉ cần sửa đúng 3 chỗ này:

| # | File | Đối chiếu với |
|---|------|---------------|
| 1 | `src/lib/treasury/guard.ts` (import `withAuth`) | `src/lib/auth/middleware.ts`, `src/app/api/vault/route.ts` |
| 2 | `src/lib/treasury/tideCrypto.ts` (tên tham số của `signRelationshipPolicy` / `encryptForRecord` / `decryptForRecord`) | `src/lib/tide/relationship.ts` và README của nó |
| 3 | `src/lib/treasury/apiFetch.ts` (fetch có DPoP) | cách `src/app/vault/page.tsx` gọi `/api/vault` |

Nếu bạn dùng Claude Code hoặc Cursor trên máy và đã kết nối Raziel, dán prompt sau là nó sửa giúp:

> "Read src/lib/tide/relationship.ts, src/lib/auth/middleware.ts and src/app/vault/page.tsx. Fix ONLY the three adapter files src/lib/treasury/{guard,tideCrypto,apiFetch}.ts so they call those APIs correctly. Do not edit template files. Then run tide_doctor until RESULT: OK."

## 9. Kiểm tra trước khi quay demo

Làm lần lượt theo đúng thứ tự:

1. **Thủ quỹ 1:** tạo một khoản chi, rồi niêm phong. Sẽ có 2 popup Tide để ký policy. Trạng thái chuyển thành `SEALED`.
2. **Thủ quỹ 1 bấm Giải ngân ngay.** Kết quả phải là **403**: "You do not hold role payout-…".
3. **Thủ quỹ 1 tạo realm role `payout-xxxx` và tự gán cho mình** trong Console. Change request nằm ở trạng thái PENDING với 1/2 chữ ký. Bấm Giải ngân lần nữa thì vẫn bị từ chối.
4. **Thủ quỹ 2** (Trình duyệt B) duyệt trong Console → change request được commit. Thủ quỹ 1 đăng nhập lại rồi bấm Giải ngân → ✅ tiền chuyển, và sổ ngân hàng có thêm một dòng.
5. **Thử vai admin xấu:**
   - `./scripts/rogue-admin.sh show`: chỉ thấy ciphertext.
   - `tamper <id>` trên một khoản chi khác: giải ngân thất bại khi giải mã.
   - `force <id>`: trạng thái bị đổi nhưng không có dòng nào trong `bank_transfers`, tức là không có tiền nào chuyển đi.

> **Phase 0 của Tide:** hợp đồng `RelationshipAttestation:1` có thể chưa có trên mọi mạng ORK. Nếu ký policy báo *unknown contract*, hỏi ngay đội Tide trên Discord: https://discord.gg/XBMd9ny2q5
> **Phương án dự phòng** (vẫn đạt tiêu chí): bỏ bước niêm phong. Câu chuyện chính vẫn giữ nguyên: ngân hàng chỉ nhận lệnh từ người có role `payout-<id>` trong token đã được mạng Tide ký, và role đó chỉ có được khi quorum duyệt.
