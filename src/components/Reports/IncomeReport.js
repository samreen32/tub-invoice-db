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
import { GET_INCOME_INVOICE } from "../../Auth_API";
import { useNavigate } from "react-router-dom";
import { Toolbar } from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import generatePDF from "react-to-pdf";
import * as XLSX from 'xlsx';

export default function IncomeReport() {
  let navigate = useNavigate();
  const targetRef = useRef();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const searchWords = searchQuery.split(" ");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [filteredInvoices, setFilteredInvoices] = useState([]);
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

  /* Endpoint integration for get all the invoices */
  useEffect(() => {
    const fetchIncomeInvoices = async () => {
      try {
        const response = await axios.get(`${GET_INCOME_INVOICE}`);
        console.log(response.data.invoices);
        setInvoices(response.data.invoices);
        setFilteredInvoices(response.data.invoices);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchIncomeInvoices();
  }, []);

  useEffect(() => {
    const filtered = invoices.filter((invoice) => {
      const yearFromInvoice = new Date(invoice.payment_date).getFullYear();
      const monthFromInvoice = new Date(invoice.payment_date).getMonth();

      const yearMatches =
        selectedYear === "" || yearFromInvoice.toString() === selectedYear;
      const monthMatches =
        selectedMonth === "" || monthFromInvoice.toString() === months.indexOf(selectedMonth).toString();

      return (
        yearMatches &&
        monthMatches &&
        searchWords.every((word) =>
          Object.values(invoice).some((value) =>
            String(value).toLowerCase().includes(word.toLowerCase())
          )
        )
      );
    });

    setFilteredInvoices(filtered);

    const total = filtered.reduce((acc, invoice) => acc + invoice.total_amount, 0);
    setFilteredTotalAmount(total);
  }, [invoices, selectedYear, selectedMonth, searchWords]);


  const columns = [
    { id: "invoice_num", label: "Invoice No.", minWidth: 170 },
    { id: "total_amount", label: "Invoice Amount", minWidth: 170 },
    { id: "date", label: "Date", minWidth: 170 },
    { id: "id", label: "", minWidth: 170 },
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
    const filteredData = invoices.map(invoice => ({
      "Invoice No.": invoice.invoice_num,
      "Date": new Date(invoice.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }),
      "Invoice Amount": `$${invoice.total_amount.toFixed(2)}`
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
    XLSX.writeFile(workBook, "IncomeReport.xlsx");
  };

  return (
    <div style={{ marginTop: "2%", padding: "0px 50px" }}>
      <span style={{
        cursor: "pointer", textAlign: "center",
        justifyContent: "center", display: "flex",
        marginLeft: "990px"
      }}
      >
        <span onClick={() => generatePDF(targetRef, { filename: "IncomeReport.pdf" })}
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
        <div className="container-report px-5 py-5" style={{ width: "100%" }}>
          <>
            <h2
              style={{
                display: "flex",
                margin: "auto",
                justifyContent: "center",
                marginBottom: "40px"
              }}
            >
              <span
                onClick={() => {
                  navigate("/main");
                }}
                style={{ cursor: "pointer", marginLeft: "-1300px", marginTop: "-45px" }}
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
                <h2 style={{ padding: "5px" }}>Income Report</h2>
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
                      {filteredInvoices
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((invoice, index) => (
                          <>
                            {index !== 0 && index % 32 === 0 && (
                              <>
                                <TableRow style={{ height: "80px" }}>
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
                                        fontWeight: "500"
                                      }}
                                    >
                                      {column.label}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </>
                            )}
                            <TableRow key={invoice.invoice_num} style={{ cursor: "pointer" }}>
                              {columns.map((column) => (
                                <TableCell key={column.id} align="left">
                                  {column.id === "date"
                                    ? invoice.payment_date
                                      ? new Date(invoice.payment_date).toLocaleDateString()
                                      : "N/A"
                                    : column.id === "total_amount"
                                      ? `$${invoice.total_amount.toFixed(2)}`
                                      : invoice[column.id]}
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
