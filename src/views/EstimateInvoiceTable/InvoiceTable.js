import React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import { UserLogin } from "../../context/AuthContext";
import { DELETE_INVOICE, REVERSE_PAYMENT } from "../../Auth_API";
import { useNavigate } from "react-router";
import axios from "axios";

function InvoiceTable({
    filteredTotalAmount, page,
    setPage, setRowsPerPage,
    setInvoices, setTotalAmount,
    invoices, rowsPerPage
}) {
    let navigate = useNavigate();
    const { setInvoiceDetails } = UserLogin();

    const columns = [
        { id: "invoice_num", label: "Invoice No.", minWidth: 100 },
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
                // console.log(response.data.success);
            } else {
                console.error(response.data.message);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    const handleEditInvoice = (invoiceNum, adjustedInvoiceNum) => {
        // console.log(adjustedInvoiceNum, "adjustedInvoiceNum")
        navigate(`/edit_invoice`, { state: { invoiceNum, adjustedInvoiceNum } });
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
                // console.log(response.data.success);
            } else {
                console.error(response.data.message);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <>
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
                                            <TableCell key={column.id} align="left"
                                            // onClick={() => handleEditInvoice(invoice.invoice_num, invoice.adjustedInvoiceNum)}
                                            >
                                                {column.id === "invoice_num" ? (
                                                    invoice.PO_Invoice_date ? invoice.adjustedInvoiceNum : invoice.invoice_num
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
                                                    !invoice.PO_Invoice_date ? (
                                                        <Button
                                                            variant="contained"
                                                            style={{ background: "green" }}
                                                            onClick={() => handleEditInvoice(invoice.invoice_num, invoice.adjustedInvoiceNum)}
                                                        >
                                                            Generate
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="contained"
                                                            style={{ background: "gray" }}
                                                            onClick={() => handleEditInvoice(invoice.invoice_num, invoice.adjustedInvoiceNum)}
                                                        >
                                                            Generated
                                                        </Button>
                                                    )
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
    )
}

export default InvoiceTable