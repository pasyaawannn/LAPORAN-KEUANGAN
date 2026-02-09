let transaksi = JSON.parse(localStorage.getItem("kasData")) || [];

const saldoEl = document.getElementById("saldo");
const pemasukanEl = document.getElementById("pemasukan");
const pengeluaranEl = document.getElementById("pengeluaran");
const listEl = document.getElementById("listTransaksi");

const filterJenis = document.getElementById("filterJenis");
const filterBulan = document.getElementById("filterBulan");

let chartBar;
let chartPie;

/* =======================
   FORMAT RUPIAH
======================= */
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

/* =======================
   RENDER DATA
======================= */
function render() {
  listEl.innerHTML = "";

  let totalMasuk = 0;
  let totalKeluar = 0;

  // Filter transaksi
  let filtered = transaksi.filter(t => {
    let jenisOK =
      filterJenis.value === "all" || t.jenis === filterJenis.value;

    let bulanOK =
      !filterBulan.value || t.tanggal.startsWith(filterBulan.value);

    return jenisOK && bulanOK;
  });

  // Tampilkan tabel
  filtered.forEach((t, index) => {
    if (t.jenis === "masuk") totalMasuk += t.nominal;
    else totalKeluar += t.nominal;

    listEl.innerHTML += `
      <tr>
        <td>${t.tanggal}</td>
        <td>${t.jenis}</td>
        <td>${t.keterangan}</td>
        <td>${formatRupiah(t.nominal)}</td>
        <td>
          <button class="action-btn edit-btn" onclick="editTransaksi(${index})">Edit</button>
          <button class="action-btn hapus-btn" onclick="hapusTransaksi(${index})">Hapus</button>
        </td>
      </tr>
    `;
  });

  // Update dashboard
  saldoEl.textContent = formatRupiah(totalMasuk - totalKeluar);
  pemasukanEl.textContent = formatRupiah(totalMasuk);
  pengeluaranEl.textContent = formatRupiah(totalKeluar);

  // Simpan data
  localStorage.setItem("kasData", JSON.stringify(transaksi));

  // Update grafik
  updateCharts();
}

/* =======================
   CRUD TRANSAKSI
======================= */
function hapusTransaksi(index) {
  transaksi.splice(index, 1);
  render();
}

function editTransaksi(index) {
  let t = transaksi[index];

  document.getElementById("editIndex").value = index;
  document.getElementById("jenis").value = t.jenis;
  document.getElementById("nominal").value = t.nominal;
  document.getElementById("keterangan").value = t.keterangan;
  document.getElementById("tanggal").value = t.tanggal;
}

document.getElementById("formTransaksi").addEventListener("submit", e => {
  e.preventDefault();

  let index = document.getElementById("editIndex").value;

  let data = {
    jenis: document.getElementById("jenis").value,
    nominal: parseInt(document.getElementById("nominal").value),
    keterangan: document.getElementById("keterangan").value,
    tanggal: document.getElementById("tanggal").value
  };

  if (index === "") transaksi.push(data);
  else transaksi[index] = data;

  e.target.reset();
  document.getElementById("editIndex").value = "";

  render();
});

/* =======================
   FILTER EVENT
======================= */
filterJenis.addEventListener("change", render);
filterBulan.addEventListener("change", render);

/* =======================
   EXPORT PDF
======================= */
function exportPDF() {
  window.print();
}

/* =======================
   DARK MODE
======================= */
document.getElementById("darkToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

/* =======================
   GRAFIK BULANAN + PIE
======================= */
function updateCharts() {
  // Hitung pemasukan & pengeluaran total
  let masuk = transaksi
    .filter(t => t.jenis === "masuk")
    .reduce((a, b) => a + b.nominal, 0);

  let keluar = transaksi
    .filter(t => t.jenis === "keluar")
    .reduce((a, b) => a + b.nominal, 0);

  /* ===== PIE CHART ===== */
  const pieCtx = document.getElementById("pieChart").getContext("2d");

  if (chartPie) chartPie.destroy();

  chartPie = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Pemasukan", "Pengeluaran"],
      datasets: [{
        data: [masuk, keluar]
      }]
    }
  });

  /* ===== BAR CHART BULANAN ===== */
  let bulanData = {};

  transaksi.forEach(t => {
    let bulan = t.tanggal.slice(0, 7); // YYYY-MM

    if (!bulanData[bulan]) {
      bulanData[bulan] = { masuk: 0, keluar: 0 };
    }

    bulanData[bulan][t.jenis] += t.nominal;
  });

  let labels = Object.keys(bulanData);
  let dataMasuk = labels.map(b => bulanData[b].masuk);
  let dataKeluar = labels.map(b => bulanData[b].keluar);

  const barCtx = document.getElementById("barChart").getContext("2d");

  if (chartBar) chartBar.destroy();

  chartBar = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "Pemasukan", data: dataMasuk },
        { label: "Pengeluaran", data: dataKeluar }
      ]
    }
  });
}

/* =======================
   START APP
======================= */
render();
