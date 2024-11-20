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
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [filteredTotalAmount, setFilteredTotalAmount] = useState(0);
    const [showUncreatedInvoices, setShowUncreatedInvoices] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1); // Page starts at 1
    const rowsPerPage = 10;
    const [totalInvoices, setTotalInvoices] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);

    const months = [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December",
    ];

    useEffect(() => {
        const fetchAllInvoices = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${GET_ALL_INVOICES}`, {
                    params: {
                        page,
                        limit: rowsPerPage,
                        search: searchQuery,
                        year: selectedYear,
                        month: selectedMonth,
                        showUncreatedInvoices: showUncreatedInvoices ? 1 : 0,
                    },
                });
                setInvoices(response.data.invoices);
                setGrandTotal(response.data.grandTotal || 0);
                setTotalInvoices(response.data.totalInvoices);
            } catch (error) {
                console.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAllInvoices();
    }, [page, rowsPerPage, searchQuery, selectedYear, selectedMonth, showUncreatedInvoices]);

    useEffect(() => {
        setPage(1); 
    }, [searchQuery, selectedYear, selectedMonth, showUncreatedInvoices]);

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
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