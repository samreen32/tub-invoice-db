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
import { DELETE_INVOICE, GET_ALL_INVOICES, REVERSE_PAYMENT } from "../../Auth_API";
import { useNavigate } from "react-router-dom";
import { UserLogin } from "../../context/AuthContext";
import { Toolbar } from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export default function SecondInvoiceReport() {
    let navigate = useNavigate();
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
                const filteredInvoices = response.data.invoices
                    .map((invoice) => ({
                        ...invoice,
                        date: new Date(invoice.date).toLocaleDateString(),
                    }))
                    .filter((invoice) => {
                        const yearFromPODate = new Date(invoice.PO_Invoice_date).getFullYear();
                        const monthFromPODate = new Date(invoice.PO_Invoice_date).getMonth();

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
                                invoice.invoice_num.toString().includes(word)
                        ) ||
                        searchString.every(
                            (word) =>
                                invoice.bill_to.join(", ").toLowerCase().includes(word) ||
                                invoice.job_site_name.toLowerCase().includes(word) ||
                                invoice.invoice_num.toString().includes(word))
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
        // { id: "type_of_work", label: "Type of Work", minWidth: 100 },
        { id: "job_site_num", label: "Job Site Number", minWidth: 100 },
        { id: "total_amount", label: "Invoice Amount", minWidth: 100 },
        { id: "payment_status", label: "Payment Status", minWidth: 100 },
        {
            id: "add_payment",
            label: "Payment",
            minWidth: 100,
        },
        {
            id: "edit",
            label: "Generate",
            minWidth: 100,
        },
        {
            id: "delete",
            label: "Void",
            minWidth: 100,
        },
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

    /* Functions for delete invoice */
    const handleDeleteInvoice = async (invoiceNum) => {
        try {
            const response = await axios.delete(`${DELETE_INVOICE}/${invoiceNum}`);

            if (response.data.success) {
                setInvoices((prevInvoices) =>
                    prevInvoices.filter((invoice) => invoice.invoice_num !== invoiceNum)
                );
                setTotalAmount(
                    (prevTotal) => prevTotal - response.data.invoice.total_amount
                );
                console.log(response.data.success);
            } else {
                console.error(response.data.message);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    const handleEditInvoice = (invoiceNum) => {
        navigate(`/edit_invoice`, { state: { invoiceNum } });
    };

    const handleReversePayment = async (invoiceNum) => {
        try {
            const response = await axios.put(`${REVERSE_PAYMENT}/${invoiceNum}`);
            if (response.data.success) {
                setInvoices((prevInvoices) =>
                    prevInvoices.map((invoice) =>
                        invoice.invoice_num === invoiceNum
                            ? { ...invoice, payment_status: false }
                            : invoice
                    )
                );
                setTotalAmount((prevTotal) => prevTotal - response.data.invoice.total_amount);
                console.log(response.data.success);
            } else {
                console.error(response.data.message);
            }
        } catch (error) {
            console.error(error.message);
        }
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
                                style={{ cursor: "pointer", marginLeft: "-40%" }}
                            >
                                <i class="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
                            </span>
                            <span style={{ cursor: "pointer", marginLeft: "40%", fontWeight: "600" }}>
                                {" "}
                                Invoice Report
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
                                                            ) : column.id === "bill_to" ? (
                                                                invoice.bill_to.length > 0 ? invoice.bill_to[0] : "-"
                                                            ) : column.id === "payment_status" ? (
                                                                invoice.payment_status.toString()
                                                            ) : column.id === "total_amount" ? (
                                                                `$${invoice.total_amount.toFixed(2)}`
                                                            ) : column.id === "PO_Invoice_date" ? (
                                                                new Date(invoice.PO_Invoice_date).toLocaleDateString("en-US", {
                                                                    year: "2-digit",
                                                                    month: "2-digit",
                                                                    day: "2-digit",
                                                                })
                                                            ) : column.id === "add_payment" ? (
                                                                invoice.payment_status ? (
                                                                    <div style={{ textAlign: "center", margin: "auto" }}>
                                                                        <i class="fa fa-check fa-2x" aria-hidden="true"></i>
                                                                        <Button
                                                                            variant="contained"
                                                                            style={{ background: "gray" }}
                                                                            onClick={() => handleReversePayment(invoice.invoice_num)}
                                                                        >
                                                                            Reverse
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ textAlign: "center", margin: "auto" }}>
                                                                        <Button
                                                                            variant="contained"
                                                                            color="primary"
                                                                            onClick={() =>
                                                                                handleInvoicePayment(
                                                                                    invoice.invoice_num,
                                                                                    invoice.total_amount
                                                                                )
                                                                            }
                                                                        >
                                                                            Recieve
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                invoice[column.id]
                                                            )}
                                                            {column.id === "edit" && (
                                                                <Button
                                                                    variant="contained"
                                                                    style={{ background: "green" }}
                                                                    onClick={() => handleEditInvoice(invoice.invoice_num)}
                                                                >
                                                                    Generate
                                                                </Button>
                                                            )}
                                                            {column.id === "delete" && (
                                                                <Button
                                                                    variant="contained"
                                                                    style={{ background: "red" }}
                                                                    onClick={() => handleDeleteInvoice(invoice.invoice_num)}
                                                                >
                                                                    Void
                                                                </Button>
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
                    </>
                </div>
            </div>
        </div>
    );
}
