import React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import { UserLogin } from "../../context/AuthContext";
import { DELETE_INVOICE, REVERSE_PAYMENT } from "../../Auth_API";
import { useNavigate } from "react-router";
import axios from "axios";
import { Pagination } from "@mui/material";
import { LinearProgress } from "@mui/material";

function InvoiceTable({
    filteredTotalAmount,
    setInvoices,
    setTotalAmount,
    invoices,
    handlePageChange,
    page,
    totalInvoices,
    rowsPerPage,
    loading
}) {
    let navigate = useNavigate();
    const { setInvoiceDetails } = UserLogin();
    const pageCount = Math.ceil(totalInvoices / rowsPerPage);

    const columns = [
        { id: "invoice_num", label: "Invoice #", minWidth: 100 },
        { id: "bill_to", label: "Bill To", minWidth: 100 },
        { id: "PO_number", label: "PO No.", minWidth: 100 },
        { id: "PO_Invoice_date", label: "PO Invoice Date", minWidth: 100 },
        { id: "job_site_num", label: "Job Site Number", minWidth: 100 },
        { id: "total_amount", label: "Invoice Amount", minWidth: 100 },
        { id: "payment_status", label: "Payment Status", minWidth: 10 },
        {
            id: "add_payment",
            label: "Payment",
            minWidth: 100,
        },
        {
            id: "edit",
            label: "Invoice Generated",
            minWidth: 100,
        },
        {
            id: "delete",
            label: "Void",
            minWidth: 100,
        },
    ];

    const handleInvoicePayment = (invoiceNum, totalAmount) => {
        navigate(`/pay_invoice`, { state: { invoiceNum, totalAmount } });
    };

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
            } else {
                console.error(response.data.message);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    const handleEditInvoice = (displayedInvoiceNum, invoiceNum) => {
        navigate(`/edit_invoice`, { state: { displayedInvoiceNum, invoiceNum } });
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
            } else {
                console.error(response.data.message);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <>
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
                                const displayedInvoiceNum = invoice.invoice_num >= 479 && invoice.PO_Invoice_date
                                    ? invoice.newInvoiceNum
                                    : invoice.PO_Invoice_date
                                        ? invoice.adjustedInvoiceNum
                                        : invoice.invoice_num;
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
                                                ) : column.id === "invoice_generated" ? (
                                                    <Button variant="contained" color={invoice.PO_Invoice_date ? "primary" : "secondary"}>
                                                        {invoice.PO_Invoice_date ? "Yes" : "No"}
                                                    </Button>
                                                ) : column.id === "add_payment" ? (
                                                    invoice.payment_status ? (
                                                        <div style={{ textAlign: "center", margin: "auto" }}>
                                                            <i className="fa fa-check fa-2x" aria-hidden="true"></i>
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
                                                                Receive
                                                            </Button>
                                                        </div>
                                                    )
                                                ) : (
                                                    invoice[column.id]
                                                )}
                                                {column.id === "edit" && (
                                                    <Button
                                                        variant="contained"
                                                        style={{ background: invoice.PO_Invoice_date ? "gray" : "green" }}
                                                        onClick={() => handleEditInvoice(displayedInvoiceNum, invoice.invoice_num)}
                                                    >
                                                        {invoice.PO_Invoice_date ? "Generated" : "Generate"}
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
                                );
                            })}
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
                <div
                    style={{
                        display: "flex", justifyContent: "center",
                        padding: "10px", position: "relative"
                    }}
                >
                    <Pagination
                        count={pageCount}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        variant="outlined"
                        shape="rounded"
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
            </Paper>
        </>
    );
}

export default InvoiceTable;