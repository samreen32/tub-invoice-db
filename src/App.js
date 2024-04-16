import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import InvoiceGenerated from "./components/CreateInvoice/InvoiceGenerated";
import AuthProvider from "./context/AuthContext";
import ViewInvoice from "./components/RecievePayment/RecievePay_Invoice";
import InvoiceForm from "./components/CreateInvoice/InvoiceForm";
import NonPayment_Report from "./components/Reports/NonPayment_Report";
import InvoiceReport from "./components/Reports/InvoiceReport";
import IncomeReport from "./components/Reports/IncomeReport";
import CustomerReport from "./components/Reports/CustomerReport";
import Main from "./components/main";
import EditInvoice from "./components/CreateInvoice/EditInvoice";
import EditUnpaidInvoice from "./components/Reports/EditUnpaidInvoice";
import JobSiteReport from "./components/Reports/JobSiteReport";
import EmployeeReport from "./components/Reports/EmployeeReport";
import SecondInvoiceReport from "./components/Reports/SecondInvoiceReport";
import EditSecondInvoice from "./components/CreateInvoice/EditSecondInvoice";
import SalesReport from "./components/Reports/SalesReport";
import SalesStatement from "./components/Reports/SalesStatement";
import Login from "./components/Login";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route exact path="/" element={<Login />} />
          <Route exact path="/main" element={<Main />} />
          <Route exact path="/estimate" element={<InvoiceForm />} />
          <Route exact path="/estimate_generated" element={<InvoiceGenerated />} />
          <Route exact path="/estimate_report" element={<InvoiceReport />} />
          <Route exact path="/edit_estimate" element={<EditInvoice />} />

          <Route exact path="/invoice" element={<SecondInvoiceReport />} />
          <Route exact path="/edit_invoice" element={<EditSecondInvoice />} />
          <Route exact path="/sales_report" element={<SalesReport />} />

          <Route exact path="/job_site_report" element={<JobSiteReport />} />
          <Route exact path="/employee_report" element={<EmployeeReport />} />
          <Route exact path="/pay_invoice" element={<ViewInvoice />} />
          <Route exact path="/unpaid_invoice_details" element={<EditUnpaidInvoice />} />
          <Route exact path="/unpaid_invoice_report" element={<NonPayment_Report />} />
          <Route exact path="/income_report" element={<IncomeReport />} />
          <Route exact path="/customer_report" element={<CustomerReport />} />
          <Route exact path="/sales_statement" element={<SalesStatement />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;