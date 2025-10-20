// src/lib/exportUtils.ts

import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Import plugin autoTable
import Papa from 'papaparse';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction } from '@/hooks/useTransactions'; // Sesuaikan path jika perlu
import { formatCurrency } from '@/utils/currency'; // Sesuaikan path jika perlu
import { ReportFilterValues } from '@/components/reports/ReportFilters'; // Sesuaikan path jika perlu

// Helper type untuk autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

/**
 * Fungsi untuk Ekspor Laporan ke PDF
 */
export const exportToPDF = (
    transactions: Transaction[],
    filters: ReportFilterValues,
    totals: { totalIncome: number; totalExpense: number; netFlow: number },
    title: string = "Laporan Transaksi Keuangan"
) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const tableColumn = ["Tanggal", "Tipe", "Kategori", "Deskripsi", "Rekening", "Jumlah (Rp)"];
    const tableRows: (string | number)[][] = [];

    // Header Laporan
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    // Info Filter
    const filterLines = [
        `Tanggal Cetak: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: id })}`,
        `Periode: ${filters.dateRange?.from ? format(filters.dateRange.from, 'dd MMM yyyy', { locale: id }) : 'Semua'} - ${filters.dateRange?.to ? format(filters.dateRange.to, 'dd MMM yyyy', { locale: id }) : 'Sekarang'}`,
        `Tipe: ${filters.type === 'all' ? 'Semua' : filters.type}`,
        `Kategori: ${filters.categoryId === 'all' || !filters.categoryId ? 'Semua' : 'Spesifik'}`, // Bisa ditambahkan nama kategori jika perlu
        `Rekening: ${filters.bankAccountId === 'all' || !filters.bankAccountId ? 'Semua' : 'Spesifik'}`, // Bisa ditambahkan nama rekening jika perlu
        `Pencarian: ${filters.searchQuery || '-'}`,
    ];
    let startY = 30;
    filterLines.forEach(line => {
        doc.text(line, 14, startY);
        startY += 6;
    });

    // Body Tabel
    transactions.forEach(t => {
        const transactionData = [
            format(new Date(t.transaction_date), 'dd/MM/yy', { locale: id }),
            t.type === 'income' ? 'Masuk' : 'Keluar',
            t.categories?.name || "Uncategorized",
            t.description || '-',
            t.bank_accounts?.account_name || 'Tunai/Lainnya',
            // Format angka untuk PDF (tanpa Rp, hanya angka dengan separator)
            new Intl.NumberFormat('id-ID').format(t.amount)
        ];
        tableRows.push(transactionData);
    });

    // Buat Tabel
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: startY + 5, // Beri sedikit jarak setelah info filter
        headStyles: { fillColor: [63, 66, 241] }, // Warna primer (indigo)
        styles: { fontSize: 8 },
        columnStyles: {
            5: { halign: 'right' } // Kolom Jumlah rata kanan
        }
    });

    // Footer Tabel (Total)
    const finalY = (doc as any).lastAutoTable.finalY || startY + 10; // Posisi Y setelah tabel
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Pemasukan: ${formatCurrency(totals.totalIncome)}`, 14, finalY + 10);
    doc.text(`Total Pengeluaran: ${formatCurrency(totals.totalExpense)}`, 14, finalY + 16);
    doc.setFontSize(12);
    doc.text(`Arus Bersih (Net Flow): ${formatCurrency(totals.netFlow)}`, 14, finalY + 24);


    // Nama File
    const dateStr = format(new Date(), 'yyyyMMdd');
    doc.save(`laporan_keuangan_${dateStr}.pdf`);
};

/**
 * Fungsi untuk Ekspor Laporan ke CSV
 */
export const exportToCSV = (
    transactions: Transaction[],
    filename: string = `laporan_keuangan_${format(new Date(), 'yyyyMMdd')}.csv`
) => {
    const csvData = transactions.map(t => ({
        Tanggal: format(new Date(t.transaction_date), 'yyyy-MM-dd', { locale: id }),
        Tipe: t.type,
        Kategori: t.categories?.name || "Uncategorized",
        Deskripsi: t.description || '',
        Rekening: t.bank_accounts?.account_name || 'Tunai/Lainnya',
        Jumlah: t.amount, // Gunakan angka asli untuk CSV
        ID_Transaksi: t.id,
        ID_User: t.user_id,
        ID_Kategori: t.category_id,
        ID_Rekening: t.bank_account_id
    }));

    const csv = Papa.unparse(csvData, {
        header: true,
        quotes: true,
    });

    // Buat link download
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }); // Tambah BOM untuk Excel
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};