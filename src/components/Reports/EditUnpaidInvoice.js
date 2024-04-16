import React, { useEffect, useRef, useState } from "react";
import { UserLogin } from "../../context/AuthContext";
import logo from "../../assets/img/logo.png";
import TextField from "@mui/material/TextField";
import { useLocation, useNavigate } from "react-router";
import axios from "axios";
import Swal from "sweetalert2";
import { EDIT_INVOICE, GET_INVOICE } from "../../Auth_API";
import generatePDF from "react-to-pdf";

function EditUnpaidInvoice() {
  let navigate = useNavigate();
  const targetRef = useRef();
  const { state } = useLocation();
  const { invoiceNum } = state;
  const { formUpdateData, setFormUpdateData } = UserLogin();
  const [visibleBillToFields, setVisibleBillToFields] = useState(1);
  const [focusedField, setFocusedField] = useState(null);

  /* Input field validation */
  const handleInputChange = (index, e) => {
    const { name, value } = e?.target || {};

    setFormUpdateData((prevData) => {
      if (index !== undefined) {
        const updatedItems = [...prevData.items];
        updatedItems[index] = {
          ...updatedItems[index],
          [name]: value,
        };

        const totalAmount = updatedItems.reduce(
          (total, item) =>
            total + (item.quantity || 0) * (item.price_each || 0),
          0
        );

        return {
          ...prevData,
          items: updatedItems,
          total_amount: totalAmount,
        };
      } else {
        if (
          name === "bill_to_1" ||
          name === "bill_to_2" ||
          name === "bill_to_3"
        ) {
          const updatedBillTo = [...prevData.bill_to];
          const fieldIndex = Number(name.split("_")[2]);
          updatedBillTo[fieldIndex - 1] = value;

          return {
            ...prevData,
            bill_to: updatedBillTo,
          };
        } else {
          return {
            ...prevData,
            [name]: value,
          };
        }
      }
    });
  };

  /* Endpoint integration */
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        const response = await axios.get(`${GET_INVOICE}/${invoiceNum}`);
        if (response.data.success) {
          setFormUpdateData(response.data.invoice);
          console.log(response.data.invoice);
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchInvoiceDetails();
  }, [invoiceNum]);

  /* Update Endpoint integration */
  const handleUpdateInvoice = async () => {
    try {
      const response = await axios.put(
        `${EDIT_INVOICE}/${invoiceNum}`,
        formUpdateData
      );
      if (response.data.success) {
        navigate("/unpaid_invoice_report");
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Invoice updated successfully.",
        });
        setFormUpdateData({
          bill_to: [""],
          installer: "",
          PO_number: "",
          PO_date: "",
          type_of_work: "",
          job_site_num: "",
          job_site_name: "",
          job_location: "",
          lot_no: "",
          items: [
            {
              description: "",
              quantity: "",
              price_each: "",
            },
          ],
          invoice: {
            invoice_num: null,
            date: null,
            total_amount: null,
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: response.data.message || "Failed to update invoice.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update invoice. Please try again later.",
      });
      console.error("Failed to update invoice:", error.message);
    }
  };

  const handleAddItem = () => {
    setFormUpdateData((prevData) => ({
      ...prevData,
      items: [
        ...prevData.items,
        {
          description: "",
          quantity: 0,
          price_each: 0,
          total_amount: 0,
        },
      ],
    }));
  };

  /* Press enter key to add new field as well as key focus */
  const handleBillToEnterKey = (e, fieldIndex) => {
    if (e.key === "Enter") {
      const nextVisibleFields = Math.min(visibleBillToFields + 1, 3);
      setVisibleBillToFields(nextVisibleFields);
      setFocusedField(nextVisibleFields - 1);
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (focusedField !== null) {
      const inputRef = document.getElementById(`bill_to_${focusedField + 1}`);
      if (inputRef) {
        inputRef.focus();
      }
    }
  }, [focusedField]);

  const handleGenerateNew = () => {
    navigate("/unpaid_invoice_report");
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const options = { year: '2-digit', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div id="invoice-generated">
      <div className="row">
        {/* Left side */}
        <div className="col-md-6" style={{
          marginTop: "40px",
          justifyContent: "left",
          marginLeft: "-500px"
        }}>
          <div className="add-container">
            <span onClick={handleGenerateNew} className="new-invoice-btn">
              Go Back
            </span>
          </div>
        </div>

        {/* Right side */}
        <div
          className="col-md-6"
          style={{ marginTop: "50px", justifyContent: "right", display: "flex", marginLeft: "400px" }}
        >
          <span
            onClick={handleUpdateInvoice}
            className="new-invoice-btn"
          >
            Update Details
          </span>
          <span
            onClick={() => generatePDF(targetRef, { filename: "invoice.pdf" })}
            className="new-invoice-btn mx-3"
          >
            Generate PDF
          </span>
        </div>
      </div>

      <div
        className="container px-5 py-5 mt-5"
        style={{ width: "100%" }}
        ref={targetRef}
      >
        <div id="pdf">
          <div className="row">
            <div className="invoice-first-div col-8 px-5">
              <img src={logo} alt="logo tub" />
              <address className="mt-3 px-3">
                <b style={{ fontSize: "28px" }}>Tub Pro's, Inc. </b>
                <br />
                PO Box 30596 <br />
                Las Vegas, NV. 89173 <br />
                Office: (702)445-6232 <br />
                Fax: (702) 445-6241
              </address>
            </div>
            <div className="col-4">
              <p className="invoice-details">
                <em>
                  <b>Invoice</b>
                </em>
              </p>
              <p>
                Number &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {formUpdateData.invoice_num}
              </p>

              <p>
                Date
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {formatDate(formUpdateData.date)}
              </p>
            </div>
          </div>

          <form>
            <div className="row bill_to_div px-5" style={{ border: "2px solid white" }}>
              <div className="col-md-9">
                <p>
                  Bill To <br />
                  {[1, 2, 3].map(
                    (fieldIndex) =>
                      fieldIndex <= visibleBillToFields && (
                        <React.Fragment key={`bill_to_${fieldIndex}`}>
                          <TextField
                            id={`bill_to_${fieldIndex}`}
                            type="text"
                            variant="standard"
                            name={`bill_to_${fieldIndex}`}
                            value={formUpdateData.bill_to[fieldIndex - 1] || ""}
                            onChange={(e) => handleInputChange(undefined, e)}
                            onKeyDown={(e) => handleBillToEnterKey(e, fieldIndex)}
                          />
                          <br />
                        </React.Fragment>
                      )
                  )}
                </p>
              </div>
              <div className="col-md-3">
                <p>
                  Installer <br />
                  <TextField
                    id="installer"
                    type="text"
                    variant="standard"
                    name="installer"
                    value={formUpdateData.installer}
                    onChange={(e) => handleInputChange(undefined, e)}
                  />
                </p>
              </div>
            </div>
            <div className="last-row mt-3">
              <div className="row po_details_div px-5 ">
                <div className="col">
                  PO No.
                  <br />
                  <TextField
                    id="po_num"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="PO_number"
                    value={formUpdateData.PO_number}
                    onChange={(e) => handleInputChange(undefined, e)}
                  />
                </div>
                <div className="col">
                  PO Date
                  <br />
                  <TextField
                    id="po_date"
                    type="date"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="PO_date"
                    value={formUpdateData.PO_date}
                    onChange={(e) => handleInputChange(undefined, e)}
                  />
                </div>
                <div className="col">
                  Type of Work
                  <br />
                  <TextField
                    id="type_of_work"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="type_of_work"
                    value={formUpdateData.type_of_work}
                    onChange={(e) => handleInputChange(undefined, e)}
                  />
                </div>
                <div className="col">
                  Job Site No.
                  <br />
                  <TextField
                    id="job_site_no"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="job_site_num"
                    value={formUpdateData.job_site_num}
                    onChange={(e) => handleInputChange(undefined, e)}
                  />
                </div>
                <div className="col">
                  Job Name
                  <br />
                  <TextField
                    id="job_site_name"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="job_site_name"
                    value={formUpdateData.job_site_name}
                    onChange={(e) => handleInputChange(undefined, e)}
                  />
                </div>
                <div className="col">
                  Job Location
                  <br />
                  <TextField
                    id="job_location"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="job_location"
                    value={formUpdateData.job_location}
                    onChange={(e) => handleInputChange(undefined, e)}
                  />
                </div>

              </div>

              <div className="line"></div>
              <div className="row item_details_div px-5">
                <div className="col-md-1">
                  Lot No.
                </div>
                <div className="col-md-7">
                  <span className="plus-icon" onClick={handleAddItem}>
                    <i className="fas fa-plus-circle"></i>
                  </span>
                  &nbsp; Description
                </div>
                <div className="col-md-1" style={{ marginLeft: "-22px" }}>Quantity</div>
                <div className="col-md-2" style={{ marginLeft: "10px" }}>Price Each</div>
                <div className="col-md-1" style={{ marginLeft: "-60px" }}>Amount</div>
              </div>
              <div className="row item_details_div px-5" style={{ marginTop: "-65px" }}>
                {formUpdateData.items.map((item, index) => (
                  <div
                    className="row"
                    style={{ marginTop: index === 0 ? "0" : "10px" }}
                  >
                    <div className="col-md-1">
                      <TextField
                        id="lot_no"
                        variant="standard"
                        type="text"
                        name="lot_no"
                        value={item.lot_no}
                        onChange={(e) => handleInputChange(undefined, e)}
                      />
                    </div>
                    <div className="col-md-7">
                      <TextField
                        id="description"
                        variant="standard"
                        type="text"
                        name="description"
                        value={item.description}
                        style={{ width: "100%" }}
                        onChange={(e) => handleInputChange(index, e)}
                      />
                    </div>
                    <div className="col-md-1">
                      <TextField
                        id="quantity"
                        variant="standard"
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleInputChange(index, e)}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="col-md-2">
                      <TextField
                        id="price_each"
                        variant="standard"
                        type="number"
                        name="price_each"
                        value={item.price_each}
                        onChange={(e) => handleInputChange(index, e)}
                        style={{ width: "70%" }}
                      />
                    </div>
                    <div className="col-md-1 my-2" style={{ marginLeft: "-60px" }}>
                      <TextField
                        id="amount"
                        variant="standard"
                        type="text"
                        InputProps={{ disableUnderline: true }}
                        readOnly
                        value={`${" "}$ ${(item.quantity || 0) * (item.price_each || 0)
                          }`}
                      />
                    </div>
                  </div>
                ))}

                <div
                  className="invoice-last-div px-5"
                  style={{ marginTop: "600px" }}
                >
                  <p style={{ marginRight: "70px" }}>
                    Total Due: {`$${formUpdateData.total_amount || ""}`}
                  </p>
                  <h5 style={{ fontSize: "25px", fontWeight: "600" }}>
                    Thank You! We truly appreciate your business!
                  </h5>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditUnpaidInvoice;
