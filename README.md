# Solutech Backend Test

REST API untuk technical test backend developer Solutech. Isinya login pakai JWT, CRUD product, dan pembuatan order yang mengurangi stok dalam satu transaction.

## Stack

Next.js 16 (App Router, route handlers) + TypeScript, Prisma 7, PostgreSQL. Validasi input pakai Zod, auth pakai jsonwebtoken + bcryptjs.

## Struktur

Pakai 3 layer: route handler -> service -> repository.

```
app/api/        route handler, urusan HTTP saja
services/       business logic
repositories/   query prisma
validators/     schema zod per endpoint
lib/            prisma client, jwt, auth middleware, error class
prisma/         schema + seed
sql/            create_tables.sql
postman/        postman collection
```

Route handler tidak pegang business logic sama sekali, tugasnya cuma parse request, panggil service, balikin response. Business logic ada di service, akses database lewat repository.

## Setup

Butuh Node 18+ dan PostgreSQL yang sudah jalan.

```bash
npm install
```

Copy `.env.example` jadi `.env` lalu sesuaikan:

- `DATABASE_URL` = connection string postgres, contoh `postgresql://USER:PASSWORD@localhost:5432/solutech_ecommerce?schema=public`
- `JWT_SECRET` = string random, bebas isinya
- `JWT_EXPIRES_IN` = umur token, misal `1d`

Buat database kosong dulu, jalankan script create table, generate prisma client, seed, lalu jalankan appnya:

```bash
psql "$DATABASE_URL" -f sql/create_tables.sql
npx prisma generate
npx prisma db seed
npm run dev
```

Seed bikin 1 user (`admin@solutech.test` / `password123`) dan 5 product. App jalan di `http://localhost:3000`.

## Endpoint

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/auth/login` | - | login, balikin JWT |
| GET | `/api/products` | ya | list product, support `?page=&pageSize=&search=` |
| POST | `/api/products` | ya | buat product |
| GET | `/api/products/:id` | ya | detail product |
| PATCH | `/api/products/:id` | ya | update product |
| DELETE | `/api/products/:id` | ya | soft delete |
| POST | `/api/orders` | ya | buat order, body `{ items: [{ productId, quantity }] }` |
| GET | `/api/orders` | ya | list order milik user yang login |

Endpoint product dan order semuanya butuh header `Authorization: Bearer <token>`.

Paling gampang ngetesnya lewat Postman, import file di folder `postman/`. Habis request Login, tokennya otomatis kesimpan ke collection variable jadi tidak perlu copy paste manual ke request lain.

## Business logic order

Pembuatan order semuanya jalan di dalam satu `prisma.$transaction`, jadi kalau gagal di tengah (misal stok kurang) tidak ada data yang setengah masuk.

Urutannya: quantity untuk productId yang sama digabung dulu (kalau tidak digabung, item duplikat bisa lolos cek stok masing-masing padahal totalnya lebih dari stok). Lalu ambil productnya, harus ada dan belum di-soft-delete, cek stok, hitung total. Kalau stok kurang balikin 409.

Harga yang dipakai adalah harga product saat order dibuat, disimpan sebagai `price_at_purchase` di order item. Jadi kalau nanti harga productnya diganti, riwayat order lama tidak ikut berubah.

Untuk pengurangan stoknya saya tidak pakai update biasa, tapi `updateMany` dengan kondisi `stock >= quantity`. Kalau ternyata kena 0 row berarti ada order lain yang keburu masuk duluan, order ditolak 409. Dengan cara ini stok tidak bisa minus walaupun ada dua request bersamaan. Di tabel products juga ada `CHECK (stock >= 0)` buat jaga-jaga.

Soft delete product pakai kolom `is_deleted`. Semua query read (list, detail, dan pengambilan product waktu buat order) memfilter kolom ini, jadi product yang dihapus tidak muncul lagi tapi riwayat ordernya tetap ada.

Error handling pakai custom error class (`ValidationError` 400, `UnauthorizedError` 401, `NotFoundError` 404, `ConflictError` 409). Service tinggal throw, nanti diubah jadi response JSON yang konsisten di `lib/api-response.ts`. Error dari Zod juga ditangkap di situ dan jadi 400, sisanya 500.

## Keputusan teknis & asumsi

- Saya pakai bearer token, bukan httpOnly cookie, biar gampang dites lewat Postman. Spec membolehkan dua-duanya.
- Tidak buat endpoint register karena spec bilang cukup pakai user hasil seed.
- Harga disimpan `DECIMAL(12,2)` biar tidak kena masalah pembulatan float. Waktu hitung total saya convert ke `number`, untuk skala test ini cukup, kalau di production lebih aman pakai decimal library atau hitung di database.
- ID pakai UUID.
- Prisma 7 pakai generator `prisma-client` yang baru (output ke folder `generated/`), bukan import dari `@prisma/client` seperti dulu. Ini memang default rekomendasi Prisma sekarang untuk project baru.

## Fitur

Yang selesai:

- Login JWT, semua endpoint product & order diproteksi
- CRUD product + pagination + search by name + soft delete
- Order dengan pengurangan stok dan total dalam satu transaction
- List order hanya milik user yang login
- Validasi Zod di semua endpoint, error handling konsisten, layered architecture
- SQL create table, seed prisma, `.env.example`, postman collection

Yang belum dikerjakan (bagian opsional):

- Redis cache untuk list product
- Rate limiting / request logging
- Unit / integration test
- Frontend admin

## Estimasi waktu

Sekitar 4-5 jam, dikerjakan beberapa sesi. Yang paling makan waktu bagian transaction order (termasuk benerin bug stok waktu item duplikat) dan testing lewat Postman.
