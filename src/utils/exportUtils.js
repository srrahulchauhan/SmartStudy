import { formatDisplayDate, formatDisplayTime } from './timeUtils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportTasksToExcel(historyTasks) {
    if (!historyTasks || historyTasks.length === 0) {
      alert("No history data to export yet!");
      return;
    }

    const data = historyTasks.map(task => {
        const dateString = task.historyDate || new Date(task.actualStart || Date.now()).toISOString();
        return {
            'Date': formatDisplayDate(dateString),
            'Subject': task.subject || '',
            'Topic': task.topic || '',
            'Hours Completed': task.duration ? task.duration.toFixed(2) : '0',
            'Start Time': task.plannedStart || '',
            'End Time': task.plannedEnd || '',
            'Status': task.status || ''
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Study History");

    // Fix column widths
    const wscols = [
        { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `study_report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportTasksToPDF(historyTasks) {
    if (!historyTasks || historyTasks.length === 0) {
        alert("No history data to export yet!");
        return;
    }

    const doc = new jsPDF();
    
    // Add Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text("Smart Study Tracker - Progress Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const totalHours = historyTasks.reduce((acc, t) => acc + (t.duration || 0), 0);
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235); // Indigo color
    doc.text(`Total Focus Time: ${totalHours.toFixed(2)} Hours`, 14, 40);

    // Table
    const tableColumn = ["Date", "Subject", "Topic", "Hours", "Status"];
    const tableRows = historyTasks.map(task => [
        formatDisplayDate(task.historyDate || new Date(task.actualStart || Date.now()).toISOString()),
        task.subject || '',
        task.topic || '',
        task.duration ? task.duration.toFixed(2) : '0',
        task.status || ''
    ]);

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo
        styles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 40 },
            2: { cellWidth: 50 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 }
        }
    });

    doc.save(`study_progress_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Keeping CSV for legacy if needed, or aliasing to Excel
export const exportTasksToCSV = exportTasksToExcel;
