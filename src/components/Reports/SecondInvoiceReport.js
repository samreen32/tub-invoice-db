import React, { useState, useEffect } from "react";
import axios from "axios";
import { GET_ALL_INVOICES, } from "../../Auth_API";
import { useNavigate } from "react-router-dom";
import InvoiceTable from "../../views/EstimateInvoiceTable/InvoiceTable";
import SearchBar from "../../views/EstimateInvoiceTable/SearchBar";

export default function SecondInvoiceReport() {
    let navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [invoices, setInvoices] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    const searchWords = searchQuery.split(" ");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [filteredTotalAmount, setFilteredTotalAmount] = useState(0);
    const [showUncreatedInvoices, setShowUncreatedInvoices] = useState(false);

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

    useEffect(() => {
        const fetchAllInvoices = async () => {
            try {
                const response = await axios.get(`${GET_ALL_INVOICES}`);
                let adjustedInvoiceCounter = 38592;
                const invoicesWithAdjustedNumbers = response.data.invoices.map((invoice) => {
                    if (invoice.PO_Invoice_date) {
                        return {
                            ...invoice,
                            adjustedInvoiceNum: adjustedInvoiceCounter++,
                        };
                    }
                    return invoice;
                });

                const sortedInvoices = invoicesWithAdjustedNumbers
                    .map((invoice) => ({
                        ...invoice,
                        date: new Date(invoice.date).toLocaleDateString(),
                        date: new Date(invoice.date),
                    }))
                    .sort((a, b) => b.date - a.date);
                const filteredInvoices = sortedInvoices.filter((invoice) => {
                    const yearFromPODate = new Date(invoice.PO_Invoice_date).getFullYear();
                    const monthFromPODate = new Date(invoice.PO_Invoice_date).getMonth();

                    const yearMatches = selectedYear === "" || yearFromPODate.toString() === selectedYear;
                    const monthMatches = selectedMonth === "" || monthFromPODate.toString() === months.indexOf(selectedMonth).toString();

                    return yearMatches && monthMatches;
                });

                // Search filter
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
                const paidInvoices = searchedInvoices.filter((invoice) => invoice.payment_status);
                const totalSum = paidInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
                setTotalAmount(totalAmount + totalSum);
                const slicedInvoices = (showUncreatedInvoices ? uncreatedInvoices : searchedInvoices).slice(
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
    }, [selectedYear, selectedMonth, page, rowsPerPage, searchQuery, searchWords, showUncreatedInvoices]);

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
                                style={{ cursor: "pointer", marginLeft: "-30%" }}
                            >
                                <i class="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
                            </span>
                            <span style={{ cursor: "pointer", marginLeft: "30%", fontWeight: "600" }}>
                                {" "}
                                Estimate - Invoice Report
                            </span>
                        </h2>

                        {/* Search field */}
                        <SearchBar
                            invoices={invoices}
                            months={months}
                            showUncreatedInvoices={showUncreatedInvoices}
                            selectedYear={selectedYear}
                            selectedMonth={selectedMonth}
                            setSelectedMonth={setSelectedMonth}
                            setSelectedYear={setSelectedYear}
                            setSearchQuery={setSearchQuery}
                            setShowUncreatedInvoices={setShowUncreatedInvoices}
                        />
                        <InvoiceTable
                            filteredTotalAmount={filteredTotalAmount}
                            page={page}
                            setPage={setPage}
                            setRowsPerPage={setRowsPerPage}
                            setInvoices={setInvoices}
                            setTotalAmount={setTotalAmount}
                            invoices={invoices}
                            rowsPerPage={rowsPerPage}
                        />
                    </>
                </div>
            </div>
        </div>
    );
}
