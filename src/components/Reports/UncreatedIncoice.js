import React, { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import axios from "axios";

import { useNavigate } from "react-router-dom";
import { UserLogin } from "../../context/AuthContext";
import { Toolbar } from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import * as XLSX from 'xlsx';
import { GET_ALL_INVOICES } from "../../Auth_API";

export default function UncreatedInvoice() {
    let navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [invoices, setInvoices] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const { setInvoiceDetails } = UserLogin();
    const [searchQuery, setSearchQuery] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const searchWords = searchQuery.split(" ");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [filteredTotalAmount, setFilteredTotalAmount] = useState(0);

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const handleMonthChange = (event) => {
        setSelectedMonth(event.target.value);
    };

    const handleYearChange = (event) => {
        setSelectedYear(event.target.value);
    };

    useEffect(() => {
        const fetchAllInvoices = async () => {
            try {
                const response = await axios.get(`${GET_ALL_INVOICES}`);
                console.log("Fetched Invoices:", response.data.invoices);

                const sortedInvoices = response.data.invoices
                    .map((invoice) => ({
                        ...invoice,
                        date: new Date(invoice.date).toLocaleDateString(),
                        date: new Date(invoice.date), // Ensure date is a Date object
                        adjustedInvoiceNum: 38492 + (invoice.invoice_num - 100)
                    }))
                    .sort((a, b) => b.date - a.date);

                console.log("Sorted Invoices:", sortedInvoices);

                const filteredInvoices = sortedInvoices.filter((invoice) => {
                    return !invoice.PO_Invoice_date;
                });

                const searchedInvoices = filteredInvoices.filter((invoice) => {
                    const searchString = searchWords.map((word) => word.toLowerCase());
                    return (
                        searchString.some(
                            (word) =>
                                invoice.bill_to.join(", ").toLowerCase().includes(word) ||
                                invoice.job_site_name.toLowerCase().includes(word) ||
                                invoice.invoice_num.toString().includes(word)
                        ) ||
                        searchString.every(
                            (word) =>
                                invoice.bill_to.join(", ").toLowerCase().includes(word) ||
                                invoice.job_site_name.toLowerCase().includes(word) ||
                                invoice.invoice_num.toString().includes(word)
                        )
                    );
                });

                setInvoices(searchedInvoices);

                const paidInvoices = searchedInvoices.filter((invoice) => invoice.payment_status);
                const totalSum = paidInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
                setTotalAmount(totalAmount + totalSum);

                const slicedInvoices = searchedInvoices.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                );

                const filteredTotal = slicedInvoices.reduce((sum, invoice) => {
                    if (invoice.payment_status) {
                        return sum + invoice.total_amount;
                    }
                    return sum;
                }, 0);

                setFilteredTotalAmount(filteredTotal);

            } catch (error) {
                console.error(error.message);
            }
        };

        fetchAllInvoices();
    }, [selectedYear, selectedMonth, page, rowsPerPage, searchQuery, searchWords]);

    const columns = [
        { id: "invoice_num", label: "Invoice No.", minWidth: 100 },
        { id: "bill_to", label: "Bill To", minWidth: 100 },
        { id: "PO_number", label: "PO No.", minWidth: 100 },
        { id: "PO_Invoice_date", label: "PO Invoice Date", minWidth: 100 },
        { id: "job_site_num", label: "Job Site Number", minWidth: 100 },
        { id: "total_amount", label: "Invoice Amount", minWidth: 100 },
        { id: "payment_status", label: "Payment Status", minWidth: 10 },
    ];

    /* Table pagination */
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleInvoicePayment = (invoiceNum, totalAmount) => {
        navigate(`/pay_invoice`, { state: { invoiceNum, totalAmount } });
    };

    /* Functions for Search Input Field */
    const handleSearchClick = () => {
        setIsExpanded(!isExpanded);
        setSearchQuery("");
    };

    const handleEditInvoice = (invoiceNum, adjustedInvoiceNum) => {
        navigate(`/edit_invoice`, { state: { invoiceNum, adjustedInvoiceNum } });
    };

    const downloadExcel = () => {
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

        // Set custom column widths
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

        // Applying styles to header row
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

        // Ensure each header cell is styled
        const headers = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1']; // Adjust as per your columns
        headers.forEach((cellRef) => {
            if (workSheet[cellRef]) { // Check if cell exists
                workSheet[cellRef].s = headerCellStyle;
            }
        });

        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "Invoices");
        XLSX.writeFile(workBook, "InvoiceReport.xlsx");
    };

    return (
        <div style={{ marginTop: "2%", padding: "0px 50px" }}>
            <div id="invoice-generated">
                <div className="container-report px-5 py-5" style={{ width: "100%" }}>
                    <>
                        <h2
                            style={{
                                display: "flex",
                                margin: "auto",
                                justifyContent: "center",
                                marginBottom: "50px"
                            }}
                        >
                            <span
                                onClick={() => {
                                    navigate("/main");
                                }}
                                style={{ cursor: "pointer", marginLeft: "-20%" }}
                            >
                                <i class="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
                            </span>
                            <span style={{ cursor: "pointer", marginLeft: "20%", fontWeight: "600" }}>
                                {" "}
                                Uncreated Invoice Report
                            </span>
                        </h2>

                        {/* Search field */}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>

                            <Toolbar className="toolbar-search" style={{ marginBottom: "-55px" }}>
                                <form className="d-flex search-form" role="search">
                                    <div
                                        className={`search-container ${isExpanded ? "expanded" : ""
                                            }`}
                                    >
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
                                            onChange={(e) => setSearchQuery(e.target.value)}
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
                                    <MenuItem value="">All Years... </MenuItem>
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
                                    <MenuItem value="">All Months... </MenuItem>
                                    {months.map((month) => (
                                        <MenuItem key={month} value={month}>
                                            {month}
                                        </MenuItem>
                                    ))}

                                </Select>
                            </div>
                        </div>

                        <Paper sx={{ width: "100%", overflow: "hidden" }}>
                            <TableContainer>
                                <Table stickyHeader aria-label="sticky table">
                                    <TableHead>
                                        <TableRow>
                                            {columns.map((column) => (
                                                <TableCell
                                                    key={column.id}
                                                    align="left"
                                                    style={{
                                                        minWidth: column.minWidth,
                                                        backgroundColor: "#08a0d1",
                                                        color: "white",
                                                        fontWeight: "500"
                                                    }}
                                                >
                                                    {column.label}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {invoices
                                            .slice(
                                                page * rowsPerPage,
                                                page * rowsPerPage + rowsPerPage
                                            )
                                            .map((invoice) => (
                                                <TableRow
                                                    key={invoice.invoice_num}
                                                    onClick={() => setInvoiceDetails(invoice.invoice_num)}
                                                    style={{
                                                        cursor: "pointer",
                                                        backgroundColor: invoice.PO_Invoice_date ? "orange" : "white"
                                                    }}
                                                >
                                                    {columns.map((column) => (
                                                        <TableCell key={column.id} align="left">
                                                            {column.id === "invoice_num" ? (
                                                                invoice.adjustedInvoiceNum
                                                            ) : column.id === "date" ? (
                                                                new Date(invoice.date).toLocaleDateString()
                                                            ) : column.id === "bill_to" ? (
                                                                invoice.bill_to.length > 0 ? invoice.bill_to[0] : "-"
                                                            ) : column.id === "payment_status" ? (
                                                                invoice.payment_status.toString()
                                                            ) : column.id === "total_amount" ? (
                                                                `${invoice.total_amount.toLocaleString('en-US', {
                                                                    style: 'currency',
                                                                    currency: 'USD',
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2
                                                                }) || '$0.00'}`
                                                            ) : column.id === "PO_Invoice_date" ? (
                                                                new Date(invoice.PO_Invoice_date).toLocaleDateString("en-US", {
                                                                    year: "2-digit",
                                                                    month: "2-digit",
                                                                    day: "2-digit",
                                                                })
                                                            ) : column.id === "invoice_generated" ? (
                                                                <Button variant="contained" color={invoice.PO_Invoice_date ? "primary" : "secondary"}>
                                                                    {invoice.PO_Invoice_date ? "Yes" : "No"}
                                                                </Button>
                                                            ) : (
                                                                invoice[column.id]
                                                            )}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                    </TableBody>

                                </Table>
                            </TableContainer>
                            <div className="amount-container">
                                <div className="total_amount_invoices">
                                    <p className="py-1">Total: &nbsp; &nbsp; {filteredTotalAmount?.toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) || '$0.00'}
                                    </p>
                                </div>
                            </div>

                            <TablePagination
                                className="table-last-row-audio"
                                rowsPerPageOptions={[5, 10, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]}
                                component="div"
                                count={invoices.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </Paper>
                    </>
                </div>
            </div>
        </div>
    );
}
