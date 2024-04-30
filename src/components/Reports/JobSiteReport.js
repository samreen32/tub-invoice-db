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
import generatePDF from "react-to-pdf";
import * as XLSX from 'xlsx';

export default function JobSiteReport() {
    let navigate = useNavigate();
    const targetRef = useRef();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [invoices, setInvoices] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const { setInvoiceDetails, invoiceDetails } = UserLogin();
    const [searchQuery, setSearchQuery] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const searchWords = searchQuery.split(" ");

    /* Endpoint integration for get all the invoices */
    useEffect(() => {
        const fetchUnpaidInvoices = async () => {
            try {
                const response = await axios.get(`${GET_ALL_INVOICES}`);
                console.log(response.data.invoices);

                const filteredInvoices = response.data.invoices.map((invoice) => ({
                    ...invoice,
                    date: new Date(invoice.date).toLocaleDateString(),
                }));

                // Filter based on search query
                const searchedInvoices = filteredInvoices.filter((invoice) => {
                    const searchString = searchWords.map((word) => word.toLowerCase());
                    return (
                        searchString.some(
                            (word) =>
                                invoice.bill_to.join(", ").toLowerCase().includes(word) ||
                                invoice.job_site_name.toLowerCase().includes(word) ||
                                invoice.job_location.toLowerCase().includes(word)
                        ) ||
                        searchString.every(
                            (word) =>
                                invoice.bill_to.join(", ").toLowerCase().includes(word) ||
                                invoice.job_site_name.toLowerCase().includes(word) ||
                                invoice.job_location.toLowerCase().includes(word)
                        )
                    );
                });

                setInvoices(searchedInvoices);
                console.log(searchedInvoices, "hdasjh")

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
    }, [searchQuery, searchWords]);


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

    const columns = [
        { id: "invoice_num", label: "Invoice No.", minWidth: 100 },
        { id: "job_location", label: "Job Site Location", minWidth: 100 },
        // { id: "lot_no", label: "Lot No.", minWidth: 100 },
        { id: "total_amount", label: "Amount", minWidth: 100 },

    ];

    const downloadExcel = () => {
        const filteredData = invoices.map(invoice => ({
            "Invoice No.": invoice.invoice_num,
            "Job Location": invoice.job_location,
            "Amount": `$${invoice.total_amount.toFixed(2)}`
        }));

        const workSheet = XLSX.utils.json_to_sheet(filteredData);

        // Set custom column widths
        workSheet['!cols'] = [
            { wch: 15 },
            { wch: 25 },
            { wch: 15 },

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
        XLSX.writeFile(workBook, "JobSite_Report.xlsx");
    };

    return (
        <div style={{ marginTop: "2%", padding: "0px 50px" }}>
            <span style={{
                cursor: "pointer", textAlign: "center",
                justifyContent: "center", display: "flex",
                marginLeft: "990px"

            }}>
                <span onClick={() => generatePDF(targetRef, { filename: "JobSite_Report.pdf" })}
                    className="new-invoice-btn mx-3">
                    Generate Print
                </span>
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
                <div className="container-report px-5 py-5" style={{ width: "100%" }}>
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
                            style={{ cursor: "pointer", marginLeft: "-1000px", marginTop: "-40px" }}
                        >
                            <i class="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
                        </span>
                    </h2>

                    {/* Search field */}
                    <>
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
                    </>

                    <div ref={targetRef} style={{ padding: "0 20px" }}>
                        <span style={{ cursor: "pointer", marginLeft: "40%" }}>
                            <h2 style={{ padding: "5px" }}>Job Site Name Report</h2>
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
                                                const searchString = searchWords.map((word) => word.toLowerCase());
                                                return (
                                                    searchString.some(
                                                        (word) =>
                                                            invoice.bill_to.join(", ").toLowerCase().includes(word) ||
                                                            invoice.job_site_name.toLowerCase().includes(word) ||
                                                            invoice.job_location.toLowerCase().includes(word)
                                                    ) ||
                                                    searchString.every(
                                                        (word) =>
                                                            invoice.bill_to.join(", ").toLowerCase().includes(word) ||
                                                            invoice.job_site_name.toLowerCase().includes(word) ||
                                                            invoice.job_location.toLowerCase().includes(word)
                                                    )
                                                );
                                            })
                                            .slice(
                                                page * rowsPerPage,
                                                page * rowsPerPage + rowsPerPage
                                            )
                                            .map((invoice, index) => (
                                                <>
                                                    {index % 32 === 0 && index !== 0 && (
                                                        <>
                                                            <TableRow style={{ height: "80px" }}>
                                                                {columns.map((column) => (
                                                                    <TableCell key={`spacer-${column.id}`} />
                                                                ))}
                                                            </TableRow>
                                                            <TableRow style={{ marginTop: "10%" }}>
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
                                                        </>
                                                    )}
                                                    <TableRow
                                                        key={invoice.invoice_num}
                                                        onClick={() => setInvoiceDetails(invoice.invoice_num)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        {columns.map((column) => (
                                                            <TableCell key={column.id} align="left">
                                                                {column.id === "date" ? (
                                                                    new Date(invoice.date).toLocaleDateString()
                                                                ) : column.id === "bill_to" ? (
                                                                    invoice.bill_to.join(", ")
                                                                ) : column.id === "payment_status" ? (
                                                                    invoice.payment_status.toString()
                                                                ) : column.id === "total_amount" ? (
                                                                    `$${invoice.total_amount.toFixed(2)}`
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
                                    <p className="py-1">Total: &nbsp; &nbsp; ${totalAmount.toFixed(2)}
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
                    </div>
                </div>
            </div>
        </div >
    );
}
