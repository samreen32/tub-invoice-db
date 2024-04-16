import React, { useState } from "react";
import { TextField } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { RECIEVE_PAYMENT } from "../../Auth_API";
import axios from "axios";
import Swal from "sweetalert2";
import { useLocation, useNavigate } from "react-router";

export default function RecievePay_Invoice() {
  let navigate = useNavigate();
  const { state } = useLocation();
  const { invoiceNum, totalAmount } = state;

  const [paymentDetails, setPaymentDetails] = useState({
    // installer: "",
    payment_date: "",
    payment_amount: totalAmount,
    check_num: "",
    payment_type: "",
  });

  const payment_type_select = [
    {
      value: "Check",
      label: "Check",
    },
    {
      value: "Cash",
      label: "Cash",
    },
  ];

  /* Endpoint integration */
  const handlePaymentSubmit = async () => {
    try {
      const response = await axios.put(
        `${RECIEVE_PAYMENT}/${invoiceNum}`,
        paymentDetails
      );
      console.log(response.data);
      navigate(`/invoice`);
      {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Payment Recieved",
        });
        return;
      }
    } catch (error) {
      console.error(error.response.data);
      Swal.fire({
        icon: "error",
        title: "Oops",
        text: "Failed to recieve payment. Please try again later.",
      });
    }
  };

  /* Input field onChange */
  const handleChange = (event) => {
    const { name, value } = event.target;
    setPaymentDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  return (
    <div style={{ marginTop: "2%" }}>
      <h2 style={{ display: "flex", margin: "auto", justifyContent: "center" }}>
        <span
          onClick={() => {
            navigate("/invoice");
          }}
          style={{ cursor: "pointer", marginLeft: "-23%" }}
        >
          <i class="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
        </span>
        <span style={{ cursor: "pointer", marginLeft: "23%" }}>
          Recieve Payment
        </span>
      </h2>
      <div id="invoice-generated">
        <div className="container px-5 py-5" style={{ width: "100%" }}>
          <>
            <h4>Invoice #: {invoiceNum}</h4>
            <div className="payment-recieve-container">
              <div className="row py-5">
                <div className="col">
                  Date<br />
                  <TextField
                    id="payment_date"
                    variant="standard"
                    type="date"
                    name="payment_date"
                    style={{ width: "100%", }}
                    value={paymentDetails.payment_date}
                    onChange={handleChange}
                  />
                </div>
                <div className="col">
                  Payment
                  <TextField
                    id="payment_amount"
                    variant="standard"
                    type="text"
                    name="payment_amount"
                    value={`$${paymentDetails.payment_amount}`}
                    onChange={handleChange}
                  />
                </div>
                <div className="col">
                  Check/Card #
                  <TextField
                    id="check_num"
                    variant="standard"
                    type="text"
                    name="check_num"
                    value={paymentDetails.check_num}
                    onChange={handleChange}
                  />
                </div>
                <div className="col">
                  Payment Type
                  <TextField
                    id="payment_type"
                    variant="standard"
                    type="text"
                    name="payment_type"
                    style={{ width: "100%", marginTop: "8%" }}
                    value={paymentDetails.payment_type}
                    onChange={handleChange}
                    select
                    defaultValue="EUR"
                  >
                    {payment_type_select.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
                <div className="col">
                  <div className="add-container">
                    <span
                      className="new-invoice-btn"
                      onClick={handlePaymentSubmit}
                    >
                      Add Payment
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
