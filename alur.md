usaha ini mirip sales namun dengan sistem konsinyasi, jadi saya memiliki 2 pola:
- Pola 1, yaitu saya memilik produk sendiri dari produksi setela jadi kemudian produk tersebut didata oleh admin, tanggal batch produksi, tanggal produksi, tanggal exp, nama produk, jumlah produk (dan semislanya jika ada yang kurang tolong bantu. Setalah data produk terdata kemudian mendata harga meliputi harga produksi, harga sales dan harga agen. Jadi dari sisi Admin mengetahui data semua produk setelah produksi.
- Pola 2, yaitu saya memiliki rekanan dan produk diproduksi oleh rekanan, jadi setelah mereka produksi produknya diberikan kepada saya dan didata oleh admin.

Dari kedua pola tersebut setelah produk sudah terdata disisi admin maka ada beberapa pola terkait pendistribusiannya:
- Pola 1, dibeli oleh agen dengan sayarat dan ketentuan yang berlaku, yaitu dibeli dengan harga agen (lebih murah dari harga sales) dengan minimal order dan ada jaminan retur diganti dengan produk baru sesuai jumlah retur. Detail retur nanti akan saya jelaskan.
- Pola 2, dibawa oleh sales kemudian dititipkan di toko-toko dengan sistem konsinyasi. Pola sales juga ada 2:
    - Pertama, jika toko sudah pernah terdata sebelumnya oleh sales, maka alurnya, sales tinggal mendata stok sebelumnya yang pernah dititipkan di toko tersebut. Yaitu Produk Terjual, Produk Belum Terjual dan Retur, setelahnya Sales meletakan stok baru di toko tersebut.
    - Kedua, jika toko belum pernah terdata maka didata terlebih dahulu kemudian sales menitipkan produk dengan sistem konsinyasi, dan akan dikunjungi lagi diwaktu yang akan datang. dan setelahnya alurnya mirip yang pertama.

Dari allur yang tadi tidak menutup kemungkinan ada produk retur, pengkondisian retur ada beberapa:
- Jika produk rusak/cacat produksi, maka produk tersebut dikembalikan lagi ke Rekanan/Tempat Produksi Sendiri
- Jika produk rusak/cacat pengiriman maka produk tersebut dikembalikan lagi ke Gdang/kantor admin
- Jika produk exp maka produk tersebut dikembalikan lagi ke gudang/kantor admin
- Jika produk rusak/cacat display (ketika produk sudah berada pada toko-toko dan jika ada hal yan mengakibatkan produk rusakcacat dan tidak layak jua/konsumsi), maka produk tersebut dikembalikan lagi ke gudang/kantor admin

itu gambaran umum alurnya, ada gambaran detail dari sisi sales, yaitu ketika hendak menitipkan produk ke toko-toko:
- Pertama, Sales langsung menitipkan produk
- Kedua, Sales menitipkan produk beserta wadah display, jadi semisal wadah display tersebut untuk memuat produk, 1 wadah bisa berisi beberapa produk dengan beberapa varian. Jadi dari sisi sales bisa memantau yang memakai wadah dsiplay dimana saja dan bisa mengetahui setiap wadah ada produk apa saja dengan varian apa saja.

itu semua adalah alur manual, dan harapannya bisa dibuatkan sistem digital berdasarkan alur tersebut.
jadi setiap akun yang pertama wajib mendaftarkan diri dan akan menjadi owner, kemudian taap berikutnya mendaftarkan usahanya. setelahnya baru bisa mengelola aplikasinya seperti tambah produk, tambah pengguna dan lainnya yang diperlukan seperti pada alur. Jadi setelah login nanti tampilan owner, tampilan admin dan tampilan slaes berbeda sesuai dengan tugas pokok masing-masing.

stack yang saya inginkan:
- Refine
- Hono
- Tailwind
- UI Shadcn
- PWA
- Deploy pada cloudflare
- Database D1 Cloudflare
- Storage R2 Cloudflare