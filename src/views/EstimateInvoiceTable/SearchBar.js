import React, { useCallback, useState } from 'react';
import { debounce } from 'lodash';
import { Toolbar } from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import * as XLSX from 'xlsx';

function SearchBar({
    months, selectedYear, selectedMonth, showUncreatedInvoices, invoices,
    setSelectedMonth, setSelectedYear, setSearchQuery, setShowUncreatedInvoices
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const debouncedSetSearchQuery = useCallback(
        debounce((query) => {
            setSearchQuery(query);
        }, 500),
        []
    );

    const handleSearchInputChange = (event) => {
        debouncedSetSearchQuery(event.target.value);
    };

    const handleSearchClick = () => {
        setIsExpanded(!isExpanded);
        setSearchQuery(""); // Reset search when expanding
    };

    const handleMonthChange = useCallback((event) => {
        setSelectedMonth(event.target.value);
    }, [setSelectedMonth]);

    const handleYearChange = useCallback((event) => {
        setSelectedYear(event.target.value);
    }, [setSelectedYear]);

    const handleToggleUncreatedInvoices = useCallback((event, newAlignment) => {
        setShowUncreatedInvoices(newAlignment);
    }, [setShowUncreatedInvoices]);


    const downloadExcel = useCallback(() => {
        const filteredData = invoices.map(invoice => ({
            "Invoice No.": invoice.invoice_num,
            "Bill To": invoice.bill_to.join(", "),
            "PO No.": invoice.PO_number,
            "PO Date": new Date(invoice.PO_Invoice_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }),
            "Job Site Number": invoice.job_site_num,
            "Amount": `$${invoice.total_amount.toFixed(2)}`,
            "Payment Status": invoice.payment_status ? "Received" : "Not Received"
        }));

        const workSheet = XLSX.utils.json_to_sheet(filteredData);

        workSheet['!cols'] = [
            { wch: 15 },
            { wch: 25 },
            { wch: 15 },
            { wch: 15 },
            { wch: 20 },
            { wch: 20 },
            { wch: 10 },
            { wch: 15 }
        ];

        const headerCellStyle = {
            font: {
                name: 'Calibri',
                sz: 14,
                bold: true
            },
            alignment: {
                horizontal: "center",
                vertical: "center"
            }
        };

        const headers = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'];
        headers.forEach((cellRef) => {
            if (workSheet[cellRef]) {
                workSheet[cellRef].s = headerCellStyle;
            }
        });

        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "Invoices");
        XLSX.writeFile(workBook, "InvoiceReport.xlsx");
    }, [invoices]);

    return (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Toolbar className="toolbar-search" style={{ marginBottom: "-55px" }}>
                <form className="d-flex search-form" role="search">
                    <div className={`search-container ${isExpanded ? "expanded" : ""}`}>
                        <button
                            onClick={handleSearchClick}
                            className="search-button"
                        >
                            <i className="fa fa-search"></i>
                        </button>
                        <input
                            className="search-input"
                            type="text"
                            placeholder="Search here..."
                            onClick={handleSearchClick}
                            onBlur={() => setIsExpanded(false)}
                            onChange={handleSearchInputChange}
                        />
                    </div>
                </form>
            </Toolbar>

            <div>
                <button
                    onClick={downloadExcel}
                    style={{
                        cursor: 'pointer',
                        fontSize: "14px",
                        padding: "12px",
                        background: "#00bbf0",
                        border: "none",
                        color: "white",
                    }}
                >
                    Download Excel
                </button>
                <Select
                    value={selectedYear}
                    onChange={handleYearChange}
                    style={{
                        marginLeft: "20px",
                        marginRight: "10px",
                        marginTop: "20px",
                    }}
                    displayEmpty
                >
                    <MenuItem value="">All Years...</MenuItem>
                    {Array.from(
                        { length: 10 },
                        (_, index) => new Date().getFullYear() - index
                    ).map((year) => (
                        <MenuItem key={year} value={year.toString()}>
                            {year}
                        </MenuItem>
                    ))}
                </Select>

                <Select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    style={{ marginRight: "20px", marginTop: "20px" }}
                    displayEmpty
                >
                    <MenuItem value="">All Months...</MenuItem>
                    {months.map((month) => (
                        <MenuItem key={month} value={month}>
                            {month}
                        </MenuItem>
                    ))}
                </Select>

                <ToggleButtonGroup
                    value={showUncreatedInvoices}
                    exclusive
                    onChange={handleToggleUncreatedInvoices}
                    aria-label="Show uncreated invoices"
                    style={{ marginRight: "20px", marginTop: "20px" }}
                >
                    <ToggleButton value={true} aria-label="show uncreated">
                        Invoice Reports
                    </ToggleButton>
                    <ToggleButton value={false} aria-label="show all">
                        All Reports
                    </ToggleButton>
                </ToggleButtonGroup>
            </div>
        </div>
    );
}

export default SearchBar;