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
import { UserLogin } from "../../context/AuthContext";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import generatePDF from "react-to-pdf";
import * as XLSX from 'xlsx';

export default function CustomerReport() {
  let navigate = useNavigate();
  const targetRef = useRef();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [invoices, setInvoices] = useState([]);
  const { setInvoiceDetails } = UserLogin();
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const searchWords = searchQuery.split(" ");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [filteredTotalAmount, setFilteredTotalAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

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
    const fetchAllInvoices = async () => {
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
                invoice.invoice_num.toString().includes(word)
            )
          );
        });

        setInvoices(searchedInvoices);
        const paidInvoices = searchedInvoices.filter((invoice) => invoice.payment_status);
        console.log("Paid Invoices:", paidInvoices);

        const totalSum = paidInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
        console.log("Total Amount of Paid Invoices:", totalSum);

        setTotalAmount(totalAmount + totalSum);
        const slicedInvoices = searchedInvoices.slice(
          page * rowsPerPage,
          page * rowsPerPage + rowsPerPage
        );
        const filteredTotal = slicedInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);

        console.log("Filtered Total Amount:", filteredTotal);

        setFilteredTotalAmount(filteredTotal);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchAllInvoices();

  }, [selectedYear, selectedMonth, page, rowsPerPage, searchQuery, searchWords]);


  const columns = [
    { id: "id", label: "#", minWidth: 100 },
    { id: "invoice_num", label: "Invoice No.", minWidth: 100 },
    { id: "date", label: "Date", minWidth: 100 },
    { id: "bill_to", label: "Customer", minWidth: 100 },
    { id: "total_amount", label: "Amount", minWidth: 100 },
    { id: "payments", label: "Payments", minWidth: 100 },
    { id: "total_amount", label: "Due", minWidth: 100 },
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

  const calculateTimeRangeTotal = (invoices, startDays, endDays) => {
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - startDays);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() - endDays);

    return invoices
      .filter((invoice) => {
        const dueDate = new Date(invoice.due_date);
        return dueDate >= startDate && dueDate <= endDate;
      })
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);
  };

  const handleTimeRangeTotal = () => {
    const currentDate = new Date();
    const currentTimestamp = currentDate.getTime();
    const thirtyDaysAgo = currentDate.setDate(currentDate.getDate() - 30);
    const sixtyDaysAgo = currentDate.setDate(currentDate.getDate() - 30);
    const ninetyDaysAgo = currentDate.setDate(currentDate.getDate() - 30);

    const total30Days = invoices
      .filter((invoice) => new Date(invoice.date).getTime() > thirtyDaysAgo)
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);

    const total60Days = invoices
      .filter((invoice) => new Date(invoice.date).getTime() <= thirtyDaysAgo && new Date(invoice.date).getTime() > sixtyDaysAgo)
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);

    const total90Days = invoices
      .filter((invoice) => new Date(invoice.date).getTime() <= sixtyDaysAgo && new Date(invoice.date).getTime() > ninetyDaysAgo)
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);

    const totalOver90Days = invoices
      .filter((invoice) => new Date(invoice.date).getTime() <= ninetyDaysAgo)
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);

    const overallTotal = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);

    return [total30Days, total60Days, total90Days, totalOver90Days, overallTotal];
  };

  const downloadExcel = () => {
    const filteredData = invoices.map(invoice => ({
      "Invoice No.": invoice.invoice_num,
      "Date": new Date(invoice.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }),
      "Bill To": invoice.bill_to.join(", "),
      "Installer": invoice.installer,
      "Total Amount": `$${invoice.total_amount.toFixed(2)}`,
      "Payment": `$0.00`,
      "Due Amount": `$${invoice.total_amount.toFixed(2)}`
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
    XLSX.writeFile(workBook, "CustomerReport.xlsx");
  };

  return (
    <div style={{ marginTop: "2%" }}>
      <span style={{
        cursor: "pointer", textAlign: "center",
        justifyContent: "center", display: "flex",
        marginLeft: "990px"

      }}>
        <span onClick={() => generatePDF(targetRef, { filename: "CustomerReport.pdf" })}
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
        <div className="container px-5 py-5" style={{ width: "100%" }}>
          <div ref={targetRef} style={{ padding: "40px 20px 10px 20px" }}>
            <>
              <h2
                style={{
                  display: "flex",
                  margin: "20px auto",
                  justifyContent: "center",
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
                <span style={{ cursor: "pointer", marginLeft: "40%" }}>
                  Statement
                </span>
              </h2>

              {/* Search field */}
              <div className="px-3">
                <span style={{ fontSize: "1.3rem" }}>Bill To</span>
                <div className="row">
                  <div className="col-md-8">
                    <p>
                      <TextField
                        className="search-input"
                        type="text"
                        variant="standard"
                        style={{ width: "100%" }}
                        onClick={handleSearchClick}
                        onBlur={() => setIsExpanded(false)}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </p>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-2">
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
                    </div>

                  </div>
                </div>
              </div>


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
                                invoice.job_site_name.toLowerCase().includes(word)
                            ) ||
                            searchString.every(
                              (word) =>
                                invoice.bill_to.join(", ").toLowerCase().includes(word) ||
                                invoice.job_site_name.toLowerCase().includes(word)
                            )
                          );
                        })
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((invoice, index) => (
                          <>
                            {/* Insert header row after every 32 items */}
                            {index !== 0 && index % 26 === 0 && (
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
                            <TableRow
                              key={invoice.invoice_num}
                              onClick={() => setInvoiceDetails(invoice.invoice_num)}
                              style={{ cursor: "pointer" }}
                            >
                              <TableCell align="left">{index + 1}</TableCell>
                              {columns.slice(1).map((column) => (
                                <TableCell
                                  key={column.id}
                                  align="left"
                                >
                                  {column.id === "date"
                                    ? new Date(invoice.date).toLocaleDateString()
                                    : column.id === "bill_to"
                                      ? invoice.bill_to.length > 0 ? invoice.bill_to[0] : "-"
                                      : column.id === "total_amount"
                                        ? `$${invoice.total_amount.toFixed(2)}`
                                        : column.id === "payments"
                                          ? `$${'0.00'}`
                                          : invoice[column.id]
                                  }
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
                  className="table-last-row-audio mt-3"
                  rowsPerPageOptions={[5, 10, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]}
                  component="div"
                  count={invoices.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Paper>

              <Paper sx={{ width: "100%", overflow: "hidden", marginTop: "6%", textAlign: "center", border: "none", padding: "12px", }}>
                <table className="table" border={1}>
                  <thead>
                    <tr style={{
                      fontSize: "18px", backgroundColor: "#08a0d1",
                      color: "white",
                      fontWeight: "500"
                    }}>
                      <th scope="col">0 - 30 Days</th>
                      <th scope="col">31 - 60 Days</th>
                      <th scope="col">61 - 90 Days</th>
                      <th scope="col">^ 91 Days</th>
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ fontSize: "18px" }}>
                      {handleTimeRangeTotal().map((total, index) => (
                        <td key={index} style={{ padding: "25px" }}>
                          ${total.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </Paper>
            </>
          </div>
        </div>
      </div>
    </div>
  );
}
