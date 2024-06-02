import React, { useState, useEffect, useRef } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import generatePDF from "react-to-pdf";
import axios from "axios";
import { GET_ALL_INVOICES } from "../../Auth_API";
import { useNavigate } from "react-router-dom";
import { UserLogin } from "../../context/AuthContext";
import { Toolbar } from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import * as XLSX from 'xlsx';

export default function EmployeeReport() {
    let navigate = useNavigate();
    const [page, setPage] = useState(0);
    const targetRef = useRef();
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [invoices, setInvoices] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const { setInvoiceDetails } = UserLogin();
    const [searchQuery, setSearchQuery] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const searchWords = searchQuery.split(" ");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");

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

    /* Endpoint integration for get all the invoices */
    useEffect(() => {
        const fetchUnpaidInvoices = async () => {
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

                        const yearMatches =
                            selectedYear === "" || yearFromPODate.toString() === selectedYear;
                        const monthMatches =
                            selectedMonth === "" ||
                            monthFromPODate.toString() === months.indexOf(selectedMonth).toString();

                        return yearMatches && monthMatches;
                    });

                // Filter invoices based on the search query
                const searchedInvoices = filteredInvoices.filter((invoice) => {
                    const searchString = searchWords.map((word) => word.toLowerCase());
                    return searchString.every((word) =>
                        columns.some((column) =>
                            column.id === "date" &&
                            new Date(invoice.date)
                                .toLocaleDateString()
                                .toLowerCase()
                                .includes(word.toLowerCase()) ||
                            String(invoice[column.id])
                                .toLowerCase()
                                .includes(word.toLowerCase())
                        )
                    );
                });

                setInvoices(searchedInvoices);
                const totalSum = searchedInvoices.reduce(
                    (sum, invoice) => sum + invoice.total_amount,
                    0
                );
                setTotalAmount(totalSum);
            } catch (error) {
                console.error(error.message);
            }
        };

        fetchUnpaidInvoices();
    }, [selectedYear, selectedMonth, searchQuery, searchWords]);

    const columns = [
        { id: "invoice_num", label: "Invoice No.", minWidth: 70 },
        { id: "installer", label: "Installer", minWidth: 70 },
        { id: "PO_date", label: "PO Date", minWidth: 70 },
        { id: "total_amount", label: "Earned Amount", minWidth: 70 },
        // { id: "id", label: "", minWidth: 70 },
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

    const downloadExcel = () => {
        const filteredData = invoices.map(invoice => ({
            "Invoice No.": invoice.invoice_num,
            "PO Date": new Date(invoice.PO_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }),
            "Installer": invoice.installer,
            "Earned Amount": `$${invoice.total_amount.toFixed(2)}`
        }));

        const workSheet = XLSX.utils.json_to_sheet(filteredData);
        workSheet['!cols'] = [
            { wch: 15 },
            { wch: 25 },
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
        const headers = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'];
        headers.forEach((cellRef) => {
            if (workSheet[cellRef]) {
                workSheet[cellRef].s = headerCellStyle;
            }
        });

        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "Invoices");
        XLSX.writeFile(workBook, "EmployeeReport.xlsx");
    };

    return (
        <div style={{ marginTop: "2%", padding: "0px 50px" }}>
            <span style={{
                cursor: "pointer", textAlign: "center",
                justifyContent: "center", display: "flex",
                marginLeft: "990px"

            }}>
                <span onClick={() => generatePDF(targetRef, { filename: "EmployeeReport.pdf" })}
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
                <div className="container px-5" style={{ width: "100%" }}>
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
                            style={{ cursor: "pointer", marginLeft: "-1300px" }}
                        >
                            <i class="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
                        </span>
                    </h2>

                    <div style={{ marginBottom: "-100px" }}>
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
                            <h2 style={{ padding: "5px" }}>Employee Statement</h2>
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
                                                            (invoice.bill_to
                                                                ? invoice.bill_to.join(", ").toLowerCase().includes(word)
                                                                : false) ||
                                                            (invoice.installer
                                                                ? invoice.installer.toLowerCase().includes(word)
                                                                : false)
                                                    ) ||
                                                    searchString.every(
                                                        (word) =>
                                                            (invoice.bill_to
                                                                ? invoice.bill_to.join(", ").toLowerCase().includes(word)
                                                                : false) ||
                                                            (invoice.installer
                                                                ? invoice.installer.toLowerCase().includes(word)
                                                                : false)
                                                    )
                                                );
                                            })
                                            .map((invoice) => (
                                                <TableRow
                                                    key={invoice.invoice_num}
                                                    onClick={() => setInvoiceDetails(invoice.invoice_num)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    {columns.map((column) => (
                                                        <TableCell key={column.id} align="left">
                                                            {column.id === "date" ? (
                                                                new Date(invoice.date).toLocaleDateString()
                                                            ) : column.id === "total_amount" ? (
                                                                `${invoice.total_amount.toLocaleString('en-US', {
                                                                    style: 'currency',
                                                                    currency: 'USD',
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2
                                                                }) || '$0.00'}`
                                                            ) : column.id === "PO_date" ? (
                                                                new Date(invoice.PO_date).toLocaleDateString("en-US", {
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
                                            ))}
                                    </TableBody>

                                </Table>
                            </TableContainer>
                            <div className="amount-container">
                                <div className="total_amount_invoices">
                                    <p className="py-1">Total: &nbsp; &nbsp; {totalAmount?.toLocaleString('en-US', {
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
                        <br />
                        <br />
                    </div>

                </div>
            </div>
        </div>
    );
}
