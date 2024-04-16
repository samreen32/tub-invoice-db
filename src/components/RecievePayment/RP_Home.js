import React, { useState } from "react";
import { useNavigate } from "react-router";
import { TextField } from "@mui/material";
import axios from "axios";
import { GET_INVOICE } from "../../Auth_API";
import { UserLogin } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export default function RP_Home() {
  let navigate = useNavigate();
  const { setInvoiceDetails } = UserLogin();
  const [credentials, setCredentials] = useState({
    invoice_num: "",
  });
  const { invoice_num } = credentials;

  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  /* Endpoint function that gets invoice */
  const handleInvoiceForm = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.get(`${GET_INVOICE}/${invoice_num}`);
      const invoiceDetails = response.data.invoice;
      setInvoiceDetails(invoiceDetails);
      console.log(response.data.invoice, "invoice");
      const element = document.querySelectorAll(".modal-backdrop");
      element.forEach((item) => {
        item.style.display = "none";
      });
      document.body.style.overflow = "auto";

      navigate("/view_invoice");
    } catch (error) {
      console.error("Error fetching invoice details:", error.message);
    }
  };

  return (
    <div style={{ marginTop: "10%" }}>
      <div class="d-flex justify-content-center align-items-center">
        <div class="d-flex text-center">
          <div class="ag-format-container">
            <div class="ag-courses_box">
              <div class="ag-courses_item">
                <Link to="/invoice" class="ag-courses-item_link">
                  <div class="ag-courses-item_bg"></div>

                  <div class="ag-courses-item_title">Generate Invoice</div>
                  <div class="ag-courses-item_date-box">Generate</div>
                </Link>
              </div>
              <div class="ag-courses_item">
                <Link to="/invoice_report" class="ag-courses-item_link">
                  <div class="ag-courses-item_bg"></div>
                  <div class="ag-courses-item_title">View Invoices</div>
                  <div class="ag-courses-item_date-box">View</div>
                </Link>
              </div>
              <div class="ag-courses_item">
                <Link class="ag-courses-item_link" to="/unpaid_invoice_report">
                  <div class="ag-courses-item_bg"></div>
                  <div class="ag-courses-item_title">Unpaid Invoice Report</div>
                  <div class="ag-courses-item_date-box">View Report</div>
                </Link>
              </div>
              <div class="ag-courses_item">
                <Link to="/income_report" class="ag-courses-item_link">
                  <div class="ag-courses-item_bg"></div>
                  <div class="ag-courses-item_title">View Income Report</div>
                  <div class="ag-courses-item_date-box">View</div>
                </Link>
              </div>
              <div class="ag-courses_item">
                <Link to="/customer_report" class="ag-courses-item_link">
                  <div class="ag-courses-item_bg"></div>
                  <div class="ag-courses-item_title">View Customer Report</div>
                  <div class="ag-courses-item_date-box">View</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
