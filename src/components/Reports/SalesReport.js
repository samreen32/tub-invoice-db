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

export default function SalesReport() {
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
    const [filteredTotalAmount, setFilteredTotalAmount] = useState(0);
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const handleYearChange = (event) => {
        setSelectedYear(event.target.value);
    };

    useEffect(() => {
        const fetchAllInvoices = async () => {
            try {
                const response = await axios.get(`${GET_ALL_INVOICES}`);
                const allInvoices = response.data.invoices.map((invoice) => ({
                    ...invoice,
                    date: new Date(invoice.date).toLocaleDateString(),
                }));

                const filteredInvoices = allInvoices.filter((invoice) => {
                    const yearFromPODate = new Date(invoice.PO_date).getFullYear();
                    const yearMatches =
                        selectedYear === "" || yearFromPODate.toString() === selectedYear.toString();
                    return yearMatches;
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

                const customerMonthTotals = new Map();

                searchedInvoices.forEach((invoice) => {
                    const customer = invoice.bill_to.join(", ");
                    const month = new Date(invoice.PO_date).getMonth() + 1; // Months are 0-indexed
                    const key = `${customer}_${month}`;

                    if (!customerMonthTotals.has(customer)) {
                        customerMonthTotals.set(customer, {
                            bill_to: invoice.bill_to,
                            total_amount: 0,
                        });
                    }

                    // Accumulate the amount for the corresponding month
                    customerMonthTotals.get(customer)[`month_${month}`] =
                        (customerMonthTotals.get(customer)[`month_${month}`] || 0) +
                        invoice.total_amount;

                    // Accumulate the total amount for the customer
                    customerMonthTotals.get(customer).total_amount += invoice.total_amount;
                });

                // Transform map data into the desired format
                const transformedInvoices = Array.from(customerMonthTotals.values());
                setInvoices(transformedInvoices);
                const paidInvoices = searchedInvoices.filter((invoice) => invoice.payment_status);
                const totalSum = paidInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
                setTotalAmount(totalAmount + totalSum);
                const slicedInvoices = transformedInvoices.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                );
                const filteredTotal = slicedInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
                setFilteredTotalAmount(filteredTotal);
            } catch (error) {
                console.error(error.message);
            }
        };

        fetchAllInvoices();
    }, [selectedYear, page, rowsPerPage, searchQuery, searchWords]);


    const columns = [
        { id: "bill_to", label: "Customers", minWidth: 140 },
        ...Array.from({ length: 12 }, (_, index) => ({
            id: `month_${index + 1}`,
            label: `${selectedYear}/${index + 1}`,
            minWidth: 100,
        })),
        { id: "total_amount", label: "Total", minWidth: 100 },
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
        const excelColumns = [
            { id: "bill_to", label: "Customers" },
            ...Array.from({ length: 12 }, (_, index) => ({
                id: `month_${index + 1}`,
                label: `${selectedYear}/${index + 1}`
            })),
            { id: "total_amount", label: "Total" }
        ];
        const filteredData = invoices.map(invoice => {
            const invoiceRow = {
                "Customers": invoice.bill_to.length > 0 ? invoice.bill_to[0] : "-",
                "Total": `$${invoice.total_amount.toFixed(2)}`
            };
            excelColumns.forEach(column => {
                if (column.id.startsWith("month_")) {
                    invoiceRow[column.label] = invoice[column.id] ? `$${invoice[column.id].toFixed(2)}` : "-";
                }
            });

            return invoiceRow;
        });
        const workSheet = XLSX.utils.json_to_sheet(filteredData);
        workSheet['!cols'] = excelColumns.map(() => ({
            wch: 15
        }));
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
        excelColumns.forEach((column, index) => {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
            if (workSheet[cellRef]) {
                workSheet[cellRef].s = headerCellStyle;
            }
        });

        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "Invoices");
        XLSX.writeFile(workBook, "salesReport.xlsx");
    };


    return (
        <div style={{ marginTop: "2%" }}>
            <span className="container" style={{
                cursor: "pointer", textAlign: "right",
                justifyContent: "right", display: "flex",
                background: "transparent",
                maxWidth: "1800px"
            }}>
                <span onClick={() => generatePDF(targetRef, { filename: "salesReport.pdf" })}
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
                <div className="container px-5 py-5" style={{ maxWidth: "1800px" }}>
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
                        <div style={{ marginBottom: "-70px" }}>
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

                            {Array.from(
                                { length: 10 },
                                (_, index) => new Date().getFullYear() - index
                            ).map((year) => (
                                <MenuItem key={year} value={year.toString()}>
                                    {year}
                                </MenuItem>
                            ))}

                        </Select>

                        <div ref={targetRef} style={{ padding: "0 20px" }}>
                            <span style={{ cursor: "pointer", marginLeft: "40%" }}>
                                <h2 style={{ padding: "5px" }}>Sales Trend</h2>
                            </span><br />
                            <Paper sx={{ width: "100%", overflow: "hidden" }}>
                                <TableContainer>
                                    <Table stickyHeader aria-label="sticky table">
                                        <TableHead>
                                            <TableRow>
                                                {columns.map((column, index) => (
                                                    <TableCell
                                                        key={column.id}
                                                        align="left"
                                                        style={{
                                                            minWidth: column.minWidth,
                                                            backgroundColor: "#08a0d1",
                                                            color: "white",
                                                            fontWeight: "500",
                                                            borderRight: index !== columns.length - 1 ? '1px solid #ddd' : 'none',
                                                        }}
                                                    >
                                                        {column.label}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {invoices
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                .map((invoice, rowIndex) => (
                                                    <>
                                                        {rowIndex !== 0 && rowIndex % 33 === 0 && (
                                                            <TableRow>
                                                                {columns.map((column, colIndex) => (
                                                                    <TableCell
                                                                        key={column.id}
                                                                        align="left"
                                                                        style={{
                                                                            minWidth: column.minWidth,
                                                                            backgroundColor: "#08a0d1",
                                                                            color: "white",
                                                                            fontWeight: "500",
                                                                            borderRight: colIndex !== columns.length - 1 ? '1px solid #ddd' : 'none',
                                                                        }}
                                                                    >
                                                                        {column.label}
                                                                    </TableCell>
                                                                ))}
                                                            </TableRow>
                                                        )}
                                                        <TableRow
                                                            key={invoice.bill_to.join(", ")}
                                                            onClick={() => setInvoiceDetails(invoice.invoice_num)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            {columns.map((column, colIndex) => (
                                                                <TableCell key={column.id} align="left"
                                                                    style={{
                                                                        borderRight: colIndex !== columns.length - 1 ? '1px solid #ddd' : 'none',
                                                                        borderBottom: rowIndex !== invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length - 1 ? '1px solid #ddd' : 'none',
                                                                    }}
                                                                >
                                                                    {column.id === "bill_to" ? (
                                                                        invoice.bill_to.length > 0 ? invoice.bill_to[0] : "-"
                                                                    ) : column.id.startsWith("month_") ? (
                                                                        invoice[column.id] ? `$${invoice[column.id].toFixed(2)}` : "-"
                                                                    ) : column.id === "total_amount" ? (
                                                                        `$${invoice[column.id].toFixed(2)}`
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
                                        <p className="py-1">Total: &nbsp; &nbsp; ${filteredTotalAmount.toFixed(2)}
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
                    </>
                </div>
            </div>
        </div>
    );
}
