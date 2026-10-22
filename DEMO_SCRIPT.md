# Kịch bản video demo 2 phút — Quỹ Xóm

**Chuẩn bị trước khi quay**
- 3 cửa sổ trình duyệt (A, B, C), mỗi cửa sổ đã đăng nhập sẵn một thủ quỹ.
- 1 cửa sổ terminal, phóng to chữ.
- Đã có sẵn **một khoản chi ở trạng thái SEALED** (để không phải chờ popup lúc quay) và **một khoản DRAFT**.
- Role `payout-xxxx` đã tạo sẵn nhưng **chưa gán**, để màn duyệt quorum diễn ra ngay trên hình.
- Nói tiếng Anh nếu ban giám khảo là quốc tế. Lời thoại bên dưới viết bằng tiếng Anh, kèm ghi chú hình ảnh bằng tiếng Việt.

---

## 0:00–0:25 · THE POSSIBILITY

**Hình:** Ảnh hoặc slide một con hẻm, thùng quỹ xóm. Sau đó chuyển sang trang `/treasury`.

**Lời thoại:**
> "Every neighbourhood in Vietnam has a fund — for streetlights, fire extinguishers, emergencies. It runs on trust in one treasurer. Quỹ Xóm makes that trust unnecessary: money moves only when a quorum of treasurers agrees, and no server, admin or single person can fake that agreement."

## 0:25–0:50 · THE CONSTRAINT

**Hình:** Terminal chạy `./scripts/rogue-admin.sh show`. Chèn chữ lên hình: *"Normal app: approval = a DB flag"*.

**Lời thoại:**
> "In a normal app, '2 of 3 approvals' is just a row in a database. Whoever runs the server can flip it. Here I'm the database owner — and all I can see is ciphertext. The payout instruction is sealed in the treasurer's browser by the Tide network."

## 0:50–1:35 · THE PROTOTYPE

**Hình (khoảng 45 giây, phần chính của video):**
1. **Trình duyệt A (Thủ quỹ 1)** bấm **Giải ngân** → nhật ký đỏ báo *"You do not hold role payout-…"*. *(5 giây)*
2. Trong Tide Console, Thủ quỹ 1 tự gán role `payout-xxxx` cho mình → change request hiện **PENDING 1/2**. *(10 giây)*
3. Bấm Giải ngân lần nữa → **vẫn bị mạng Tide từ chối**. *(5 giây)*
4. **Trình duyệt B (Thủ quỹ 2)** duyệt trong enclave Tide → change request được **commit**. *(10 giây)*
5. Trình duyệt A đăng nhập lại, bấm Giải ngân → nhật ký xanh hiện người nhận và số tiền → sổ ngân hàng có thêm một dòng. *(15 giây)*

**Lời thoại:**
> "Treasurer one tries to release the payment alone — refused. Even with full admin rights, granting herself access only creates a pending request. The network still says no. Treasurer two approves in her own Tide enclave… and now the instruction decrypts and the bank pays."

## 1:35–1:50 · ROGUE ADMIN (bằng chứng)

**Hình:** Chạy `./scripts/rogue-admin.sh tamper <id2>` → bấm Giải ngân khoản đó → thất bại. Chạy `force <id2>` → trạng thái đổi thành RELEASED, nhưng sổ ngân hàng **trống**.

**Lời thoại:**
> "Tampering with the ciphertext breaks it. Forging 'released' moves no money."

## 1:50–2:00 · WHAT CHANGES

**Hình:** Slide kết với 3 dòng chữ.

**Lời thoại:**
> "Authority no longer lives in an account or a server. It emerges from the quorum. That's what TideCloak unlocks: community money that even its own operators can't steal."

---

**Mẹo quay:**
- Dùng OBS, độ phân giải 1080p.
- Cắt bỏ thời gian chờ popup enclave.
- Thêm phụ đề tiếng Việt nếu cần.
- Quay từng đoạn riêng rồi ghép lại, như vậy dễ giữ đúng 2:00 hơn quay một lần liền.
