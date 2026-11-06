# Dexa Group — Fullstack Web Technical Test

Aplikasi **Absensi WFH Karyawan** + **Monitoring Karyawan (Admin HRD)**.

- Backend: **NestJS** dengan konsep **microservices** (TCP transport) + **MySQL** (TypeORM)
- Frontend: **React** (Vite + Tailwind)
- Auth: JWT (login di guard Otorisasi per endpoint)

---

## Arsitektur

```
┌──────────────┐  HTTP :3005   ┌────────────────┐
│ web-employee │ ────────────► │    gateway      │  Auth Guard / Roles Guard / Upload proxy
│  (React)     │               │   (NestJS)      │
└──────────────┘               └───┬────────┬───┘
┌──────────────┐                   │ TCP    │
│ web-admin    │ ─── HTTP :3005 ───┘        │
│  (React)     │       ┌──────────┬─────────┴────────┐
└──────────────┘       ▼          ▼                  ▼
                auth-service  employee-service  attendance-service
                 :4001 TCP      :4002 TCP         :4003 TCP
                     └──────────┴─────────┬─────────┘
                                          ▼
                                    MySQL «absensi»
```

### Database (auto-sinkronisasi TypeORM)

- `employees` — master data karyawan: `nip` (unik), `full_name`, `email` (unik), `password` (bcrypt), `role`
  (`employee|admin`), `position`, `department`, `phone`, `joined_at`, `is_active`, timestamps
- `attendances` — absensi: `employee_id`, `work_date` (unik per karyawan/hari), `check_in_at`,
  `check_in_photo`, `check_in_note`, `check_out_at`, `check_out_photo`, timestamps

---

## Menjalankan

```bash
npm install

# 1. MySQL (sekali saja)
brew services start mysql
mysql -uroot -e "CREATE DATABASE absensi CHARACTER SET utf8mb4;
                 CREATE USER 'absensi'@'127.0.0.1' IDENTIFIED BY 'absensi123';
                 GRANT ALL ON absensi.* TO 'absensi'@'127.0.0.1';"

# 2. Jalankan semua (1 gateway + 3 microservice + 2 React app)
npm run dev

# 3. Seed data (tabel dibuat otomatis oleh TypeORM setelah service start pertama)
npm run seed
```

| URL | Apps |
| --- | --- |
| http://localhost:5173 | Absensi WFH (karyawan) |
| http://localhost:5174 | Monitoring Karyawan (admin HRD) |
| http://localhost:3005/api | REST API gateway |
| http://localhost:3005/uploads/* | Foto bukti absensi |

Port & konfigurasi lain ada di `server/.env` (port 3000 dipakai proses lain di mesin ini, gateway pakai 3005).

### Akun seed

| Role | Email | Password |
| --- | --- | --- |
| Admin HRD | `admin@dexa.com` | `admin123` |
| Karyawan | `budi@dexa.com` | `employee123` |
| Karyawan | `rani@dexa.com` | `employee123` |

---

## API (via gateway)

| Method | Endpoint | Auth | Deskripsi |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | — | Login, return JWT + profil |
| GET | `/api/auth/me` | JWT | Profil dari token |
| GET | `/api/employees?search=` | Admin | Daftar karyawan (+cari) |
| POST | `/api/employees` | Admin | Tambah karyawan |
| PATCH | `/api/employees/:id` | Admin | Update karyawan |
| POST | `/api/attendance/check-in` | JWT (multipart `photo`, `note`) | Absen masuk + foto bukti (Wajib) |
| POST | `/api/attendance/check-out` | JWT (multipart `photo` opsional) | Absen keluar |
| GET | `/api/attendance/me/today` | JWT | Keadaan hari ini |
| GET | `/api/attendance?from=&to=&employeeId=` | Admin / karyawan (milik sendiri) | Monitoring absensi (read-only utk admin) |

Validasi foto: hanya JPG/PNG, maks 5 MB.

NIP karyawan maupun admin dibuat otomatis oleh sistem saat data dibuat (format `EMP001`, `EMP002`, dst.), jadi tidak perlu diisi manual.

## Verifikasi singkat (cURL)

```bash
TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"budi@dexa.com","password":"employee123"}' | jq -r .accessToken)

# Absen masuk + foto
curl -X POST http://localhost:3005/api/attendance/check-in \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@selfie.jpg;type=image/jpeg" -F "note=WFH hari ini"
```

## Struktur

```
server/
├── apps/
│   ├── gateway/            HTTP API (port 3005): konsolidasi ke 3 microservice via TCP
│   ├── auth-service/       :4001 login + JWT
│   ├── employee-service/   :4002 CRUD master data karyawan
│   └── attendance-service/ :4003 absen masuk/keluar + foto + monitoring
├── libs/common/            entitas TypeORM, DTO, message-pattern, helper konfigurasi DB
└── uploads/                penyimpanan foto bukti absensi
client/
├── web-employee/           login, absen (kamera/file + catatan), riwayat
└── web-admin/              login, CRUD data karyawan, monitoring absensi (read-only)
```
