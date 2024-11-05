import React, { useState, useEffect } from "react";
import axios from "axios";
import { GET_ALL_INVOICES } from "../../Auth_API";
import { useNavigate } from "react-router-dom";
import InvoiceTable from "../../views/EstimateInvoiceTable/InvoiceTable";
import SearchBar from "../../views/EstimateInvoiceTable/SearchBar";

export default function SecondInvoiceReport() {
    let navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const searchWords = searchQuery.split(" ");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [filteredTotalAmount, setFilteredTotalAmount] = useState(0);
    const [showUncreatedInvoices, setShowUncreatedInvoices] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1); // Current page state
    const rowsPerPage = 10;
    const [totalInvoices, setTotalInvoices] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0); // New state for grand total

    const months = [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December",
    ];

    useEffect(() => {
        const fetchAllInvoices = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${GET_ALL_INVOICES}`, {
                    params: { page, limit: rowsPerPage }
                });

                setGrandTotal(response.data.grandTotal || 0);
                const invoicesWithAdjustedNumbers = response.data.invoices.map((invoice, index) => {
                    if (invoice.PO_Invoice_date) {
                        return { ...invoice };
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

    const handlePageChange = (event, newPage) => {
        setPage(newPage); // Updates page and triggers re-fetch through useEffect
    };

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
                    <h2 style={{ display: "flex" }}>
                        <span
                            onClick={() => { navigate("/main"); }}
                            style={{ cursor: "pointer", marginLeft: "-30%" }}
                        >
                            <i className="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
                        </span>
                        <span style={{ cursor: "pointer", marginLeft: "30%", fontWeight: "600" }}>
                            Estimate - Invoice Report
                        </span>
                    </h2>

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
                        setInvoices={setInvoices}
                        setTotalAmount={setTotalAmount}
                        invoices={invoices}
                        handlePageChange={handlePageChange}
                        page={page}
                        totalInvoices={totalInvoices}
                        rowsPerPage={rowsPerPage}
                        loading={loading}
                        grandTotal={grandTotal}
                    />
                </div>
            </div>
        </div>
    );
}