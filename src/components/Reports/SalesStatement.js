import React, { useState, useEffect, useRef } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import axios from "axios";
import { GET_ALL_INVOICES } from "../../Auth_API";
import { useNavigate } from "react-router-dom";
import { UserLogin } from "../../context/AuthContext";
import { Toolbar } from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import generatePDF from "react-to-pdf";
import * as XLSX from 'xlsx';

export default function SalesStatement() {
    let navigate = useNavigate();
    const targetRef = useRef();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
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
                console.log(response.data.invoices);

                const filteredInvoices = response.data.invoices
                    .map((invoice) => ({
                        ...invoice,
                        date: new Date(invoice.date).toLocaleDateString(),
                    }))
                    .filter((invoice) => {
                        const yearFromPODate = new Date(invoice.PO_date).getFullYear();
                        const monthFromPODate = new Date(invoice.PO_date).getMonth();

                        const yearMatches = selectedYear === "" || yearFromPODate.toString() === selectedYear;
                        const monthMatches = selectedMonth === "" || monthFromPODate.toString() === months.indexOf(selectedMonth).toString();

                        return yearMatches && monthMatches;
                    });

                const searchedInvoices = filteredInvoices.filter((invoice) => {
                    const searchString = searchWords.map((word) => word.toLowerCase());
                    return (
                        searchString.some(
                            (word) =>
                                invoice.bill_to.join(", ").toLowerCase().includes(word) ||
                                invoice.job_site_name.toLowerCase().includes(word) ||
                                invoice.invoice_num.toString().includes(word)  // Add this line for searching based on invoice number
                        ) ||
                        searchString.every(
                            (word) =>
                                invoice.bill_to.join(", ").toLowerCase().includes(word) ||
                                invoice.job_site_name.toLowerCase().includes(word) ||
                                invoice.invoice_num.toString().includes(word)  // Add this line for searching based on invoice number
                        )
                    );
                });

                setInvoices(searchedInvoices);
                const paidInvoices = searchedInvoices.filter((invoice) => invoice.payment_status);
                console.log("Paid Invoices:", paidInvoices);

                const totalSum = paidInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
                console.log("Total Amount of Paid Invoices:", totalSum);

                setTotalAmount(totalAmount + totalSum);
                const slicedInvoices = searchedInvoices.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                );
                const filteredTotal = slicedInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);

                console.log("Filtered Total Amount:", filteredTotal);

                setFilteredTotalAmount(filteredTotal);
            } catch (error) {
                console.error(error.message);
            }
        };

        fetchAllInvoices();

    }, [selectedYear, selectedMonth, page, rowsPerPage, searchQuery, searchWords]);

    const columns = [
        { id: "invoice_num", label: "Invoice No.", minWidth: 100 },
        { id: "PO_Invoice_date", label: "Invoice Date", minWidth: 100 },
        { id: "PO_number", label: "P.O", minWidth: 100 },
        { id: "job_site_name", label: "Job Site Name", minWidth: 100 },
        { id: "lot_no", label: "Lots", minWidth: 100 },
        { id: "job_location", label: "Job Location", minWidth: 100 },
        { id: "total_amount", label: "Amount", minWidth: 100 },
        { id: "payment_date", label: "Paid Date", minWidth: 100 },
        { id: "check_num", label: "Check no", minWidth: 100 },
        { id: "", label: "Balance Due", minWidth: 100 },

    ];

    /* Table pagination */
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    /* Functions for Search Input Field */
    const handleSearchClick = () => {
        setIsExpanded(!isExpanded);
        setSearchQuery("");
    };

    const downloadExcel = () => {
        const filteredData = invoices.map(invoice => {
            const lastPayment = invoice.payments && invoice.payments.length > 0 ? invoice.payments[invoice.payments.length - 1] : null;
            const checkNumber = lastPayment ? lastPayment.check_num : "-";
            const paymentDate = lastPayment && lastPayment.payment_date
                ? new Date(lastPayment.payment_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                })
                : "-";

            return {
                "Invoice No.": invoice.invoice_num,
                "Invoice Date": new Date(invoice.PO_Invoice_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }),
                "PO No.": invoice.PO_number,
                "Job Site Number": invoice.job_site_num,
                "Lot No.": invoice.lot_no,
                "Job Location": invoice.job_location,
                "Paid Date": paymentDate,
                "Check no": checkNumber,
                "Total Amount": `$${invoice.total_amount.toFixed(2)}`,
                "Balance Due": `$0.00`
            };
        });

        const workSheet = XLSX.utils.json_to_sheet(filteredData);
        workSheet['!cols'] = [
            { wch: 15 },
            { wch: 25 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 25 },
            { wch: 25 },
            { wch: 25 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
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
        const headers = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1'];
        headers.forEach((cellRef) => {
            if (workSheet[cellRef]) {
                workSheet[cellRef].s = headerCellStyle;
            }
        });

        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "Invoices");
        XLSX.writeFile(workBook, "SaleStatement.xlsx");
    };

    return (
        <div style={{ marginTop: "2%" }}>
            <span className="container" style={{
                cursor: "pointer", textAlign: "right",
                justifyContent: "right", display: "flex",
                background: "transparent",
            }}>
                <span onClick={() => generatePDF(targetRef, { filename: "SaleStatement.pdf" })}
                    className="new-invoice-btn mx-3"> Generate Print</span>
                <button
                    onClick={downloadExcel}
                    style={{
                        cursor: 'pointer',
                        fontSize: "14px",
                        padding: "12px",
                        background: "green",
                        border: "none",
                        color: "white",
                    }}
                >
                    Download Excel
                </button>
            </span>

            <div id="invoice-generated">
                <div className="container px-5 py-5" style={{ width: "100%" }}>
                    <>
                        <h2
                            style={{
                                display: "flex",
                                margin: "auto",
                                justifyContent: "center",
                            }}
                        >
                            <span
                                onClick={() => {
                                    navigate("/main");
                                }}
                                style={{ cursor: "pointer", marginLeft: "-100%", marginTop: "-65px" }}
                            >
                                <i class="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
                            </span>
                        </h2>

                        {/* Search field */}
                        <div style={{ marginBottom: "-50px" }}>
                            <Toolbar className="toolbar-search">
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
                        </div>

                        <>
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
                        </>

                        <div ref={targetRef} style={{ padding: "0 20px" }}>
                            <span style={{ cursor: "pointer", marginLeft: "40%" }}>
                                <h2 style={{ padding: "5px" }}>Sales Statement</h2>
                            </span><br />
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
                                                .filter((invoice) => {
                                                    const searchString = searchWords.map((word) =>
                                                        word.toLowerCase()
                                                    );
                                                    return (
                                                        searchString.some(
                                                            (word) =>
                                                                invoice.bill_to
                                                                    .join(", ")
                                                                    .toLowerCase()
                                                                    .includes(word) ||
                                                                invoice.job_site_name.toLowerCase().includes(word)
                                                        ) ||
                                                        searchString.every(
                                                            (word) =>
                                                                invoice.bill_to
                                                                    .join(", ")
                                                                    .toLowerCase()
                                                                    .includes(word) ||
                                                                invoice.job_site_name.toLowerCase().includes(word)
                                                        )
                                                    );
                                                })
                                                .slice(
                                                    page * rowsPerPage,
                                                    page * rowsPerPage + rowsPerPage
                                                )
                                                .map((invoice, index) => (
                                                    <>
                                                        {index !== 0 && index % 29 === 0 && (
                                                            <>
                                                                <TableRow style={{ height: "120px" }}>
                                                                    {columns.map((column) => (
                                                                        <TableCell key={`spacer-${column.id}`} />
                                                                    ))}
                                                                </TableRow>
                                                                <TableRow>
                                                                    {columns.map((column) => (
                                                                        <TableCell
                                                                            key={column.id}
                                                                            align="left"
                                                                            style={{
                                                                                minWidth: column.minWidth,
                                                                                backgroundColor: "#08a0d1",
                                                                                color: "white",
                                                                                fontWeight: "500",
                                                                            }}
                                                                        >
                                                                            {column.label}
                                                                        </TableCell>
                                                                    ))}
                                                                </TableRow>
                                                            </>
                                                        )}
                                                        <TableRow
                                                            key={invoice.invoice_num}
                                                            onClick={() => setInvoiceDetails(invoice.invoice_num)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            {columns.map((column) => (
                                                                <TableCell key={column.id} align="left">
                                                                    {column.id === "PO_Invoice_date" ? (
                                                                        new Date(invoice.PO_Invoice_date).toLocaleDateString()
                                                                    ) : column.id === "payment_status" ? (
                                                                        invoice.payment_status.toString()
                                                                    ) : column.id === "total_amount" ? (
                                                                        `$${invoice.total_amount.toFixed(2)}`
                                                                    ) : column.id === "payment_date" ? (
                                                                        invoice.payments.length > 0 ? (
                                                                            invoice.payments[invoice.payments.length - 1].payment_date ? new Date(invoice.payments[invoice.payments.length - 1].payment_date).toLocaleDateString("en-US", {
                                                                                year: "2-digit",
                                                                                month: "2-digit",
                                                                                day: "2-digit"
                                                                            }) : "-"
                                                                        ) : (
                                                                            "-"
                                                                        )
                                                                    ) : column.id === "check_num" ? (
                                                                        invoice.payments.length > 0 ? (
                                                                            invoice.payments[invoice.payments.length - 1].check_num
                                                                        ) : (
                                                                            "-"
                                                                        )
                                                                    ) : (
                                                                        invoice[column.id]
                                                                    )}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </>
                                                ))}
                                        </TableBody>


                                    </Table>
                                </TableContainer>
                                <div className="amount-container">
                                    <div className="total_amount_invoices">
                                        <p className="py-1">Grand Total: &nbsp; &nbsp; <span style={{ marginRight: "30%" }}>
                                            ${filteredTotalAmount.toFixed(2)}</span></p>
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
                        </div>
                    </>
                </div>
            </div>
        </div>
    );
}
