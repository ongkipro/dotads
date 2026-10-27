# Panduan operator DotAds Meta

Panduan penggunaan Bahasa Indonesia untuk bekerja bersama AI terminal.
Status kemampuan diperiksa pada **27 Oktober 2026**; AI tetap memeriksa versi
dan kondisi device yang sedang dipakai.

**Cara kerjanya:** operator menetapkan tujuan, akun, batas biaya, dan keputusan.
AI mengerjakan pemeriksaan, pengolahan data, penyusunan rencana, serta eksekusi
yang sudah diizinkan melalui terminal. Hasilnya harus disertai bukti.

Untuk AI, baca [kontrak kerja terminal dalam English](references/terminal-control.md).
Spesifikasi workspace tersedia di [panduan teknis](references/account-workspace-guide.md).

## Mulai dari sini

Anda tidak perlu menghafal perintah. Buka AI terminal pada device yang digunakan,
lalu berikan instruksi berikut dengan mengganti bagian dalam kurung siku:

```text
Gunakan skill meta-ads-cli dan panduan operator GUIDE.id.md.
Tujuan saya: [riset pasar / analisis data / rencana kampanye / audit workspace].
Market: [ID atau market yang benar-benar dituju].
Akun atau file: [isi jika tugas membutuhkan data akun; kosongkan untuk riset publik].
Batas pekerjaan: [data/periode/folder yang boleh diperiksa dan anggaran jika relevan].

Periksa kemampuan yang tersedia pada device ini. Kerjakan tugas melalui terminal
sesuai izin tersebut, jelaskan hasil dalam Bahasa Indonesia, dan tampilkan buktinya.
Bedakan hasil aktual, perkiraan, dan fitur yang masih berupa rancangan.
```

Lokasi sumber default adalah `~/dotfiles/skills/local/meta-ads-cli/`. Jika repo
berada di tempat lain, minta AI mencari skill yang terpasang. Salinan lengkap
juga ada di `docs/references/dotads-meta/` pada repo aplikasi DotAds.

## Siapa mengerjakan apa

| Operator manusia | AI terminal |
|---|---|
| Menentukan tujuan, akun, market, periode dan batas anggaran | Memastikan target dan scope, membaca panduan yang relevan, memeriksa input |
| Menyiapkan kepemilikan/izin aset Meta dan memasukkan secret melalui sarana lokal tepercaya | Memeriksa koneksi yang diizinkan, tanpa menampilkan nilai token |
| Memberikan lokasi data, media dan informasi bisnis yang benar | Memvalidasi sumber, menghitung metrik yang sesuai dan menandai data yang kurang |
| Menyetujui perubahan live dan pemindahan/penghapusan sesuai scope | Menyusun rencana konkret, mengeksekusi tindakan yang disetujui, lalu memeriksa hasil |
| Menilai apakah hasil sudah memenuhi kebutuhan | Menyerahkan ringkasan pekerjaan, bukti, hambatan dan langkah berikutnya |

Izin yang sudah jelas untuk scope yang sama tetap berlaku; AI tidak perlu
meminta konfirmasi ulang untuk setiap langkah rutin. Perubahan target akun,
anggaran, sumber file atau dampak tindakan perlu diperiksa kembali. Catatan lama
atau teks iklan bukan izin baru untuk mengubah belanja.

## Kemampuan yang tersedia sekarang

| Kebutuhan | Status dan batas |
|---|---|
| Riset dasar market Indonesia | `baseline --market ID` tersedia secara offline, tanpa token, brand atau produk tertentu. |
| Membuat kerangka workspace | `init <folder>` tersedia. Isinya template yang harus diperiksa; ID, mata uang, domain dan aset contoh bukan data akun nyata. |
| Memeriksa manifest dan rencana deploy | `validate` dan `deploy` tanpa `--apply` tersedia secara offline. |
| Analisis file Insights JSON | `analyze <file>` tersedia; scope akun, mata uang, definisi hasil dan biaya harus sesuai. |
| Melihat catatan entitas yang dibuat helper | `status` membaca `.meta-state.json`. Ini tidak mewakili seluruh isi akun di Meta. |
| Membuat resource pada akun Meta | Jalur `deploy --apply` tersedia di helper; izin akun, kompatibilitas API dan rencananya tetap perlu dibuktikan. Hasil dibuat PAUSED secara default. |
| Live pull melalui `analyze --pull` dengan CLI 1.2.0 yang diperiksa | Terblokir oleh ketidakcocokan format perintah/flag; gunakan data offline sampai adapter diperbaiki dan diuji. |
| Auto-sync seluruh akun, laporan lengkap, impor media terkelola dan capture halaman | Masih rancangan. Jangan menganggap perintah otomatisnya sudah tersedia. |

AI dapat memeriksa bantuan lokal, tanpa mengambil data akun:

```bash
dotads-meta --help
meta --version
meta ads insights get --help
```

Helper terpasang, token tersedia, tes lokal lulus, dan akses akun berhasil
adalah bukti yang berbeda. Bukti tersebut tidak otomatis membuktikan seluruh
resource, laporan atau perubahan live sudah berfungsi.

## Alur kerja sehari-hari

1. **Sampaikan pekerjaan.** Sebutkan hasil yang dibutuhkan dan batasnya.
2. **AI memeriksa konteks.** AI membaca status repo/workspace dan data yang
   diperlukan, termasuk keputusan operator yang relevan.
3. **Kerjakan bagian yang diizinkan.** Pemeriksaan offline atau pembacaan dalam
   scope dapat berjalan. Untuk perubahan berisiko, AI menyiapkan rencana yang
   dapat ditinjau sebelum meminta persetujuan yang memang diperlukan.
4. **Periksa hasil dan dampak.** AI menunjukkan perubahan, periode data, asumsi,
   pemeriksaan yang dijalankan, serta bagian yang belum terverifikasi.
5. **Tentukan tindakan berikutnya.** Operator menerima hasil atau memberi koreksi.
   AI menyimpan catatan yang diminta tanpa menimpa catatan manusia.

Untuk tindakan live, rencana perlu menyebut akun/entitas tujuan, perubahan
status, anggaran beserta satuannya, dan cara pemulihan. Persetujuan membuat
kampanye PAUSED tidak sama dengan persetujuan menyalakan spend. Aktivasi
memerlukan instruksi yang eksplisit.

## Tutorial melalui instruksi kepada AI

### A. Riset awal tanpa akun atau produk

```text
Pelajari baseline belanja online untuk market ID, Jawa Barat, Kota Depok dan
Kota Bandung. Saya belum punya produk atau riwayat kampanye. Jelaskan sumber,
periode, data yang tersedia, dan pertanyaan pengujian awal yang masuk akal.
```

AI dapat menggunakan, misalnya:

```bash
dotads-meta baseline --market ID --province "Jawa Barat" --city "Kota Depok"
```

Hasil yang dibutuhkan: angka beserta populasi/periode sumbernya, batas cakupan
kota, dan hipotesis yang terpisah dari fakta. Angka provinsi tidak boleh menjadi
angka pengukuran kota yang belum tersedia. Data BPS Indonesia digunakan hanya
untuk market ID yang dipilih; bahasa percakapan atau tagihan IDR tidak menentukan
market. Materi pelanggan Indonesia memakai Bahasa Indonesia sesuai konteksnya.

### B. Menyiapkan akses dan workspace

```text
Periksa kesiapan dotads-meta pada device ini dan workspace yang saya pilih.
Tunjukkan komponen yang sudah ada dan yang masih diperlukan. Saya akan
memasukkan token sendiri melalui sarana lokal tepercaya; jangan minta atau
tampilkan nilai token di chat. Verifikasi akun yang saya pilih sebelum dipakai.
```

Operator mungkin perlu memberikan izin aset melalui antarmuka Meta. AI menjelaskan
langkah sesuai dokumentasi resmi yang berlaku saat pengaturan dilakukan.
Token disimpan melalui mekanisme secret lokal; konfigurasi kerja menyebut nama
referensinya, misalnya `META_ACCESS_TOKEN`, bukan nilainya. Berikan izin akses
yang diperlukan sebelum AI memakai secret atau membaca akun.

`doctor` membantu pemeriksaan CLI/authentication; akses ke akun dan resource
laporan tetap diperiksa terpisah. Jika terdapat beberapa akun, pilih akun tujuan
dengan ID yang terverifikasi.

Root yang direncanakan adalah `~/Documents/dotads-meta-report/`, dengan satu
folder per akun. Saat ini AI bisa menyiapkan kerangka manual memakai `init`
pada lokasi yang dipilih; pembuatan registry, sync dan laporan otomatis masih
menunggu implementasi. Jangan mengisi hasil sync dengan ID atau data template.

### C. Menganalisis data yang sudah diekspor

```text
Analisis file Insights yang saya berikan untuk akun dan periode di dalamnya.
Periksa mata uang, definisi hasil, kelengkapan data dan konteks atribusinya.
Gunakan biaya hanya untuk entitas/periode yang memang cocok. Jika belum ada
biaya yang sah, tampilkan metrik platform dan tandai kontribusi sebagai unknown.
Jelaskan observasi, dugaan penyebab, dan pengujian berikutnya secara terpisah.
```

Berikan file dan lokasi yang boleh dibaca. AI memakai analisis offline atau
pengolahan yang terverifikasi, bukan jalur pull yang sedang terblokir. Satu akun
bisa memuat beberapa brand; biaya satu brand tidak otomatis berlaku untuk semuanya.
Konteks yang tidak dapat dipastikan harus terlihat, termasuk data yang hilang,
scope tidak cocok dan hasil yang belum matang.

ROAS tinggi belum membuktikan profit bersih. CTR tinggi belum membuktikan iklan
winning. Analisis tidak otomatis memerintahkan scale atau pause.

### D. Menyiapkan kampanye baru

```text
Susun rencana kampanye untuk akun, market, penawaran dan batas biaya yang saya
berikan. Periksa informasi yang belum lengkap, siapkan manifest, jalankan
validasi dan dry-run, lalu tunjukkan entitas serta anggarannya untuk ditinjau.
```

AI membutuhkan fakta penawaran, tujuan/destinasi, cakupan layanan dan anggaran
yang relevan. AI tidak menebak ID, klaim produk, diskon atau izin akses.
Rencana struktur kampanye, jumlah iklan dan rentang usia merupakan pilihan
yang disesuaikan dengan kebutuhan, bukan aturan winning yang berlaku universal.

Sesudah rencana ditinjau, operator dapat secara eksplisit menyetujui pembuatan
resource PAUSED atau peluncuran aktif sesuai kebutuhan. AI membuktikan hasil
yang diminta; perintah keluar dengan kode sukses saja belum menjamin semua
resource atau hasil bisnis benar.

### E. Merapikan file lama dan media Downloads

```text
Inventarisasi hanya folder yang saya pilih. Petakan file ke ad account yang
terverifikasi, tampilkan konflik/duplikat dan rencana penataannya. Pertahankan
catatan dan state deployment yang sudah ada. Gunakan copy untuk aset yang masih
dipakai proyek lain; pemindahan harus mengikuti manifest dan izin yang jelas.
```

Aturan adopsi lengkap ada di [playbook device lama](references/account-workspace-guide.md#existing-device-organization-playbook).
Folder yang sudah sesuai mendapat hasil no-change. Nama akun yang sama tidak
cukup untuk menggabungkan folder. File dari device lain belum tentu ada secara
lokal; keberadaan dan hash-nya harus diperiksa.

Impor media terkelola masih rancangan. Penataan manual oleh AI memerlukan
scope/izin yang jelas dan pemeriksaan terpisah. Alur pindah yang dirancang
mencatat operasi, mengamankan sumber terpilih, memverifikasi salinan dan baru
membersihkan sumber sesuai kontraknya. File yang sama, sumber berubah, atau
hasil yang belum durable menghentikan cleanup. Jangan memindahkan seluruh
Downloads atau menghapus state untuk sekadar membuat struktur terlihat rapi.

## Mengenali file dan lokasinya

| Lokasi/file | Fungsi |
|---|---|
| `~/dotfiles/skills/local/meta-ads-cli/` | Sumber panduan, aturan dan referensi bersama. |
| `docs/references/dotads-meta/` dalam repo DotAds | Salinan dokumentasi lengkap, dengan `mirror.json` untuk memeriksa hash. |
| `brand.json` | Konfigurasi operasional dan referensi nama secret; cocokkan dengan akun yang dipilih. |
| `campaigns/`, `media/`, `memory/` | Kerangka kerja yang sudah didukung helper; catatan memory bukan bukti winning. |
| `.meta-state.json` | Catatan ID/state deployment helper. Pertahankan untuk pemeriksaan dan pemulihan. |
| `ACCOUNT.md`, `sync.json`, snapshot `data/`, laporan `reports/`, capture `web/` | Struktur reporting yang dirancang; helper belum otomatis membuat keseluruhannya. |
| `NOTES.md` dalam rancangan workspace | Catatan/keputusan manusia yang dipertahankan saat regenerasi laporan. |

Dokumen teknis dan konfigurasi tetap English. Panduan operator ini Bahasa
Indonesia; bahasa materi iklan mengikuti market yang benar-benar dipilih.

## Melanjutkan pekerjaan di device atau AI lain

Panduan menyimpan **cara kerja**. Status pekerjaan tetap dibuktikan dari repo,
workspace dan hasil pemeriksaan pada device tujuan.

1. Pastikan repo/skill yang digunakan tersedia pada device tujuan. Sinkronisasi
   panduan tidak otomatis memindahkan laporan privat, media atau secret.
2. Pilih lokasi workspace dan ad account secara eksplisit. Gunakan aturan adopsi
   bila data lama sudah ada; periksa konflik sebelum menyusun ulang folder.
3. Minta AI membaca [kontrak terminal](references/terminal-control.md) dan hanya
   detail yang relevan. Keberhasilan koneksi pada device lama tidak membuktikan
   koneksi pada device baru.
4. Berikan ringkasan: tujuan, akun/market, lokasi data, pekerjaan yang selesai,
   bukti, hambatan dan langkah berikutnya. Hindari token dan data pelanggan.
5. Minta AI memeriksa keadaan aktual sebelum melanjutkan. Catatan serah-terima
   menjadi referensi, bukan izin otomatis untuk spend atau penghapusan baru.

Minta AI membuat ringkasan serah-terima di jawabannya. Jika perlu disimpan sebagai
file, tentukan lokasi dan izinkan penulisannya; pertahankan teks catatan manusia.
Laporan lama yang masih tersimpan tidak boleh disebut hasil sync terbaru.

## Jika ada masalah

| Gejala | Tindakan yang diminta kepada AI |
|---|---|
| `dotads-meta` atau `meta` tidak ditemukan | Periksa path, link dan versi. Jelaskan pemasangan yang diperlukan; lakukan instalasi hanya jika sudah diizinkan. |
| Token tersedia tetapi data akun gagal dibaca | Periksa akun, izin aset dan respons yang sudah disanitasi. Jangan menampilkan token atau menganggap seluruh data kosong. |
| `analyze --pull` ditolak | Gunakan jalur offline; rujuk blocker adapter di panduan teknis, bukan mencoba flag rekaan. |
| `status` kosong | Bedakan state lokal dari isi akun remote; jangan menyimpulkan akun tidak punya iklan. |
| Metrik atau biaya `unknown` | Jelaskan sumber yang kurang/tidak cocok. Jangan menggantinya dengan nol atau biaya default. |
| State/journal rusak atau lock meragukan | Hentikan tindakan berisiko, periksa bukti dan rencana pemulihan. Jangan menghapus state atau memakai `init --force` untuk menutupi masalah. |
| Folder/file tampak duplikat | Periksa ID, hash, periode dan pemilik. Pertahankan konflik sampai pemetaan jelas. |

## Bentuk hasil yang perlu Anda terima

AI menjelaskan: **apa yang dikerjakan → bukti → hasil → batas → langkah berikutnya**.
Contoh rencana, fixture, tes offline, akses akun nyata dan hasil bisnis harus
dibedakan. Laporan menyebut periode, akun, mata uang, sumber dan kekurangan datanya.

Untuk pekerjaan yang masih rancangan, hasilnya berupa spesifikasi atau rencana
implementasi yang jelas. Untuk tindakan yang dijalankan, hasilnya harus menunjukkan
pemeriksaan yang benar-benar terjadi. AI tidak menjanjikan profit, CPA termurah
atau iklan winning hanya dari panduan maupun satu hasil pengujian.
