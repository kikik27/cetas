# **Celo Tactics: Dokumen Desain Game Fully On-Chain Berkecepatan Tinggi pada Celo L2**

## **1\. Landasan Teknis Celo L2 & Ekosistem MiniPay**

Migrasi teknis jaringan Celo menjadi Ethereum Layer-2 (L2) menggunakan kerangka kerja OP Stack dan EigenDA sebagai lapisan ketersediaan data (*data availability*) berhasil memangkas biaya keamanan jaringan hingga 99,8%. Dampak langsung bagi pengguna akhir adalah terpeliharanya biaya gas yang sangat rendah (rata-rata USD 0,0009) serta waktu finalitas blok yang sangat cepat (\~1 detik). Hal ini menjadikan Celo L2 sebagai infrastruktur yang sangat ideal untuk mendukung aplikasi *Fully On-Chain* dengan lalu lintas transaksi mikro yang sangat padat.  
Pintu gerbang distribusi utama game ini adalah **MiniPay**, dompet stablecoin non-kustodial milik Opera yang telah melampaui 15 juta alamat aktif di seluruh pasar berkembang dunia. MiniPay menyederhanakan akses Web3 melalui fitur-fitur berikut:

* **Fee Abstraction Tingkat Protokol:** Pengguna dapat membayar biaya transaksi langsung menggunakan stablecoin seperti USDm, USDT, atau USDC tanpa perlu menyimpan saldo gas token CELO.  
* **Identitas Sosial Kontak Telepon:** Memanfaatkan protokol SocialConnect untuk memetakan nomor telepon kontak menjadi hash identitas on-chain terlindungi secara kriptografis, memungkinkan fitur pencarian teman bermain secara instan.

## **2\. Studi Komparatif & Benchmarking Game Transaksi Tinggi**

Untuk merancang loop transaksi yang optimal, kita harus mempelajari metrik dari game-game Web3 berkinerja tinggi yang sukses mengaktifkan sirkulasi ekonomi mereka:

* **Pixels (Ronin Network):** Memiliki lebih dari 725.000 DAU. Namun, karena hampir seluruh gameplay-nya berjalan *off-chain* dan transaksi *on-chain* hanya terjadi saat perdagangan di marketplace, rata-rata tindakan *on-chain* per dompet hanya berkisar di angka 22 kali dalam 30 hari.  
* **World of Dypians (WOD \- opBNB):** Menembus rekor 1 miliar transaksi kumulatif dan memiliki lebih dari 895.000 Daily Active Users (DAU) berkat integrasi misi harian (*daily quests*) on-chain yang intensif.  
* **Alien Worlds (WAX/BNB Chain):** Menghasilkan rata-rata 599 transaksi per dompet setiap bulannya karena aktivitas penambangan (*mining*) on-chain yang terus-menerus.

Berikut adalah tabel perbandingan performa metrik game Web3 untuk memandu target performa game kita:

| Nama Game | Blockchain Utama | Rata-rata Transaksi Bulanan per Dompet | Mekanisme Utama Pemicu Transaksi | Target Retensi D30 |
| :---- | :---- | :---- | :---- | :---- |
| **Alien Worlds** | WAX & BNB Chain | 599 Transaksi | Mining berulang & rotasi NFT | 10–15% |
| **World of Dypians** | opBNB L2 | 120 Transaksi | Kampanye LiveOps & Daily Quests | 15–25% |
| **Pixels** | Ronin Network | 22 Transaksi | Task board & C2C trading | 20–30% |
| **Celo Tactics (Target)** | Celo L2 | 1.500 Transaksi | Fully On-Chain Shop, Merging & Combat | 15–25% |

## **3\. Desain Core Loop Game "Celo Tactics"**

"Celo Tactics" adalah game strategi *Roguelike Auto-Battler* 2D (seperti kombinasi *Teamfight Tactics* dan *Balatro*). Pemain menyusun formasi karakter (minion) di grid catur, membelanjakan koin untuk melakukan *reroll*, menggabungkan unit untuk meningkatkan bintang, dan bertempur melawan minion lawan dalam sesi pertandingan singkat (3–5 menit).

### **A. Loop Gameplay & Arsitektur On-Chain (FOCG)**

Setiap sesi permainan terdiri dari 5 Ronde. Setiap ronde memiliki 2 Fase:

#### **1\. Fase Persiapan (Preparation Phase)**

Pada fase ini, semua tindakan mekanis pemain dikirimkan sebagai transaksi *on-chain* instan di latar belakang:

* **Membeli Unit (Buy):** Pemain membelanjakan koin untuk membeli minion dari toko \-\> Transaksi *on-chain* (Minting NFT ERC-1155).  
* **Menyegarkan Toko (Reroll):** Pemain membayar 2 koin untuk merestrukturisasi pilihan toko \-\> Transaksi *on-chain* (memicu fungsi VRF lokal untuk mengacak unit).  
* **Menggabungkan Unit (Merge):** Ketika pemain memiliki 3 unit minion yang sama di bangku cadangan, sistem otomatis menggabungkannya menjadi unit Bintang 2 (Tier 2). Tindakan ini mengeksekusi *on-chain contract* yang membakar (*burn*) 3 unit lama dan mencetak (*mint*) 1 unit baru yang lebih kuat.  
* **Menempatkan Unit (Placement):** Memindahkan minion dari cadangan ke papan grid koordinat X,Y \-\> Transaksi *on-chain* (Mengubah state variabel posisi pada smart contract).

#### **2\. Fase Pertempuran (Combat Phase)**

Setelah tombol "Battle" ditekan atau waktu habis, pertempuran akan berjalan otomatis di layar.

* Hasil akhir pertempuran (menang/kalah, sisa darah, damage) dihitung sepenuhnya di dalam smart contract game berdasarkan status minion yang ditempatkan. Pertempuran diselesaikan dengan satu transaksi akhir ronde yang memperbarui status kesehatan (*health points*) pemain secara *on-chain*.

### **B. Proyeksi Densitas Transaksi per Sesi Pertandingan**

Mari kita hitung secara matematis jumlah transaksi riil yang dihasilkan oleh satu pemain dalam satu sesi pertandingan (5 ronde):  
Asumsi aktivitas rata-rata pemain per pertandingan (5 ronde):

* **Beli Unit (f\_{\\text{beli}}):** Membeli rata-rata 12 unit minion \= **12 transaksi**.  
* **Reroll Toko (f\_{\\text{reroll}}):** Melakukan reroll rata-rata 15 kali \= **15 transaksi**.  
* **Menggabungkan Unit (f\_{\\text{merge}}):** Menggabungkan unit sebanyak 4 kali \= **4 transaksi**.  
* **Menempatkan Unit (f\_{\\text{pos}}):** Mengubah posisi unit di grid sebanyak 10 kali \= **10 transaksi**.  
* **Penyelesaian Ronde (f\_{\\text{round\\\_settle}}):** Menyelesaikan ronde sebanyak 5 kali \= **5 transaksi**.

Maka, satu sesi pertandingan berdurasi 3–5 menit dari **satu pemain** akan menghasilkan:  
Jika game ini berhasil menjaring target moderat **10.000 Daily Active Users (DAU)** melalui MiniPay , dan rata-rata setiap user memainkan 3 sesi pertandingan per hari, total volume transaksi harian yang dihasilkan adalah:  
Volume 1,38 juta transaksi harian ini akan menempatkan Celo sebagai L2 berkinerja tertinggi di industri, dan infrastruktur Celo L2 (kapasitas 1.400 TPS) dapat memprosesnya dengan sangat mudah tanpa lonjakan biaya gas bagi pemain.

## **4\. Psikologi Loss Aversion: Taruhan Loot Dungeon & Match Stakes**

Untuk meningkatkan retensi Hari ke-30 (D30) yang menjadi kunci keberlanjutan ekonomi game , Celo Tactics mengintegrasikan konsep psikologi **Loss Aversion** (keengganan kehilangan) ke dalam sistem pertandingan:  
            
                             `|`  
                             `v`  
                 
                             `|`  
              `+--------------+--------------+`  
              `|                             |`  
      `(Peringkat 1-4)                (Peringkat 5-8)`  
              `|                             |`  
              `v                             v`  
      `[ Menangkan Hadiah ]`           
      `(Ambil cUSD dari Pool)        (Modal Hangus Sepenuhnya)`

* **Mekanisme Match Stakes (Kehilangan Tiket):** Untuk masuk ke dalam arena turnamen, setiap pemain harus menyetor tiket masuk (*entry fee*) sebesar 0,1 cUSD ke dalam pool kontrak pintar. Hanya pemain yang menempati peringkat 4 besar di akhir pertandingan yang berhak membawa pulang total kumpulan cUSD dari pool hadiah. Pemain di peringkat bawah akan **kehilangan modal taruhan mereka secara instan**. Rasa takut kehilangan modal riil ini memicu ketegangan psikologis yang sangat intens dan membuat setiap sesi reroll serta keputusan taktis terasa berharga.  
* **Loss Aversion pada Kemajuan Streak Harian:** Mengadopsi siklus retensi mingguan humanis. Pemain mengumpulkan poin harian untuk menjaga "Daily Streak Checklist" mereka tetap aktif. Jika mereka absen bermain sehari saja, streak mingguan mereka akan terputus dan mereka akan kehilangan potensi klaim airdrop token tata kelola. Game menyediakan fitur *Streak Shield* (dapat dibeli menggunakan reward dalam game) sebagai proteksi kecemasan sebelum pengguna absen bermain.

## **5\. Arsitektur UX Bebas Hambatan (Account Abstraction & Session Keys)**

Menghasilkan 46 transaksi dalam satu sesi bermain akan menjadi mimpi buruk bagi kenyamanan bermain jika pemain harus menyetujui popup persetujuan dompet Metamask di setiap detiknya. Oleh karena itu, Celo Tactics wajib mengintegrasikan **Biconomy Nexus SDK** untuk membangun infrastruktur **Account Abstraction (ERC-4337 & ERC-7579)** secara penuh.  
`sequenceDiagram`  
    `autonumber`  
    `Gamer->>Game Frontend: Tekan "Mulai Pertandingan" & Google Login`  
    `Game Frontend->>Biconomy Nexus: Buat Smart Account (ERC-4337)`  
    `Biconomy Nexus->>EntryPoint Contract: Otorisasi Session Key (ERC-7715)`  
    `Note over Game Frontend, EntryPoint Contract: Pemain hanya menyetujui tanda tangan sekali di awal sesi`  
    `loop Sesi Bermain (Reroll / Buy / Move)`  
        `Game Frontend->>Biconomy Nexus: Kirim UserOperation (Gasless)`  
        `Biconomy Nexus->>Biconomy Paymaster: Sponsori Biaya Gas (cUSD)`  
        `Biconomy Paymaster->>EntryPoint Contract: Eksekusi State Baru`  
    `end`

### **Langkah Kerja Teknis Sistem Bebas Popup (AA Pipeline):**

1. **Otorisasi Tersegmentasi (Smart Sessions ERC-7715):** Di awal permainan, dApp memanggil fungsi wallet\_grantPermissions. Pemain menyetujui pembukaan kunci sesi (*Session Keys*) sementara yang disimpan di memori runtime browser mereka. Kunci ini memiliki izin terbatas :  
   * Hanya boleh memanggil fungsi kontrak game: buyUnit(), rerollShop(), mergeUnit(), dan moveUnit().  
   * Tidak memiliki izin untuk mentransfer aset cUSD atau NFT utama ke dompet lain (mencegah pencurian aset apabila perangkat diretas).  
   * Memiliki durasi kadaluwarsa otomatis dalam 2 jam.  
2. **Sponsor Gas Penuh (Biconomy Paymaster):** Melalui *Sponsorship Paymaster*, pengembang menanggung seluruh biaya transaksi gas pemain (yang hanya USD 0,0009 per transaksi di Celo L2). Pengembang dapat menutupi biaya subsidi gas ini dari potongan pajak tiket masuk pertandingan sebesar 5% (revenue developer).

## **6\. Optimalisasi WebGL: Perbandingan Phaser 3 vs Cocos Creator**

Membangun game mobile browser yang berjalan mulus di dalam dompet standalone MiniPay membutuhkan optimalisasi ukuran file build yang sangat ketat.

### **Analisis Komparatif Engine WebGL untuk Mobile Browser:**

| Parameter Evaluasi | Phaser 3 Framework | Cocos Creator Engine |
| :---- | :---- | :---- |
| **Ukuran Build Kosong** | \~500 KB (Sangat ringan, waktu muat \<2 detik) | \~2–4 MB (Cukup berat untuk koneksi 2G/3G) |
| **Fisika & Komputasi** | Arcade Physics terintegrasi, sangat cepat | Box2D dioptimalkan dengan WebAssembly (5\\times lebih cepat) |
| **Pola Pengembangan** | Berbasis kode murni, memberikan kontrol logika yang presisi | Alur kerja terintegrasi dengan editor visual drag-and-drop |
| **Rekomendasi Proyek** | Sangat direkomendasikan untuk target peluncuran cepat \<1 bulan | Cocok untuk visual 3D yang kompleks, butuh waktu build lebih lama |

### **Strategi Optimasi Ukuran Bundel (Tree-Shaking & Lazy Loading):**

Untuk memastikan game dapat dimuat dalam waktu di bawah 3 detik, tim pengembang harus mengonfigurasi bundler (seperti Vite atau Webpack) untuk menghapus seluruh modul Phaser yang tidak digunakan (Tree-Shaking) :

1. Gunakan *ESM Named Imports* saat mengimpor komponen Phaser :  
   `import { Game, Scene, GameObjects } from 'phaser';`

2. Setel "sideEffects": false di dalam file package.json agar bundler dapat membuang kode mati (*dead code*) secara aman.  
3. Gunakan *Iframe Bridge Sandbox* untuk memisahkan rendering game Phaser dari modul Web3 Next.js, menjaga agar runtime Web3 tidak membebani kinerja visual game.

## **7\. Rencana Aksi Pengembangan Celo Tactics (\< 1 Sesi Bulan)**

Rencana kerja taktis untuk tim kecil (1-2 developer) dalam mengeksekusi proyek ini dalam waktu kurang dari satu bulan:  
 `-> [Minggu 2: Logic Game Phaser] -> [Minggu 3: Integrasi AA] ->`

* **Minggu 1: Inisiasi Celo Composer & Smart Contract** Inisiasi proyek menggunakan CLI Celo: npx @celo/celo-composer@latest create \-t minipay. Tulis smart contract minion (ERC-1155) dan logika turnamen di Hardhat. Deploy ke Celo Sepolia Testnet.  
* *Minggu 2: Pemrograman Mekanik di Phaser 3* Bangun gameplay loop auto-battler secara lokal di Phaser: sistem grid isometric 8x8, penempatan unit, reroll shop, dan kalkulasi pertempuran dinamis.  
* **Minggu 3: Integrasi Biconomy SDK & Smart Sessions** Hubungkan game Phaser ke Next.js menggunakan *window.parent.postMessage*. Konfigurasikan Biconomy Smart Sessions agar mengizinkan pengiriman UserOperation secara gasless di latar belakang ketika pemain melakukan reroll atau membeli unit.  
* **Minggu 4: Tunneling ngrok, Pengujian, dan Submit** Aktifkan "Developer Mode" di MiniPay. Gunakan **ngrok** (ngrok http 3000\) untuk memetakan server lokal Next.js ke HTTPS aman yang bisa dibuka langsung di MiniPay. Submit game Anda ke discover page MiniPay menggunakan formulir pengajuan resmi.

#### **Karya yang dikutip**

1\. What Is Celo? The Mobile-First Ethereum L2 Explained | Support \- Eco, https://eco.com/support/en/articles/11011400-what-is-celo-the-mobile-first-ethereum-l2-explained 2\. Celo's Ethereum L2 Transformation: How A Mobile-First Blockchain ..., https://blog.mexc.com/news/celo-ethereum-l2-transformation-and-how-a-mobile-first-blockchain-quietly-built-real-adoption/ 3\. Celo: Ethereum Layer 2 for Payments, Stablecoins & DeFi, https://celo.org/ 4\. MiniPay Contributes up to $1 Million CELO to Back Mini App Builders & Launches Roadshow \- Opera, https://press.opera.com/2026/04/22/minipay-builders-incentive-and-roadshow/ 5\. Kiln powers stablecoin earn product for MiniPay users on Celo, targeting 1.3B unbanked globally, https://www.kiln.fi/post/kiln-powers-stablecoin-earn-product-for-minipay-users-on-celo-targeting-1-3b-unbanked-globally 6\. SocialConnect Integration Kit (SCIK): Plug-and-Play Phone Number & Social ID Onboarding for Celo dApps \- Governance Proposals, https://forum.celo.org/t/socialconnect-integration-kit-scik-plug-and-play-phone-number-social-id-onboarding-for-celo-dapps/12108 7\. Top Web3 Games in the GameFi Sector to Watch in 2026 \- BingX, https://bingx.com/en/learn/article/what-are-the-top-web3-games-in-gamefi-sector 8\. Build on MiniPay \- Celo Docs, https://docs.celo.org/build-on-celo/build-on-minipay/overview 9\. Retention by Game Genre: Why It Varies and How to Optimize It ..., https://blog.playio.co/retention-by-game-genre 10\. Recovery-First Streak Design | Yu-kai Chou, https://yukaichou.com/gamification-analysis/recovery-first-streak-design/ 11\. ERC-7715 Explained: Wallet Permissions, Sessions, and Subscriptions | Support \- Eco, https://eco.com/support/en/articles/11953354-erc-7715-explained-wallet-permissions-sessions-and-subscriptions 12\. Smart Account Session Snap: Gaming Dapp Auto Approvals \- MetaMask, https://metamask.io/news/smart-account-session-snap-gaming-dapp-auto-approvals 13\. Account Abstraction Wallet: Complete Guide to Smart Contract Accounts | Cobo, https://www.cobo.com/post/account-abstraction-wallet 14\. Optimizing Frontend Bundles with Tree-Shaking Techniques \- NamasteDev Blogs, https://namastedev.com/blog/optimizing-frontend-bundles-with-tree-shaking-techniques/ 15\. Understanding Vite Bundle Visualizer: A Frontend Engineer's Guide | Edstem Technologies, https://www.edstem.com/blog/vite-bundle-visualizer 16\. Reduce the bundle size of a game using Vite and Typescript \- Phaser 3, https://phaser.discourse.group/t/reduce-the-bundle-size-of-a-game-using-vite-and-typescript/14046 17\. Get Started Building on MiniPay \- Celo Docs, https://docs.celo.org/build-on-celo/build-on-minipay/quickstart 18\. celo-org/minipay-template \- GitHub, https://github.com/celo-org/minipay-template