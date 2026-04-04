import { db } from '../src/lib/db';

// ============================================================
// MITRA SEWA — Seed Data Script
// Generates sample rental data for the past 6 months
// Run: bun run prisma/seed.ts
// ============================================================

interface SampleRental {
  nama: string;
  noHp: string;
  alamat: string;
  items: { item: string; qty: number }[];
}

const sampleRentals: SampleRental[] = [
  { nama: "Budi Santoso", noHp: "081234567890", alamat: "Jl. Raya Darmo No. 45, Surabaya", items: [{ item: "scaffolding", qty: 10 }] },
  { nama: "Ahmad Hidayat", noHp: "082345678901", alamat: "Jl. Kenjeran No. 12, Surabaya", items: [{ item: "mesin_stamper", qty: 2 }, { item: "mesin_molen", qty: 1 }] },
  { nama: "Siti Aminah", noHp: "083456789012", alamat: "Jl. Basuki Rahmat No. 78, Surabaya", items: [{ item: "scaffolding", qty: 5 }, { item: "u_head", qty: 50 }] },
  { nama: "Hendra Wijaya", noHp: "084567890123", alamat: "Jl. Tunjungan No. 55, Surabaya", items: [{ item: "catwalk", qty: 30 }, { item: "shock", qty: 40 }] },
  { nama: "Dewi Lestari", noHp: "085678901234", alamat: "Jl. Ahmad Yani No. 100, Surabaya", items: [{ item: "scaffolding", qty: 20 }, { item: "shock", qty: 60 }, { item: "u_head", qty: 60 }] },
  { nama: "Roni Pratama", noHp: "086789012345", alamat: "Jl. Mayjen Sungkono No. 33, Surabaya", items: [{ item: "mesin_molen", qty: 2 }] },
  { nama: "Rina Susanti", noHp: "087890123456", alamat: "Jl. Rungkut Asri No. 21, Surabaya", items: [{ item: "scaffolding", qty: 15 }, { item: "catwalk", qty: 20 }] },
  { nama: "Joko Widodo", noHp: "088901234567", alamat: "Jl. Gayungsari No. 88, Surabaya", items: [{ item: "mesin_stamper", qty: 3 }, { item: "scaffolding", qty: 8 }] },
  { nama: "Mega Putri", noHp: "089012345678", alamat: "Jl. Wonokromo No. 66, Surabaya", items: [{ item: "scaffolding", qty: 25 }, { item: "shock", qty: 100 }] },
  { nama: "Eko Prasetyo", noHp: "081122334455", alamat: "Jl. Menganti No. 14, Surabaya", items: [{ item: "mesin_molen", qty: 1 }, { item: "catwalk", qty: 15 }] },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateInPast(maxDaysAgo: number): Date {
  const now = new Date();
  const daysAgo = randomInt(1, maxDaysAgo);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  // Set to start of day for consistency
  date.setHours(8, 0, 0, 0);
  return date;
}

async function main() {
  console.log("🌱 MITRA SEWA Seed Script");
  console.log("=".repeat(40));

  // Check if data already seeded
  const existingRentals = await db.rental.count();
  if (existingRentals > 0) {
    console.log(`✅ Database already has ${existingRentals} rental(s). Skipping seed.`);
    console.log("   Delete existing rentals first if you want to re-seed.");
    return;
  }

  // Ensure price settings exist (via the same defaults as the API)
  const defaultPrices = [
    { item: "scaffolding", label: "Frame Scaffolding", unit: "set", price: 75000, billingType: "harian" },
    { item: "shock", label: "Joint Pin (Shock)", unit: "pcs", price: 5000, billingType: "bulanan" },
    { item: "u_head", label: "U Head", unit: "pcs", price: 5000, billingType: "bulanan" },
    { item: "catwalk", label: "Catwalk", unit: "pcs", price: 5000, billingType: "bulanan" },
    { item: "mesin_stamper", label: "Mesin Stamper", unit: "unit", price: 150000, billingType: "harian" },
    { item: "mesin_molen", label: "Mesin Molen", unit: "unit", price: 100000, billingType: "harian" },
  ];

  // Ensure stock settings exist
  const defaultStock = [
    { item: "scaffolding", label: "Frame Scaffolding", unit: "set", total: 100 },
    { item: "shock", label: "Joint Pin (Shock)", unit: "pcs", total: 200 },
    { item: "u_head", label: "U Head", unit: "pcs", total: 200 },
    { item: "catwalk", label: "Catwalk", unit: "pcs", total: 200 },
    { item: "mesin_stamper", label: "Mesin Stamper", unit: "unit", total: 5 },
    { item: "mesin_molen", label: "Mesin Molen", unit: "unit", total: 5 },
  ];

  console.log("\n📦 Ensuring price settings...");
  for (const def of defaultPrices) {
    await db.priceSetting.upsert({
      where: { item: def.item },
      update: { label: def.label },
      create: def,
    });
  }
  console.log(`   ✅ ${defaultPrices.length} price settings ready`);

  console.log("\n📦 Ensuring stock settings...");
  for (const def of defaultStock) {
    await db.stockSetting.upsert({
      where: { item: def.item },
      update: { label: def.label },
      create: def,
    });
  }
  console.log(`   ✅ ${defaultStock.length} stock settings ready`);

  // Get prices from DB
  const prices = await db.priceSetting.findMany();
  const priceMap: Record<string, { label: string; unit: string; price: number; billingType: string }> = {};
  for (const p of prices) {
    priceMap[p.item] = {
      label: p.label,
      unit: p.unit,
      price: p.price,
      billingType: p.billingType,
    };
  }

  // Generate rentals
  console.log("\n📋 Creating sample rentals...");

  for (let i = 0; i < sampleRentals.length; i++) {
    const sample = sampleRentals[i];

    // Random start date within the past 6 months (180 days)
    // Older rentals for "kembali" status, more recent for "aktif"
    let maxDaysAgo: number;
    if (i < 7) {
      // Returned rentals: spread across the full 6 months
      maxDaysAgo = 180;
    } else if (i < 9) {
      // Active rentals: started 10-60 days ago
      maxDaysAgo = 60;
    } else {
      // Last rental (overdue active): started 40-70 days ago with short return date in the past
      maxDaysAgo = 70;
    }

    const tanggalSewa = randomDateInPast(maxDaysAgo);

    // Random duration: 3-60 days
    let lamaSewa: number;
    if (i < 7) {
      // Returned: varied durations
      lamaSewa = randomInt(3, 45);
    } else if (i < 9) {
      // Active: longer durations (still in progress)
      lamaSewa = randomInt(30, 60);
    } else {
      // Overdue active: short duration but return date already past
      lamaSewa = randomInt(7, 14);
    }

    const tanggalKembali = new Date(tanggalSewa.getTime() + lamaSewa * 24 * 60 * 60 * 1000);

    // Calculate items and total
    let totalHarga = 0;
    const rentalItems = sample.items.map((si) => {
      const priceInfo = priceMap[si.item];
      if (!priceInfo) {
        console.warn(`   ⚠️  Price not found for item: ${si.item}`);
        return null;
      }

      let multiplier = lamaSewa;
      if (priceInfo.billingType === "bulanan") {
        multiplier = Math.max(1, Math.ceil(lamaSewa / 30));
      }

      const subtotal = si.qty * priceInfo.price * multiplier;
      totalHarga += subtotal;

      return {
        item: si.item,
        label: priceInfo.label,
        jumlah: si.qty,
        harga: priceInfo.price,
        billingType: priceInfo.billingType,
        multiplier,
        subtotal,
      };
    }).filter(Boolean);

    // Determine status
    let status: string;
    if (i < 7) {
      status = "kembali";
    } else if (i < 9) {
      status = "aktif";
    } else {
      // Last rental is active but overdue (tanggalKembali in the past)
      status = "aktif";
    }

    // Set createdAt based on tanggalSewa (slightly before)
    const createdAt = new Date(tanggalSewa.getTime() - randomInt(0, 60) * 60 * 1000);

    await db.rental.create({
      data: {
        namaPenyewa: sample.nama,
        noHp: sample.noHp,
        alamat: sample.alamat,
        tanggalSewa,
        tanggalKembali,
        lamaSewa,
        status,
        totalHarga,
        createdAt,
        items: {
          create: rentalItems!,
        },
      },
    });

    const statusIcon = status === "aktif" ? "🟢" : "✅";
    const overdueNote = i === 9 ? " (overdue)" : "";
    console.log(`   ${statusIcon} #${i + 1} ${sample.nama} — ${status}${overdueNote} — Rp ${totalHarga.toLocaleString("id-ID")} — ${lamaSewa} hari`);
  }

  // Summary
  const totalCreated = await db.rental.count();
  const activeCount = await db.rental.count({ where: { status: "aktif" } });
  const returnedCount = await db.rental.count({ where: { status: "kembali" } });
  const totalRevenue = await db.rental.aggregate({ _sum: { totalHarga: true } });

  console.log("\n" + "=".repeat(40));
  console.log("✅ Seed completed successfully!");
  console.log(`   Total rentals: ${totalCreated}`);
  console.log(`   Active: ${activeCount} (including 1 overdue)`);
  console.log(`   Returned: ${returnedCount}`);
  console.log(`   Total revenue: Rp ${(totalRevenue._sum.totalHarga || 0).toLocaleString("id-ID")}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
