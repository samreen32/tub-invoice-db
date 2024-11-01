import React, { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserLogin } from "../../context/AuthContext";
import { LinearProgress, Pagination, Toolbar } from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import * as XLSX from "xlsx";
import { GET_ALL_INVOICES, GET_INVOICE_PO } from "../../Auth_API";


export default function UncreatedInvoice() {
    let navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const { setInvoiceDetails } = UserLogin();
    const [searchQuery, setSearchQuery] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const searchWords = searchQuery.split(" ");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [filteredTotalAmount, setFilteredTotalAmount] = useState(0);
    const [showUncreatedInvoices, setShowUncreatedInvoices] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;
    const [totalInvoices, setTotalInvoices] = useState(0);
    const pageCount = Math.ceil(totalInvoices / rowsPerPage);

    const months = [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December",
    ];

    const handleMonthChange = (event) => setSelectedMonth(event.target.value);
    const handleYearChange = (event) => setSelectedYear(event.target.value);

    useEffect(() => {
        const fetchAllInvoices = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${GET_INVOICE_PO}`, {
                    params: { page, limit: rowsPerPage }
                });
                
                let adjustedInvoiceCounter = 38592;
                const invoicesWithAdjustedNumbers = response.data.invoices.map((invoice) => {
                    if (invoice.PO_Invoice_date) {
                        return { ...invoice, adjustedInvoiceNum: adjustedInvoiceCounter++ };
                    }
                    return invoice;
                });

                const sortedInvoices = invoicesWithAdjustedNumbers
                    .map((invoice) => ({
                        ...invoice,
                        date: new Date(invoice.date),
                    }))
                    .sort((a, b) => b.date - a.date);

                const filteredInvoices = sortedInvoices.filter((invoice) => {
                    const yearFromPODate = new Date(invoice.PO_Invoice_date).getFullYear();
                    const monthFromPODate = new Date(invoice.PO_Invoice_date).getMonth();
                    const yearMatches = selectedYear === "" || yearFromPODate.toString() === selectedYear;
                    const monthMatches = selectedMonth === "" || monthFromPODate === months.indexOf(selectedMonth);
                    return yearMatches && monthMatches;
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

                const uncreatedInvoices = searchedInvoices.filter((invoice) => invoice.PO_Invoice_date);
                setInvoices(showUncreatedInvoices ? uncreatedInvoices : searchedInvoices);
                setTotalInvoices(response.data.totalInvoices);
                const paidInvoices = searchedInvoices.filter((invoice) => invoice.payment_status);
                const totalSum = paidInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
                setTotalAmount(totalAmount + totalSum);
                const filteredTotal = searchedInvoices.reduce((sum, invoice) => {
                    return invoice.payment_status ? sum + invoice.total_amount : sum;
                }, 0);
                setFilteredTotalAmount(filteredTotal);
            } catch (error) {
                console.error(error.message);
            } finally {
                setLoading(false); // Ensures loading stops regardless of success or error
            }
        };

        fetchAllInvoices();
    }, [selectedYear, selectedMonth, searchQuery, showUncreatedInvoices, page]); // `page` added as a dependency

    const columns = [
        { id: "invoice_num", label: "Invoice No.", minWidth: 100 },
        { id: "bill_to", label: "Bill To", minWidth: 100 },
        { id: "PO_number", label: "PO No.", minWidth: 100 },
        { id: "PO_Invoice_date", label: "PO Invoice Date", minWidth: 100 },
        { id: "job_site_num", label: "Job Site Number", minWidth: 100 },
        { id: "total_amount", label: "Invoice Amount", minWidth: 100 },
    ];

    const downloadExcel = () => {
        const filteredData = invoices.map(invoice => ({
            "Invoice No.": invoice.newInvoiceNum || invoice.invoice_num,
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
        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "Invoices");
        XLSX.writeFile(workBook, "InvoiceReport.xlsx");
    };

    const handlePageChange = (event, newPage) => setPage(newPage);

    return (
        <div style={{ transform: "scale(0.7)" }}>
            <div id="invoice-generated">
                <div
                    className="container-report px-5"
                    style={{
                        marginTop: "-80px",
                        height: "850px",
                        overflowY: "auto",
                    }}
                >
                    <h2
                        style={{
                            display: "flex",
                            margin: "auto",
                            justifyContent: "center",
                            marginBottom: "50px"
                        }}
                    >
                        <span
                            onClick={() => navigate("/main")}
                            style={{ cursor: "pointer", marginLeft: "-20%" }}
                        >
                            <i className="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
                        </span>
                        <span style={{ cursor: "pointer", marginLeft: "20%", fontWeight: "600" }}>
                            Invoice Report
                        </span>
                    </h2>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Toolbar className="toolbar-search" style={{ marginBottom: "-55px" }}>
                            <form className="d-flex search-form" role="search">
                                <div className={`search-container ${isExpanded ? "expanded" : ""}`}>
                                    <button onClick={() => setIsExpanded(!isExpanded)} className="search-button">
                                        <i className="fa fa-search"></i>
                                    </button>
                                    <input
                                        className="search-input"
                                        type="text"
                                        placeholder="Search here..."
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
                            <Select value={selectedYear} onChange={handleYearChange} displayEmpty>
                                <MenuItem value="">All Years...</MenuItem>
                                {Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - index).map((year) => (
                                    <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                                ))}
                            </Select>
                            <Select value={selectedMonth} onChange={handleMonthChange} displayEmpty>
                                <MenuItem value="">All Months...</MenuItem>
                                {months.map((month) => (
                                    <MenuItem key={month} value={month}>{month}</MenuItem>
                                ))}
                            </Select>
                        </div>
                    </div>
                    <Paper sx={{ width: "100%" }}>
                        {loading && <LinearProgress color="error" />}
                        <TableContainer sx={{ maxHeight: 800 }}>
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
                                {invoices.map((invoice) => {
                                const displayedInvoiceNum = invoice.invoice_num >= 832 && invoice.PO_Invoice_date
                                    ? invoice.newInvoiceNum
                                    : invoice.PO_Invoice_date
                                        ? invoice.adjustedInvoiceNum
                                        : invoice.invoice_num
                                        console.log(displayedInvoiceNum, "displayedInvoiceNum")
                                return (
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
                                                    displayedInvoiceNum
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
                                                ) : (
                                                    invoice[column.id]
                                                )}
                                               
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <div className="amount-container">
                            <div className="total_amount_invoices">
                                <p className="py-1">
                                    Total: &nbsp; &nbsp;
                                    {filteredTotalAmount?.toLocaleString("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }) || "$0.00"}
                                </p>
                            </div>
                        </div>
                    </Paper>
                    {invoices?.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                padding: "10px",
                                position: "relative",
                            }}
                        >
                            <Pagination
                                count={pageCount}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                variant="outlined"
                                shape="rounded"
                                hidePrevButton
                                hideNextButton
                                sx={{
                                    "& .MuiPaginationItem-root": {
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: "36px",
                                    },
                                    "& .MuiPaginationItem-icon": {
                                        fontSize: "1.2rem",
                                    },
                                    "& .Mui-selected": {
                                        backgroundColor: "#1565c0",
                                        color: "#ffffff",
                                    },
                                    "& .MuiPaginationItem-root:hover": {
                                        color: "#ffffff",
                                        backgroundColor: "#1565c0",
                                    },
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}